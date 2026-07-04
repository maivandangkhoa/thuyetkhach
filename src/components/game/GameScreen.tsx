import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { toPng } from 'html-to-image'
import {
  ArrowLeft,
  Check,
  Copy,
  Facebook,
  Loader2,
  MoreHorizontal,
  MessageCircle,
  MessageSquareShare,
  Swords,
} from 'lucide-react'
import ChatInput from '../chat/ChatInput'
import Markdown from '../chat/Markdown'
import PersuasionMeter from './PersuasionMeter'
import ChallengeCard from './ChallengeCard'
import ConversationCard from './ConversationCard'
import { streamGameChat } from '../../lib/api'
import { accentFor } from '../../lib/game'
import type { Scenario, GameMessage } from '../../lib/game'

let gid = 0
const uid = () => `g${++gid}`

export default function GameScreen({
  scenario,
  onExit,
  onWin,
}: {
  scenario: Scenario
  onExit: () => void
  onWin: (
    turns: number,
    quote: string,
    score: number,
    shareQuote: string | null,
  ) => void
}) {
  const accent = accentFor(scenario)
  const [messages, setMessages] = useState<GameMessage[]>([
    { id: uid(), role: 'assistant', content: scenario.greeting },
  ])
  const [busy, setBusy] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [turns, setTurns] = useState(0)
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)
  const [savingConvo, setSavingConvo] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  // Once a win is detected, lock the "save conversation" button so players can
  // never share the winning convo (which would spoil the solution). Set the
  // instant meta.win fires — i.e. before WinScreen mounts and covers the header.
  const [won, setWon] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const convoRef = useRef<HTMLDivElement>(null)
  const turnsRef = useRef(0)

  // Native share when available (mobile), else download the PNG + copy caption.
  const deliverImage = async (
    dataUrl: string,
    filename: string,
    caption: string,
  ) => {
    const blob = await (await fetch(dataUrl)).blob()
    const file = new File([blob], filename, { type: 'image/png' })
    const nav = navigator as Navigator & {
      canShare?: (d: ShareData) => boolean
    }
    if (nav.canShare && nav.canShare({ files: [file] })) {
      await nav.share({ files: [file], text: caption })
    } else {
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = filename
      a.click()
      await navigator.clipboard?.writeText(caption)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // "Rủ bạn cùng chơi" — share a challenge IMAGE (+ deep-link) for this scenario.
  const onInvite = async () => {
    if (sharing) return
    const link = `https://game.fechtin.com/?s=${scenario.id}`
    const caption = `Thử thách: thuyết phục "${scenario.title}" trong Thuyết Khách Hành! Bạn làm được không? 👉 ${link}`
    setSharing(true)
    try {
      if (!cardRef.current) throw new Error('no card')
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        skipFonts: true,
      })
      await deliverImage(dataUrl, 'thu-thach-dau-tri.png', caption)
    } catch {
      /* user cancelled share or generation failed — ignore */
    } finally {
      setSharing(false)
    }
  }

  // "Chia sẻ lên Facebook" — Facebook bỏ qua ảnh/caption từ Web Share API,
  // nên ta chỉ gửi link deep-link; Facebook tự dựng preview từ OG tags của trang.
  // Đồng thời copy caption vào clipboard để người dùng dán vào ô soạn bài.
  const onShareFacebook = () => {
    const link = `https://game.fechtin.com/?s=${scenario.id}`
    // copy lời mời (không await để giữ user-gesture cho popup)
    void onCopyLink('Đã sao chép lời mời — dán (Ctrl/Cmd+V) vào bài đăng Facebook nhé 👍')
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`
    window.open(url, '_blank', 'noopener,noreferrer,width=640,height=640')
  }

  // "Copy link + lời mời" — sao chép caption kèm deep-link vào clipboard để
  // dán lên bất kỳ đâu (Facebook, Messenger, Zalo, Telegram…). Universal nhất.
  const onCopyLink = async (
    toastMsg = 'Đã sao chép lời mời — dán vào bất kỳ đâu 👍',
  ) => {
    const link = `https://game.fechtin.com/?s=${scenario.id}`
    const caption = `Thử thách: thuyết phục "${scenario.title}" trong Thuyết Khách Hành! Bạn làm được không? 👉 ${link}`
    try {
      await navigator.clipboard?.writeText(caption)
      setCopied(true)
      setToast(toastMsg)
      setTimeout(() => setCopied(false), 2000)
      setTimeout(() => setToast(null), 3200)
    } catch {
      setToast('Không sao chép được — trình duyệt chặn clipboard 😕')
      setTimeout(() => setToast(null), 3200)
    }
  }

  // "Lưu ảnh hội thoại" — capture the whole conversation as one long image.
  // Disabled while streaming and permanently after a win (no spoiling how to win).
  const onSaveConversation = async () => {
    if (savingConvo || busy || won) return
    const link = `https://game.fechtin.com/?s=${scenario.id}`
    const caption = `Màn đấu trí của mình với "${scenario.title}" trong Thuyết Khách Hành 😏 Thử sức nhé 👉 ${link}`
    setSavingConvo(true)
    try {
      if (!convoRef.current) throw new Error('no card')
      const node = convoRef.current
      // A long conversation makes this card very tall; at pixelRatio 2 the output
      // canvas can exceed the browser's memory budget and crash the tab. Cap the
      // total output pixels — short chats still get full 2× quality, tall ones
      // scale the ratio down gracefully.
      const w = node.offsetWidth || 600
      const h = node.offsetHeight || 600
      const MAX_OUTPUT_PX = 16_000_000
      const pixelRatio = Math.max(
        1,
        Math.min(2, Math.sqrt(MAX_OUTPUT_PX / (w * h))),
      )
      const dataUrl = await toPng(node, {
        pixelRatio,
        cacheBust: true,
        skipFonts: true,
      })
      await deliverImage(dataUrl, `hoi-thoai-dau-tri-${scenario.id}.png`, caption)
    } catch {
      /* user cancelled share or generation failed — ignore */
    } finally {
      setSavingConvo(false)
    }
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text: string) => {
    if (busy) return
    setBusy(true)
    const userMsg: GameMessage = { id: uid(), role: 'user', content: text }
    const aId = uid()
    const nextTurn = turnsRef.current + 1
    turnsRef.current = nextTurn
    setTurns(nextTurn)

    const history = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }))

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: aId, role: 'assistant', content: '', streaming: true },
    ])

    let full = ''
    try {
      await streamGameChat({
        scenarioId: scenario.id,
        messages: history,
        onDelta: (delta) => {
          full += delta
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aId ? { ...m, content: m.content + delta } : m,
            ),
          )
        },
        onMeta: (meta) => {
          setScore(meta.score)
          if (meta.win) {
            setWon(true) // lock the conversation-share button immediately
            setTimeout(
              () =>
                onWin(
                  nextTurn,
                  full.trim(),
                  meta.score ?? 100,
                  meta.shareQuote ?? null,
                ),
              900,
            )
          }
        },
      })
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aId
            ? { ...m, content: `⚠️ ${(err as Error).message}` }
            : m,
        ),
      )
    } finally {
      setMessages((prev) =>
        prev.map((m) => (m.id === aId ? { ...m, streaming: false } : m)),
      )
      setBusy(false)
    }
  }

  return (
    <div className="flex h-dvh flex-col bg-ink-900">
      {/* off-screen cards used to generate the share images */}
      <div className="pointer-events-none fixed left-[-10000px] top-0">
        <ChallengeCard ref={cardRef} scenario={scenario} />
        <ConversationCard
          ref={convoRef}
          scenario={scenario}
          messages={messages}
          turns={turns}
        />
      </div>

      {/* ambient */}
      <div className="pointer-events-none fixed inset-0">
        <div
          className="absolute left-1/3 top-0 h-80 w-80 rounded-full opacity-20 blur-[130px]"
          style={{ background: accent }}
        />
      </div>

      {/* header — z-20 so the Share dropdown paints above the z-10 message list
          (same-z siblings would otherwise let the later message div cover it) */}
      <header className="relative z-20 border-b border-white/5 px-4 py-3 sm:px-6">
        {/* hàng 1: back · emoji + tên · menu 3 chấm */}
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <button
              onClick={onExit}
              className="-ml-1 rounded-xl p-1.5 text-muted transition-colors hover:bg-white/5 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span className="shrink-0 text-xl leading-none">{scenario.emoji}</span>
            <div className="truncate text-lg font-semibold tracking-tight">
              {scenario.title}
            </div>
          </div>
          <div className="flex shrink-0 items-center">
            {/* menu "···" → gom các hành động chia sẻ cho gọn */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Tùy chọn"
                className="rounded-xl p-2 text-muted transition-colors hover:bg-white/5 hover:text-white"
              >
                {sharing || savingConvo ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : copied ? (
                  <Check className="h-5 w-5 text-emerald-400" />
                ) : (
                  <MoreHorizontal className="h-5 w-5" />
                )}
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      role="menu"
                      className="absolute right-0 z-40 mt-2 w-64 overflow-hidden rounded-2xl border border-white/10 bg-ink-700 p-1.5 shadow-glow-lg"
                    >
                      {/* share the conversation as a long image */}
                      <button
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(false)
                          onSaveConversation()
                        }}
                        disabled={busy || won || savingConvo}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/[0.05] disabled:opacity-40"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-brand-light">
                          <MessageSquareShare className="h-[18px] w-[18px]" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-white">
                            Chia sẻ đoạn hội thoại
                          </div>
                          <div className="text-xs text-muted">
                            Ảnh dài cả đoạn chat
                          </div>
                        </div>
                      </button>

                      {/* invite a friend to try this scenario */}
                      <button
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(false)
                          onInvite()
                        }}
                        disabled={sharing}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/[0.05] disabled:opacity-40"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-brand-light">
                          <Swords className="h-[18px] w-[18px]" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-white">
                            Thách bạn cùng chơi
                          </div>
                          <div className="text-xs text-muted">
                            Gửi thử thách màn này
                          </div>
                        </div>
                      </button>

                      {/* share the scenario link to Facebook */}
                      <button
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(false)
                          onShareFacebook()
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/[0.05]"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-brand-light">
                          <Facebook className="h-[18px] w-[18px]" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-white">
                            Chia sẻ lên Facebook
                          </div>
                          <div className="text-xs text-muted">
                            Đăng link màn này lên Facebook
                          </div>
                        </div>
                      </button>

                      {/* copy caption + link to paste anywhere */}
                      <button
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(false)
                          onCopyLink()
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/[0.05]"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-brand-light">
                          <Copy className="h-[18px] w-[18px]" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-white">
                            Sao chép link + lời mời
                          </div>
                          <div className="text-xs text-muted">
                            Dán lên bất kỳ đâu
                          </div>
                        </div>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* hàng 2: dòng mục tiêu — dùng lại tagline (nguồn duy nhất với trang chương) */}
        {scenario.tagline && (
          <div className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-muted">
            {scenario.tagline}
          </div>
        )}

        {/* hàng 3: lượt chat + thanh thuyết phục */}
        <div className="mx-auto mt-3 flex max-w-3xl items-center gap-4">
          <div className="flex shrink-0 items-center gap-1.5 text-sm text-muted">
            <MessageCircle className="h-4 w-4" />
            <span className="tabular-nums">{turns}</span>
          </div>
          <div className="min-w-0 flex-1">
            <PersuasionMeter score={score} grow />
          </div>
        </div>
      </header>

      {/* messages */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6">
          {messages.map((m) =>
            m.role === 'user' ? (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-end"
              >
                <div className="max-w-[80%] rounded-3xl rounded-br-lg bg-brand-gradient px-5 py-3 text-[0.95rem] leading-relaxed text-ink-900">
                  {m.content}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"
                  style={{ background: `${accent}22`, border: `1px solid ${accent}55` }}
                >
                  {scenario.emoji}
                </span>
                <div className="max-w-[82%] rounded-3xl rounded-tl-lg border border-white/8 bg-white/[0.03] px-5 py-3">
                  {m.streaming && !m.content ? (
                    <div className="flex gap-1.5 py-1">
                      {[0, 0.2, 0.4].map((d) => (
                        <span
                          key={d}
                          className="h-2 w-2 animate-pulse-dot rounded-full bg-brand-light"
                          style={{ animationDelay: `${d}s` }}
                        />
                      ))}
                    </div>
                  ) : (
                    <Markdown text={m.content} />
                  )}
                </div>
              </motion.div>
            ),
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* input */}
      <div className="relative z-10 px-4 pb-5 pt-2 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <ChatInput
            onSend={send}
            disabled={busy}
            placeholder="Nhập lời thuyết phục…"
            hint="Mẹo: nhập vai, nêu lý do thật thuyết phục nhé 😏"
          />
        </div>
      </div>

      {/* toast — báo rõ đã copy nội dung vào clipboard */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
          >
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-ink-800/95 px-4 py-2.5 text-sm font-medium text-white shadow-xl backdrop-blur">
              <Check className="h-4 w-4 shrink-0 text-emerald-400" />
              {toast}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
