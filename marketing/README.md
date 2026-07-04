# Ảnh quảng cáo — Thuyết Khách Hành

Tổng 25 ảnh, 3 nhóm × 2 tỉ lệ (ngang 1200×630 cho FB/Zalo/banner; dọc 1080×1920 cho Story/Reels/TikTok).

## 1. `screenshots/` — UI game thật (chụp headless Chrome)
- `home-portrait.png`, `home-landscape.png` — màn chính (danh sách chương/màn).
- `chat-portrait-*.png` (crush, me-vo, cyber-guard, ch06…) — màn chat, mỗi màn 1 màu chương.
- `chat-landscape-crush.png` — màn chat bản ngang.
- (Màn thắng tạm bỏ — animation không chụp tĩnh được headless; cần quay màn hình thật.)

## 2. `cards/` — promo card thiết kế (satori, font Be Vietnam Pro)
- `card-landscape-<id>.png` (1200×630) · `card-portrait-<id>.png` (1080×1920).
- 7 màn đa dạng màu/độ khó. Có brand + tên màn + mục tiêu + độ khó + CTA.

## 3. `mockups/` — screenshot lồng khung điện thoại
- `mockup-portrait-{home,chat}.png`, `mockup-landscape-{home,chat}.png`.
- Hợp nhất nhất cho ad: có khung máy + headline + nút CTA.

## Tạo lại / chỉnh
- Cards: `node marketing/gen-cards.mjs` (sửa mảng `PICKS` để đổi màn).
- Mockups: `node marketing/gen-mockups.mjs` rồi chụp các file `.html` bằng Chrome headless.
- Screenshots: Chrome headless `--screenshot` vào `game.fechtin.com/?s=<id>` (chat) hoặc `/` (home);
  dọc dùng `--window-size=540,960 --force-device-scale-factor=2`.
