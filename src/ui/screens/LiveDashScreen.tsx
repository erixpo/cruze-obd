import { Badge } from '@/components/ui/badge'
import { fuelChip, trimTalk } from '../../lib/format'
import { useSession } from '../../session/AppSession'
import { Gauge } from '../components/Gauge'
import { MetricCard } from '../components/MetricCard'

export function LiveDashScreen() {
  const { live, status, fuelMode, capability, consumptionNote } = useSession()
  const stft = trimTalk(live?.stft)
  const ltft = trimTalk(live?.ltft)

  if (status !== 'ready' && status !== 'reconnecting' && !live) {
    return (
      <EmptyDash hint="Najprv sa pripoj (alebo zapni demo) — inak nemám čo ukazovať." />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Naživo</p>
          <h1 className="text-2xl font-semibold tracking-tight">Budíky</h1>
        </div>
        <Badge>{fuelChip(fuelMode)}</Badge>
      </header>

      <div className="grid grid-cols-2 gap-2">
        <Gauge label="Otáčky" value={live?.rpm} unit="ot/min" max={6500} warnFrom={4800} />
        <Gauge label="Rýchlosť" value={live?.speed} unit="km/h" max={180} />
        <Gauge label="Záťaž" value={live?.load} unit="%" max={100} digits={0} />
        <Gauge label="Plyn" value={live?.throttle} unit="%" max={100} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MetricCard label="Teplota vody" value={live?.coolant} unit="°C" />
        <MetricCard label="Napätie" value={live?.voltage} unit="V" digits={2} />
        <MetricCard label="Krátkodobá korekcia" value={live?.stft} unit="%" digits={1} hint={stft.detail} />
        <MetricCard label="Dlhodobá korekcia" value={live?.ltft} unit="%" digits={1} hint={ltft.detail} />
        <MetricCard label="Lambda" value={live?.o2b1s1} unit="V" digits={2} />
        <MetricCard label="Teplota sania" value={live?.intakeTemp} unit="°C" />
        <MetricCard label="MAP" value={live?.map} unit="kPa" />
        <MetricCard label="MAF" value={live?.maf} unit="g/s" digits={1} />
      </div>

      <p className="text-sm text-muted-foreground">{consumptionNote}</p>
      {capability ? (
        <p className="text-xs text-muted-foreground">
          Scan: {capability.labels.filter((l) => l.supported).length} z{' '}
          {capability.labels.length} sledovaných parametrov auto posiela.
        </p>
      ) : null}
    </div>
  )
}

function EmptyDash({ hint }: { hint: string }) {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-semibold tracking-tight">Budíky</h1>
      <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">{hint}</p>
    </div>
  )
}
