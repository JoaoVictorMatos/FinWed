export default function ProgressBar({ value, max, showLabel = true, className = '' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const color = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-yellow-400' : 'bg-primary-500'

  return (
    <div className={className}>
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && (
        <span className={`text-xs mt-0.5 block ${pct >= 100 ? 'text-red-600' : pct >= 80 ? 'text-yellow-600' : 'text-gray-500'}`}>
          {pct.toFixed(0)}%
        </span>
      )}
    </div>
  )
}
