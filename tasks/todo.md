# Kế hoạch mở rộng: "Đấu Trí" → Campaign có Chương + Tiến trình

> Giai đoạn 1 của lộ trình mở rộng. Hướng đã chốt với user:
> **Khung chương + tiến trình**, lưu **localStorage (ẩn danh)**.
> Tuân thủ thứ tự roadmap (`Gameplay → AI Engine → Retention → Content`):
> giai đoạn này dựng **bộ khung** (structure + progression), KHÔNG ôm 180 màn.

## 0. Hiện trạng (điểm xuất phát)
- 8 scenario hardcode phẳng trong `server/game.js` (`SCENARIOS`), không có chương.
- Type `Scenario` (`src/lib/game.ts`) có `tone` 4 giá trị; không có chapter/order/boss.
- `GamePage` chỉ có 3 trạng thái: picker → game → win. Không có tiến trình/lưu.
- Stats play/win là global ẩn danh ở server (`stats.js`) — GIỮ NGUYÊN.
- Win detect kép (winPhrase + Judge AI) đang chạy tốt — GIỮ NGUYÊN.

## 1. Mục tiêu giai đoạn 1 (Definition of Done)
- [ ] Game gom theo **15 chương** (metadata đủ 15, có màu/emoji/theme/requiredStars).
- [ ] Mỗi scenario có `chapter`, `order`, `isBoss`.
- [ ] **Tiến trình localStorage**: XP, level người chơi, **sao (0–3)/màn**, mở khoá chương theo tổng sao.
- [ ] UI: Bản đồ chương (khoá/mở + tiến độ) → lưới màn trong chương (sao + boss) → game.
- [ ] Header người chơi: Level + Rank + tổng sao + thanh XP.
- [ ] WinScreen hiện **số sao đạt** + **XP nhận** + toast lên cấp.
- [ ] Chương 1 (Đời Thường) được viết đầy đủ 12 màn làm chương mẫu chạy được.
- [ ] 8 scenario cũ được di trú vào đúng chương; các chương chưa viết hiện "Sắp ra mắt" (khoá mềm).

## 2. Thiết kế dữ liệu (server)
**Tách content khỏi logic** (game.js sẽ vượt 500 LOC nếu nhồi thêm):
- `server/scenarios/chapters.js` — metadata 15 chương:
  `{ id:1..15, slug, title, emoji, theme, accent, requiredStars, lesson }`
  (Ch.1 requiredStars:0; Ch.2:18; Ch.3:42; ... theo Progression doc.)
- `server/scenarios/chapter01.js` … (mỗi file 1 chương; giai đoạn này: ch01 đủ 12,
  các chương có scenario cũ thì chứa số màn hiện có).
- `server/scenarios/index.js` — gộp tất cả → export `SCENARIOS` + `CHAPTERS`.
- `server/game.js` — BỎ mảng `SCENARIOS`, `import` từ `scenarios/index.js`; giữ
  toàn bộ logic (`buildSystem`, `judge*`, `detectWin`, fallback chain…).

**Field mới trên mỗi scenario:** `chapter:number`, `order:1..12`, `isBoss:boolean`,
`turnTarget:number` (mốc tính 2 sao; suy ra từ difficulty nếu thiếu).
Giữ nguyên các field cũ. `tone` giữ lại (tương thích) nhưng màu sẽ lấy theo chương.

**Di trú 8 màn cũ:** bao-ve→Ch1 · me-vo→Ch2 · crush,tong-tai→Ch3 · sep→Ch4 ·
khach-outsource→Ch5 · cyber-guard(ARK-7),alien→Ch8.

## 3. API (server/index.js + game.js)
- `publicScenario()` thêm `chapter, order, isBoss`.
- `GET /api/game/scenarios` → đổi payload thành `{ chapters: CHAPTERS, scenarios: [...] }`
  (kèm play/win count như cũ). **Server vẫn stateless về tiến trình** — khoá/sao
  tính ở client từ localStorage. `POST /api/game/chat` GIỮ NGUYÊN (meta đã có win+score).

