/**
 * OG image động cho từng màn chơi (Open Graph 1200×630).
 *
 * Bot crawler của Facebook/Zalo/Messenger không chạy JS — chúng chỉ đọc thẻ
 * `og:image`. Ta vẽ một ảnh riêng cho mỗi scenario (tên màn, chương, độ khó,
 * lời mời) bằng satori (layout → SVG) rồi resvg-js (SVG → PNG).
 *
 * Người chơi KHÔNG bao giờ tải ảnh này — chỉ bot mới lấy, và đã được cache.
 * Không dùng emoji vì satori không render emoji khi chạy offline.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FONT_DIR = path.join(__dirname, 'assets')

// Tên family phải KHỚP giữa satori và resvg, nếu lệch resvg sẽ fallback sai font.
const FONT_FAMILY = 'Be Vietnam Pro'
const fontRegular = fs.readFileSync(path.join(FONT_DIR, 'BeVietnamPro-Regular.ttf'))
const fontBold = fs.readFileSync(path.join(FONT_DIR, 'BeVietnamPro-Bold.ttf'))

const BG = '#0B0F19' // ink-900
const MUTED = '#A1A1AA'
const SUBTLE = '#C7C9D1'

// Helper tạo element cho satori (thay cho JSX — server không có JSX).
const h = (type, style, children) => ({
  type,
  props: { style, ...(children !== undefined ? { children } : {}) },
})

/** Dựng cây element của tấm card từ scenario + chapter. */
function card(scenario, chapter) {
  const accent = chapter?.accent || '#4285F4'
  const chapterLabel = chapter
    ? `CHƯƠNG ${chapter.id} · ${chapter.title.toUpperCase()}`
    : 'THUYẾT KHÁCH HÀNH'

  return h(
    'div',
    {
      width: '1200px',
      height: '630px',
      display: 'flex',
      flexDirection: 'column',
      padding: '72px',
      backgroundColor: BG,
      fontFamily: FONT_FAMILY,
      position: 'relative',
    },
    [
      // thanh accent trên cùng
      h('div', {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '12px',
        backgroundColor: accent,
      }),
      // brand
      h(
        'div',
        {
          display: 'flex',
          fontSize: '26px',
          fontWeight: 700,
          letterSpacing: '4px',
          color: accent,
        },
        'THUYẾT KHÁCH HÀNH',
      ),
      // chương
      h(
        'div',
        {
          display: 'flex',
          marginTop: '40px',
          fontSize: '28px',
          fontWeight: 700,
          color: MUTED,
          letterSpacing: '1px',
        },
        chapterLabel,
      ),
      // tên màn (lớn)
      h(
        'div',
        {
          display: 'flex',
          marginTop: '14px',
          fontSize: '78px',
          fontWeight: 700,
          color: '#FFFFFF',
          lineHeight: 1.08,
        },
        scenario.title,
      ),
      // tagline / mục tiêu
      h(
        'div',
        {
          display: 'flex',
          marginTop: '28px',
          fontSize: '34px',
          color: SUBTLE,
          lineHeight: 1.35,
          maxWidth: '1000px',
        },
        scenario.tagline || '',
      ),
      // hàng dưới: độ khó + lời mời
      h(
        'div',
        {
          display: 'flex',
          marginTop: 'auto',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        [
          h(
            'div',
            {
              display: 'flex',
              padding: '12px 28px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255,255,255,0.08)',
              border: `1px solid ${accent}`,
              fontSize: '28px',
              fontWeight: 700,
              color: '#FFFFFF',
            },
            `Độ khó: ${scenario.difficulty || '—'}`,
          ),
          h(
            'div',
            {
              display: 'flex',
              fontSize: '28px',
              fontWeight: 700,
              color: accent,
            },
            'Bạn thuyết phục được không?  ·  game.fechtin.com',
          ),
        ],
      ),
    ],
  )
}

/**
 * Render scenario thành PNG buffer. Ném lỗi nếu thất bại (caller fallback).
 * @returns {Promise<Buffer>}
 */
export async function renderOgPng(scenario, chapter) {
  const svg = await satori(card(scenario, chapter), {
    width: 1200,
    height: 630,
    fonts: [
      { name: FONT_FAMILY, data: fontRegular, weight: 400, style: 'normal' },
      { name: FONT_FAMILY, data: fontBold, weight: 700, style: 'normal' },
    ],
  })
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    font: {
      fontBuffers: [fontRegular, fontBold],
      loadSystemFonts: false,
      defaultFontFamily: FONT_FAMILY,
    },
  })
  return resvg.render().asPng()
}
