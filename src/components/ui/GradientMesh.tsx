/**
 * Animated gradient mesh background with soft glow blobs.
 * Used behind the hero and final CTA for a premium, futuristic feel.
 */
export default function GradientMesh({ dense = false }: { dense?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* base grid */}
      <div className="absolute inset-0 grid-bg mask-fade-b opacity-60" />

      {/* drifting color blobs */}
      <div className="absolute left-1/2 top-[-10%] h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-brand/30 blur-[120px] animate-mesh-drift" />
      <div
        className="absolute left-[12%] top-[18%] h-[30rem] w-[30rem] rounded-full bg-brand-violet/25 blur-[120px] animate-mesh-drift"
        style={{ animationDelay: '-6s' }}
      />
      <div
        className="absolute right-[8%] top-[8%] h-[34rem] w-[34rem] rounded-full bg-brand-light/20 blur-[120px] animate-mesh-drift"
        style={{ animationDelay: '-12s' }}
      />
      {dense && (
        <div
          className="absolute bottom-[-15%] left-[30%] h-[36rem] w-[36rem] rounded-full bg-brand/20 blur-[130px] animate-mesh-drift"
          style={{ animationDelay: '-3s' }}
        />
      )}

      {/* vignette to keep edges calm */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#0B0F19_95%)]" />
    </div>
  )
}
