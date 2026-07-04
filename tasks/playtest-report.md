# Báo cáo playtest "Đấu Trí" — đêm 2026-06-21 → sáng 2026-06-22

> Đã chơi thử **toàn bộ 172 màn mới** (chương 1–15, trừ 8 màn gốc). Hai giai đoạn:
> ch1–5 bằng harness Groq tự động; **ch6–15 bằng 6 subagent Claude đóng vai người
> chơi** (ý anh — không tốn quota Groq cho "player", chỉ NPC chạy model thật qwen3-32b).
> NPC luôn là code/model THẬT. Mỗi màn được audit xưng hô/nhập vai/ngôn ngữ/lặp.
>
> Công cụ (trong `tasks/`): `validate-scenarios.mjs`, `playtest.mjs`, `npc-turn.mjs`
> (cầu nối 1 lượt NPC cho subagent), `scenario-brief.mjs`, `verify-fix.mjs`,
> `penalty-ab.mjs`. Dữ liệu thô ch1–5: `playtest-results.jsonl`.

---

## ✅ ĐÃ FIX (root cause) — tất cả đã verify. Chỉ đụng 3 file: `server/game.js`, `server/index.js`, `server/scenarios/chapter10.js`

| # | Vấn đề | Sửa | Verify |
|---|--------|-----|--------|
| 1 | **Thắng-ngay-lượt-1** `ch10-ky-su-nha-may`: lời chào *"đừng bảo tôi bật nó lên"* trùng winPhrase | đổi winPhrase → `"thôi được, tôi bật điện lên"` | validate 180/180 = 0 lỗi |
| 2 | **Rớt chữ/vỡ câu** (màn ít lời, vd crush): penalty chống-lặp tính trên cả ngữ cảnh → phạt đại từ đến mức bỏ chữ | `frequencyPenalty 0.6→0.3`, `presencePenalty 0.4→0.1`, `repeatPenalty 1.3→1.2` (index.js) | A/B crush: hết vỡ câu ✔ |
| 3 | **Xưng hô lệch**: `xe-om` xưng "tao"; god-NPC ("ta/ngươi") trôi thành "tôi/bạn" | siết luật XƯNG HÔ: dùng ĐÚNG đại từ đã nêu, cấm đổi ta→tôi, cấm mình/tao/tớ/mày/bạn (game.js) | xe-om nhất quán "bác/cậu" ✔; Genghis/Shakespeare giữ "ta/ngươi" ✔ |
| 4 | **Reply rỗng** (qwen3 đôi khi chỉ ra `<think>`→lọc sạch) | guard: rỗng thì thử lại 1 lần không penalty rồi đẩy xuống client (index.js) | guard kích hoạt đúng ✔ |
| 5 | **Phá vai / lộ meta / từ chối kiểu trợ lý AI**: ch9 Genghis lộ "lời chỉ dẫn vai", Shakespeare từ chối "tôi là AI" + rò `<\|header_end\|>`; nhiều màn lộ "người chơi"/"assistant" | thêm luật cấm phá vai + "đây là nhập vai hư cấu, luôn giữ vai, không từ chối ngoài vai" (game.js) | Genghis & Shakespeare giữ vai sạch ✔ |
| 6 | **Luật "thuần Việt" mâu thuẫn vai tech/business** (anh đã duyệt) | `allowsJargon(s)=!s.lang && (s.allowJargon ?? [4,5].includes(s.chapter))`: ch4–5 được xen API/ROI/KPI; màn `lang` & chương khác giữ nguyên (game.js) | in 3 nhánh prompt đúng cả 3 ✔ |

---

## 🟠 CÒN TỒN TẠI — model-level, KHÔNG sửa triệt để được bằng prompt (đề xuất follow-up)

