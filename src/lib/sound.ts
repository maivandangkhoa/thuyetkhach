/**
 * Hiệu ứng âm thanh nhẹ tạo bằng WebAudio (không cần file asset, không tải mạng).
 * Dùng cho khoảnh khắc mở khoá thành tựu — một hợp âm ba nốt đi lên, sáng & ngắn.
 * Mọi lỗi (trình duyệt chặn / chưa có tương tác) đều nuốt êm, không phá game.
 */
let ctx: AudioContext | null = null

function audioCtx(): AudioContext | null {
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!AC) return null
    if (!ctx) ctx = new AC()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

/** Chuông mở khoá: bộ ba nốt E5–G#5–B5 (hợp âm Mi trưởng) ngân nhanh. */
export function playUnlockSound() {
  const ac = audioCtx()
  if (!ac) return
  const now = ac.currentTime
  const notes = [659.25, 830.61, 987.77] // E5, G#5, B5
  notes.forEach((freq, i) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    const t = now + i * 0.1
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.16, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45)
    osc.connect(gain).connect(ac.destination)
    osc.start(t)
    osc.stop(t + 0.5)
  })
}
