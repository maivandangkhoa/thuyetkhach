/**
 * Controlled A/B: replay the SAME player turns (recorded from the pre-fix run)
 * against the NPC under the current (post-fix) code, so output differences are
 * due to the code change, not a different player. Prints each NPC reply + flags.
 *
 * node tasks/verify-fix.mjs <scenarioId> [scenarioId...]
 * Player turns are read from tasks/playtest-results.jsonl (the recorded transcript).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getScenario, systemPrompt, gameModelChain } from '../server/game.js'
import { streamLLMFallback, llmOnceFallback } from '../server/llm.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, 'playtest-results.jsonl')
const FOREIGN = /[Ѐ-ӿ฀-๿؀-ۿ֐-׿ᄀ-ᇿ가-힯぀-ヿ㐀-鿿]/u

const recorded = new Map()
for (const line of fs.readFileSync(OUT, 'utf8').split('\n').filter(Boolean)) {
  try {
    const r = JSON.parse(line)
    if (r.transcript) recorded.set(r.id, r)
  } catch {}
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function collect(opts) {
  let out = ''
  for await (const d of streamLLMFallback(opts)) out += d
  return out.trim()
}

const ids = process.argv.slice(2)
for (const id of ids) {
  const s = getScenario(id)
  const rec = recorded.get(id)
  if (!s || !rec) {
    console.log(`\n## ${id}: missing scenario or recording`)
    continue
  }
  const playerTurns = rec.transcript.filter((m) => m.role === 'user').map((m) => m.content)
  console.log(`\n=============== ${id} (${s.title}) ===============`)
  console.log(`address: ${s.address || '(none)'}`)
  const models = gameModelChain(s)
  const history = []
  const prev = []
  for (let i = 0; i < playerTurns.length; i++) {
    history.push({ role: 'user', content: playerTurns[i] })
    let reply = ''
    for (let attempt = 0; ; attempt++) {
      try {
        reply = await collect({
          models,
          messages: [{ role: 'system', content: systemPrompt(s) }, ...history],
          temperature: 0.6,
          frequencyPenalty: 0.3,
          presencePenalty: 0.1,
          repeatPenalty: 1.2,
        })
        break
      } catch (e) {
        if (!/429|rate limit/i.test(e.message) || attempt > 4) throw e
        const m = /try again in\s+(?:(\d+)m)?([\d.]+)s/i.exec(e.message)
        const ms = m ? Math.ceil(((+(m[1] || 0)) * 60 + parseFloat(m[2])) * 1000) + 500 : 20000
        console.log(`   ⏳ waiting ${(ms / 1000).toFixed(0)}s`)
        await sleep(ms)
      }
    }
    // mirror the server-side empty-reply guard (Fix 3): retry once, no penalty
    let guarded = false
    if (!reply.trim()) {
      try {
        const r2 = await llmOnceFallback({
          models,
          messages: [{ role: 'system', content: systemPrompt(s) }, ...history],
          temperature: 0.7,
        })
        if (r2.trim()) {
          reply = r2.trim()
          guarded = true
        }
      } catch {}
    }
    history.push({ role: 'assistant', content: reply })
    const flags = []
    if (guarded) flags.push('GUARD-RECOVERED')
    if (!reply.trim()) flags.push('EMPTY')
    if (FOREIGN.test(reply)) flags.push('FOREIGN:' + (reply.match(FOREIGN) || [])[0])
    if (/\b(tao|mày|tớ)\b/i.test(reply)) flags.push('RUDE-PRONOUN')
    if (/\bmình\b/i.test(reply)) flags.push('uses-mình')
    if (/\bbạn\b/i.test(reply)) flags.push('uses-bạn')
    if (prev.some((p) => p === reply)) flags.push('VERBATIM-REPEAT')
    prev.push(reply)
    console.log(`\nP${i + 1}> ${playerTurns[i].slice(0, 90)}`)
    console.log(`N${i + 1}> ${reply}`)
    if (flags.length) console.log(`   ⚠ ${flags.join(', ')}`)
  }
}
console.log('\n--- verify done ---')
