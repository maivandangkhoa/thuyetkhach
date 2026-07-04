/**
 * Firebase init — chỉ dùng cho ĐĂNG NHẬP + đồng bộ tiến trình đa thiết bị.
 * Web config (apiKey...) là thông tin CÔNG KHAI, an toàn để nhúng vào client.
 * Nếu thiếu config (build không có env) → `firebaseEnabled = false`, game vẫn
 * chạy bình thường ở chế độ localStorage, chỉ ẩn nút đăng nhập.
 */
import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

const env = import.meta.env
const config = {
  apiKey: env.PUBLIC_FIREBASE_API_KEY,
  authDomain: env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.PUBLIC_FIREBASE_APP_ID,
}

export const firebaseEnabled = Boolean(config.apiKey && config.projectId && config.appId)

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null

if (firebaseEnabled) {
  app = initializeApp(config)
  auth = getAuth(app)
  db = getFirestore(app)
}

export { auth, db }
export const googleProvider = new GoogleAuthProvider()
