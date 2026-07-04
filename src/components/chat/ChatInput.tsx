import { useRef, useState } from 'react'
import { Paperclip, Mic, ArrowUp } from 'lucide-react'

export default function ChatInput({
  onSend,
  disabled,
  placeholder = 'Nhập lời thuyết phục…',
  hint = 'AI có thể mắc sai sót. Hãy kiểm chứng thông tin quan trọng.',
}: {
  onSend: (text: string) => void
  disabled?: boolean
  placeholder?: string
  hint?: string
}) {
  const [value, setValue] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

  const submit = () => {
    const text = value.trim()
    if (!text || disabled) return
    onSend(text)
    setValue('')
    if (ref.current) ref.current.style.height = 'auto'
  }

  const grow = () => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }

  return (
    <div className="relative">
      {/* soft glowing border */}
      <div className="pointer-events-none absolute -inset-px rounded-[1.6rem] bg-brand-gradient opacity-30 blur-md" />

      <div className="relative flex items-end gap-2 rounded-3xl glass-strong p-2.5">
        <button className="mb-0.5 rounded-xl p-2.5 text-muted transition-colors hover:bg-white/5 hover:text-white">
          <Paperclip className="h-5 w-5" />
        </button>

        <textarea
          ref={ref}
          rows={1}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            grow()
          }}
          onKeyDown={(e) => {
            // Ignore Enter while an IME composition is active (e.g. Vietnamese
            // Telex/VNI). Otherwise the last syllable gets committed *after* we
            // clear the box and reappears as leftover text.
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              submit()
            }
          }}
          placeholder={placeholder}
          className="max-h-[200px] flex-1 resize-none bg-transparent py-2.5 text-base leading-relaxed text-white placeholder:text-muted focus:outline-none"
        />

        <button className="mb-0.5 rounded-xl p-2.5 text-muted transition-colors hover:bg-white/5 hover:text-white">
          <Mic className="h-5 w-5" />
        </button>

        <button
          onClick={submit}
          disabled={!value.trim() || disabled}
          className="mb-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient text-ink-900 shadow-glow transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          <ArrowUp className="h-5 w-5" strokeWidth={2.4} />
        </button>
      </div>

      {hint && <p className="mt-2.5 text-center text-xs text-muted">{hint}</p>}
    </div>
  )
}
