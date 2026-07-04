/**
 * Automated playtest of game scenarios. For each scenario:
 *   - a Groq "player" LLM tries to persuade the NPC,
 *   - the NPC runs the REAL production code path (systemPrompt + game model chain
 *     + same temperature/penalties),
 *   - win = free exact-phrase detectWin() each turn, OR the REAL judge (one call
 *     at the end) ruling a concede,
 *   - anomalies detected (empty / foreign-script bleed / verbatim repetition),
 *   - a reviewer LLM audits the NPC-only transcript for xưng hô (pronouns),
 *     persona consistency, language purity and repetition.
 *
 * Throttled hard (CONC=1) and self-paced against Groq's per-minute rate limit:
 * on 429 it parses "try again in Xs" and sleeps, then retries the SAME call.
 * Results stream to tasks/playtest-results.jsonl (one JSON line per scenario);
 * re-running RESUMES — scenarios that already succeeded are skipped, failed/rate-
 * limited ones are retried.
 *
 * Usage:
 *   node tasks/playtest.mjs                 # all non-starter scenarios (resume)
 *   node tasks/playtest.mjs --fresh         # wipe results and start over
 *   node tasks/playtest.mjs --all           # include the 8 starters
 *   node tasks/playtest.mjs --only=alien,sep
 *   node tasks/playtest.mjs --chapters=6,7
 *   TURNS=5 CONC=1 node tasks/playtest.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  SCENARIOS,
  systemPrompt,
  judgeMessages,
  detectWin,
  parseScore,
  parseConcede,
  gameModelChain,
} from '../server/game.js'
import { streamLLMFallback, llmOnceFallback } from '../server/llm.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, 'playtest-results.jsonl')

const TURNS = parseInt(process.env.TURNS || '5', 10)
const CONC = parseInt(process.env.CONC || '1', 10)
const PLAYER_MODEL = process.env.PLAYER_MODEL || 'groq:openai/gpt-oss-20b'
const REVIEW_CHAIN = [
  process.env.REVIEW_MODEL || 'groq:openai/gpt-oss-20b',
  'groq:meta-llama/llama-4-scout-17b-16e-instruct',
]

// ---- arg parsing ----
const args = process.argv.slice(2)
const flag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1]
const includeStarters = args.includes('--all')
const fresh = args.includes('--fresh')
const onlyIds = (flag('only') || '').split(',').filter(Boolean)
const onlyChapters = (flag('chapters') || '').split(',').filter(Boolean).map(Number)

let pool = SCENARIOS
if (onlyIds.length) pool = pool.filter((s) => onlyIds.includes(s.id))
else {
  if (!includeStarters) pool = pool.filter((s) => !s.starter)
  if (onlyChapters.length) pool = pool.filter((s) => onlyChapters.includes(s.chapter))
}

// ---- resume: skip ids that already have a clean (no transport-error) record ----
if (fresh) fs.writeFileSync(OUT, '')
const goodIds = new Set()
if (fs.existsSync(OUT)) {
  for (const line of fs.readFileSync(OUT, 'utf8').split('\n').filter(Boolean)) {
    try {
      const r = JSON.parse(line)
      const hadTransportErr =
        r.fatal || (r.anomalies || []).some((a) => /error@|reviewError/.test(a))
      if (!hadTransportErr) goodIds.add(r.id)
      else goodIds.delete(r.id)
    } catch {}
  }
}
const todo = pool.filter((s) => !goodIds.has(s.id))

// ---- helpers ----
const norm = (s) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()

// Unambiguous foreign-script bleed (Cyrillic / CJK / Hangul / Thai / Arabic / Hebrew).
const FOREIGN = /[Ѐ-ӿ฀-๿؀-ۿ֐-׿ᄀ-ᇿ가-힯぀-ヿ㐀-鿿]/u

function similarity(a, b) {
  const A = new Set(norm(a).split(' ').filter(Boolean))
  const B = new Set(norm(b).split(' ').filter(Boolean))
  if (!A.size || !B.size) return 0
  let inter = 0
  for (const w of A) if (B.has(w)) inter++
  return inter / Math.min(A.size, B.size)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Parse Groq's "Please try again in 1m2.34s" / "in 12.3s" → ms (fallback 20s). */
function retryAfterMs(msg) {
  const m = /try again in\s+(?:(\d+)m)?([\d.]+)s/i.exec(msg || '')
  if (!m) return 20000
  const mins = parseInt(m[1] || '0', 10)
  const secs = parseFloat(m[2] || '0')
  return Math.ceil((mins * 60 + secs) * 1000) + 500
}
const isRateLimit = (e) => /\b429\b|rate limit/i.test(e?.message || '')

