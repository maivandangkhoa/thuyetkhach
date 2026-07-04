import { forwardRef } from 'react'
import { accentFor } from '../../lib/game'
import type { Scenario } from '../../lib/game'

/**
 * A "challenge a friend" image for one scenario — shared from inside a game
 * before winning. Rendered off-screen and captured with html-to-image, so it
 * avoids backdrop-filter / gradient-clipped text (solid colors only), same
 * constraints as ShareCard.
 */
const ChallengeCard = forwardRef<HTMLDivElement, { scenario: Scenario }>(
  ({ scenario }, ref) => {
    const accent = accentFor(scenario)
    const tagline =
      scenario.tagline.length > 150
        ? scenario.tagline.slice(0, 148).trimEnd() + '…'
        : scenario.tagline

    return (
      <div
        ref={ref}
        style={{
          width: 540,
          height: 720,
          padding: 40,
          boxSizing: 'border-box',
          fontFamily: 'Inter, sans-serif',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          background: `radial-gradient(120% 80% at 50% -10%, ${accent}33, transparent 60%), radial-gradient(100% 60% at 100% 110%, #4285F433, transparent 55%), #0B0F19`,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* brand */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span
            style={{
              fontWeight: 800,
              fontSize: 30,
              whiteSpace: 'nowrap',
              flexShrink: 0,
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

        {/* center */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 104, lineHeight: 1 }}>{scenario.emoji}</div>
          <div
            style={{
              marginTop: 20,
              fontSize: 14,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: accent,
              fontWeight: 700,
            }}
          >
            🔥 Thách đấu thuyết phục
          </div>
          {/* full-width block so html-to-image computes the wrapped height
              correctly (shrink-to-fit mis-measures in the cloned DOM, causing
              a 2nd title line to overlap the difficulty badge) */}
          <div
            style={{
              marginTop: 10,
              width: '100%',
              flexShrink: 0,
              fontSize: 34,
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            {scenario.title}
          </div>

          {/* difficulty */}
          <div
            style={{
              marginTop: 14,
              padding: '5px 14px',
              borderRadius: 999,
              border: `1px solid ${accent}66`,
              color: accent,
              fontSize: 14,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Độ khó: {scenario.difficulty}
          </div>

          {/* tagline */}
          <div
            style={{
              marginTop: 22,
              padding: '16px 18px',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
              fontSize: 18,
              lineHeight: 1.5,
              color: 'rgba(255,255,255,0.9)',
            }}
          >
            {tagline}
          </div>

          <div
            style={{
              marginTop: 20,
              fontSize: 19,
              fontWeight: 600,
              color: '#fff',
              whiteSpace: 'nowrap',
            }}
          >
            Bạn dám thử không? 😏
          </div>
        </div>

        {/* footer — prominent CTA with the link printed on the image */}
        <div
          style={{
            marginTop: 22,
            padding: '14px 18px',
            borderRadius: 14,
            background: 'linear-gradient(135deg,#4285F4,#8AB4F8,#A78BFA)',
            color: '#0B0F19',
            textAlign: 'center',
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          🎮 Chơi ngay tại game.fechtin.com
        </div>

        {/* secondary brand line — drives traffic to the financial-news product */}
        <div
          style={{
            marginTop: 12,
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.6)',
          }}
        >
          📈 Tin tài chính dành riêng cho bạn · fechtin.com
        </div>
      </div>
    )
  },
)

ChallengeCard.displayName = 'ChallengeCard'
export default ChallengeCard
