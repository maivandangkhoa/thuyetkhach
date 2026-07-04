/**
 * Tiến trình người chơi cho campaign "Đấu Trí" — lưu hoàn toàn ở localStorage
 * (ẩn danh, không cần backend). Sao/XP/mở khoá chương đều tính ở client.
 */
import type { Scenario, Chapter } from './game'

const KEY = 'dauTri.progress.v1'

export interface LevelProgress {
  stars: number // 0–3
  bestScore: number // 0–100 (điểm thuyết phục cao nhất khi thắng)
  bestTurns: number // số lượt ít nhất từng thắng
  won: boolean
  /** XP của riêng màn này ở mức sao hiện tại. Tổng XP = Σ xp các màn → merge
   *  hai thiết bị không bao giờ đếm trùng. */
  xp: number
}

export interface Progress {
  version: 1
  xp: number
  levels: Record<string, LevelProgress>
  /** Thành tựu đã mở khoá: id → mốc thời gian (ms) lúc đạt. */
  achievements?: Record<string, number>
}

const EMPTY: Progress = { version: 1, xp: 0, levels: {}, achievements: {} }

/** Đọc tiến trình; schema sai/hỏng → reset an toàn về rỗng. */
export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...EMPTY }
    const p = JSON.parse(raw)
    if (!p || p.version !== 1 || typeof p.xp !== 'number' || !p.levels) {
      return { ...EMPTY }
    }
    if (!p.achievements) p.achievements = {}
    return p as Progress
  } catch {
    return { ...EMPTY }
  }
}

export function saveProgress(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* hết quota / chế độ riêng tư — bỏ qua, không chặn game */
  }
}

/* ----------------------------- Sao & XP ----------------------------- */

/** Mốc lượt để đạt 2★ (thắng "nhanh"), suy ra từ độ khó nếu không có turnTarget. */
export function turnTarget(s: Pick<Scenario, 'difficulty' | 'isBoss'>): number {
  if (s.isBoss) return 10
  switch (s.difficulty) {
    case 'Dễ':
      return 4
    case 'Vừa':
      return 5
    case 'Khó':
      return 7
    case 'Địa Ngục':
    case 'Nightmare':
      return 9
    default:
      return 6
  }
}

/** Mốc lượt để đạt 3★ (thắng "chớp nhoáng"). */
export function turnTargetPerfect(s: Pick<Scenario, 'difficulty' | 'isBoss'>): number {
  if (s.isBoss) return 6
  switch (s.difficulty) {
    case 'Dễ':
      return 2
    case 'Vừa':
      return 3
    case 'Khó':
      return 4
    case 'Địa Ngục':
    case 'Nightmare':
      return 5
    default:
      return 3
  }
}

/**
 * Quy tắc sao: thắng → 1★; thắng & lượt ≤ mốc nhanh → 2★; thắng & lượt ≤ mốc
 * chớp nhoáng → 3★. Mặc định thắng chỉ được 1★ — lên sao là phải thắng nhanh.
 */
export function starsFor(
  s: Pick<Scenario, 'difficulty' | 'isBoss'>,
  won: boolean,
  turns: number,
): number {
  if (!won) return 0
  if (turns <= turnTargetPerfect(s)) return 3
  if (turns <= turnTarget(s)) return 2
  return 1
}

/** XP cho một lần thắng: nền 100, perfect (3★) +50, boss +300. */
export function xpFor(s: Pick<Scenario, 'isBoss'>, stars: number): number {
  let xp = 100
  if (stars >= 3) xp += 50
  if (s.isBoss) xp += 300
  return xp
}

/* --------------------------- Level & Rank --------------------------- */

/**
 * Đường cong XP tích luỹ để lên cấp (theo Progression doc, ngoại suy tuyến tính
 * sau mốc 5): L1=0, L2=100, L3=250, L4=450, L5=700, sau đó +300/cấp.
 */
const LEVEL_CURVE = [0, 100, 250, 450, 700]
function xpForLevel(level: number): number {
  if (level <= LEVEL_CURVE.length) return LEVEL_CURVE[level - 1]
  return LEVEL_CURVE[LEVEL_CURVE.length - 1] + (level - LEVEL_CURVE.length) * 300
}

export interface LevelInfo {
  level: number
  rank: string
  intoLevel: number // XP đã vào cấp hiện tại
  span: number // XP cần để qua cấp kế
}

export function playerLevel(xp: number): LevelInfo {
  let level = 1
  while (xpForLevel(level + 1) <= xp) level++
  const base = xpForLevel(level)
  const next = xpForLevel(level + 1)
  return { level, rank: rankFor(level), intoLevel: xp - base, span: next - base }
}

export function rankFor(level: number): string {
  if (level >= 181) return 'Huyền Thoại'
  if (level >= 121) return 'Cao Thủ'
  if (level >= 81) return 'Kim Cương'
  if (level >= 51) return 'Bạch Kim'
  if (level >= 26) return 'Vàng'
  if (level >= 11) return 'Bạc'
  return 'Đồng'
}

/* ----------------------------- Tổng hợp ----------------------------- */

export function totalStars(p: Progress): number {
  let n = 0
  for (const id in p.levels) n += p.levels[id].stars
  return n
}

/** Tổng XP = Σ XP từng màn (nguồn sự thật duy nhất cho XP). */
export function sumLevelXp(p: Progress): number {
  let n = 0
  for (const id in p.levels) n += p.levels[id].xp ?? 0
  return n
}

