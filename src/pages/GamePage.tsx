import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import ChapterMap from '../components/game/ChapterMap'
import LevelGrid from '../components/game/LevelGrid'
import GameScreen from '../components/game/GameScreen'
import WinScreen from '../components/game/WinScreen'
import { fetchScenarios } from '../lib/api'
import { useAuth } from '../lib/auth'
import {
  loadProgress,
  saveProgress,
  recordResult,
  recomputeXp,
  mergeProgress,
} from '../lib/progress'
import { loadCloud, saveCloud, makeCloudSaver } from '../lib/progress-sync'
import { saveLeaderboard } from '../lib/leaderboard'
import { detectUnlocks } from '../lib/achievements'
import type { Progress, RecordResult } from '../lib/progress'
import type { Achievement } from '../lib/achievements'
import type { Chapter, Scenario } from '../lib/game'

interface WinState {
  turns: number
  quote: string
  /** Câu trích đã kiểm duyệt cho ảnh chia sẻ (null → ảnh tự rút gọn câu đầy đủ). */
  shareQuote: string | null
  reward: RecordResult
  unlocked: Achievement[]
}

export default function GamePage() {
  const { user } = useAuth()
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<Progress>(() => loadProgress())
  const [syncing, setSyncing] = useState(false)

  // Trạng thái điều hướng nằm trên URL (?c=<chương>, ?s=<màn>) để nút
  // back/forward của trình duyệt hoạt động và mọi màn hình đều deep-link được.
  const [params, setParams] = useSearchParams()
  const scenarioId = params.get('s')
  const active = scenarioId
    ? (scenarios.find((s) => s.id === scenarioId) ?? null)
    : null
  const chapterId = active != null ? String(active.chapter) : params.get('c')
  const chapter = chapterId
    ? (chapters.find((c) => String(c.id) === chapterId) ?? null)
    : null

  const [round, setRound] = useState(0) // bump to remount GameScreen on replay
  const [won, setWon] = useState<WinState | null>(null)

  const saver = useRef(makeCloudSaver())
  const syncedUid = useRef<string | null>(null)

  const openScenario = (s: Scenario) => {
    setWon(null)
    setRound((r) => r + 1)
    setParams({ s: s.id })
  }

  // Dev ?win= cần set WinScreen ngay sau khi đổi URL sang màn tương ứng —
  // giữ tạm ở ref để effect dưới áp vào thay vì xoá mất.
  const pendingWin = useRef<WinState | null>(null)

  // Back/forward của trình duyệt rời khỏi màn chơi → bỏ màn thắng cũ,
  // để khi quay lại không hiện lại WinScreen của ván trước.
  useEffect(() => {
    setWon(pendingWin.current)
    pendingWin.current = null
  }, [scenarioId])

  useEffect(() => {
    fetchScenarios()
      .then(({ chapters, scenarios }) => {
        setChapters(chapters)
        setScenarios(scenarios)
        // Self-heal: tính lại XP từng màn từ dữ liệu scenario (cho cả data cũ),
        // rồi rà soát thành tựu đã đạt từ trước (im lặng — không toast/âm thanh).
        const healed = recomputeXp(loadProgress(), scenarios)
        detectUnlocks(healed, scenarios, chapters, undefined, Date.now())
        saveProgress(healed)
        setProgress(healed)
        // Dev-only: ?win=<id> jumps straight to the victory/share screen so the
        // win card can be tested without playing a match to completion.
        // Optional &turns= and &stars= tune the result. No effect in prod builds.
        if (import.meta.env.DEV) {
          const q = new URLSearchParams(window.location.search)
          const winId = q.get('win')
          const winScenario = winId && scenarios.find((s) => s.id === winId)
          if (winScenario) {
            const turns = Number(q.get('turns')) || 3
            const stars = Math.min(3, Math.max(1, Number(q.get('stars')) || 3))
            pendingWin.current = {
              turns,
              quote:
                'Cô không nhận cọc đồ cá nhân của em. Nhưng cô có thể cho em mượn nếu em ký vào giấy cam kết giữ gìn sách cẩn thận và trả đúng hạn. Nếu em làm hư hoặc mất sách, em sẽ chịu trách nhiệm. Em có đồng ý không?',
              shareQuote:
                '… Nhưng cô có thể cho em mượn nếu em ký vào giấy cam kết giữ gìn sách cẩn thận và trả đúng hạn. …',
              reward: {
                stars,
                prevStars: 0,
                starsGained: stars,
                xpGained: 30,
                leveledUp: false,
                newLevel: 1,
                unlockedChapter: null,
              },
              unlocked: [],
            }
            // Đổi URL sang màn tương ứng; effect [scenarioId] sẽ áp pendingWin.
            setParams(
              (p) => {
                p.set('s', winScenario.id)
                return p
              },
              { replace: true },
            )
          }
        }
      })
      .catch((e) =>
        setError((e as Error).message || 'Không tải được danh sách màn chơi'),
      )
      .finally(() => setLoading(false))
  }, [])

  // Đăng nhập → gộp local + cloud một lần, ghi lại cả hai phía.
  useEffect(() => {
    if (!user) {
      syncedUid.current = null
      return
    }
    if (scenarios.length === 0 || syncedUid.current === user.uid) return
    syncedUid.current = user.uid
    let cancelled = false
    ;(async () => {
      setSyncing(true)
      const cloud = await loadCloud(user.uid)
      const local = loadProgress()
      const base = cloud ?? { version: 1 as const, xp: 0, levels: {} }
      const merged = recomputeXp(mergeProgress(local, base), scenarios)
      detectUnlocks(merged, scenarios, chapters, undefined, Date.now())
      saveProgress(merged)
      await saveCloud(user.uid, merged)
      await saveLeaderboard(user, merged)
      if (!cancelled) {
        setProgress(merged)
        setSyncing(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user, scenarios])

  const handleWin = (
    turns: number,
    quote: string,
    score: number,
    shareQuote: string | null,
  ) => {
    if (!active) return
    const { progress: next, result } = recordResult(
      active,
      { won: true, turns, score },
      chapters,
    )
    // Mở khoá thành tựu vừa đạt (kèm ngữ cảnh thời điểm thắng cho "Cú Đêm").
    const unlocked = detectUnlocks(
      next,
      scenarios,
      chapters,
      { justWon: true, scenarioId: active.id, hour: new Date().getHours() },
      Date.now(),
    )
    if (unlocked.length) saveProgress(next) // ghi lại cờ thành tựu vừa thêm
    setProgress(next)
    if (user) saver.current.queue(user, next)
    setWon({ turns, quote, shareQuote, reward: result, unlocked })
  }

  // In a match (or won screen on top of it).
  if (active) {
    return (
      <>
        <GameScreen
          key={`${active.id}:${round}`}
          scenario={active}
          onExit={() => setParams({ c: String(active.chapter) })}
          onWin={handleWin}
        />
        <AnimatePresence>
          {won != null && (
            <WinScreen
              scenario={active}
              turns={won.turns}
              quote={won.quote}
              shareQuote={won.shareQuote}
              reward={won.reward}
              unlocked={won.unlocked}
              onReplay={() => {
                setWon(null)
                setRound((r) => r + 1)
              }}
              onPickAnother={() => {
                setWon(null)
                setParams({ c: String(active.chapter) })
              }}
            />
          )}
        </AnimatePresence>
      </>
    )
  }

  // Inside a chapter → level grid.
  if (chapter) {
    return (
      <LevelGrid
        chapter={chapter}
        scenarios={scenarios}
        progress={progress}
        onPick={openScenario}
        onBack={() => setParams({})}
      />
    )
  }

  // Default → chapter map.
  return (
    <ChapterMap
      chapters={chapters}
      scenarios={scenarios}
      progress={progress}
      loading={loading}
      error={error}
      syncing={syncing}
      onPick={(c) => setParams({ c: String(c.id) })}
    />
  )
}