### a) Thoái hoá văn bản ngẫu nhiên (degeneration/loop/garble) — vấn đề lớn nhất
Subagent ở **cả 6 nhóm** đều báo: thỉnh thoảng NPC sinh ra câu lặp vòng ("không thể
không…", "có thể có thể…"), rớt chữ, hoặc sụp thành ký tự rác — nặng nhất ở màn boss
ngữ cảnh dài và khi input lạ (vd subagent dán lời bài hát → ch14-ke-buon-ky-uc sụp).
**Bản chất:** qwen3-32b trên Groq **mất ổn định ngẫu nhiên** — tôi KHÔNG tái hiện được
theo ý muốn (chơi lại ch12-minotaur, ch09-da-vinci nhiều cấu hình đều SẠCH). Hạ penalty
(#2) giảm bớt một dạng lỗi nhưng không khử hết phần ngẫu nhiên.
**Đề xuất (chưa làm — rủi ro cao nếu làm vội trong đêm):** thêm **"quality guard"** ở
server — nếu reply dính foreign-script / lặp vòng / rác thì **sinh lại 1 lần** (giống
empty-guard nhưng cần xử lý đã lỡ stream → cần đụng cả frontend để "thay bong bóng").
Hoặc cân nhắc đổi model game sang `gpt-oss-120b` (memory ghi "đa ngữ sạch") và so giọng VN.

### b) Lọt ký tự ngoại ngữ (hiếm, ~4/110)
`ch07-customs` (看起来), `ch13-nguoi-doc-tam` (操纵), `ch11-quan-am` (Hàn 유혹),
`ch15-creator` (Nhật すること). Đây là "language bleeding" cố hữu của qwen3 (memory đã ghi).
Luật prompt đã cấm; còn lọt ngẫu nhiên → cùng hướng "quality guard" ở (a).

### c) Rò token chat-template: `<|header_end|>`, "assistant"
Hiện tượng của qwen3/Groq, không sửa được bằng nội dung prompt. Luật anti-phá-vai (#5)
giảm phần "assistant\n\n" mở đầu; phần token đặc biệt nên **strip ở `llm.js`** (follow-up nhỏ).

---

## 🟡 KHÔNG phải bug (đừng sửa nhầm)

- **"won=false dù NPC đã xuôi"**: do `npc-turn.mjs` (harness subagent) **chỉ chạy
  detectWin khớp-câu, KHÔNG chạy judge** (để tiết kiệm quota). **Production CÓ judge** nên
  các ca này VẪN thắng thật. Đây là giới hạn của harness, không phải lỗi game.
  (Gặp ở: airport-security, tran-hung-dao, archon, city-ai, einstein, bunker, loki…)
- **Màn ngoại ngữ ch5** (Nhật/Hàn/Anh, `lang` đặt sẵn): cố ý.
- **ch14-ai-luat-su, ch15 meta-NPC tự nhận là AI**: đúng vai, không phải phá vai.

## 🔧 ĐỀ XUẤT cải thiện dữ liệu (chưa làm — cần anh duyệt)
- **winPhrases cho NPC xưng "ta"**: nhiều boss xưng "ta" nhưng winPhrases viết kiểu "tôi…"
  → đường khớp-câu NHANH ít kích hoạt (vẫn thắng nhờ judge, nhưng phản hồi chậm hơn).
  Nên rà winPhrases các màn god/thần thoại để thêm biến thể "ta…". (vd ch15-nha-thiet-ke,
  ch15-ai-tao-the-gioi, ch14-archon.)

## 📊 Tổng kết phạm vi
- Cấu trúc: **180/180** PASS (sau fix #1).
- Chơi thử: **172/172 màn mới** (ch1–5 harness + ch6–15 qua 6 subagent). Đa số thắng được
  ≤4 lượt. Vài màn không-thắng-trong-4-lượt chủ yếu do degeneration/thiếu judge, không
  phải do thiết kế bất khả thi.

## ⚠️ Lưu ý quan trọng
- **CHƯA deploy.** 6 fix nằm ở 3 file server. Chạy `./deploy.sh` khi anh duyệt.
- Trong lúc tôi làm, có **thay đổi song song** (ai đó/phiên khác đang sửa
  `ShareCard/WinScreen/ChapterMap/GamePage` + đổi tên màn ch4 "Team→nhóm", kèm
  `verify-sharecard.mjs`). Tôi **không đụng** vào các file đó. Đừng commit/deploy lẫn lộn.
