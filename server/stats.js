import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Stored OUTSIDE the app dir (../../aihub-data) so `deploy.sh`'s
// `rsync --delete` into /home/ubuntu/ai-hub never wipes it. Override with
// STATS_FILE if needed.
const FILE =
  process.env.STATS_FILE ||
  path.join(__dirname, '..', '..', 'aihub-data', 'game-stats.json')

// Per-scenario counters: number of plays started and wins reached.
const data = { plays: {}, wins: {} }
try {
  const loaded = JSON.parse(fs.readFileSync(FILE, 'utf8'))
  Object.assign(data.plays, loaded.plays)
  Object.assign(data.wins, loaded.wins)
} catch {
  /* first run — file doesn't exist yet */
}

// Invariant: a win always belongs to a counted play, so wins ≤ plays per
// scenario (win rate can never exceed 100%). Repair any legacy file where a
// win got double-counted within one conversation (judge-concede path).
for (const id of Object.keys(data.wins)) {
  data.wins[id] = Math.min(data.wins[id], data.plays[id] || 0)
}

// Debounced atomic write (temp + rename) — coalesces bursts, never corrupts.
let timer = null
function scheduleWrite() {
  if (timer) return
  timer = setTimeout(() => {
    timer = null
    try {
      fs.mkdirSync(path.dirname(FILE), { recursive: true })
      const tmp = `${FILE}.tmp`
      fs.writeFileSync(tmp, JSON.stringify(data))
      fs.renameSync(tmp, FILE)
    } catch (err) {
      console.warn('[stats] write failed:', err.message)
    }
  }, 1000)
}

export function recordPlay(scenarioId) {
  data.plays[scenarioId] = (data.plays[scenarioId] || 0) + 1
  scheduleWrite()
}

export function recordWin(scenarioId) {
  // Clamp to plays: never count more wins than plays for a scenario, so the
  // win rate stays ≤ 100% even if this fires twice for one round.
  const plays = data.plays[scenarioId] || 0
  data.wins[scenarioId] = Math.min((data.wins[scenarioId] || 0) + 1, plays)
  scheduleWrite()
}

/** { plays, wins } for one scenario (zeros if never played). */
export function getStats(scenarioId) {
  return {
    plays: data.plays[scenarioId] || 0,
    wins: data.wins[scenarioId] || 0,
  }
}
