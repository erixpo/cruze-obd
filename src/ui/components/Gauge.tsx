import { fmtNum } from '../../lib/format'

type GaugeProps = {
  label: string
  value?: number
  unit: string
  min?: number
  max: number
  digits?: number
  warnFrom?: number
}

export function Gauge({ label, value, unit, min = 0, max, digits = 0, warnFrom }: GaugeProps) {
  const ratio = value === undefined ? 0 : Math.min(1, Math.max(0, (value - min) / (max - min)))
  const angle = -210 + ratio * 240
  const hot = warnFrom !== undefined && value !== undefined && value >= warnFrom
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border bg-card px-2 py-3">
      <svg viewBox="0 0 120 92" className="h-24 w-full">
        <path
          d="M16 78 A 48 48 0 1 1 104 78"
          fill="none"
          stroke="currentColor"
          className="text-muted"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M16 78 A 48 48 0 1 1 104 78"
          fill="none"
          stroke="currentColor"
          className={hot ? 'text-destructive' : 'text-primary'}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${ratio * 201} 201`}
        />
        <line
          x1="60"
          y1="70"
          x2="60"
          y2="28"
          stroke="currentColor"
          className={hot ? 'text-destructive' : 'text-accent'}
          strokeWidth="2.5"
          strokeLinecap="round"
          transform={`rotate(${angle} 60 70)`}
        />
        <text x="60" y="64" textAnchor="middle" className="fill-foreground" fontSize="16" fontWeight="600">
          {fmtNum(value, digits)}
        </text>
        <text x="60" y="78" textAnchor="middle" className="fill-muted-foreground" fontSize="9">
          {unit}
        </text>
      </svg>
      <p className="text-center text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
