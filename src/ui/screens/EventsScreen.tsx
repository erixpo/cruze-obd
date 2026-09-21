import { Button } from '@/components/ui/button'
import { fuelChip, fmtNum, whenSk } from '../../lib/format'
import { useSession } from '../../session/AppSession'

export function EventsScreen() {
  const { events, injectDemoJerk, settings, status } = useSession()
  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Diagnóza trhnutia</p>
        <h1 className="text-2xl font-semibold tracking-tight">Trhnutia</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Zachytím otras telefónu (akcelerometer) a zároveň prepad otáčok. K tomu korekcie, rýchlosť
          a režim paliva.
        </p>
      </header>

      {settings.demoMode && status === 'ready' ? (
        <Button variant="secondary" onClick={injectDemoJerk}>
          Simulovať trhnutie v demo
        </Button>
      ) : null}

      {events.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
          Zatiaľ nič. Telefón nechaj v držiaku, nech cíti otras. GPS sa uloží len ak povolíš
          polohu.
        </p>
      ) : (
        <ul className="grid gap-2">
          {events.map((e) => (
            <li key={e.id} className="rounded-xl border bg-card p-3 text-sm">
              <div className="flex justify-between gap-2">
                <span className="font-medium">{whenSk(e.timestamp)}</span>
                <span>{fuelChip(e.fuelMode)}</span>
              </div>
              <p className="mt-1">
                Prepad {fmtNum(e.rpmDrop)} ot · teraz {fmtNum(e.rpm)} ot · otras {fmtNum(e.accelG, 2)} g
              </p>
              <p className="text-muted-foreground">
                {fmtNum(e.speed)} km/h · STFT {fmtNum(e.stft, 1)} % · LTFT {fmtNum(e.ltft, 1)} %
                {e.gps ? ` · ${e.gps.lat.toFixed(4)}, ${e.gps.lon.toFixed(4)}` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