## 4. Tiến trình (client, localStorage) — `src/lib/progress.ts`
- Key `dauTri.progress.v1`; shape `{ version, xp, levels: { [id]: {stars, bestScore, bestTurns, won} } }`.
- Quy tắc sao: thắng → ≥1★; thắng & `turns ≤ turnTarget` → 2★; thắng & `score ≥ 90`
  (perfect) → 3★. Lấy `max` với kết quả cũ (không tụt sao).
- XP: thắng +100, perfect +50, boss +300 (theo Progression doc).
- `playerLevel(xp)` theo đường cong; `rank(level)` (Đồng/Bạc/Vàng/Bạch Kim/…).
- `totalStars()`, `chapterUnlocked(ch, totalStars)`.
- `recordResult(scenario,{won,turns,score})` → cập nhật + lưu; trả `{starsGained, xpGained, leveledUp}`.
- Hook nhẹ `useProgress()` để component đọc/ghi + re-render.

## 5. UI (src/components/game/)
- `Stars.tsx` — hiển thị 0–3 sao nhỏ (dùng lại nhiều nơi).
- `PlayerHeader.tsx` — Level + Rank + tổng sao + thanh XP (đặt đầu các màn chọn).
- `ChapterMap.tsx` — thay vai trò "trang đầu": lưới 15 thẻ chương; mỗi thẻ hiện
  emoji/màu/tên/lesson + tiến độ `x/12` sao; khoá nếu chưa đủ requiredStars
  (hiện "Cần ⭐N"); chương chưa có nội dung → nhãn "Sắp ra mắt".
- `LevelGrid.tsx` — chọn chương → lưới 12 màn; mỗi ô: emoji, tên, sao đạt, badge BOSS;
  nút quay lại bản đồ. (Trong chương đã mở: các màn chơi tự do, không khoá tuần tự —
  đơn giản hoá giai đoạn 1.)
- `ScenarioPicker.tsx` — repurpose/giữ làm fallback hoặc gỡ; logic chọn chuyển vào ChapterMap/LevelGrid.
- `WinScreen.tsx` — thêm dải sao đạt, "+XP", và toast "Lên cấp / Mở khoá Chương X" nếu có.

## 6. Điều phối (src/pages/GamePage.tsx + lib)
- `src/lib/game.ts`: thêm `Chapter` interface; mở rộng `Scenario` (`chapter,order,isBoss`);
  helper màu theo chương (thay `TONE_ACCENT` cứng).
- `src/lib/api.ts`: `fetchScenarios()` trả `{chapters, scenarios}`.
- `GamePage`: state máy `view: 'chapters' | 'levels' | 'game'` + `selectedChapter`;
  load progress; khi `onWin` → `recordResult()` rồi truyền sao/XP xuống WinScreen.
  Deep-link `?s=` vẫn nhảy thẳng vào màn (giữ tính năng cũ).

## 7. Thứ tự thực thi (đề xuất) + kiểm chứng
1. Backend data model: chapters.js + tách scenarios + di trú 8 + viết Chương 1.
   → test `GET /api/game/scenarios` trả đúng chapters + scenarios có field mới.
2. `progress.ts` + unit thử nhanh logic sao/level (chạy node hoặc test tay).
3. UI: Stars, PlayerHeader, ChapterMap, LevelGrid.
4. Nối GamePage + api.ts + game.ts; WinScreen sao/XP.
5. `npm run build` (tsc) sạch lỗi; chạy `npm run dev`, chơi thử 1 màn → kiểm tra
   sao/XP/mở khoá lưu qua reload.

## 8. Ràng buộc / lưu ý
- Mỗi file ≤ 500 LOC (lý do tách scenarios theo chương).
- KHÔNG đụng logic LLM/judge/fallback đang chạy ổn.
- localStorage versioned (`v1`) để sau nâng cấp/migrate; sai schema → reset an toàn.
- Chưa làm: accounts/leaderboard server, skill tree, dynamic events, generator,
  daily challenge — để các giai đoạn sau (đã ghi nhận trong PDF roadmap).

