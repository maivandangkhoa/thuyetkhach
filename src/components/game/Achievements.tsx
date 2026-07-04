import { motion } from 'framer-motion'
import { X, Medal, Lock, Check } from 'lucide-react'
import { ACHIEVEMENTS, type AchCtx } from '../../lib/achievements'
import type { Progress } from '../../lib/progress'
import type { Scenario, Chapter } from '../../lib/game'

const CAT_LABEL: Record<string, string> = {
  story: 'Cốt truyện',
  skill: 'Kỹ năng',
  special: 'Đặc biệt',
}

/**
 * Modal "Thành tựu": lưới huy hiệu với 3 trạng thái — đã đạt (đủ màu + ngày),
 * chưa đạt (mờ + gợi ý, có thể kèm thanh tiến độ), và ẩn (??? cho secret). Dữ
 * liệu thuần localStorage nên không cần đăng nhập.
 */
export default function Achievements({
  progress,
  scenarios,
  chapters,
  onClose,
}: {
  progress: Progress
  scenarios: Scenario[]
  chapters: Chapter[]
  onClose: () => void
}) {
  const ctx: AchCtx = { p: progress, scenarios, chapters }
  const earnedMap = progress.achievements ?? {}
  const earnedCount = ACHIEVEMENTS.filter((a) => earnedMap[a.id]).length

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
        className="relative flex max-h-[82vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl glass shadow-card"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
            <Medal className="h-5 w-5 text-amber-400" /> Thành Tựu
            <span className="ml-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-xs font-medium text-muted">
              {earnedCount}/{ACHIEVEMENTS.length}
            </span>
          </h2>
          <button
            onClick={onClose}
            className="text-muted transition-colors hover:text-white"
            title="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {ACHIEVEMENTS.map((a) => {
              const at = earnedMap[a.id]
              const earned = !!at
              const hidden = a.secret && !earned
              const bar = !earned && a.progress ? a.progress(ctx) : null
              let date: string | null = null
              if (at) {
                const d = new Date(at)
                date = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
              }

              return (
                <div
                  key={a.id}
                  className={`relative flex flex-col items-center rounded-2xl border p-3 text-center transition-colors ${
                    earned
                      ? 'border-brand/40 bg-brand/10 shadow-glow'
                      : 'border-white/10 bg-white/[0.02]'
                  }`}
                >
                  <span
                    className={`text-3xl ${earned ? '' : 'opacity-30 grayscale'}`}
                    aria-hidden
                  >
                    {hidden ? '❓' : a.icon}
                  </span>
                  <div
                    className={`mt-1.5 text-sm font-semibold ${
                      earned ? 'text-white' : 'text-muted'
                    }`}
                  >
                    {hidden ? 'Bí mật' : a.title}
                  </div>
                  <div className="mt-0.5 text-[0.7rem] leading-snug text-muted/70">
                    {hidden ? 'Mở khoá để hé lộ' : a.desc}
                  </div>

                  {earned ? (
                    <div className="mt-1.5 inline-flex items-center gap-1 text-[0.65rem] font-medium text-brand-light">
                      <Check className="h-3 w-3" /> Đắc thành {date}
                    </div>
                  ) : bar ? (
                    <div className="mt-2 w-full">
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-brand/60"
                          style={{ width: `${Math.min(100, (bar[0] / bar[1]) * 100)}%` }}
                        />
                      </div>
                      <div className="mt-1 text-[0.65rem] text-muted/70">
                        Tích luỹ {bar[0]}/{bar[1]}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1.5 inline-flex items-center gap-1 text-[0.65rem] text-muted/50">
                      <Lock className="h-3 w-3" /> {CAT_LABEL[a.category]}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
