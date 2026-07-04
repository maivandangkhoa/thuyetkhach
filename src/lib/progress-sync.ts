/**
 * Đồng bộ tiến trình lên Firestore theo `uid` (khi đã đăng nhập).
 * Tài liệu: collection `gameProgress`, doc id = uid, field `progress`.
 * Khi chưa đăng nhập / Firebase tắt → các hàm này là no-op an toàn.
 */
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db } from './firebase'
import { saveLeaderboard } from './leaderboard'
import type { Progress } from './progress'

const COLLECTION = 'gameProgress'

/** Firestore không nhận Infinity/NaN — thay bestTurns vô hạn bằng sentinel. */
function sanitize(p: Progress): Progress {
  const levels: Progress['levels'] = {}
  for (const id in p.levels) {
    const lp = p.levels[id]
    levels[id] = {
      ...lp,
      bestTurns: Number.isFinite(lp.bestTurns) ? lp.bestTurns : 9999,
      xp: lp.xp ?? 0,
    }
  }
  return { version: 1, xp: p.xp, levels, achievements: p.achievements ?? {} }
}

export async function loadCloud(uid: string): Promise<Progress | null> {
  if (!db) return null
  try {
    const snap = await getDoc(doc(db, COLLECTION, uid))
    if (!snap.exists()) return null
    const data = snap.data() as { progress?: Progress }
    return data.progress ?? null
  } catch {
    return null
  }
}

export async function saveCloud(uid: string, p: Progress): Promise<void> {
  if (!db) return
  try {
    await setDoc(
      doc(db, COLLECTION, uid),
      { progress: sanitize(p), updatedAt: serverTimestamp() },
      { merge: true },
    )
  } catch {
    /* mạng lỗi / quyền — không chặn game, local vẫn giữ */
  }
}

/** Bộ ghi cloud có debounce để tránh spam Firestore mỗi lượt thắng. Ghi cả
 *  tiến trình riêng (`gameProgress`) lẫn tóm tắt công khai (`leaderboard`). */
export function makeCloudSaver(delay = 1500) {
  let timer: ReturnType<typeof setTimeout> | null = null
  let pending: { user: User; p: Progress } | null = null
  const flush = () => {
    if (pending) {
      saveCloud(pending.user.uid, pending.p)
      saveLeaderboard(pending.user, pending.p)
    }
    pending = null
    timer = null
  }
  return {
    queue(user: User, p: Progress) {
      pending = { user, p }
      if (timer) clearTimeout(timer)
      timer = setTimeout(flush, delay)
    },
    flushNow() {
      if (timer) clearTimeout(timer)
      flush()
    },
  }
}
