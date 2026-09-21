import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fuelChip, fmtDuration, fmtNum } from '../../lib/format'
import { useSession } from '../../session/AppSession'

export function TripScreen() {
  const { trip, trips, startTrip, stopTrip, fuelMode, consumptionNote } = useSession()
  const active = trip && !trip.endedAt

  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Záznam</p>
        <h1 className="text-2xl font-semibold tracking-tight">Jazda</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {active ? `Beží · ${fuelChip(fuelMode)}` : 'Žiadna aktívna jazda'}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {active && trip ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Stat label="Trvanie" value={fmtDuration(trip.durationMs)} />
              <Stat label="Vzdialenosť" value={`${fmtNum(trip.distanceKm, 1)} km`} />
              <Stat
                label="Odhad l/100"
                value={trip.avgL100 !== undefined ? fmtNum(trip.avgL100, 1) : 'nedostupný'}
              />
              <Stat
                label="Cena"
                value={trip.costEur !== undefined ? `${fmtNum(trip.costEur, 2)} €` : '—'}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Štart meria vzdialenosť z rýchlosti a spotrebu z MAF / prietoku. {consumptionNote}
            </p>
          )}
          {active ? (
            <Button variant="destructive" onClick={() => void stopTrip()}>
              Ukončiť jazdu
            </Button>
          ) : (
            <Button onClick={startTrip}>Štart jazdy</Button>
          )}
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-2 text-sm font-medium">Posledné jazdy</h2>
        {trips.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            Zatiaľ žiadna uložená jazda.
          </p>
        ) : (
          <ul className="grid gap-2">
            {trips.map((t) => (
              <li key={t.id} className="rounded-xl border bg-card px-3 py-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">{fuelChip(t.fuelMode)}</span>
                  <span className="text-muted-foreground">{fmtDuration(t.durationMs)}</span>
                </div>
                <p className="text-muted-foreground">
                  {fmtNum(t.distanceKm, 1)} km
                  {t.avgL100 !== undefined ? ` · ${fmtNum(t.avgL100, 1)} l/100` : ' · odhad nedostupný'}
                  {t.costEur !== undefined ? ` · ${fmtNum(t.costEur, 2)} €` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-base font-semibold">{value}</p>
    </div>
  )
}