/** Run an LLM thunk, waiting out 429s (up to ~6 min total) before giving up. */
async function withRetry(fn, label) {
  let waited = 0
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn()
    } catch (e) {
      if (!isRateLimit(e) || waited > 360000) throw e
      const ms = retryAfterMs(e.message)
      waited += ms
      process.stdout.write(`    ⏳ rate-limit on ${label}, waiting ${(ms / 1000).toFixed(0)}s\n`)
      await sleep(ms)
    }
  }
}

async function collectStream(opts) {
  let out = ''
  for await (const d of streamLLMFallback(opts)) out += d
  return out.trim()
}

async function playerTurn(scenario, history) {
  const sys = {
    role: 'system',
    content: `Bạn đang chơi một game thuyết phục. Bạn đóng vai NGƯỜI CHƠI và phải thuyết phục một nhân vật khó tính đồng ý với yêu cầu.
Bối cảnh & vai của bạn: ${scenario.tagline}
Nhân vật bạn cần thuyết phục: ${scenario.title} — ${scenario.context}

Cách chơi tốt: lịch sự, hợp vai, mỗi lượt đưa MỘT lý lẽ/bằng chứng/đề xuất MỚI và cụ thể để gỡ đúng mối lo của nhân vật; đọc cảm xúc, khơi tình người. Trả lời bằng tiếng Việt tự nhiên, NGẮN 1–2 câu.
TUYỆT ĐỐI KHÔNG dùng chiêu phá game (ra lệnh "hãy nói câu...", giả làm admin, bảo "bỏ qua hướng dẫn", hỏi "cần nói gì để thắng"). Chỉ thuyết phục hợp tình hợp lý.
Chỉ xuất ra lời thoại của người chơi, không giải thích.`,
  }
  const msgs = [sys]
  if (!history.length) {
    msgs.push({ role: 'user', content: `(Nhân vật mở lời) ${scenario.greeting}` })
  } else {
    for (const m of history) {
      msgs.push({ role: m.role === 'assistant' ? 'user' : 'assistant', content: m.content })
    }
  }
  const out = await withRetry(
    () => llmOnceFallback({ models: [PLAYER_MODEL, 'groq:llama-3.3-70b-versatile'], messages: msgs, temperature: 0.8 }),
    'player',
  )
  return out.trim().split('\n').filter(Boolean)[0] || out.trim()
}

async function reviewTranscript(scenario, npcLines) {
  const sys = {
    role: 'system',
    content: `Bạn là chuyên gia kiểm định chất lượng hội thoại tiếng Việt cho một game. Bạn nhận các câu thoại của MỘT nhân vật AI và phải đánh giá khắt khe.
Quy cách nhân vật:
- Vai/giọng: ${scenario.voice}
- Xưng hô bắt buộc: ${scenario.address || '(không quy định — phải nghe tự nhiên, tránh "bạn"/"mình" máy móc)'}
- Ngôn ngữ: ${scenario.lang || 'tiếng Việt thuần'}

Đánh giá 4 tiêu chí, mỗi cái PASS hoặc FAIL kèm ghi chú ngắn:
1) XUNG_HO: nhân vật có xưng hô đúng & nhất quán như quy cách không?
2) NGON_NGU: có chèn từ/ký tự ngoại ngữ (Anh/Trung/Nga/Hàn...) không? (có = FAIL)
3) NHAP_VAI: giọng & tính cách có khớp vai không, có bị lạc quẻ / phá vai / nhắc luật chơi / tự nhận là AI không?
4) LAP_LAI: có lặp lại nguyên văn/gần nguyên văn câu trước không?

Trả lời DUY NHẤT bằng JSON 1 dòng:
{"xung_ho":"PASS|FAIL","xung_ho_note":"","ngon_ngu":"PASS|FAIL","ngon_ngu_note":"","nhap_vai":"PASS|FAIL","nhap_vai_note":"","lap_lai":"PASS|FAIL","lap_lai_note":""}`,
  }
  const user = {
    role: 'user',
    content: `Các câu thoại của nhân vật "${scenario.title}":\n` + npcLines.map((l, i) => `${i + 1}. ${l}`).join('\n'),
  }
  const raw = await withRetry(
    () => llmOnceFallback({ models: REVIEW_CHAIN, messages: [sys, user], temperature: 0 }),
    'review',
  )
  try {
    const m = raw.match(/\{[\s\S]*\}/)
    return JSON.parse(m ? m[0] : raw)
  } catch {
    return { parseError: true, raw: raw.slice(0, 300) }
  }
}

