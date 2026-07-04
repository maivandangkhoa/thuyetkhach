/**
 * Print a scenario brief for a playtesting subagent: public info + the secret
 * spec it needs to (a) play effectively and (b) AUDIT the NPC's behaviour
 * (address/pronouns, voice, language, win condition).
 *
 * node tasks/scenario-brief.mjs <scenarioId>
 */
import { getScenario } from '../server/game.js'

const s = getScenario(process.argv[2])
if (!s) {
  console.log(JSON.stringify({ error: `unknown scenarioId: ${process.argv[2]}` }))
  process.exit(1)
}
console.log(
  JSON.stringify(
    {
      id: s.id,
      chapter: s.chapter,
      order: s.order,
      isBoss: !!s.isBoss,
      title: s.title,
      difficulty: s.difficulty,
      lang: s.lang || 'tiếng Việt',
      tagline: s.tagline,
      greeting: s.greeting,
      voice: s.voice,
      address: s.address || '(không quy định — phải tự nhiên, tránh "bạn"/"mình" máy móc)',
      context_hint: s.context,
      // win condition (so the agent knows the goal); the NPC says one of these when conceding
      winPhrases: s.winPhrases,
    },
    null,
    2,
  ),
)
