import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Trophy, Star, Loader2, LogIn } from 'lucide-react'
import { useAuth } from '../../lib/auth'
import {
  loadLeaderboardWithMe,
  type LeaderboardEntry,
  type LeaderboardView,
} from '../../lib/leaderboard'

// Tối đa 6 dòng hiển thị, KỂ CẢ dòng "của bạn" ghim cuối khi rớt khỏi top.
// → rớt top: 5 dòng đầu + 1 dòng của bạn. Nằm trong top: 6 dòng đầu.
const MAX_ROWS = 6

// Top-3 dùng badge tròn màu huy chương (vàng/bạc/đồng) với số to, rõ —
// thay cho emoji 🥇🥈🥉 vì con số khắc trong emoji quá nhỏ, không đọc được.
const MEDAL_STYLES = [
  'bg-gradient-to-b from-amber-300 to-amber-500 text-amber-950 ring-amber-200/50',
  'bg-gradient-to-b from-slate-200 to-slate-400 text-slate-800 ring-slate-100/50',
  'bg-gradient-to-b from-orange-400 to-orange-700 text-orange-950 ring-orange-300/50',
]

/**
 * Modal bảng xếp hạng: top người chơi theo XP. Yêu cầu đăng nhập (rules chỉ cho
 * user đã auth đọc); chưa đăng nhập → mời đăng nhập. Tô sáng dòng của chính mình.
 */
export default function Leaderboard({ onClose }: { onClose: () => void }) {
  const { user, signIn } = useAuth()
  const [view, setView] = useState<LeaderboardView | null>(null)

  useEffect(() => {
    if (!user) {
      setView({ top: [], me: null })
      return
    }
    let cancelled = false
    setView(null)
    loadLeaderboardWithMe(user.uid, MAX_ROWS).then((v) => {
      if (!cancelled) setView(v)
    })
    return () => {
      cancelled = true
    }
  }, [user])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-3xl glass shadow-card"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
            <Trophy className="h-5 w-5 text-amber-400" /> Bảng Xếp Hạng
          </h2>
          <button
            onClick={onClose}
            className="text-muted transition-colors hover:text-white"
            title="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {!user ? (
            <div className="flex flex-col items-center gap-4 px-4 py-12 text-center">
              <p className="text-sm text-muted">
                Đăng nhập để lưu thành tích, leo bảng xếp hạng và xem ai mới là bậc thầy thuyết phục.
              </p>
              <button
                onClick={() => signIn().catch(() => {})}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-5 text-sm font-medium text-white transition-colors hover:border-white/25 hover:bg-white/[0.1]"
              >
                <LogIn className="h-4 w-4" /> Đăng nhập
              </button>
            </div>
          ) : view === null ? (
            <div className="flex items-center justify-center gap-2 px-4 py-12 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
            </div>
          ) : view.top.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-muted">
              Chưa có ai trên bảng xếp hạng. Hãy là người đầu tiên! 🏆
            </p>
          ) : (
            <ol className="space-y-1.5">
              {/* Rớt top → chừa 1 chỗ cho dòng của bạn để tổng vẫn ≤ MAX_ROWS. */}
              {view.top.slice(0, view.me ? MAX_ROWS - 1 : MAX_ROWS).map((r, i) => (
                <Row key={r.uid} entry={r} position={i + 1} isMe={r.uid === user.uid} />
              ))}
              {view.me && (
                <>
                  <li className="flex items-center justify-center py-1 text-muted/40" aria-hidden>
                    ⋯
                  </li>
                  <Row entry={view.me.entry} position={view.me.position} isMe />
                </>
              )}
            </ol>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

/** Một dòng xếp hạng — dùng chung cho top 10 và dòng "của bạn" ghim cuối. */
function Row({
  entry: r,
  position,
  isMe,
}: {
  entry: LeaderboardEntry
  position: number
  isMe: boolean
}) {
  return (
    <li
      className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${
        isMe ? 'border border-brand/40 bg-brand/10' : 'bg-white/[0.03]'
      }`}
    >
      {position <= 3 ? (
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-extrabold shadow ring-1 ${MEDAL_STYLES[position - 1]}`}
        >
          {position}
        </span>
      ) : (
        <span className="w-7 shrink-0 text-center text-sm font-bold text-muted">
          {position}
        </span>
      )}
      {r.photo ? (
        <img src={r.photo} alt="" className="h-8 w-8 shrink-0 rounded-full" />
      ) : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-ink-900">
          {r.name.charAt(0).toUpperCase()}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-white">
          {r.name}
          {isMe && <span className="ml-1 text-xs text-brand-light">(bạn)</span>}
        </div>
        <div className="text-[0.7rem] text-muted/70">
          Cấp {r.level} · {r.rank}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-sm font-semibold text-white">{r.xp} XP</div>
        <div className="inline-flex items-center gap-1 text-[0.7rem] text-amber-400">
          <Star className="h-3 w-3 fill-amber-400" /> {r.stars}
        </div>
      </div>
    </li>
  )
}
