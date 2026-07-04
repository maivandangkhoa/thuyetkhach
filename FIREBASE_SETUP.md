# Firebase — đăng nhập & đồng bộ tiến trình game

Game "Đấu Trí" lưu tiến trình theo 2 chế độ:

- **Ẩn danh (mặc định):** XP/sao/level lưu trong `localStorage` của trình duyệt.
  Không cần làm gì, nhưng mất nếu xoá cache / đổi máy.
- **Đăng nhập Google (tuỳ chọn):** tiến trình đồng bộ lên Firestore theo tài
  khoản → không mất, tự đồng bộ mọi thiết bị. Khi đăng nhập lần đầu, tiến trình
  ẩn danh đang có sẽ được **gộp** vào tài khoản (lấy kết quả tốt hơn từng màn).

Nếu không cấu hình Firebase, nút đăng nhập tự ẩn và game chạy bình thường ở chế
độ ẩn danh (không lỗi).

## 1. Biến môi trường (client)

Đặt trong `.env` (xem `.env.example`). Đây là **web config công khai**, không phải
secret, được nhúng vào bundle lúc `vite build`:

```
PUBLIC_FIREBASE_API_KEY=...
PUBLIC_FIREBASE_AUTH_DOMAIN=...
PUBLIC_FIREBASE_PROJECT_ID=...
PUBLIC_FIREBASE_STORAGE_BUCKET=...
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
PUBLIC_FIREBASE_APP_ID=...
```

⚠️ **Build chạy trên VM** (`deploy.sh` chạy `npm run build` trên VM), nên các biến
này phải có mặt trong `.env` **trên VM**, không chỉ máy local. `deploy.sh` loại
`.env` khỏi rsync, vậy phải thêm thủ công vào `/home/ubuntu/ai-hub/.env` trên VM
rồi deploy lại.

## 2. Các bước trong Firebase Console

1. **Authentication → Sign-in method:** bật **Google**.
2. **Authentication → Settings → Authorized domains:** thêm các domain chạy app:
   `localhost`, `game.fechtin.com`, `ai.fechtin.com` (và `fechtin.com`).
3. **Firestore Database:** tạo database (production mode), rồi đặt security rules
   (mục 3).

⚠️ **Gotcha `authDomain`:** config đang đặt `authDomain=fechtin.com` (custom). Để
`signInWithPopup` hoạt động, `https://fechtin.com/__/auth/handler` phải được
Firebase Hosting phục vụ. Nếu popup báo lỗi domain, đổi `PUBLIC_FIREBASE_AUTH_DOMAIN`
sang giá trị mặc định `fechtinp.firebaseapp.com` (luôn chạy).

## 3. Firestore security rules

> Nguồn chuẩn: [`firestore.rules`](firestore.rules) ở gốc dự án. Sửa file đó rồi
> dán vào **Firebase Console → Firestore → Rules** (hoặc `firebase deploy
> --only firestore:rules` nếu dùng Firebase CLI). Đoạn dưới chỉ để tham khảo.

- `gameProgress/{uid}` (tiến trình chi tiết): mỗi người chỉ đọc/ghi của mình.
- `leaderboard/{uid}` (tóm tắt công khai cho bảng xếp hạng): mọi người đã đăng
  nhập đều **đọc** được; chỉ chủ sở hữu mới **ghi** doc của mình.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /gameProgress/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /leaderboard/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## 4. Mô hình dữ liệu

`gameProgress/{uid}`:
```jsonc
{
  "progress": {
    "version": 1,
    "xp": 550,                       // = Σ xp các màn (không đếm trùng khi merge)
    "levels": {
      "bao-ve": { "stars": 3, "bestScore": 95, "bestTurns": 3, "won": true, "xp": 150 }
    }
  },
  "updatedAt": <serverTimestamp>
}
```

`leaderboard/{uid}` (tóm tắt công khai — denormalize từ progress để xếp hạng):
```jsonc
{
  "name": "Tên hiển thị",   // displayName Google (hoặc "Người chơi ẩn danh")
  "photo": "https://…",      // photoURL hoặc null
  "xp": 550,                 // = progress.xp (khoá sắp xếp, giảm dần)
  "stars": 9,                // tổng sao
  "level": 3,
  "rank": "Vàng",
  "updatedAt": <serverTimestamp>
}
```

Bảng xếp hạng xếp theo `xp` giảm dần (lấy top 50) — Firestore tự tạo single-field
index nên không cần composite index. Doc này được ghi cùng lúc với `gameProgress`
mỗi khi đồng bộ/thắng.
