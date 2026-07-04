import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { toPng } from 'html-to-image'
import {
  Check,
  Download,
  Grid2x2,
  Link as LinkIcon,
  Loader2,
  RotateCw,
  Share2,
  Trophy,
} from 'lucide-react'
import ShareCard from './ShareCard'
import Stars from './Stars'
import { rankForTurns, accentFor } from '../../lib/game'
import type { Scenario } from '../../lib/game'
import type { RecordResult } from '../../lib/progress'
import type { Achievement } from '../../lib/achievements'
import { playUnlockSound } from '../../lib/sound'

const COLORS = ['#4285F4', '#8AB4F8', '#A78BFA', '#22C55E', '#F59E0B']

function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 40 }).map((_, i) => {
        const left = (i * 37) % 100
        const delay = (i % 10) * 0.12
        const color = COLORS[i % COLORS.length]
        return (
          <motion.span
            key={i}
            className="absolute top-[-10%] h-2.5 w-2.5 rounded-sm"
            style={{ left: `${left}%`, background: color }}
            initial={{ y: -40, rotate: 0, opacity: 1 }}
            animate={{ y: '110vh', rotate: 540, opacity: [1, 1, 0.6] }}
            transition={{ duration: 2.6 + (i % 5) * 0.3, delay, ease: 'easeIn' }}
          />
        )
      })}
    </div>
  )
}

