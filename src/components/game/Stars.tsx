import { Star } from 'lucide-react'

/** Hiển thị 0–3 sao đã đạt của một màn. */
export default function Stars({
  value,
  size = 14,
  className = '',
}: {
  value: number
  size?: number
  className?: string
}) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {[0, 1, 2].map((i) => {
        const earned = i < value
        return (
          <Star
            key={i}
            style={{ width: size, height: size }}
            className={earned ? 'fill-amber-400 text-amber-400' : 'text-white/20'}
          />
        )
      })}
    </span>
  )
}
