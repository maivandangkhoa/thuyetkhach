import { Star, Trophy } from 'lucide-react'
import { playerLevel } from '../../lib/progress'
import type { Progress } from '../../lib/progress'

/** Dải thông tin người chơi: Level + Rank + tổng sao + thanh XP. */
export default function PlayerHeader({
  progress,
  totalStars,
  maxStars,
}: {
  progress: Progress
  totalStars: number
  maxStars: number
}) {
  const info = playerLevel(progress.xp)
  const pct = info.span > 0 ? Math.min(100, Math.round((info.intoLevel / info.span) * 100)) : 0

  return (
    <div className="mx-auto flex max-w-md items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3">
      <div className="flex flex-col items-center">
        <span className="text-[0.65rem] uppercase tracking-wider text-muted/70">Cấp</span>
        <span className="text-2xl font-bold leading-none text-white">{info.level}</span>
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1 font-medium text-brand-light">
            <Trophy className="h-3.5 w-3.5" /> {info.rank}
          </span>
          <span className="inline-flex items-center gap-1 text-amber-400">
            <Star className="h-3.5 w-3.5 fill-amber-400" /> {totalStars}/{maxStars}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand to-brand-light transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1 text-right text-[0.65rem] text-muted/60">
          {info.intoLevel}/{info.span} XP
        </div>
      </div>
    </div>
  )
}
