import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'

/** Animated 0–100 "how persuaded is the character" gauge. */
export default function PersuasionMeter({
  score,
  grow,
}: {
  score: number | null
  grow?: boolean
}) {
  const value = score ?? 0
  const color =
    value >= 80 ? '#22C55E' : value >= 45 ? '#F59E0B' : '#EF4444'

  return (
    <div className={`flex items-center gap-2.5 ${grow ? 'w-full' : ''}`}>
      <Heart
        className="h-4 w-4 shrink-0"
        style={{ color, fill: value >= 80 ? color : 'transparent' }}
      />
      <div
        className={`relative h-2 overflow-hidden rounded-full bg-white/10 ${
          grow ? 'flex-1' : 'w-28 sm:w-40'
        }`}
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: `linear-gradient(90deg, #EF4444, ${color})` }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
      <span className="w-10 text-right font-mono text-xs tabular-nums text-muted">
        {`${value}%`}
      </span>
    </div>
  )
}
