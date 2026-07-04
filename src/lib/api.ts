import type { Scenario, Chapter } from './game'

export interface ApiMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface GameData {
  chapters: Chapter[]
  scenarios: Scenario[]
}

export async function fetchScenarios(): Promise<GameData> {
  const res = await fetch('/api/game/scenarios')
  if (!res.ok) throw new Error(`Request failed (${res.status})`)
  const data = await res.json()
  return {
    chapters: (data.chapters ?? []) as Chapter[],
    scenarios: (data.scenarios ?? []) as Scenario[],
  }
}

export interface GameMeta {
  win: boolean
  score: number | null
  /** Câu trích đã kiểm duyệt cho ảnh chia sẻ (null nếu chưa thắng/không có). */
  shareQuote?: string | null
}

interface GameStreamOpts {
  scenarioId: string
  messages: ApiMessage[]
  signal?: AbortSignal
  onDelta: (delta: string) => void
  onMeta: (meta: GameMeta) => void
}

/** Stream one game turn; onMeta fires once at the end with win/score. */
export async function streamGameChat({
  scenarioId,
  messages,
  signal,
  onDelta,
  onMeta,
}: GameStreamOpts): Promise<void> {
  const res = await fetch('/api/game/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenarioId, messages }),
    signal,
  })
  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => '')
    throw new Error(detail || `Request failed (${res.status})`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const events = buffer.split('\n\n')
    buffer = events.pop() ?? ''
    for (const evt of events) {
      const line = evt.trim()
      if (!line.startsWith('data:')) continue
      const payload = line.slice(5).trim()
      if (payload === '[DONE]') return
      try {
        const obj = JSON.parse(payload)
        if (obj.error) throw new Error(obj.error)
        if (obj.delta) onDelta(obj.delta)
        if (obj.meta) onMeta(obj.meta as GameMeta)
      } catch (err) {
        if (err instanceof SyntaxError) continue
        throw err
      }
    }
  }
}
