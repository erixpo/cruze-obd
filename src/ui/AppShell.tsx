import { FUTURE_WORK } from '../obd/todos'
import { useSession } from '../session/AppSession'
import { BottomNav } from './components/BottomNav'
import { AfterDriveScreen } from './screens/AfterDriveScreen'
import { CarProfileScreen } from './screens/CarProfileScreen'
import { ConnectScreen } from './screens/ConnectScreen'
import { DtcScreen } from './screens/DtcScreen'
import { EventsScreen } from './screens/EventsScreen'
import { FuelModeScreen } from './screens/FuelModeScreen'
import { LiveDashScreen } from './screens/LiveDashScreen'
import { TripScreen } from './screens/TripScreen'

export function AppShell() {
  const { screen, status, error, fuelMode } = useSession()
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-lg flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2 text-xs">
        <span className="font-medium">Cruze 1.8 LPG</span>
        <span className="text-muted-foreground">
          {fuelMode === 'lpg' ? 'LPG' : 'Benzín'} · {statusLabel(status)}
        </span>
      </div>
      {error && screen !== 'connect' ? (
        <p className="bg-destructive/15 px-4 py-2 text-xs text-destructive">{error}</p>
      ) : null}
      <main className="flex-1 overflow-y-auto px-4 py-4">
        {screen === 'connect' ? <ConnectScreen /> : null}
        {screen === 'dash' ? <LiveDashScreen /> : null}
        {screen === 'fuel' ? <FuelModeScreen /> : null}
        {screen === 'dtc' ? <DtcScreen /> : null}
        {screen === 'trip' ? <TripScreen /> : null}
        {screen === 'events' ? <EventsScreen /> : null}
        {screen === 'car' ? <CarProfileScreen /> : null}
        {screen === 'score' ? <AfterDriveScreen /> : null}
        <p className="mt-8 text-[10px] leading-relaxed text-muted-foreground">
          {FUTURE_WORK.gmMode22} {FUTURE_WORK.mode06} {FUTURE_WORK.abMaps}
        </p>
      </main>
      <BottomNav />
    </div>
  )
}

function statusLabel(status: string): string {
  if (status === 'ready') return 'online'
  if (status === 'connecting') return 'spájam'
  if (status === 'reconnecting') return 'znova'
  if (status === 'error') return 'chyba'
  return 'offline'
}
