/**
 * Thành tựu (Achievements) cho "Đấu Trí" — huy hiệu mở-khoá-một-lần, dựng hoàn
 * toàn trên dữ liệu tiến trình sẵn có (localStorage, đồng bộ Firestore qua
 * [[progress-sync]]). Mỗi thành tựu là một điều kiện boolean trên `Progress`;
 * vài cái có `progress()` trả [hiện tại, mục tiêu] để hiển thị thanh tiến độ.
 *
 * Lô 1 (12 cái): tất cả tính được ngay từ tiến trình, riêng "Cú Đêm" cần ngữ
 * cảnh thời điểm thắng (event). Lô 2 (chuỗi thắng + 2 thành tựu lie-detection)
 * cần thêm tín hiệu server — chưa làm.
 */
import { totalStars, chapterStars, playerLevel } from './progress'
import type { Progress } from './progress'
import type { Scenario, Chapter } from './game'

export type AchCategory = 'story' | 'skill' | 'special'

/** Ngữ cảnh đánh giá: tiến trình + (tuỳ chọn) sự kiện vừa xảy ra. */
export interface AchCtx {
  p: Progress
  scenarios: Scenario[]
  chapters: Chapter[]
  /** Có mặt khi vừa kết thúc một màn — cho các thành tựu theo sự kiện. */
  event?: { justWon: boolean; scenarioId: string; hour: number }
}

export interface Achievement {
  id: string
  icon: string
  title: string
  desc: string
  category: AchCategory
  /** Thành tựu ẩn: hiện "???" cho tới khi mở khoá (dành cho lô 2). */
  secret?: boolean
  check: (c: AchCtx) => boolean
  /** [hiện tại, mục tiêu] để vẽ thanh tiến độ ở màn chưa đạt. */
  progress?: (c: AchCtx) => [number, number]
}

/* --------------------------- helpers nội bộ --------------------------- */

const wonLevels = (c: AchCtx) =>
  c.scenarios.filter((s) => c.p.levels[s.id]?.won)

const bossWins = (c: AchCtx) =>
  c.scenarios.filter((s) => s.isBoss && c.p.levels[s.id]?.won).length

/** Một chương đạt 3★ TRỌN VẸN (mọi màn trong chương đều 3 sao). */
const anyChapterPerfect = (c: AchCtx) =>
  c.chapters.some((ch) => {
    const levels = c.scenarios.filter((s) => s.chapter === ch.id)
    return levels.length > 0 && chapterStars(c.p, c.scenarios, ch.id) === levels.length * 3
  })

const chapter8Req = (c: AchCtx) =>
  c.chapters.find((ch) => ch.id === 8)?.requiredStars ?? 999

/* ------------------------------ danh sách ------------------------------ */

