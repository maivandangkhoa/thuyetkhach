# Thuyết Khách Hành — Đấu Trí

Game thuyết phục AI tại **https://game.fechtin.com** — người chơi trò chuyện để
thuyết phục một nhân vật AI cứng đầu nói ra "câu chịu thua" bí mật. 15 chương ×
12 màn, tiến trình sao/XP, đăng nhập Google (Firebase) tùy chọn, PWA cài được.

Tách ra từ repo `openchat` (FechTin AI hub) — từ 2026-07 đây là dự án độc lập.

## Stack

- **Frontend:** Vite + React + TypeScript + Tailwind (SPA, `src/`)
- **Backend:** Express (`server/`) — `/api/game/scenarios`, `/api/game/chat`
  (SSE), `/og/:id.png` (ảnh OG từng màn qua satori + resvg)
- **LLM:** Groq (chuỗi fallback trong `server/game.js`), judge chấm điểm thắng/thua
- Bí mật màn chơi (winPhrases, persona, context) chỉ nằm server-side

## Chạy local

```bash
cp .env.example .env   # điền GROQ_API_KEY (+ PUBLIC_FIREBASE_* nếu cần login)
npm install
npm run dev            # vite :5174 + api :8788
```

Lưu ý: preview OG (`/og/*.png`, rewrite `?s=`) chỉ chạy qua server node
(`npm run dev:server` + bản build), không qua vite dev server.

## Deploy

```bash
VM_HOST=<ip> ./deploy.sh          # rsync + npm install + build trên VM + restart systemd `game`
VM_HOST=<ip> ./deploy.sh --fast   # bỏ qua npm install
VM_HOST=<ip> ./deploy.sh --logs   # tail logs
```

VM: systemd service `game` (port 8788, localhost) sau nginx vhost
`game.fechtin.com` + Cloudflare Full (strict). `.env` trên VM phải có đủ
`PUBLIC_FIREBASE_*` **trước khi build** (vite bake vào bundle) và
`STATS_FILE=/home/ubuntu/game-data/game-stats.json`.

## Tooling

- `tasks/validate-scenarios.mjs` — kiểm tra cấu trúc 180 màn
- `tasks/playtest.mjs` — auto-playtest bằng LLM (cần GROQ_API_KEY)
- `marketing/` — sinh ảnh quảng cáo (cards/mockups/screenshots)
- `gameplay/` — tài liệu thiết kế các chương
