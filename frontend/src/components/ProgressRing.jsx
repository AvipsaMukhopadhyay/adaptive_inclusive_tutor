/** Circular percentage indicator. */
export default function ProgressRing({ percent, size = 96, stroke = 10, label }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - Math.min(100, Math.max(0, percent)) / 100)
  return (
    <div className="ring" style={{ width: size, height: size }} role="img" aria-label={`${percent}% ${label || 'complete'}`}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="ring-track" />
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="ring-fill"
                strokeDasharray={c} strokeDashoffset={offset} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <span className="ring-text">{percent}%</span>
    </div>
  )
}