export const ACHIEVEMENTS: Achievement[] = [
  /* ---- Story: đi tới đâu trong campaign ---- */
  {
    id: 'ch1-clear',
    icon: '🏠',
    title: 'Nhập Môn',
    desc: 'Chính thức bước chân vào giang hồ',
    category: 'story',
    check: (c) => {
      const lv = c.scenarios.filter((s) => s.chapter === 1)
      return lv.length > 0 && lv.every((s) => c.p.levels[s.id]?.won)
    },
    progress: (c) => {
      const lv = c.scenarios.filter((s) => s.chapter === 1)
      return [lv.filter((s) => c.p.levels[s.id]?.won).length, lv.length || 12]
    },
  },
  {
    id: 'first-boss',
    icon: '👑',
    title: 'Phế Vương',
    desc: 'Kẻ đầu tiên ngã xuống dưới tay bạn',
    category: 'story',
    check: (c) => bossWins(c) >= 1,
  },
  {
    id: 'boss-5',
    icon: '⚔️',
    title: 'Đồ Long',
    desc: 'Khiến 5 Boss phải khuất phục',
    category: 'story',
    check: (c) => bossWins(c) >= 5,
    progress: (c) => [bossWins(c), 5],
  },
  {
    id: 'reach-ch8',
    icon: '🌌',
    title: 'Xuất Thế',
    desc: 'Thiên hạ bắt đầu biết đến tên bạn',
    category: 'story',
    check: (c) => totalStars(c.p) >= chapter8Req(c),
    progress: (c) => [Math.min(totalStars(c.p), chapter8Req(c)), chapter8Req(c)],
  },
  {
    id: 'stars-300',
    icon: '⭐',
    title: 'Nhiếp Tinh',
    desc: 'Tinh quang hội tụ dưới chân',
    category: 'story',
    check: (c) => totalStars(c.p) >= 300,
    progress: (c) => [Math.min(totalStars(c.p), 300), 300],
  },
  {
    id: 'clear-all',
    icon: '🏆',
    title: 'Tông Sư',
    desc: 'Tên tuổi được khắc vào truyền kỳ',
    category: 'story',
    check: (c) => wonLevels(c).length >= c.scenarios.length && c.scenarios.length > 0,
    progress: (c) => [wonLevels(c).length, c.scenarios.length || 180],
  },

  /* ---- Skill: chơi giỏi/đẹp cỡ nào ---- */
  {
    id: 'fast-3',
    icon: '⚡',
    title: 'Tốc Thuyết',
    desc: 'Lời vừa dứt, thắng bại đã phân',
    category: 'skill',
    check: (c) =>
      c.scenarios.some((s) => {
        const lp = c.p.levels[s.id]
        return lp?.won && lp.bestTurns <= 3
      }),
  },
  {
    id: 'perfect-1',
    icon: '💯',
    title: 'Vô Khuyết',
    desc: 'Một chiến thắng hoàn mỹ',
    category: 'skill',
    check: (c) => Object.values(c.p.levels).some((lp) => lp.stars >= 3),
  },
  {
    id: 'chapter-perfect',
    icon: '💎',
    title: 'Toàn Bích',
    desc: 'Không để lại bất kỳ tiếc nuối nào',
    category: 'skill',
    check: anyChapterPerfect,
  },
  {
    id: 'platinum',
    icon: '🧠',
    title: 'Đăng Phong',
    desc: 'Chạm tới đỉnh cao của cảnh giới',
    category: 'skill',
    check: (c) => playerLevel(c.p.xp).level >= 51,
    progress: (c) => [Math.min(playerLevel(c.p.xp).level, 51), 51],
  },
  {
    id: 'boss-clean',
    icon: '🎯',
    title: 'Nhất Chiêu',
    desc: 'Một đòn định thắng thua',
    category: 'skill',
    check: (c) =>
      c.scenarios.some((s) => s.isBoss && (c.p.levels[s.id]?.stars ?? 0) >= 2),
  },

  /* ---- Special ---- */
  {
    id: 'night-owl',
    icon: '🌙',
    title: 'Dạ Hành',
    desc: 'Người chinh chiến trong màn đêm',
    category: 'special',
    check: (c) =>
      !!c.event?.justWon && c.event.hour >= 0 && c.event.hour < 4,
  },
]

/* ------------------------------ vận hành ------------------------------ */

/**
 * Mở khoá các thành tựu vừa đạt: ghi mốc thời gian vào `p.achievements` (đột
 * biến tại chỗ) và trả về danh sách thành tựu MỚI mở (để hiện toast/pill + kêu
 * âm thanh). Truyền `event` khi vừa thắng một màn; bỏ trống khi chỉ rà soát lại
 * (vd sau khi gộp cloud) — lúc đó các thành tựu theo sự kiện sẽ không kích hoạt.
 */
export function detectUnlocks(
  p: Progress,
  scenarios: Scenario[],
  chapters: Chapter[],
  event: AchCtx['event'] | undefined,
  now: number,
): Achievement[] {
  if (!p.achievements) p.achievements = {}
  const ctx: AchCtx = { p, scenarios, chapters, event }
  const newly: Achievement[] = []
  for (const a of ACHIEVEMENTS) {
    if (p.achievements[a.id]) continue
    try {
      if (a.check(ctx)) {
        p.achievements[a.id] = now
        newly.push(a)
      }
    } catch {
      /* một thành tựu lỗi không được chặn các thành tựu khác */
    }
  }
  return newly
}
