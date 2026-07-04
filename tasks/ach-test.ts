/* Kiểm logic detectUnlocks với dữ liệu giả lập. Chạy: npx tsx tasks/ach-test.ts */
import { detectUnlocks, ACHIEVEMENTS } from '../src/lib/achievements'
import type { Progress } from '../src/lib/progress'
import type { Scenario, Chapter } from '../src/lib/game'

// --- scenarios giả lập: chương 1 (12 màn, boss = order 12) + 1 màn chương 8 ---
const mk = (id: string, chapter: number, order: number, isBoss = false): Scenario =>
  ({ id, chapter, order, isBoss, difficulty: 'Dễ', emoji: '🙂', title: id,
     tone: 'normal', tagline: '', greeting: '' } as unknown as Scenario)

const scenarios: Scenario[] = [
  ...Array.from({ length: 12 }, (_, i) => mk(`c1-${i + 1}`, 1, i + 1, i === 11)),
  mk('c8-1', 8, 1),
]
const chapters: Chapter[] = [
  { id: 1, requiredStars: 0 } as Chapter,
  { id: 8, requiredStars: 42 } as Chapter,
]

const lvl = (stars: number, bestTurns = 6) => ({ stars, bestScore: 90, bestTurns, won: true, xp: 0 })
const emptyP = (): Progress => ({ version: 1, xp: 0, levels: {}, achievements: {} })

let pass = 0, fail = 0
const check = (name: string, got: boolean, want = true) => {
  const ok = got === want
  console.log(`${ok ? '✓' : '✗'} ${name}`)
  ok ? pass++ : fail++
}
const ids = (as: { id: string }[]) => as.map((a) => a.id).sort()

// 1) Tiến trình rỗng → không mở gì
{
  const p = emptyP()
  const u = detectUnlocks(p, scenarios, chapters, undefined, 1)
  check('rỗng → 0 thành tựu', u.length === 0)
}

// 2) Hạ boss ch1 với 2★ → first-boss + boss-clean (KHÔNG ch1-clear vì mới 1 màn)
{
  const p = emptyP()
  p.levels['c1-12'] = lvl(2)
  const u = ids(detectUnlocks(p, scenarios, chapters, undefined, 1))
  check('hạ 1 boss 2★ → first-boss', u.includes('first-boss'))
  check('hạ boss 2★ → boss-clean', u.includes('boss-clean'))
  check('mới 1 màn → KHÔNG ch1-clear', !u.includes('ch1-clear'))
}

// 3) Toàn bộ ch1 đạt 3★ → ch1-clear + chapter-perfect(Toàn Bích) + perfect-1 + first-boss
{
  const p = emptyP()
  for (let i = 1; i <= 12; i++) p.levels[`c1-${i}`] = lvl(3, 5)
  const u = ids(detectUnlocks(p, scenarios, chapters, undefined, 1))
  check('cả ch1 3★ → ch1-clear', u.includes('ch1-clear'))
  check('cả ch1 3★ → chapter-perfect (Toàn Bích)', u.includes('chapter-perfect'))
  check('có 3★ → perfect-1', u.includes('perfect-1'))
}

// 4) bestTurns ≤ 3 → fast-3
{
  const p = emptyP()
  p.levels['c1-1'] = lvl(1, 3)
  const u = ids(detectUnlocks(p, scenarios, chapters, undefined, 1))
  check('thắng ≤3 lượt → fast-3', u.includes('fast-3'))
}

// 5) Cú Đêm: event giờ 2 → mở; giờ 10 → không
{
  const p = emptyP()
  const night = detectUnlocks(p, scenarios, chapters, { justWon: true, scenarioId: 'c1-1', hour: 2 }, 1)
  check('thắng lúc 2h → night-owl', ids(night).includes('night-owl'))

  const p2 = emptyP()
  const day = detectUnlocks(p2, scenarios, chapters, { justWon: true, scenarioId: 'c1-1', hour: 10 }, 1)
  check('thắng lúc 10h → KHÔNG night-owl', !ids(day).includes('night-owl'))
}

// 6) Idempotent: chạy lại không mở lại
{
  const p = emptyP()
  p.levels['c1-12'] = lvl(2)
  detectUnlocks(p, scenarios, chapters, undefined, 1)
  const again = detectUnlocks(p, scenarios, chapters, undefined, 2)
  check('chạy lại → 0 thành tựu mới (idempotent)', again.length === 0)
  check('timestamp giữ lần đầu (=1)', p.achievements!['first-boss'] === 1)
}

console.log(`\n${ACHIEVEMENTS.length} thành tựu định nghĩa | ${pass} pass, ${fail} fail`)
process.exit(fail ? 1 : 0)
