/**
 * Provider router. Model ids from Groq are namespaced with a `groq:` prefix so
 * we can route a chat request to the right backend; everything else is Ollama.
 */
import { streamChat as ollamaStream, chatOnce as ollamaOnce } from './ollama.js'
import { streamGroqChat, groqChatOnce } from './groq.js'

export const GROQ_PREFIX = 'groq:'
export const isGroq = (id) => typeof id === 'string' && id.startsWith(GROQ_PREFIX)
export const realId = (id) => (isGroq(id) ? id.slice(GROQ_PREFIX.length) : id)

/** Remove <think>…</think> reasoning from a full string (one-shot results). */
export function stripThinkText(s = '') {
  let t = s.replace(/<think>[\s\S]*?<\/think>/gi, '')
  t = t.replace(/<think>[\s\S]*$/i, '') // dangling open with no close
  const ci = t.lastIndexOf('</think>') // stray close tag
  if (ci !== -1) t = t.slice(ci + '</think>'.length)
  return t.trim()
}

/**
 * Wrap a delta stream to drop <think>…</think> blocks, even when the tags are
 * split across chunks. Reasoning models (e.g. Qwen3) emit these; we hide them.
 */
async function* stripThinkStream(source) {
  const OPEN = '<think>'
  const CLOSE = '</think>'
  const KEEP = CLOSE.length // hold back a tail so split tags aren't leaked
  let inThink = false
  let buf = ''

  for await (const chunk of source) {
    buf += chunk
    let out = ''
    for (;;) {
      if (!inThink) {
        const i = buf.indexOf(OPEN)
        if (i !== -1) {
          out += buf.slice(0, i)
          buf = buf.slice(i + OPEN.length)
          inThink = true
          continue
        }
        if (buf.length > KEEP) {
          out += buf.slice(0, buf.length - KEEP)
          buf = buf.slice(buf.length - KEEP)
        }
        break
      } else {
        const j = buf.indexOf(CLOSE)
        if (j !== -1) {
          buf = buf.slice(j + CLOSE.length)
          inThink = false
          continue
        }
        if (buf.length > KEEP) buf = buf.slice(buf.length - KEEP)
        break
      }
    }
    if (out) yield out
  }
  if (!inThink && buf) yield buf
}

/** Stream deltas from whichever provider owns the model (think blocks removed). */
export function streamLLM({ model, messages, signal, temperature, frequencyPenalty, presencePenalty, repeatPenalty }) {
  const source = isGroq(model)
    ? streamGroqChat({ model: realId(model), messages, signal, temperature, frequencyPenalty, presencePenalty })
    : ollamaStream({ model, messages, signal, temperature, repeatPenalty })
  return stripThinkStream(source)
}

/** One-shot completion from whichever provider owns the model (think removed). */
export async function llmOnce({ model, messages, signal, temperature }) {
  const raw = isGroq(model)
    ? await groqChatOnce({ model: realId(model), messages, signal, temperature })
    : await ollamaOnce({ model: realId(model), messages, signal, temperature })
  return stripThinkText(raw)
}

/** Did the client abort? Don't fall back on aborts — the user left. */
const isAbort = (err, signal) =>
  (signal && signal.aborted) ||
  (err && (err.name === 'AbortError' || /abort/i.test(err.message || '')))

/**
 * Cooldown nhớ tạm (server-wide): model nào vừa lỗi sẽ bị bỏ qua ở đầu chuỗi
 * trong DOWN_MS, để người chơi vào sau không phải tốn round-trip lỗi nữa mà đi
 * thẳng tới model đang khoẻ. Hết hạn thì model tự được thử lại.
 */
const DOWN_MS = 60_000
const downUntil = new Map()
const markDown = (m) => downUntil.set(m, Date.now() + DOWN_MS)
const markUp = (m) => downUntil.delete(m)

/** Lọc bỏ model đang trong cooldown; nếu tất cả đều "down" thì vẫn thử cả chuỗi. */
function healthyOrder(models) {
  const now = Date.now()
  const up = models.filter((m) => (downUntil.get(m) || 0) <= now)
  return up.length ? up : models
}

/**
 * Stream deltas, auto-switching to the next model on failure. Only switches
 * BEFORE the first token of a model is emitted — once text has streamed, a
 * later failure propagates (switching mid-reply would duplicate text).
 */
export async function* streamLLMFallback({ models, messages, signal, temperature, frequencyPenalty, presencePenalty, repeatPenalty, onSwitch }) {
  const chain = healthyOrder(models)
  let lastErr
  for (let i = 0; i < chain.length; i++) {
    const model = chain[i]
    let started = false
    try {
      for await (const delta of streamLLM({ model, messages, signal, temperature, frequencyPenalty, presencePenalty, repeatPenalty })) {
        started = true
        yield delta
      }
      markUp(model)
      return // streamed to completion
    } catch (err) {
      if (isAbort(err, signal)) throw err
      lastErr = err
      markDown(model)
      if (started) throw err // already emitted text → can't safely switch
      if (onSwitch && i + 1 < chain.length) onSwitch(model, chain[i + 1], err)
    }
  }
  throw lastErr || new Error('No model available')
}

/** One-shot completion, auto-switching to the next model on failure. */
export async function llmOnceFallback({ models, messages, signal, temperature }) {
  const chain = healthyOrder(models)
  let lastErr
  for (const model of chain) {
    try {
      const out = await llmOnce({ model, messages, signal, temperature })
      markUp(model)
      return out
    } catch (err) {
      if (isAbort(err, signal)) throw err
      lastErr = err
      markDown(model)
    }
  }
  throw lastErr || new Error('No model available')
}
