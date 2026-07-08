import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Lock, Star, Eye, Trophy, Medal } from 'lucide-react'
import GradientMesh from '../ui/GradientMesh'
import PlayerHeader from './PlayerHeader'
import AccountChip from './AccountChip'
import Leaderboard from './Leaderboard'
import Achievements from './Achievements'
import { useAuth } from '../../lib/auth'
import { chapterStars, levelPlayable, totalStars } from '../../lib/progress'
import type { Progress } from '../../lib/progress'
import type { Chapter, Scenario } from '../../lib/game'

const MAX_STARS_PER_LEVEL = 3

export default function ChapterMap({
  chapters,
  scenarios,
  progress,
  loading,
  error,
  syncing = false,
  onPick,
}: {
  chapters: Chapter[]
  scenarios: Scenario[]
  progress: Progress
  loading: boolean
  error: string | null
  syncing?: boolean
  onPick: (chapter: Chapter) => void
}) {
  const { enabled: authEnabled } = useAuth()
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showAchievements, setShowAchievements] = useState(false)
  const total = totalStars(progress)
  const grandMax = scenarios.length * MAX_STARS_PER_LEVEL

  return (
    <div className="relative min-h-screen overflow-hidden">
      <GradientMesh dense />
      <div className="relative mx-auto max-w-5xl px-6 pb-16 pt-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/icon-192.png" alt="" className="h-9 w-9 rounded-xl" />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAchievements(true)}
              title="Thành tựu"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-xs font-medium text-white transition-colors hover:border-white/25 hover:bg-white/[0.08]"
            >
              <Medal className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">Thành tựu</span>
            </button>
            {authEnabled && (
              <button
                onClick={() => setShowLeaderboard(true)}
                title="Bảng xếp hạng"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-xs font-medium text-white transition-colors hover:border-white/25 hover:bg-white/[0.08]"
              >
                <Trophy className="h-3.5 w-3.5 text-amber-400" />
                <span className="hidden sm:inline">Xếp hạng</span>
              </button>
            )}
            <AccountChip syncing={syncing} />
          </div>
        </div>

        <div className="mt-8 text-center">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Thuyết Khách <span className="text-gradient">Hành</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-left text-muted">
            Từ những trái tim băng giá đến những bộ óc lạnh lùng, liệu bạn có thể
            khiến họ đổi ý trong một vài câu?
          </p>
        </div>

        {!loading && (
          <div className="mt-8">
            <PlayerHeader progress={progress} totalStars={total} maxStars={grandMax} />
          </div>
        )}

        {error && <p className="mt-10 text-center text-sm text-error">{error}</p>}

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-44 animate-pulse rounded-3xl shimmer-bg" />
              ))
            : chapters.map((c, i) => {
                const levels = scenarios.filter((s) => s.chapter === c.id)
                const count = levels.length
                const playable = levels.filter((s) => levelPlayable(progress, c, s)).length
                const stars = chapterStars(progress, scenarios, c.id)
                const comingSoon = count === 0
                const partial = playable > 0 && playable < count
                const noneOpen = !comingSoon && playable === 0

                return (
                  <motion.button
                    key={c.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={comingSoon ? undefined : { y: -6 }}
                    onClick={() => !comingSoon && onPick(c)}
                    disabled={comingSoon}
                    className={`card-sheen group relative h-full overflow-hidden rounded-3xl glass p-6 text-left shadow-card ${
                      comingSoon ? 'cursor-not-allowed opacity-60' : noneOpen ? 'opacity-80' : ''
                    }`}
                  >
                    <div
                      className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-3xl transition-opacity duration-500 group-hover:opacity-50"
                      style={{ background: c.accent }}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-4xl">{c.emoji}</span>
                      <span className="text-[0.7rem] font-medium text-muted/60">
                        Chương {c.id}
                      </span>
                    </div>
                    <h3 className="relative mt-4 text-lg font-semibold tracking-tight">
                      {c.title}
                    </h3>
                    <p className="relative mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
                      {c.lesson}
                    </p>

                    <div className="relative mt-4 flex items-center justify-between text-xs">
                      {comingSoon ? (
                        <span className="text-muted/50">✨ Sắp ra mắt</span>
                      ) : noneOpen ? (
                        <span className="inline-flex items-center gap-1 text-muted/70">
                          <Lock className="h-3.5 w-3.5" /> Cần ⭐{c.requiredStars}
                        </span>
                      ) : partial ? (
                        <span className="inline-flex items-center gap-1 font-medium text-amber-400">
                          <Star className="h-3.5 w-3.5 fill-amber-400" /> {stars}/{count * 3}
                          <span className="ml-1 text-muted/60">· mở {playable}/{count}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-medium text-amber-400">
                          <Star className="h-3.5 w-3.5 fill-amber-400" /> {stars}/{count * 3}
                        </span>
                      )}
                      {!comingSoon && (
                        <span
                          className="inline-flex items-center gap-1 font-medium"
                          style={{ color: c.accent }}
                        >
                          {noneOpen ? (
                            <>
                              <Eye className="h-3.5 w-3.5" /> Xem trước
                            </>
                          ) : (
                            <>
                              {count} màn <ArrowRight className="h-3.5 w-3.5" />
                            </>
                          )}
                        </span>
                      )}
                    </div>
                  </motion.button>
                )
              })}
        </div>

        {/* cross-promo banner → financial-news product */}
        <div className="mt-12 text-center">
          <a
            href="https://fechtin.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl sm:rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm text-muted transition-colors hover:border-white/20 hover:text-white"
          >
            <span className="flex flex-col sm:block leading-snug">
              <span>
                <span className="mr-1">📈</span>
                Tài trợ bởi <span className="font-medium text-white">FechTin</span>
                <span className="hidden sm:inline"> — </span>
              </span>
              <span>Cùng bạn kiến tạo tự do tài chính</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </a>
        </div>
      </div>

      <AnimatePresence>
        {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
        {showAchievements && (
          <Achievements
            progress={progress}
            scenarios={scenarios}
            chapters={chapters}
            onClose={() => setShowAchievements(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
