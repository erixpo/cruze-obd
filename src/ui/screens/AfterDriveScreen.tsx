import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { useSession } from '../../session/AppSession'

export function AfterDriveScreen() {
  const { lastScore, trip } = useSession()

  if (!lastScore) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Po jazde</h1>
        <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
          Skóre sa spočíta keď ukončíš jazdu. Dovtedy tu nič nie je — zámerne.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">After drive</p>
        <h1 className="text-2xl font-semibold tracking-tight">Hodnotenie</h1>
      </header>

      <div className="rounded-xl border bg-card p-4">
        <p className="text-5xl font-semibold tabular-nums">{lastScore.score}</p>
        <p className="mt-1 text-sm text-muted-foreground">{lastScore.headline}</p>
        <Progress className="mt-3" value={lastScore.score} />
        {trip ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {trip.distanceKm.toFixed(1)} km ·{' '}
            {trip.avgL100 !== undefined ? `${trip.avgL100.toFixed(1)} l/100` : 'odhad nedostupný'}
          </p>
        ) : null}
      </div>

      {lastScore.alerts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Žiadne červené vlajky z tejto jazdy.</p>
      ) : (
        lastScore.alerts.map((a) => (
          <Alert key={a.title} variant={a.severity === 'bad' ? 'destructive' : 'default'}>
            <AlertTitle>{a.title}</AlertTitle>
            <AlertDescription>{a.detail}</AlertDescription>
          </Alert>
        ))
      )}
    </div>
  )
}
