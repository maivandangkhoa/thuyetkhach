import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import { streamLLMFallback, llmOnceFallback } from './llm.js'
import {
  SCENARIOS,
  CHAPTERS,
  getScenario,
  publicScenario,
  gameModelChain,
  systemPrompt,
  detectWin,
  buildShareQuote,
  judgeMessages,
  parseScore,
  parseConcede,
} from './game.js'
import { recordPlay, recordWin, getStats } from './stats.js'
import { renderOgPng } from './og.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 8788

const app = express()
app.use(cors())
app.use(express.json({ limit: '4mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

/** Public list of game scenarios (no secrets) + play/win counts per scenario,
 *  kèm metadata chương. Tiến trình (sao/unlock) do client tự tính từ localStorage. */
app.get('/api/game/scenarios', (_req, res) => {
  res.json({
    chapters: CHAPTERS,
    scenarios: SCENARIOS.map((s) => ({ ...publicScenario(s), ...getStats(s.id) })),
  })
})

/**
 * Play a turn. Body: { scenarioId, messages: [{role:'user'|'assistant', content}] }
 * Streams the character's reply, then emits a meta event:
 *   data: {"meta": {"win": bool, "score": 0-100}}
 */
app.post('/api/game/chat', async (req, res) => {
  const { scenarioId, messages } = req.body || {}
  const scenario = getScenario(scenarioId)
  if (!scenario || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'scenarioId and messages are required' })
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders?.()

  const controller = new AbortController()
  let finished = false
  res.on('close', () => {
    if (!finished) controller.abort()
  })

  // Heartbeat: while a model cold-loads it sends no tokens for a while.
  // Proxies (Cloudflare cuts idle requests at ~100s) would drop the connection.
  // Emit an SSE comment line every 15s until the first token; clients ignore it.
  let firstTokenSent = false
  const heartbeat = setInterval(() => {
    if (!firstTokenSent && !finished) res.write(': keepalive\n\n')
  }, 15000)

  const models = gameModelChain(scenario)
  const convo = messages
    .filter((m) => m && m.content)
    .map((m) => ({ role: m.role, content: m.content }))
  let reply = ''

  // Count a "play" the moment a player sends their first message of a round.
  if (convo.filter((m) => m.role === 'user').length === 1) recordPlay(scenario.id)

  try {
    for await (const delta of streamLLMFallback({
      models,
      messages: [{ role: 'system', content: systemPrompt(scenario) }, ...convo],
      signal: controller.signal,
      temperature: 0.6, // lower temp → less foreign-language token bleeding
      // Chống NPC lặp lại nguyên văn câu trước (Groq dùng frequency/presence,
      // Ollama dùng repeat_penalty). GIỮ NHẸ: penalty tính trên CẢ ngữ cảnh nên
      // khi hội thoại dài, các từ chức năng/đại từ tiếng Việt bị phạt nặng dần →
      // câu cụt, rớt chữ (đã thấy ở màn ít lời như "crush"). Luật cấm-lặp trong
      // system prompt mới là tuyến phòng thủ chính.
      frequencyPenalty: 0.3,
      presencePenalty: 0.1,
      repeatPenalty: 1.2,
      onSwitch: (from, to, err) =>
        console.warn(`[game] ${from} lỗi (${(err.message || '').slice(0, 80)}) → chuyển sang ${to}`),
    })) {
      firstTokenSent = true
      reply += delta
      res.write(`data: ${JSON.stringify({ delta })}\n\n`)
    }

    // qwen3 đôi khi chỉ xuất khối <think> (bị lọc sạch) → reply rỗng = bong bóng
    // trống bên người chơi. Thử lại 1 lần không streaming, bỏ penalty, rồi đẩy
    // nguyên câu xuống client.
    if (!reply.trim() && !controller.signal.aborted) {
      try {
        const retry = await llmOnceFallback({
          models,
          messages: [{ role: 'system', content: systemPrompt(scenario) }, ...convo],
          signal: controller.signal,
          temperature: 0.7,
        })
        if (retry.trim()) {
          reply = retry.trim()
          firstTokenSent = true
          res.write(`data: ${JSON.stringify({ delta: reply })}\n\n`)
        }
      } catch {
        /* giữ reply rỗng — judge bên dưới sẽ xử lý */
      }
    }

    // Win = exact phrase match OR the judge rules the character conceded
    // (robust to model typos that garble the winning phrase).
    const wonByPhrase = detectWin(reply, scenario)
    let won = wonByPhrase
    let score = won ? 100 : null
    try {
      const judged = await llmOnceFallback({
        models,
        messages: judgeMessages(scenario, [
          ...convo,
          { role: 'assistant', content: reply },
        ]),
        signal: controller.signal,
        temperature: 0, // deterministic scoring
      })
      if (!won && parseConcede(judged)) won = true
      score = parseScore(judged, won)
    } catch {
      score = won ? 100 : null
    }

    // Count the win once — skip if an exact-phrase win already happened earlier
    // in this conversation (player kept chatting after winning).
    if (
      won &&
      !convo.some((m) => m.role === 'assistant' && detectWin(m.content, scenario))
    ) {
      recordWin(scenario.id)
    }

    // Câu trích đã kiểm duyệt cho ảnh chia sẻ (chỉ khi thắng).
    const shareQuote = won ? buildShareQuote(reply, scenario, wonByPhrase) : null
    res.write(`data: ${JSON.stringify({ meta: { win: won, score, shareQuote } })}\n\n`)
    res.write('data: [DONE]\n\n')
  } catch (err) {
    if (!controller.signal.aborted) {
      console.error(`[game] tất cả model đều lỗi: ${err.message}`)
      res.write(
        `data: ${JSON.stringify({ error: '⚠️ Các trợ lý AI đang quá tải, bạn thử lại sau giây lát nhé.' })}\n\n`,
      )
    }
  } finally {
    clearInterval(heartbeat)
    finished = true
    res.end()
  }
})

/**
 * Per-scenario link previews. The generic game meta/PWA tags are baked into
 * index.html; only a share link with ?s=<id> needs a server-side rewrite,
 * because crawlers (Zalo, Messenger, Facebook…) don't run JS.
 */
const ORIGIN = process.env.PUBLIC_ORIGIN || 'https://game.fechtin.com'

// Escape a value for safe injection: HTML-escape (`"`/`&`/`<`) and double any
// `$` so it survives String.replace's backreference syntax in the reduce below.
const attr = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/\$/g, '$$$$')

function scenarioMeta(html, scenario) {
  const title = `${scenario.title} — Thuyết Khách Hành`
  const desc =
    scenario.tagline ||
    'Một trận đấu trí: thuyết phục AI thay đổi quan điểm. Bạn làm được không?'
  const url = `${ORIGIN}/?s=${encodeURIComponent(scenario.id)}`
  const img = `${ORIGIN}/og/${encodeURIComponent(scenario.id)}.png`

  // content values never contain a double quote, so `[^"]*` is a safe match.
  const set = (id, value) =>
    [new RegExp(`((?:name|property)="${id}"[\\s\\S]*?content=")[^"]*(")`), `$1${value}$2`]

  const eTitle = attr(title)
  const eDesc = attr(desc)
  return [
    [/<title>[^<]*<\/title>/, `<title>${eTitle}</title>`],
    set('description', eDesc),
    set('og:title', eTitle),
    set('og:description', eDesc),
    set('og:url', attr(url)),
    set('og:image', attr(img)),
    set('twitter:title', eTitle),
    set('twitter:description', eDesc),
    set('twitter:image', attr(img)),
  ].reduce((h, [re, to]) => h.replace(re, to), html)
}

/**
 * OG image động cho từng màn — chỉ bot crawler lấy, cache in-memory sau lần đầu.
 * Lỗi render / không có màn → fallback ảnh chung /og-game.png.
 */
const ogCache = new Map() // id -> PNG Buffer
app.get(/^\/og\/(.+)\.png$/, async (req, res) => {
  const id = req.params[0]
  try {
    let png = ogCache.get(id)
    if (!png) {
      const scenario = getScenario(id)
      if (!scenario) return res.redirect(302, '/og-game.png')
      const chapter = CHAPTERS.find((c) => c.id === scenario.chapter)
      png = await renderOgPng(scenario, chapter)
      ogCache.set(id, png)
    }
    res.type('png')
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800')
    res.send(png)
  } catch (e) {
    console.error('[og] render failed for', id, '→', e?.message)
    res.redirect(302, '/og-game.png')
  }
})

// Serve the built frontend in production, if it exists.
const dist = path.join(__dirname, '..', 'dist')
if (fs.existsSync(dist)) {
  const baseHtml = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
  // Nếu có ?s=<id> hợp lệ → preview riêng từng màn (tính per-request, rất nhẹ).
  const sendDoc = (req, res) => {
    const sid = typeof req.query.s === 'string' ? req.query.s : null
    const scenario = sid ? getScenario(sid) : null
    res.type('html').send(scenario ? scenarioMeta(baseHtml, scenario) : baseHtml)
  }

  app.get('/', sendDoc)
  app.use(express.static(dist, { index: false })) // assets/og images, not index.html
  app.get('*', sendDoc) // client-side routes fall back to the SPA shell
}

app.listen(PORT, () => {
  console.log(`\n  Thuyết Khách Hành backend ready → http://localhost:${PORT}\n`)
})