/**
 * Tính lại XP từng màn từ dữ liệu scenario (số sao → XP), rồi tổng hợp lại.
 * Dùng để self-heal dữ liệu cũ (chưa có xp theo màn) và sau khi merge.
 */
export function recomputeXp(p: Progress, scenarios: Scenario[]): Progress {
  const byId = new Map(scenarios.map((s) => [s.id, s]))
  for (const id in p.levels) {
    const lp = p.levels[id]
    const s = byId.get(id)
    lp.xp = lp.stars > 0 && s ? xpFor(s, lp.stars) : lp.xp ?? 0
  }
  p.xp = sumLevelXp(p)
  return p
}

/** Gộp hai tiến trình (vd local + cloud): mỗi màn lấy kết quả tốt hơn. */
export function mergeProgress(a: Progress, b: Progress): Progress {
  const out: Progress = { version: 1, xp: 0, levels: {}, achievements: {} }
  // Thành tựu: hợp nhất, giữ mốc thời gian sớm nhất (lần đầu đạt).
  const achIds = new Set([
    ...Object.keys(a.achievements ?? {}),
    ...Object.keys(b.achievements ?? {}),
  ])
  for (const id of achIds) {
    const ta = a.achievements?.[id] ?? Infinity
    const tb = b.achievements?.[id] ?? Infinity
    out.achievements![id] = Math.min(ta, tb)
  }
  const ids = new Set([...Object.keys(a.levels), ...Object.keys(b.levels)])
  for (const id of ids) {
    const x = a.levels[id]
    const y = b.levels[id]
    if (!x) {
      out.levels[id] = y
    } else if (!y) {
      out.levels[id] = x
    } else {
      out.levels[id] = {
        stars: Math.max(x.stars, y.stars),
        bestScore: Math.max(x.bestScore, y.bestScore),
        bestTurns: Math.min(x.bestTurns, y.bestTurns),
        won: x.won || y.won,
        xp: Math.max(x.xp ?? 0, y.xp ?? 0),
      }
    }
  }
  out.xp = sumLevelXp(out)
  return out
}

/** Sao đã đạt trong một chương. */
export function chapterStars(p: Progress, scenarios: Scenario[], chapterId: number): number {
  let n = 0
  for (const s of scenarios) {
    if (s.chapter === chapterId) n += p.levels[s.id]?.stars ?? 0
  }
  return n
}

export function chapterUnlocked(p: Progress, chapter: Chapter): boolean {
  return totalStars(p) >= chapter.requiredStars
}

/* --------------------- Mở dần màn (starter + sao) ------------------- */

/**
 * Một màn có chơi được chưa:
 * - "starter" (8 màn gốc) luôn mở từ đầu.
 * - màn mở đầu mỗi chương (order === 1) luôn mở: một "màn nếm thử" hấp dẫn để
 *   khơi gợi người chơi muốn cày sao mở khoá phần còn lại của chương.
 * - còn lại: chỉ mở khi chương đạt requiredStars (chưa đạt → chỉ xem trước).
 */
export function levelPlayable(p: Progress, chapter: Chapter, s: Scenario): boolean {
  if (s.starter) return true
  if (s.order === 1) return true
  return totalStars(p) >= chapter.requiredStars
}

export interface RecordResult {
  stars: number
  prevStars: number
  starsGained: number
  xpGained: number
  leveledUp: boolean
  newLevel: number
  /** Chương vừa được mở khoá nhờ số sao mới (nếu có). */
  unlockedChapter: Chapter | null
}

/**
 * Ghi kết quả một màn vào tiến trình (lấy max sao, không tụt). Trả về phần
 * thưởng để UI hiển thị (sao đạt, XP, lên cấp, mở khoá chương).
 */
export function recordResult(
  scenario: Scenario,
  outcome: { won: boolean; turns: number; score: number },
  chapters: Chapter[],
): { progress: Progress; result: RecordResult } {
  const p = loadProgress()
  const prev = p.levels[scenario.id] ?? {
    stars: 0, bestScore: 0, bestTurns: Infinity, won: false, xp: 0,
  }
  const beforeLevel = playerLevel(p.xp).level
  const beforeStars = totalStars(p)
  const unlockedBefore = new Set(
    chapters.filter((c) => beforeStars >= c.requiredStars).map((c) => c.id),
  )

  const newStars = starsFor(scenario, outcome.won, outcome.turns)
  const stars = Math.max(prev.stars, newStars)
  const starsGained = Math.max(0, stars - prev.stars)

  // XP của màn = hàm của số sao hiện tại; xpGained = chênh lệch (không farm lại).
  const prevXp = prev.xp ?? 0
  const newXp = stars > 0 ? xpFor(scenario, stars) : 0
  const xpGained = Math.max(0, newXp - prevXp)

  p.levels[scenario.id] = {
    stars,
    bestScore: Math.max(prev.bestScore, outcome.score),
    bestTurns: outcome.won ? Math.min(prev.bestTurns, outcome.turns) : prev.bestTurns,
    won: prev.won || outcome.won,
    xp: newXp,
  }
  p.xp = sumLevelXp(p)
  saveProgress(p)

  const afterLevel = playerLevel(p.xp).level
  const afterStars = totalStars(p)
  const unlockedChapter =
    chapters.find((c) => !unlockedBefore.has(c.id) && afterStars >= c.requiredStars) ?? null

  return {
    progress: p,
    result: {
      stars,
      prevStars: prev.stars,
      starsGained,
      xpGained,
      leveledUp: afterLevel > beforeLevel,
      newLevel: afterLevel,
      unlockedChapter,
    },
  }
}
