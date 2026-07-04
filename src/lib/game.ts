export interface Scenario {
  id: string
  emoji: string
  title: string
  /** Legacy tone tag (màu sắc giờ lấy theo chương). */
  tone?: string
  difficulty: string
  tagline: string
  greeting: string
  /** Campaign metadata. */
  chapter: number
  order: number
  isBoss: boolean
  /** "Màn gốc" — luôn mở từ đầu, bỏ qua khoá theo sao. */
  starter?: boolean
  /** Play/win counters (from the server) — used to show difficulty on the picker. */
  plays?: number
  wins?: number
}

export interface Chapter {
  id: number
  slug: string
  title: string
  emoji: string
  accent: string
  requiredStars: number
  lesson: string
}

export interface GameMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

/** Màu accent theo chương — mirror của server/scenarios/chapters.js. */
export const CHAPTER_ACCENT: Record<number, string> = {
  1: '#22C55E', 2: '#A78BFA', 3: '#F472B6', 4: '#38BDF8', 5: '#F59E0B',
  6: '#C084FC', 7: '#94A3B8', 8: '#4285F4', 9: '#EAB308', 10: '#F97316',
  11: '#EF4444', 12: '#FBBF24', 13: '#3B82F6', 14: '#06B6D4', 15: '#A855F7',
}

/** Accent màu của một màn (lấy theo chương, fallback tím thương hiệu). */
export const accentFor = (s: Pick<Scenario, 'chapter'>): string =>
  CHAPTER_ACCENT[s.chapter] ?? '#A78BFA'

/** Playful rank based on how few turns it took to win. */
export function rankForTurns(turns: number): { title: string; sub: string } {
  if (turns <= 3) return { title: 'Thần Thuyết Khách', sub: 'Đỉnh của chóp 🏆' }
  if (turns <= 6) return { title: 'Cao Thủ Năn Nỉ', sub: 'Mượt như nhung 🥇' }
  if (turns <= 10) return { title: 'Thánh Văn Vở', sub: 'Lươn lẹo có nghề 🥈' }
  return { title: 'Trùm Lì Đòn', sub: 'Cuối cùng cũng xong 🥉' }
}
