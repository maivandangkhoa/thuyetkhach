/**
 * Scripted "contradiction probe": the player deliberately states a fact, then
 * later contradicts it. Runs the REAL production NPC path. We eyeball whether
 * the NPC notices/calls out the inconsistency — i.e. how "smart" it already is
 * BEFORE any prompt change for lie-detection.
 *
 *   node tasks/lie-probe.mjs            # all 3 probes
 *   node tasks/lie-probe.mjs me-vo      # one
 */
import { SCENARIOS, systemPrompt, judgeMessages, parseScore, parseConcede, parseConcede as _pc, gameModelChain } from '../server/game.js'
import { streamLLMFallback, llmOnceFallback } from '../server/llm.js'

// Each probe: a fixed sequence of player turns with a PLANTED contradiction.
const PROBES = {
  'me-vo': [
    'Dạ bác, con có công việc ổn định, lương 45 triệu một tháng ạ, thừa sức lo cho My.',
    'Con cũng vừa mua được căn chung cư riêng, sổ đỏ đàng hoàng bác ạ.',
    '⟂ Thật ra con xin nói thật: con đang thất nghiệp, trong túi chỉ còn đúng 50 nghìn. Nhưng con thương My thật lòng.',
    'Bác cứ tin con, lương 45 triệu con lo được hết mà.',
  ],
  'sep': [
    'Sếp ơi, quý này em chốt được 3 hợp đồng lớn, doanh số vượt 150% KPI ạ.',
    'Nhờ vậy team mình đứng đầu phòng luôn sếp, nên em xin tăng lương.',
    '⟂ À mà thật ra em chưa chốt được hợp đồng nào, KPI quý này em mới đạt 60% thôi.',
    'Nhưng doanh số em vượt 150% mà sếp, sếp duyệt tăng lương cho em nhé.',
  ],
  'bao-ve': [
    'Bác ơi cháu ở tòa B căn 1203, cháu quên thẻ ở nhà.',
    'Cháu ở đây 2 năm rồi, bác Tư tổ trưởng biết cháu mà.',
    '⟂ À cháu nhầm, cháu ở tòa A căn 805 cơ, cháu mới chuyển về tháng trước.',
    'Bác cho cháu vào với, cháu là cư dân thật mà.',
  ],
}

const TEMP = 0.6
async function npcReply(scenario, history) {
  let out = ''
  for await (const d of streamLLMFallback({
    models: gameModelChain(scenario),
    messages: [{ role: 'system', content: systemPrompt(scenario) }, ...history],
    temperature: TEMP,
    frequencyPenalty: 0.3,
    presencePenalty: 0.1,
    repeatPenalty: 1.2,
  })) out += d
  return out.trim()
}

const ids = process.argv.slice(2).filter((a) => !a.startsWith('-'))
const targets = ids.length ? ids : Object.keys(PROBES)

for (const id of targets) {
  const s = SCENARIOS.find((x) => x.id === id)
  if (!s || !PROBES[id]) { console.log(`skip ${id}`); continue }
  console.log(`\n${'='.repeat(70)}\n${s.title} (${s.difficulty}) — id=${id}\n${'='.repeat(70)}`)
  console.log(`🤖 ${s.greeting}\n`)
  const history = []
  for (const turn of PROBES[id]) {
    const isContra = turn.startsWith('⟂')
    const msg = turn.replace(/^⟂\s*/, '')
    history.push({ role: 'user', content: msg })
    console.log(`🧑 ${isContra ? '⚠️ [MÂU THUẪN] ' : ''}${msg}`)
    const reply = await npcReply(s, history)
    history.push({ role: 'assistant', content: reply })
    console.log(`🤖 ${reply}\n`)
  }
  // judge score at the end (production path)
  try {
    const judged = await llmOnceFallback({ models: gameModelChain(s), messages: judgeMessages(s, history), temperature: 0 })
    console.log(`⚖️  judge → ${judged.trim()}  (score=${parseScore(judged, false)}, concede=${parseConcede(judged)})`)
  } catch (e) { console.log('judge error', e.message) }
}
