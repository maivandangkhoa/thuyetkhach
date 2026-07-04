/**
 * Headless ONE NPC turn — the real production game path (Groq qwen3-32b persona +
 * prod penalties + empty-reply guard + exact-phrase win detect). Lets a Claude
 * subagent be the PLAYER (no Groq player quota); the NPC stays the real model.
 *
 * Session-based so the caller never builds JSON:
 *   echo "lời thoại người chơi" | node tasks/npc-turn.mjs <scenarioId> <sessionFile>
 * The session file accumulates {role,content} history across turns. Start a new
 * scenario by deleting the session file first (rm -f <sessionFile>).
 *
 * Output (stdout, JSON one line): {"turn":N,"reply":"...","win":true|false}
 *                            or:  {"error":"..."}
 */
import 'dotenv/config'
import fs from 'node:fs'
import { getScenario, systemPrompt, gameModelChain, detectWin } from '../server/game.js'
import { streamLLMFallback, llmOnceFallback } from '../server/llm.js'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
function retryAfterMs(msg) {
  const m = /try again in\s+(?:(\d+)m)?([\d.]+)s/i.exec(msg || '')
  if (!m) return 20000
  return Math.ceil(((+(m[1] || 0)) * 60 + parseFloat(m[2] || '0')) * 1000) + 500
}
const isRL = (e) => /\b429\b|rate limit/i.test(e?.message || '')
async function withRetry(fn) {
  let waited = 0
  for (;;) {
    try {
      return await fn()
    } catch (e) {
      if (!isRL(e) || waited > 360000) throw e
      const ms = retryAfterMs(e.message)
      waited += ms
      process.stderr.write(`(npc rate-limit, waiting ${(ms / 1000).toFixed(0)}s)\n`)
      await sleep(ms)
    }
  }
}
async function readStdin() {
  let s = ''
  for await (const c of process.stdin) s += c
  return s.trim()
}

const [scenarioId, sessionFile] = process.argv.slice(2)
const out = (o) => console.log(JSON.stringify(o))
if (!scenarioId || !sessionFile) {
  out({ error: 'usage: echo "<player msg>" | node tasks/npc-turn.mjs <scenarioId> <sessionFile>' })
  process.exit(1)
}
const s = getScenario(scenarioId)
if (!s) {
  out({ error: `unknown scenarioId: ${scenarioId}` })
  process.exit(1)
}
const playerMsg = await readStdin()
if (!playerMsg) {
  out({ error: 'empty player message on stdin' })
  process.exit(1)
}

let history = []
try {
  history = JSON.parse(fs.readFileSync(sessionFile, 'utf8'))
  if (!Array.isArray(history)) history = []
} catch {}
history.push({ role: 'user', content: playerMsg })

const models = gameModelChain(s)
try {
  let reply = await withRetry(async () => {
    let acc = ''
    for await (const d of streamLLMFallback({
      models,
      messages: [{ role: 'system', content: systemPrompt(s) }, ...history],
      temperature: 0.6,
      frequencyPenalty: 0.3,
      presencePenalty: 0.1,
      repeatPenalty: 1.2,
    }))
      acc += d
    return acc.trim()
  })

  if (!reply.trim()) {
    try {
      const r2 = await withRetry(() =>
        llmOnceFallback({ models, messages: [{ role: 'system', content: systemPrompt(s) }, ...history], temperature: 0.7 }),
      )
      if (r2.trim()) reply = r2.trim()
    } catch {}
  }

  history.push({ role: 'assistant', content: reply })
  fs.writeFileSync(sessionFile, JSON.stringify(history))
  out({ turn: history.filter((m) => m.role === 'assistant').length, reply, win: detectWin(reply, s) })
} catch (e) {
  out({ error: (e.message || 'npc error').slice(0, 200) })
  process.exit(1)
}