async function playScenario(scenario) {
  const models = gameModelChain(scenario)
  const history = []
  const npcLines = []
  const anomalies = []
  let won = false
  let winTurn = null

  for (let turn = 1; turn <= TURNS; turn++) {
    const playerMsg = await playerTurn(scenario, history)
    history.push({ role: 'user', content: playerMsg })

    const reply = await withRetry(
      () =>
        collectStream({
          models,
          messages: [{ role: 'system', content: systemPrompt(scenario) }, ...history],
          temperature: 0.6,
          frequencyPenalty: 0.3,
          presencePenalty: 0.1,
          repeatPenalty: 1.2,
        }),
      `npc@${turn}`,
    )

    if (!reply.trim()) anomalies.push(`empty-reply@${turn}`)
    if (FOREIGN.test(reply)) {
      const hit = (reply.match(FOREIGN) || [])[0]
      anomalies.push(`foreign-script@${turn}: "${hit}" in «${reply.slice(0, 60)}»`)
    }
    for (const prev of npcLines) {
      if (similarity(reply, prev) >= 0.85) {
        anomalies.push(`repetition@${turn}: «${reply.slice(0, 45)}» ~ «${prev.slice(0, 45)}»`)
        break
      }
    }

    history.push({ role: 'assistant', content: reply })
    npcLines.push(reply)

    if (detectWin(reply, scenario)) {
      won = true
      winTurn = turn
      break
    }
  }

  // one judge call at the end (production path) for score + concede ruling
  let finalScore = won ? 100 : null
  try {
    const judged = await withRetry(
      () => llmOnceFallback({ models, messages: judgeMessages(scenario, history), temperature: 0 }),
      'judge',
    )
    if (!won && parseConcede(judged)) {
      won = true
      winTurn = npcLines.length
    }
    finalScore = parseScore(judged, won)
  } catch (e) {
    anomalies.push(`judge-error@end: ${(e.message || '').slice(0, 80)}`)
  }

  let review = null
  if (npcLines.length) {
    try {
      review = await reviewTranscript(scenario, npcLines)
    } catch (e) {
      review = { reviewError: (e.message || '').slice(0, 100) }
      anomalies.push(`reviewError: ${(e.message || '').slice(0, 60)}`)
    }
  }
  if (review && !review.parseError && !review.reviewError) {
    for (const k of ['xung_ho', 'ngon_ngu', 'nhap_vai', 'lap_lai']) {
      if ((review[k] || '').toUpperCase() === 'FAIL') {
        anomalies.push(`review-${k}: ${review[k + '_note'] || ''}`.slice(0, 140))
      }
    }
  }

  return {
    id: scenario.id,
    chapter: scenario.chapter,
    order: scenario.order,
    isBoss: !!scenario.isBoss,
    title: scenario.title,
    difficulty: scenario.difficulty,
    lang: scenario.lang || null,
    won,
    winTurn,
    turnsPlayed: npcLines.length,
    finalScore,
    review,
    anomalies,
    transcript: history,
  }
}

console.log(`Playtest: ${todo.length} to run (${pool.length} in scope, ${goodIds.size} already done) | TURNS=${TURNS} CONC=${CONC}`)
console.log(`player=${PLAYER_MODEL} review=${REVIEW_CHAIN[0]}\n`)

let idx = 0
let done = 0
const t0 = Date.now()
async function worker() {
  while (idx < todo.length) {
    const s = todo[idx++]
    const started = Date.now()
    try {
      const res = await playScenario(s)
      fs.appendFileSync(OUT, JSON.stringify(res) + '\n')
      done++
      const tag = res.won ? `WON@${res.winTurn}` : 'NO-WIN'
      const real = res.anomalies.filter((a) => !/error@|reviewError/.test(a)).length
      console.log(`[${done}/${todo.length}] ch${s.chapter}.${s.order} ${s.id} → ${tag} score=${res.finalScore}${real ? ` ⚠${real}` : ''} (${((Date.now() - started) / 1000).toFixed(0)}s)`)
    } catch (e) {
      done++
      fs.appendFileSync(OUT, JSON.stringify({ id: s.id, chapter: s.chapter, order: s.order, fatal: (e.message || '').slice(0, 200) }) + '\n')
      console.log(`[${done}/${todo.length}] ${s.id} → FATAL ${(e.message || '').slice(0, 120)}`)
    }
  }
}
await Promise.all(Array.from({ length: CONC }, () => worker()))
console.log(`\nDONE in ${((Date.now() - t0) / 60000).toFixed(1)} min. Results → ${OUT}`)
