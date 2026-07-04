import { useState } from 'react'
import { LogIn, LogOut, Loader2 } from 'lucide-react'
import { useAuth } from '../../lib/auth'

/**
 * Góc tài khoản: chưa đăng nhập → nút "Đăng nhập để lưu"; đã đăng nhập → avatar
 * + tên + nút đăng xuất. Ẩn hoàn toàn nếu Firebase chưa cấu hình.
 */
export default function AccountChip({ syncing = false }: { syncing?: boolean }) {
  const { enabled, user, loading, signIn, signOut } = useAuth()
  const [busy, setBusy] = useState(false)

  if (!enabled) return null

  const click = async (fn: () => Promise<void>) => {
    setBusy(true)
    try {
      await fn()
    } catch {
      /* user đóng popup / lỗi mạng — bỏ qua */
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <span className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-xs text-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tải…
      </span>
    )
  }

  if (!user) {
    return (
      <button
        onClick={() => click(signIn)}
        disabled={busy}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-xs font-medium text-white transition-colors hover:border-white/25 hover:bg-white/[0.08] disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <LogIn className="h-3.5 w-3.5" />
        )}
        Đăng nhập
      </button>
    )
  }

  return (
    <span className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 text-xs">
      {user.photoURL ? (
        <img src={user.photoURL} alt="" className="h-6 w-6 rounded-full" />
      ) : (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-gradient text-[0.7rem] font-bold text-ink-900">
          {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
        </span>
      )}
      <span className="max-w-[10rem] truncate text-muted">
        {user.displayName || user.email}
      </span>
      <button
        onClick={() => click(signOut)}
        disabled={busy}
        title="Đăng xuất"
        className="ml-1 text-muted transition-colors hover:text-white disabled:opacity-60"
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </span>
  )
}
