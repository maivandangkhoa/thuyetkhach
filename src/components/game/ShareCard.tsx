import { forwardRef } from 'react'
import { Trophy } from 'lucide-react'
import { rankForTurns, accentFor } from '../../lib/game'
import type { Scenario } from '../../lib/game'
import type { RecordResult } from '../../lib/progress'

/**
 * The shareable result image. Mirrors the on-screen victory card (WinScreen) for
 * the top half, then keeps the share-only call-to-action footer at the bottom.
 *
 * Rendered off-screen and captured with html-to-image, so it intentionally
 * avoids backdrop-filter / gradient-clipped text (which don't rasterise
 * reliably). Solid colors only.
 */
const ShareCard = forwardRef<
  HTMLDivElement,
  {
    scenario: Scenario
    turns: number
    quote: string
    stars: number
    reward?: RecordResult | null
  }
>(({ scenario, turns, quote, stars, reward }, ref) => {
  const accent = accentFor(scenario)
  const rank = rankForTurns(turns)
  const trimmed =
    quote.length > 320 ? quote.slice(0, 318).trimEnd() + '…' : quote

  return (
    <div
      ref={ref}
      style={{
        width: 540,
        padding: 40,
        boxSizing: 'border-box',
        fontFamily: 'Inter, sans-serif',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
        background: `radial-gradient(120% 80% at 50% -10%, ${accent}33, transparent 60%), radial-gradient(100% 60% at 100% 110%, #4285F433, transparent 55%), #0B0F19`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      {/* trophy icon */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          background: 'linear-gradient(135deg,#4285F4,#8AB4F8,#A78BFA)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Trophy size={32} color="#0B0F19" strokeWidth={2.2} />
      </div>

      {/* CHIẾN THẮNG! */}
      <div
        style={{
          marginTop: 20,
          fontSize: 14,
          letterSpacing: 4,
          textTransform: 'uppercase',
          color: '#8AB4F8',
          fontWeight: 700,
        }}
      >
        Chiến thắng!
      </div>

      {/* title — full-width block so html-to-image computes the wrapped
          height correctly (shrink-to-fit + textWrap:balance mis-measures in
          the cloned DOM, causing the 2nd line to overlap the turns line) */}
      <div
        style={{
          marginTop: 8,
          width: '100%',
          flexShrink: 0,
          fontSize: 30,
          fontWeight: 700,
          lineHeight: 1.2,
        }}
      >
        {scenario.emoji} {scenario.title}
      </div>

      {/* turns line */}
      <div style={{ marginTop: 12, fontSize: 17, color: '#A1A1AA' }}>
        Thuyết phục thành công sau{' '}
        <span style={{ fontWeight: 700, color: '#fff' }}>{turns}</span> lượt.
      </div>

      {/* star rating — fewer turns, more stars */}
      <div
        style={{
          marginTop: 16,
          display: 'flex',
          gap: 8,
          fontSize: 40,
          lineHeight: 1,
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{ color: i < stars ? '#FBBF24' : 'rgba(255,255,255,0.18)' }}
          >
            ★
          </span>
        ))}
      </div>

      {/* quote — the character's closing line */}
      <div
        style={{
          marginTop: 20,
          width: '100%',
          boxSizing: 'border-box',
          padding: '16px 18px',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.04)',
        }}
      >
        <div
          style={{
            fontSize: 17,
            lineHeight: 1.5,
            color: 'rgba(255,255,255,0.9)',
            fontStyle: 'italic',
          }}
        >
          “{trimmed}”
        </div>
        <div style={{ marginTop: 8, fontSize: 13, color: '#A1A1AA' }}>
          — {scenario.title}
        </div>
      </div>

      {/* reward box */}
      {reward && (
        <div
          style={{
            marginTop: 16,
            width: '100%',
            boxSizing: 'border-box',
            padding: 20,
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              fontSize: 15,
            }}
          >
            {reward.xpGained > 0 ? (
              <span style={{ fontWeight: 700, color: '#8AB4F8' }}>
                +{reward.xpGained} XP
              </span>
            ) : (
              <span style={{ color: '#A1A1AA' }}>Đã đạt mốc sao này rồi</span>
            )}
            {reward.starsGained > 0 && (
              <span style={{ color: '#FBBF24' }}>+{reward.starsGained} ⭐</span>
            )}
          </div>
          {reward.leveledUp && (
            <div
              style={{
                marginTop: 12,
                padding: '8px 0',
                borderRadius: 12,
                background: 'rgba(66,133,244,0.15)',
                fontSize: 15,
                fontWeight: 500,
                color: '#8AB4F8',
              }}
            >
              🎉 Lên Cấp {reward.newLevel}!
            </div>
          )}
          {reward.unlockedChapter && (
            <div
              style={{
                marginTop: 8,
                padding: '8px 0',
                borderRadius: 12,
                background: 'rgba(245,158,11,0.15)',
                fontSize: 15,
                fontWeight: 500,
                color: '#F59E0B',
              }}
            >
              🔓 Mở khoá: Chương {reward.unlockedChapter.id} —{' '}
              {reward.unlockedChapter.title}
            </div>
          )}
        </div>
      )}

      {/* danh hiệu */}
      <div
        style={{
          marginTop: 16,
          width: '100%',
          boxSizing: 'border-box',
          padding: 20,
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.04)',
        }}
      >
        <div
          style={{
            fontSize: 12,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            color: '#A1A1AA',
          }}
        >
          Danh hiệu
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 22,
            fontWeight: 700,
            color: '#8AB4F8',
          }}
        >
          {rank.title}
        </div>
        <div style={{ marginTop: 4, fontSize: 15, color: '#A1A1AA' }}>
          {rank.sub}
        </div>
      </div>

      {/* footer — prominent call-to-action with the link printed on the image */}
      <div
        style={{
          marginTop: 22,
          width: '100%',
          boxSizing: 'border-box',
          padding: '14px 18px',
          borderRadius: 14,
          background: 'linear-gradient(135deg,#4285F4,#8AB4F8,#A78BFA)',
          color: '#0B0F19',
          textAlign: 'center',
          fontWeight: 700,
          fontSize: 18,
        }}
      >
        🎮 Thử thách bạn bè tại game.fechtin.com
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
        📈 Cùng bạn kiến tạo tự do tài chính · fechtin.com
      </div>
    </div>
  )
})

ShareCard.displayName = 'ShareCard'
export default ShareCard
