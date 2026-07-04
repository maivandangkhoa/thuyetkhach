/**
 * Auth context — Google đăng nhập qua Firebase. Khi Firebase chưa cấu hình,
 * provider vẫn render (user = null, enabled = false) để game chạy ở chế độ
 * localStorage không lỗi.
 */
import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth'
import { auth, googleProvider, firebaseEnabled } from './firebase'

interface AuthState {
  enabled: boolean
  user: User | null
  loading: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  enabled: false,
  user: null,
  loading: false,
  signIn: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(firebaseEnabled)

  useEffect(() => {
    if (!firebaseEnabled || !auth) return
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  const signIn = async () => {
    if (!auth) return
    await signInWithPopup(auth, googleProvider)
  }

  const signOut = async () => {
    if (!auth) return
    await fbSignOut(auth)
  }

  return (
    <AuthContext.Provider
      value={{ enabled: firebaseEnabled, user, loading, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
