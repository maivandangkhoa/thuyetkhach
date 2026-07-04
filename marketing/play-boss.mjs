/**
 * Chơi thật ~3 câu với màn BOSS "Con Nợ Truyền Kỳ" (doi-no) trên game.fechtin.com
 * bằng Chrome thật (puppeteer-core), rồi chụp màn hình cuộc hội thoại.
 *   node marketing/play-boss.mjs
 */
import puppeteer from 'puppeteer-core'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const URL = 'https://game.fechtin.com/?s=doi-no'

// 3 nước đi thuyết phục theo đúng 3 lớp phòng thủ của boss.
const MOVES = [
  'Anh cũng vui được gặp em chứ. Mà anh hỏi thật lòng — khoản 20 triệu hồi sáu tháng trước, anh em mình tính sao cho gọn em nhỉ? Anh không làm khó gì đâu, chỉ muốn rõ ràng giữa anh em.',
  'Anh hiểu dạo này ai cũng có cái khó riêng. Nhưng anh tin em không đến mức cạn cả 20 triệu đâu — chỉ là mình chưa ưu tiên nó thôi đúng không? Hồi đó anh tin tưởng đưa em mượn chẳng cần giấy tờ gì, vì anh thật sự quý em.',
  'Anh chỉ hỏi em một câu thôi: nếu có người mượn em 20 triệu rồi sáu tháng chưa trả, em sẽ nghĩ gì về họ? Anh biết em là người tử tế, biết giữ lời. Anh không muốn mấy đồng tiền này làm sứt mẻ tình anh em mình.',
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--hide-scrollbars'],
})
const page = await browser.newPage()
await page.setViewport({ width: 540, height: 960, deviceScaleFactor: 2 })
await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 })

// chờ ô nhập (textarea) xuất hiện = đã vào màn chơi
await page.waitForSelector('textarea', { timeout: 30000 })
await sleep(1500) // greeting render xong

for (let i = 0; i < MOVES.length; i++) {
  await page.focus('textarea')
  await page.type('textarea', MOVES[i], { delay: 6 })
  await page.keyboard.press('Enter')
  // busy=true → textarea disabled (đang trả lời)
  await page.waitForFunction(() => document.querySelector('textarea')?.disabled === true, { timeout: 10000 }).catch(() => {})
  // busy=false → trả lời xong
  await page.waitForFunction(() => document.querySelector('textarea')?.disabled === false, { timeout: 60000 })
  await sleep(1200)
  console.log(`✓ lượt ${i + 1}/${MOVES.length}`)
}

const dir = path.join(__dirname, 'screenshots')

// Nếu THẮNG → chụp riêng card thắng, rồi ẩn overlay để hội thoại hiện sạch.
const winOverlay = '.fixed.inset-0.z-50'
if (await page.$(winOverlay)) {
  await sleep(1500) // chờ animation thắng xong
  const card = await page.$('.card-sheen')
  if (card) {
    await card.screenshot({ path: path.join(dir, 'boss-doi-no-win.png') })
    console.log('Đã chụp màn THẮNG → boss-doi-no-win.png')
  }
  await page.evaluate((s) => {
    document.querySelector(s)?.style.setProperty('display', 'none', 'important')
  }, winOverlay)
  await sleep(300)
}

// 1) ảnh viewport (màn hình điện thoại, phần cuối hội thoại)
await page.evaluate(() => {
  const sc = document.querySelector('.overflow-y-auto')
  if (sc) sc.scrollTop = sc.scrollHeight
})
await sleep(600)
await page.screenshot({ path: path.join(dir, 'boss-doi-no-portrait.png') })
console.log('Đã chụp viewport → boss-doi-no-portrait.png')

// 2) TOÀN BỘ hội thoại — nới khung cuộn ra hết chiều cao rồi chụp full page
await page.evaluate(() => {
  const root = document.querySelector('.h-screen')
  if (root) root.style.height = 'auto'
  const sc = document.querySelector('.overflow-y-auto')
  if (sc) {
    sc.style.overflow = 'visible'
    sc.style.flex = 'none'
  }
})
await sleep(500)
await page.screenshot({ path: path.join(dir, 'boss-doi-no-full.png'), fullPage: true })
console.log('Đã chụp toàn bộ hội thoại → boss-doi-no-full.png')

await browser.close()