## ✅ Review — Giai đoạn 1 ĐÃ HOÀN THÀNH (2026-06-20)
- Backend: `server/scenarios/` (chapters.js + chapter01/02/03/04/05/08 + index.js); game.js chỉ còn logic. Endpoint trả `{chapters, scenarios}`. **19 màn, 15 chương, Chương 1 đủ 12 (1 boss).**
- `src/lib/progress.ts` (localStorage `dauTri.progress.v1`): sao/XP/level/rank/unlock. **Đã unit-test:** thua=0★, thắng nhanh=2★, perfect=3★, boss +300XP, không farm lại XP, khoá chương theo tổng sao — tất cả đúng.
- UI: Stars, PlayerHeader, ChapterMap, LevelGrid; GamePage state machine (chapters→levels→game); WinScreen hiện sao/XP/lên cấp/mở khoá. ScenarioPicker.tsx đã xoá.
- `npm run build` sạch (tsc + vite OK). API verified bằng curl.
- Cách thử: `npm run dev` → /game → chơi Chương 1, kiểm tra sao/XP lưu qua reload.

### Giai đoạn sau (chưa làm)
- Viết nốt các chương (gồm Ch.11 Đông Phương thiếu PDF), Memory engine, Dynamic Events, Boss đa-phase, Generator/Endless, Daily Challenge, accounts+leaderboard server.

---

# Bảng xếp hạng (Leaderboard) — 2026-06-21

Mục tiêu: người đăng nhập Google lên bảng xếp hạng theo XP; ai đã đăng nhập đều
xem được top người chơi. Tận dụng auth + `gameProgress` đã có.

## Thiết kế
- Collection mới `leaderboard/{uid}`: bản tóm tắt CÔNG KHAI
  `{ name, photo, xp, stars, level, rank, updatedAt }`.
- Tách khỏi `gameProgress` (chỉ chủ đọc) → không lộ chi tiết tiến trình; rules
  `gameProgress` giữ nguyên. Đọc: mọi user đã đăng nhập; ghi: chỉ chủ `uid`.
- Xếp theo `xp` giảm dần, top 50.

## Việc
- [x] `src/lib/leaderboard.ts` — type + `saveLeaderboard()` + `loadLeaderboard()`
- [x] `src/lib/progress-sync.ts` — saver ghi kèm leaderboard (đổi `queue(user, p)`)
- [x] `src/pages/GamePage.tsx` — ghi leaderboard khi sync & khi thắng
- [x] `src/components/game/Leaderboard.tsx` — modal bảng xếp hạng
- [x] `src/components/game/ChapterMap.tsx` — nút mở bảng xếp hạng
- [x] `FIREBASE_SETUP.md` — cập nhật rules + mô hình dữ liệu
- [x] Build kiểm tra (`npm run build`) — tsc + vite sạch
- [ ] Deploy: thêm rule `leaderboard` trong Firebase Console (xem FIREBASE_SETUP.md §3)

---

# AI Engine — Lie Detection / Memory (2026-06-21) ✅

Phạm vi: **chỉ trong 1 màn** (per-session), reset khi rời màn. Cross-session là Phase 6.

Quyết định kiến trúc: **prompt-only**, KHÔNG state-machine trust/respect/annoyance như doc
(over-engineer cho game LLM-driven). NPC reply đã nhận full history → chỉ là bài toán prompt,
không thêm call/parse/token.

- [x] Thêm luật "ghi nhớ + bắt mâu thuẫn" vào `buildSystem()` (server/game.js ~L38)
- [x] `tasks/lie-probe.mjs` — probe kịch bản mâu thuẫn qua đúng path production
- [x] Đo before/after: Dễ(Bảo Vệ) trước trượt → sau bắt; Khó(Mẹ Vợ) trước mơ hồ → sau vạch thẳng
- [x] False-positive check: người chơi thành thật KHÔNG bị vu oan (vẫn thắng, judge 100)
- [x] `node --check server/game.js` OK; judge tự phạt bất nhất (score crash 0–20) nên % không cần đổi

Follow-up gợi ý: Dynamic Events (cười/giận/đổi chủ đề) có thể cùng cách prompt-only.
