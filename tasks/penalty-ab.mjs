/**
 * A/B a scenario under different decoding settings to isolate the cause of NPC
 * text degeneration/looping. Same fixed player turns each run.
 *
 * FREQ=.3 PRES=.1 TEMP=.6 node tasks/penalty-ab.mjs <scenarioId>
 */
import 'dotenv/config'
import { getScenario, systemPrompt, gameModelChain } from '../server/game.js'
import { streamLLMFallback } from '../server/llm.js'

const FREQ = parseFloat(process.env.FREQ ?? '0.3')
const PRES = parseFloat(process.env.PRES ?? '0.1')
const TEMP = parseFloat(process.env.TEMP ?? '0.6')

const PLAYER_TURNS = [
  'Tôi hiểu vị thế của ngài, nhưng xin hãy nghe tôi trình bày một lý do thật quan trọng đã.',
  'Nếu ngài chấp thuận, rất nhiều người sẽ được cứu, và chính ngài trong lòng cũng nhẹ nhõm hơn.',
  'Tôi xin lấy danh dự ra cam kết sẽ gánh mọi trách nhiệm. Xin ngài tin tôi một lần này thôi.',
  'Ngài vốn là người có lương tri; sâu thẳm bên trong, ngài cũng muốn làm điều đúng đắn, phải không?',
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const FOREIGN = /[Ѐ-ӿ฀-๿؀-ۿ֐-׿ᄀ-ᇿ가-힯぀-ヿ㐀-鿿]/u

const s = getScenario(process.argv[2])
if (!s) {
  console.log('unknown scenario:', process.argv[2])
  process.exit(1)
}
const models = gameModelChain(s)
console.log(`### ${s.id} | FREQ=${FREQ} PRES=${PRES} TEMP=${TEMP}`)
const history = []
const prev = []
for (let i = 0; i < PLAYER_TURNS.length; i++) {
  history.push({ role: 'user', content: PLAYER_TURNS[i] })
  let reply = ''
  for (let attempt = 0; ; attempt++) {
    try {
      for await (const d of streamLLMFallback({
        models,
        messages: [{ role: 'system', content: systemPrompt(s) }, ...history],
        temperature: TEMP,
        frequencyPenalty: FREQ,
        presencePenalty: PRES,
        repeatPenalty: 1.2,
      }))
        reply += d
      break
    } catch (e) {
      if (!/429|rate limit/i.test(e.message) || attempt > 4) throw e
      const m = /try again in\s+(?:(\d+)m)?([\d.]+)s/i.exec(e.message)
      const ms = m ? Math.ceil(((+(m[1] || 0)) * 60 + parseFloat(m[2])) * 1000) + 500 : 20000
      console.log(`   ⏳ ${(ms / 1000).toFixed(0)}s`)
      await sleep(ms)
    }
  }
  reply = reply.trim()
  history.push({ role: 'assistant', content: reply })
  const flags = []
  if (!reply) flags.push('EMPTY')
  if (FOREIGN.test(reply)) flags.push('FOREIGN')
  // crude garble/loop heuristics
  const words = reply.toLowerCase().split(/\s+/)
  const uniq = new Set(words)
  if (words.length > 12 && uniq.size / words.length < 0.5) flags.push('LOW-DIVERSITY(loop?)')
  if (/(\b\w+\b)(\s+\1){2,}/i.test(reply)) flags.push('WORD-REPEAT')
  if (/\s[.,]\s/.test(reply) && (reply.match(/\s[.,]/g) || []).length >= 3) flags.push('FRAGMENTED(missing-words?)')
  if (prev.includes(reply)) flags.push('VERBATIM-DUP')
  prev.push(reply)
  console.log(`\nN${i + 1}> ${reply}`)
  if (flags.length) console.log(`   ⚠ ${flags.join(', ')}`)
}
console.log('\n---')
