/**
 * Thin client around the Ollama HTTP API.
 * Docs: https://github.com/ollama/ollama/blob/main/docs/api.md
 */

const HOST = (process.env.OLLAMA_HOST || 'http://localhost:11434').replace(
  /\/$/,
  '',
)

export const ollamaHost = HOST

/** List installed models via /api/tags. */
export async function listModels() {
  const res = await fetch(`${HOST}/api/tags`, {
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`Ollama /api/tags responded ${res.status}`)
  const data = await res.json()
  return Array.isArray(data.models) ? data.models : []
}

/**
 * One-shot (non-streaming) chat completion → returns the full content string.
 * Used for the game's quick "persuasion score" judge call.
 * @param {{model:string, messages:Array<{role:string,content:string}>, signal?:AbortSignal}} opts
 */
export async function chatOnce({ model, messages, signal, temperature }) {
  const res = await fetch(`${HOST}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      ...(temperature != null ? { options: { temperature } } : {}),
    }),
    signal,
  })
  if (!res.ok) throw new Error(`Ollama /api/chat responded ${res.status}`)
  const data = await res.json()
  return data?.message?.content || ''
}

/**
 * Stream a chat completion. Yields incremental content deltas (strings).
 * @param {{model:string, messages:Array<{role:string,content:string}>, signal?:AbortSignal}} opts
 */
export async function* streamChat({ model, messages, signal, temperature, repeatPenalty }) {
  const options = {}
  if (temperature != null) options.temperature = temperature
  if (repeatPenalty != null) options.repeat_penalty = repeatPenalty
  const res = await fetch(`${HOST}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      ...(Object.keys(options).length ? { options } : {}),
    }),
    signal,
  })

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Ollama /api/chat responded ${res.status} ${detail}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // Ollama streams newline-delimited JSON objects
    let nl
    while ((nl = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, nl).trim()
      buffer = buffer.slice(nl + 1)
      if (!line) continue
      let obj
      try {
        obj = JSON.parse(line)
      } catch {
        continue
      }
      const delta = obj?.message?.content
      if (delta) yield delta
      if (obj?.done) return
    }
  }
}
