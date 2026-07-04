/**
 * Structural validation of all scenarios. Imports the REAL data so it catches
 * the same shape the server serves. Run: node tasks/validate-scenarios.mjs
 */
import { SCENARIOS, CHAPTERS, chapterCounts } from '../server/scenarios/index.js'

const norm = (s) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const problems = []
const warn = []
const P = (id, msg) => problems.push(`[${id}] ${msg}`)
const W = (id, msg) => warn.push(`[${id}] ${msg}`)

// Vietnamese letter set (incl. accents) + common punctuation/digits.
const VN_OK = /^[\sa-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ.,!?;:'"()\-–—…/%₫×+&@#0-9]*$/i

console.log(`Total scenarios: ${SCENARIOS.length}`)
console.log(`Chapters: ${CHAPTERS.length}`)
console.log('Counts per chapter:', JSON.stringify(chapterCounts()))

// unique ids
const seen = new Map()
for (const s of SCENARIOS) {
  if (seen.has(s.id)) P(s.id, `DUPLICATE id (also ch${seen.get(s.id)})`)
  seen.set(s.id, s.chapter)
}

const REQUIRED = ['id', 'chapter', 'order', 'emoji', 'title', 'difficulty', 'tagline', 'greeting', 'voice', 'context', 'winPhrases']
const byChapter = {}
for (const s of SCENARIOS) {
  const id = s.id || '??'
  ;(byChapter[s.chapter] ||= []).push(s)
  for (const f of REQUIRED) {
    if (s[f] === undefined || s[f] === null || (typeof s[f] === 'string' && !s[f].trim())) P(id, `missing/empty field: ${f}`)
  }
  if (!Array.isArray(s.winPhrases) || s.winPhrases.length === 0) P(id, `winPhrases not a non-empty array`)
  else {
    s.winPhrases.forEach((p, i) => {
      if (typeof p !== 'string' || !p.trim()) P(id, `winPhrases[${i}] empty`)
      if (norm(p).length < 3) W(id, `winPhrases[${i}] very short after norm: "${p}"`)
    })
  }
  if (typeof s.isBoss !== 'boolean') W(id, `isBoss not boolean (${s.isBoss})`)
  if (!s.address && !s.lang) W(id, `no address and no lang — pronouns may sound robotic`)

  // greeting must NOT already contain a win phrase (would auto-win turn 1)
  const ng = norm(s.greeting)
  if (Array.isArray(s.winPhrases)) {
    for (const p of s.winPhrases) {
      const np = norm(p)
      if (np && ng.includes(np)) P(id, `GREETING already contains winPhrase "${p}" → instant win bug`)
    }
  }

  // language sanity: flag non-Vietnamese letters in player-facing strings
  // (skip scenarios that intentionally use another language)
  if (!s.lang) {
    for (const f of ['title', 'tagline', 'greeting']) {
      const val = s[f] || ''
      // strip emoji and combining marks first
      const stripped = val.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
      if (!VN_OK.test(stripped)) {
        const bad = [...stripped].filter((ch) => !VN_OK.test(ch)).join('')
        W(id, `${f} has non-VN chars: "${bad}"`)
      }
    }
  }
}

// per-chapter checks
for (let ch = 1; ch <= 15; ch++) {
  const arr = (byChapter[ch] || []).sort((a, b) => a.order - b.order)
  if (arr.length !== 12) P(`ch${ch}`, `expected 12 levels, found ${arr.length}`)
  const orders = arr.map((s) => s.order)
  const expected = Array.from({ length: arr.length }, (_, i) => i + 1)
  if (JSON.stringify(orders) !== JSON.stringify(expected)) P(`ch${ch}`, `orders not 1..${arr.length}: [${orders}]`)
  const bosses = arr.filter((s) => s.isBoss)
  if (bosses.length !== 1) P(`ch${ch}`, `expected exactly 1 boss, found ${bosses.length}`)
  if (bosses[0] && bosses[0].order !== 12) P(`ch${ch}`, `boss not at order 12 (at ${bosses[0].order})`)
  // metadata present
  const meta = CHAPTERS.find((c) => c.id === ch)
  if (!meta) P(`ch${ch}`, `no CHAPTERS metadata`)
}

// starters
const starters = SCENARIOS.filter((s) => s.starter)
console.log(`Starters: ${starters.length} (${starters.map((s) => s.id).join(', ')})`)

console.log(`\n===== PROBLEMS (${problems.length}) =====`)
problems.forEach((p) => console.log('  ✗ ' + p))
console.log(`\n===== WARNINGS (${warn.length}) =====`)
warn.forEach((w) => console.log('  ⚠ ' + w))
console.log(`\nDONE. ${problems.length} problems, ${warn.length} warnings.`)
