/**
 * Tạo HTML mockup (screenshot lồng trong khung điện thoại) — nhúng ảnh base64
 * để Chrome render không cần quyền file. Sinh file .html vào marketing/mockups/,
 * sau đó chụp bằng Chrome headless (xem lệnh bash đi kèm).
 *   node marketing/gen-mockups.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SHOTS = path.join(__dirname, 'screenshots')
const OUT = path.join(__dirname, 'mockups')

const b64 = (p) => `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`

// Khung điện thoại chứa 1 screenshot (tỉ lệ 9:19.5 ~ ảnh 1080×1920).
const phone = (img, w) => `
  <div style="position:relative;width:${w}px;background:#05070d;border-radius:${w * 0.13}px;
    padding:${w * 0.028}px;box-shadow:0 40px 120px rgba(0,0,0,.6),0 0 0 2px rgba(255,255,255,.06);">
    <img src="${img}" style="width:100%;display:block;border-radius:${w * 0.1}px;"/>
  </div>`

const page = (wPx, hPx, accent, inner) => `<!doctype html><html><head><meta charset="utf-8">
<style>
  @font-face{font-family:BVP;src:url('${b64HasFont ? '' : ''}');}
  *{margin:0;box-sizing:border-box;font-family:'Be Vietnam Pro','Inter',system-ui,sans-serif;}
  body{width:${wPx}px;height:${hPx}px;overflow:hidden;
    background:radial-gradient(900px 600px at 50% 0%, ${accent}33, transparent 60%), #0B0F19;}
</style></head><body>${inner}</body></html>`
const b64HasFont = false

// ---- Portrait 1080×1920 ----------------------------------------------------
function portrait(img, accent, headline, sub) {
  const inner = `
  <div style="width:1080px;height:1920px;display:flex;flex-direction:column;
    align-items:center;padding:96px 80px 80px;">
    <div style="color:${accent};font-weight:700;letter-spacing:6px;font-size:34px;">THUYẾT KHÁCH HÀNH</div>
    <div style="color:#fff;font-weight:700;font-size:72px;line-height:1.15;text-align:center;margin-top:28px;">${headline}</div>
    <div style="color:#C7C9D1;font-size:38px;text-align:center;margin-top:22px;max-width:820px;">${sub}</div>
    <div style="margin-top:64px;">${phone(img, 560)}</div>
    <div style="margin-top:auto;color:#fff;font-weight:700;font-size:44px;
      background:${accent};padding:22px 56px;border-radius:9999px;">game.fechtin.com</div>
  </div>`
  return page(1080, 1920, accent, inner)
}

// ---- Landscape 1200×630 ----------------------------------------------------
function landscape(img, accent, headline, sub) {
  const inner = `
  <div style="width:1200px;height:630px;display:flex;align-items:center;
    gap:60px;padding:0 80px;">
    <div style="flex:1;display:flex;flex-direction:column;">
      <div style="color:${accent};font-weight:700;letter-spacing:5px;font-size:26px;">THUYẾT KHÁCH HÀNH</div>
      <div style="color:#fff;font-weight:700;font-size:64px;line-height:1.12;margin-top:18px;">${headline}</div>
      <div style="color:#C7C9D1;font-size:30px;margin-top:20px;">${sub}</div>
      <div style="margin-top:30px;align-self:flex-start;color:#0B0F19;font-weight:700;font-size:30px;
        background:${accent};padding:16px 40px;border-radius:9999px;">Chơi ngay · game.fechtin.com</div>
    </div>
    <div style="flex-shrink:0;">${phone(img, 290)}</div>
  </div>`
  return page(1200, 630, accent, inner)
}

const jobs = [
  { f: 'mockup-portrait-home.html', html: portrait(b64(path.join(SHOTS, 'home-portrait.png')), '#8AB4F8',
      'Thuyết phục AI<br/>bằng lời nói', '15 chương · 180 màn · từ đời thường tới thần thoại') },
  { f: 'mockup-portrait-chat.html', html: portrait(b64(path.join(SHOTS, 'chat-portrait-crush.png')), '#F472B6',
      'Cưa đổ crush<br/>lạnh lùng?', 'Mỗi câu nói là một nước cờ. Bạn có đủ khéo không?') },
  { f: 'mockup-landscape-home.html', html: landscape(b64(path.join(SHOTS, 'home-portrait.png')), '#8AB4F8',
      'Trò chơi thuyết phục<br/>bằng lời nói', '15 chương, 180 màn — thắng bằng lý lẽ, không bằng may rủi.') },
  { f: 'mockup-landscape-chat.html', html: landscape(b64(path.join(SHOTS, 'chat-portrait-cyber-guard.png')), '#4285F4',
      'Đấu trí với AI', 'Từ bác bảo vệ tới AI cảnh vệ — thuyết phục bằng lời.') },
]
for (const j of jobs) { fs.writeFileSync(path.join(OUT, j.f), j.html); console.log('✓', j.f) }
console.log('HTML →', OUT)