export default function WinScreen({
  scenario,
  turns,
  quote,
  shareQuote,
  reward,
  unlocked,
  onReplay,
  onPickAnother,
}: {
  scenario: Scenario
  turns: number
  quote: string
  /** Câu trích đã kiểm duyệt cho ảnh chia sẻ (null → ảnh tự rút gọn câu đầy đủ). */
  shareQuote?: string | null
  reward?: RecordResult | null
  unlocked?: Achievement[]
  onReplay: () => void
  onPickAnother: () => void
}) {
  const rank = rankForTurns(turns)

  // Mở khoá thành tựu khi vào màn thắng → kêu một tiếng chuông nhẹ (một lần).
  useEffect(() => {
    if (unlocked && unlocked.length > 0) playUnlockSound()
  }, [unlocked])
  // A win always earns at least one star; use the recorded value when present so
  // the screen, the share image and the saved progress all agree.
  const stars = reward?.stars ?? 1
  const cardRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const link = `https://game.fechtin.com/?s=${scenario.id}`
  const caption = `🏆 Tôi vừa thắng "${scenario.title}" trong Thuyết Khách Hành chỉ sau ${turns} lượt! Danh hiệu: ${rank.title}.\nThử tài tại ${link}`

  const makeImage = async () => {
    if (!cardRef.current) throw new Error('no card')
    // skipFonts: html-to-image otherwise tries to inline every stylesheet —
    // including the cross-origin Google Fonts sheet — which throws a caught-but-
    // noisy SecurityError on cssRules. The card uses an Inter/sans-serif fallback,
    // so skipping font embedding is harmless and keeps the console clean.
    return toPng(cardRef.current, {
      pixelRatio: 2,
      cacheBust: true,
      skipFonts: true,
    })
  }

  const onShare = async () => {
    setBusy(true)
    try {
      const dataUrl = await makeImage()
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], `dau-tri-${scenario.id}.png`, { type: 'image/png' })
      const nav = navigator as Navigator & {
        canShare?: (d: ShareData) => boolean
      }
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({
          files: [file],
          text: caption,
        })
      } else {
        // Desktop fallback: download the image + copy the caption/link.
        download(dataUrl, scenario.id)
        await navigator.clipboard?.writeText(caption)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      /* user cancelled share or generation failed — ignore */
    } finally {
      setBusy(false)
    }
  }

  const onDownload = async () => {
    setBusy(true)
    try {
      download(await makeImage(), scenario.id)
    } catch {
      /* ignore */
    } finally {
      setBusy(false)
    }
  }

  const onCopyLink = async () => {
    await navigator.clipboard?.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-ink-900/80 backdrop-blur-md"
    >
      <Confetti />

      {/* off-screen card used to generate the share image */}
      <div className="pointer-events-none fixed left-[-10000px] top-0">
        <ShareCard
          ref={cardRef}
          scenario={scenario}
          turns={turns}
          quote={shareQuote ?? quote}
          stars={stars}
          reward={reward}
        />
      </div>

      <div className="flex min-h-full items-center justify-center px-6 py-6">
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
        className="card-sheen relative w-full max-w-md overflow-hidden rounded-4xl glass-strong p-8 text-center shadow-glow-lg"
      >
        <div
          className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full opacity-40 blur-3xl"
          style={{ background: accentFor(scenario) }}
        />
        <div className="relative">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gradient shadow-glow">
            <Trophy className="h-8 w-8 text-ink-900" />
          </div>
          <p className="mt-5 text-sm uppercase tracking-[0.2em] text-brand-light">
            Chiến thắng!
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            {scenario.emoji} {scenario.title}
          </h2>
          <p className="mt-3 text-muted">
            Thuyết phục thành công sau{' '}
            <span className="font-semibold text-white">{turns}</span> lượt.
          </p>

          {/* prominent rating — same stars shown on the share image */}
          <Stars value={stars} size={34} className="mt-4 justify-center" />

          {/* the character's closing line — readable without sharing the image */}
          <figure className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <blockquote className="text-[15px] italic leading-relaxed text-white/85">
              “{quote}”
            </blockquote>
            <figcaption className="mt-2 text-xs text-muted">
              — {scenario.title}
            </figcaption>
          </figure>

          {reward && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center justify-center gap-4 text-sm">
                {reward.xpGained > 0 ? (
                  <span className="font-semibold text-brand-light">
                    +{reward.xpGained} XP
                  </span>
                ) : (
                  <span className="text-muted">Đã đạt mốc sao này rồi</span>
                )}
                {reward.starsGained > 0 && (
                  <span className="text-amber-400">+{reward.starsGained} ⭐</span>
                )}
              </div>
              {reward.leveledUp && (
                <div className="mt-3 rounded-xl bg-brand/15 py-2 text-sm font-medium text-brand-light">
                  🎉 Lên Cấp {reward.newLevel}!
                </div>
              )}
              {reward.unlockedChapter && (
                <div className="mt-2 rounded-xl bg-amber-400/15 py-2 text-sm font-medium text-amber-400">
                  🔓 Mở khoá: Chương {reward.unlockedChapter.id} —{' '}
                  {reward.unlockedChapter.title}
                </div>
              )}
              {unlocked?.map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 18, delay: 0.15 + i * 0.12 }}
                  className="mt-2 rounded-xl border border-brand/40 bg-brand-gradient/10 py-2 text-sm font-medium text-brand-light shadow-glow"
                  style={{ background: 'linear-gradient(90deg, rgba(66,133,244,0.18), rgba(167,139,250,0.18))' }}
                >
                  🏆 Thành tựu mới: {a.icon} {a.title}
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-xs uppercase tracking-wider text-muted">
              Danh hiệu
            </div>
            <div className="mt-1 text-xl font-semibold text-gradient">
              {rank.title}
            </div>
            <div className="mt-1 text-sm text-muted">{rank.sub}</div>
          </div>

          <div className="mt-7 flex flex-col gap-2.5">
            <button
              onClick={onShare}
              disabled={busy}
              className="flex items-center justify-center gap-2 rounded-full bg-brand-gradient py-3 text-sm font-medium text-ink-900 shadow-glow transition-transform hover:brightness-110 active:scale-95 disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
              {busy ? 'Đang tạo ảnh…' : 'Chia sẻ ảnh kết quả'}
            </button>
            <div className="flex gap-2.5">
              <button
                onClick={onDownload}
                disabled={busy}
                className="flex flex-1 items-center justify-center gap-2 rounded-full glass-strong py-3 text-sm transition-colors hover:bg-white/[0.08] disabled:opacity-60"
              >
                <Download className="h-4 w-4" /> Tải ảnh
              </button>
              <button
                onClick={onCopyLink}
                className="flex flex-1 items-center justify-center gap-2 rounded-full glass-strong py-3 text-sm transition-colors hover:bg-white/[0.08]"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <LinkIcon className="h-4 w-4" />
                )}
                {copied ? 'Đã chép' : 'Chép link'}
              </button>
            </div>
            <div className="mt-1 flex gap-2.5">
              <button
                onClick={onReplay}
                className="flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm text-muted transition-colors hover:text-white"
              >
                <RotateCw className="h-4 w-4" /> Chơi lại
              </button>
              <button
                onClick={onPickAnother}
                className="flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm text-muted transition-colors hover:text-white"
              >
                <Grid2x2 className="h-4 w-4" /> Màn khác
              </button>
            </div>
          </div>

          {/* cross-promo → financial-news product */}
          <a
            href="https://fechtin.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-muted transition-colors hover:border-white/20 hover:text-white"
          >
            <span className="flex flex-col items-center text-center leading-snug">
              <span>
                <span className="text-base">📈</span> Tài trợ bởi{' '}
                <span className="font-medium text-white">FechTin</span>
              </span>
              <span>Tin tài chính dành riêng cho bạn</span>
            </span>
          </a>
        </div>
      </motion.div>
      </div>
    </motion.div>
  )
}

function download(dataUrl: string, name: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `dau-tri-${name}.png`
  a.click()
}
