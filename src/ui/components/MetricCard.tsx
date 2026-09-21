import { fmtNum } from '../../lib/format'

type MetricCardProps = {
  label: string
  value?: number
  unit: string
  digits?: number
  hint?: string
}

export function MetricCard({ label, value, unit, digits = 0, hint }: MetricCardProps) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold tracking-tight">
        <span className="text-2xl">{fmtNum(value, digits)}</span>
        <span className="ml-1 text-sm text-muted-foreground">{unit}</span>
      </p>
      {hint ? <p className="mt-1 text-xs leading-snug text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
