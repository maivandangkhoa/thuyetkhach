/**
 * Groq client — OpenAI-compatible cloud LLM API (very fast inference).
 * Docs: https://console.groq.com/docs
 */

const KEY = process.env.GROQ_API_KEY || ''
const BASE = 'https://api.groq.com/openai/v1'

export const groqEnabled = () => !!KEY

// Exclude non-chat models (audio/tts/moderation/embeddings) from the list.
const EXCLUDE =
  /(whisper|tts|guard|embed|playai|prompt-guard|orpheus|canopylabs)/i

/** List Groq chat models available to this key. */
export async function listGroqModels() {
  if (!KEY) return []
  const res = await fetch(`${BASE}/models`, {
    headers: { Authorization: `Bearer ${KEY}` },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`Groq /models responded ${res.status}`)
  const data = await res.json()
  return (data.data || [])
    .map((m) => m.id)
    .filter((id) => id && !EXCLUDE.test(id))
}

/** Non-streaming completion → full content string (used by the game judge). */
export async function groqChatOnce({ model, messages, signal, temperature }) {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      ...(temperature != null ? { temperature } : {}),
    }),
    signal,
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Groq ${res.status} ${detail}`)
  }
  const data = await res.json()
  return data?.choices?.[0]?.message?.content || ''
}

/**
 * Stream a chat completion. Yields content deltas (strings).
 * Groq uses OpenAI SSE: lines `data: {choices:[{delta:{content}}]}` then `data: [DONE]`.
 */
export async function* streamGroqChat({
  model,
  messages,
  signal,
  temperature,
  frequencyPenalty,
  presencePenalty,
}) {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      ...(temperature != null ? { temperature } : {}),
      ...(frequencyPenalty != null ? { frequency_penalty: frequencyPenalty } : {}),
      ...(presencePenalty != null ? { presence_penalty: presencePenalty } : {}),
    }),
    signal,
  })

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Groq ${res.status} ${detail}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let nl
    while ((nl = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, nl).trim()
      buffer = buffer.slice(nl + 1)
      if (!line.startsWith('data:')) continue
      const payload = line.slice(5).trim()
      if (payload === '[DONE]') return
      try {
        const obj = JSON.parse(payload)
        const delta = obj?.choices?.[0]?.delta?.content
        if (delta) yield delta
      } catch {
        continue
      }
    }
  }
}
