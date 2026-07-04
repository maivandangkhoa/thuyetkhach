/**
 * Sinh promo card quảng cáo cho game — 2 tỉ lệ:
 *   - landscape 1200×630 (dùng lại renderOgPng của server)
 *   - portrait  1080×1920 (layout poster dọc, định nghĩa ở đây)
 * Lấy data màn từ API /api/game/scenarios. Chạy: node marketing/gen-cards.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { renderOgPng } from '../server/og.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, 'cards')
const FONT_DIR = path.join(__dirname, '..', 'server', 'assets')
const FAMILY = 'Be Vietnam Pro'
const reg = fs.readFileSync(path.join(FONT_DIR, 'BeVietnamPro-Regular.ttf'))
const bold = fs.readFileSync(path.join(FONT_DIR, 'BeVietnamPro-Bold.ttf'))

// Các màn được chọn cho đa dạng màu/độ khó.
const PICKS = [
  'bao-ve', 'me-vo', 'crush', 'sep',
  'khach-outsource', 'ch06-abandonment-fear', 'cyber-guard',
]

const h = (type, style, children) => ({
  type,
  props: { style, ...(children !== undefined ? { children } : {}) },
})

function portraitCard(s, ch) {
  const accent = ch?.accent || '#4285F4'
  const label = ch ? `CHƯƠNG ${ch.id} · ${ch.title.toUpperCase()}` : 'THUYẾT KHÁCH HÀNH'
  return h(
    'div',
    {
      width: '1080px',
      height: '1920px',
      display: 'flex',
      flexDirection: 'column',
      padding: '110px 96px',
      backgroundColor: '#0B0F19',
      fontFamily: FAMILY,
      position: 'relative',
    },
    [
      // glow accent trên
      h('div', {
        position: 'absolute', top: 0, left: 0, right: 0, height: '16px',
        backgroundColor: accent,
      }),
      h('div', {
        display: 'flex', fontSize: '40px', fontWeight: 700,
        letterSpacing: '6px', color: accent,
      }, 'THUYẾT KHÁCH HÀNH'),
      h('div', {
        display: 'flex', marginTop: '12px', fontSize: '34px',
        color: '#A1A1AA', fontWeight: 400,
      }, 'Trò chơi thuyết phục bằng lời'),

      // khối giữa
      h('div', {
        display: 'flex', flexDirection: 'column', marginTop: 'auto', marginBottom: 'auto',
      }, [
        h('div', {
          display: 'flex', fontSize: '38px', fontWeight: 700,
          color: MUTED2(accent), letterSpacing: '2px',
        }, label),
        h('div', {
          display: 'flex', marginTop: '24px', fontSize: '128px',
          fontWeight: 700, color: '#FFFFFF', lineHeight: 1.05,
        }, s.title),
        h('div', {
          display: 'flex', marginTop: '40px', fontSize: '46px',
          color: '#C7C9D1', lineHeight: 1.4,
        }, s.tagline || ''),
        h('div', {
          display: 'flex', marginTop: '48px', alignSelf: 'flex-start',
          padding: '16px 40px', borderRadius: '9999px',
          backgroundColor: 'rgba(255,255,255,0.06)', border: `2px solid ${accent}`,
          fontSize: '40px', fontWeight: 700, color: '#FFFFFF',
        }, `Độ khó: ${s.difficulty || '—'}`),
      ]),

      // CTA dưới
      h('div', { display: 'flex', flexDirection: 'column', marginTop: 'auto' }, [
        h('div', {
          display: 'flex', fontSize: '52px', fontWeight: 700, color: '#FFFFFF',
        }, 'Bạn thuyết phục được không?'),
        h('div', {
          display: 'flex', marginTop: '20px', padding: '28px 0',
          justifyContent: 'center', borderRadius: '24px',
          backgroundColor: accent, color: '#0B0F19', fontSize: '46px', fontWeight: 700,
        }, 'Chơi ngay · game.fechtin.com'),
      ]),
    ],
  )
}

// làm nhạt accent cho nhãn chương (giữ tông màu nhưng dịu hơn) — đơn giản trả về accent.
function MUTED2(accent) { return accent }

async function toPng(node, w, h) {
  const svg = await satori(node, {
    width: w, height: h,
    fonts: [
      { name: FAMILY, data: reg, weight: 400, style: 'normal' },
      { name: FAMILY, data: bold, weight: 700, style: 'normal' },
    ],
  })
  const r = new Resvg(svg, {
    fitTo: { mode: 'width', value: w },
    font: { fontBuffers: [reg, bold], loadSystemFonts: false, defaultFontFamily: FAMILY },
  })
  return r.render().asPng()
}

const res = await fetch('http://localhost:8787/api/game/scenarios')
const { scenarios, chapters } = await res.json()
const chById = Object.fromEntries(chapters.map((c) => [c.id, c]))

for (const id of PICKS) {
  const s = scenarios.find((x) => x.id === id)
  if (!s) { console.log('skip (not found):', id); continue }
  const ch = chById[s.chapter]
  // landscape (server renderer)
  fs.writeFileSync(path.join(OUT, `card-landscape-${id}.png`), await renderOgPng(s, ch))
  // portrait
  fs.writeFileSync(path.join(OUT, `card-portrait-${id}.png`), await toPng(portraitCard(s, ch), 1080, 1920))
  console.log('✓', id)
}
console.log('Xong →', OUT)
