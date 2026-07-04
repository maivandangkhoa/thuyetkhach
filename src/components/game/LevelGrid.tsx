import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Crown, Lock } from 'lucide-react'
import GradientMesh from '../ui/GradientMesh'
import Stars from './Stars'
import { levelPlayable, totalStars } from '../../lib/progress'
import type { Progress } from '../../lib/progress'
import type { Chapter, Scenario } from '../../lib/game'

export default function LevelGrid({
  chapter,
  scenarios,
  progress,
  onPick,
  onBack,
}: {
  chapter: Chapter
  scenarios: Scenario[]
  progress: Progress
  onPick: (s: Scenario) => void
  onBack: () => void
}) {
  const levels = scenarios
    .filter((s) => s.chapter === chapter.id)
    .sort((a, b) => a.order - b.order)
  const total = totalStars(progress)
  const lockedCount = levels.filter((s) => !levelPlayable(progress, chapter, s)).length

  // Khi vào một chương, cuộn lên đầu trang (state chỉ đổi, không phải điều hướng trang mới).
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [chapter.id])

  return (
    <div className="relative min-h-screen overflow-hidden">
      <GradientMesh dense />
      <div className="relative mx-auto max-w-5xl px-6 pb-16 pt-8">
        <button
          onClick={onBack}
          title="Bản đồ chương"
          aria-label="Bản đồ chương"
          className="absolute left-6 top-8 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-muted transition-colors hover:border-white/25 hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="text-center">
          <span className="text-5xl">{chapter.emoji}</span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Chương {chapter.id}
            <span className="hidden sm:inline"> — </span>
            <br className="sm:hidden" />
            <span style={{ color: chapter.accent }}>{chapter.title}</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted">{chapter.lesson}</p>
          {lockedCount > 0 && (
            <p className="mx-auto mt-4 inline-flex flex-col items-center gap-x-1 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-center text-xs text-muted sm:flex-row">
              <span className="inline-flex items-center gap-2">
                <Lock className="h-3.5 w-3.5" />
                Còn {lockedCount} màn khoá
              </span>
              <span className="hidden sm:inline">—</span>
              <span>
                <span className="sm:hidden">Mở</span>
                <span className="hidden sm:inline">mở</span> khi đạt{' '}
                {chapter.requiredStars}⭐ (bạn đang có {total}⭐)
              </span>
            </p>
          )}
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {levels.map((s, i) => {
            const lp = progress.levels[s.id]
            const playable = levelPlayable(progress, chapter, s)
            const plays = s.plays ?? 0
            const winRate = plays > 0 ? Math.min(100, Math.round(((s.wins ?? 0) / plays) * 100)) : null
            return (
              <motion.button
                key={s.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={playable ? { y: -6 } : undefined}
                onClick={() => playable && onPick(s)}
                disabled={!playable}
                className={`card-sheen group relative h-full overflow-hidden rounded-3xl glass p-6 text-left shadow-card ${
                  s.isBoss ? 'ring-1 ring-amber-400/40' : ''
                } ${playable ? '' : 'cursor-not-allowed opacity-60'}`}
              >
                <div
                  className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-3xl transition-opacity duration-500 group-hover:opacity-50"
                  style={{ background: chapter.accent }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-4xl">{s.emoji}</span>
                  {!playable ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[0.7rem] font-medium text-muted/70">
                      <Lock className="h-3.5 w-3.5" /> Khoá
                    </span>
                  ) : s.isBoss ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-1 text-[0.7rem] font-semibold text-amber-400">
                      <Crown className="h-3.5 w-3.5" /> BOSS
                    </span>
                  ) : (
                    <span
                      className="rounded-full border border-white/10 px-2.5 py-1 text-[0.7rem] font-medium"
                      style={{ color: chapter.accent }}
                    >
                      {s.difficulty}
                    </span>
                  )}
                </div>
                <h3 className="relative mt-5 text-lg font-semibold tracking-tight">
                  {s.title}
                </h3>
                <p className="relative mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
                  {s.tagline}
                </p>
                <div className="relative mt-4 flex items-center justify-between text-xs">
                  {playable ? (
                    <Stars value={lp?.stars ?? 0} />
                  ) : (
                    <span className="text-muted/50">Mở khi {chapter.requiredStars}⭐</span>
                  )}
                  {plays > 0 ? (
                    <span className="font-medium text-muted/80">
                      👥 {plays} ·{' '}
                      <span style={{ color: chapter.accent }}>🏆 {winRate}%</span>
                    </span>
                  ) : (
                    <span className="text-muted/40">✨ Chưa ai thử</span>
                  )}
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
