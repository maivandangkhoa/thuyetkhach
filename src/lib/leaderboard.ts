/**
 * Bảng xếp hạng — collection `leaderboard`, doc id = uid, chứa bản tóm tắt CÔNG
 * KHAI (tên, ảnh, xp, sao, cấp, hạng) để mọi người đã đăng nhập đều đọc được.
 * Tách khỏi `gameProgress` (chỉ chủ sở hữu đọc) nên không lộ chi tiết tiến trình.
 * Firebase tắt → các hàm là no-op an toàn (game vẫn chạy ẩn danh).
 */
import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db } from './firebase'
import { playerLevel, totalStars } from './progress'
import type { Progress } from './progress'

const COLLECTION = 'leaderboard'

export interface LeaderboardEntry {
  uid: string
  name: string
  photo: string | null
  xp: number
  stars: number
  level: number
  rank: string
}

/** Top N + (tuỳ chọn) dòng của chính người chơi khi họ nằm ngoài top. */
export interface LeaderboardView {
  top: LeaderboardEntry[]
  /** Chỉ có khi người chơi KHÔNG nằm trong top — `position` là hạng thật (1-based). */
  me: { entry: LeaderboardEntry; position: number } | null
}

function toEntry(uid: string, v: Partial<LeaderboardEntry>): LeaderboardEntry {
  return {
    uid,
    name: v.name || 'Người chơi',
    photo: v.photo ?? null,
    xp: v.xp ?? 0,
    stars: v.stars ?? 0,
    level: v.level ?? 1,
    rank: v.rank || 'Đồng',
  }
}

/** Ghi/cập nhật bản tóm tắt công khai của người chơi. No-op nếu Firebase tắt. */
export async function saveLeaderboard(user: User, p: Progress): Promise<void> {
  if (!db) return
  try {
    const info = playerLevel(p.xp)
    await setDoc(
      doc(db, COLLECTION, user.uid),
      {
        name: user.displayName || 'Người chơi ẩn danh',
        photo: user.photoURL || null,
        xp: p.xp,
        stars: totalStars(p),
        level: info.level,
        rank: info.rank,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  } catch {
    /* quyền/mạng lỗi — không chặn game, lần sync sau ghi lại */
  }
}

/** Đọc top N theo XP giảm dần. Trả [] nếu Firebase tắt / chưa đăng nhập / lỗi. */
export async function loadLeaderboard(topN = 50): Promise<LeaderboardEntry[]> {
  if (!db) return []
  try {
    const snap = await getDocs(
      query(collection(db, COLLECTION), orderBy('xp', 'desc'), limit(topN)),
    )
    return snap.docs.map((d) => toEntry(d.id, d.data() as Partial<LeaderboardEntry>))
  } catch {
    return []
  }
}

/**
 * Top N + dòng của chính người chơi nếu họ rớt khỏi top (để biết mình đang ở
 * đâu). Hạng thật tính bằng count query "số người có XP cao hơn" + 1 — rẻ, không
 * phải tải cả bảng. Trả `me: null` khi người chơi đã nằm trong top, chưa có hồ
 * sơ công khai, hoặc Firebase tắt/lỗi.
 */
export async function loadLeaderboardWithMe(
  uid: string,
  topN = 10,
): Promise<LeaderboardView> {
  const top = await loadLeaderboard(topN)
  if (!db || top.some((e) => e.uid === uid)) return { top, me: null }
  try {
    const meSnap = await getDoc(doc(db, COLLECTION, uid))
    if (!meSnap.exists()) return { top, me: null }
    const entry = toEntry(uid, meSnap.data() as Partial<LeaderboardEntry>)
    const ahead = await getCountFromServer(
      query(collection(db, COLLECTION), where('xp', '>', entry.xp)),
    )
    return { top, me: { entry, position: ahead.data().count + 1 } }
  } catch {
    return { top, me: null }
  }
}
