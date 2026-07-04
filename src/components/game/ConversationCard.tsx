import { forwardRef } from 'react'
import Markdown from '../chat/Markdown'
import { accentFor } from '../../lib/game'
import type { Scenario, GameMessage } from '../../lib/game'

/**
 * The full conversation rendered as one tall "long screenshot" image — every
 * turn as a chat bubble (user right, character left). Rendered off-screen and
 * captured with html-to-image, so it sticks to solid colors / plain gradients
 * and avoids backdrop-filter + gradient-clipped text, same constraints as
 * ShareCard / ChallengeCard.
 */
const ConversationCard = forwardRef<
  HTMLDivElement,
  {
    scenario: Scenario
    messages: GameMessage[]
    turns: number
  }
>(({ scenario, messages, turns }, ref) => {
  const accent = accentFor(scenario)
  // Skip empty / still-streaming bubbles so the image never shows a blank turn.
  const visible = messages.filter((m) => m.content.trim() !== '')

  return (
    <div
      ref={ref}
      style={{
        width: 600,
        padding: 32,
        boxSizing: 'border-box',
        fontFamily: 'Inter, sans-serif',
        color: '#fff',
        // Gradient bounded in px (not %) so it only paints a fixed band near the
        // top — a %-height gradient grows with the conversation and can crash the
        // tab when html-to-image rasterises a tall <foreignObject>.
        background: `radial-gradient(700px 280px at 50% 0px, ${accent}22, transparent 70%), #0B0F19`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* brand */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          paddingBottom: 16,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <span
          style={{
            fontWeight: 800,
            fontSize: 30,
            whiteSpace: 'nowrap',
            background: 'linear-gradient(135deg,#4285F4,#8AB4F8,#A78BFA)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
          }}
        >
          Thuyết Khách Hành
        </span>
      </div>

      {/* scenario */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
        <span
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            background: `${accent}22`,
            border: `1px solid ${accent}55`,
          }}
        >
          {scenario.emoji}
        </span>
        {/* flex:1 + minWidth:0 gives this column a deterministic width so
            html-to-image doesn't mis-measure shrink-to-fit and wrap the title
            onto a 2nd line that overlaps the subtitle (same fix as ShareCard) */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: '100%',
              fontWeight: 700,
              fontSize: 18,
              lineHeight: 1.3,
            }}
          >
            {scenario.title}
          </div>
          <div style={{ marginTop: 2, fontSize: 13, color: '#A1A1AA' }}>
            Độ khó: {scenario.difficulty} · {turns} lượt
          </div>
        </div>
      </div>

      {/* mục tiêu — dòng mô tả ngắn, đồng bộ với header màn chơi */}
      {scenario.tagline && (
        <div
          style={{
            marginTop: 12,
            fontSize: 14,
            lineHeight: 1.45,
            color: '#C7C9D1',
          }}
        >
          {scenario.tagline}
        </div>
      )}

      {/* conversation */}
      <div
        style={{
          marginTop: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {visible.map((m) =>
          m.role === 'user' ? (
            <div key={m.id} style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div
                style={{
                  maxWidth: '82%',
                  padding: '12px 16px',
                  borderRadius: '20px 20px 6px 20px',
                  background: 'linear-gradient(135deg,#4285F4,#8AB4F8,#A78BFA)',
                  color: '#0B0F19',
                  fontSize: 15,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {m.content}
              </div>
            </div>
          ) : (
            <div key={m.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 17,
                  background: `${accent}22`,
                  border: `1px solid ${accent}55`,
                }}
              >
                {scenario.emoji}
              </span>
              <div
                style={{
                  maxWidth: '82%',
                  padding: '4px 16px',
                  borderRadius: '20px 20px 20px 6px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)',
                  wordBreak: 'break-word',
                }}
              >
                <Markdown text={m.content} />
              </div>
            </div>
          ),
        )}
      </div>

      {/* footer — call-to-action with the link printed on the image */}
      <div
        style={{
          marginTop: 24,
          padding: '13px 18px',
          borderRadius: 14,
          background: 'linear-gradient(135deg,#4285F4,#8AB4F8,#A78BFA)',
          color: '#0B0F19',
          textAlign: 'center',
          fontWeight: 700,
          fontSize: 16,
        }}
      >
        🎮 Chơi ngay tại game.fechtin.com
      </div>

      {/* secondary brand line — drives traffic to the financial-news product */}
      <div
        style={{
          marginTop: 10,
          textAlign: 'center',
          fontSize: 12,
          fontWeight: 500,
          color: 'rgba(255,255,255,0.6)',
        }}
      >
        📈 Tin tài chính dành riêng cho bạn · fechtin.com
      </div>
    </div>
  )
})

ConversationCard.displayName = 'ConversationCard'
export default ConversationCard
