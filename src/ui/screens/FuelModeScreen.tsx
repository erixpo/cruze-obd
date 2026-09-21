import { Fuel } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSession } from '../../session/AppSession'

export function FuelModeScreen() {
  const { fuelMode, setFuelMode, profile, trip } = useSession()
  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Manuálna značka</p>
        <h1 className="text-2xl font-semibold tracking-tight">Na čom ideš?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ELM Mini nevidí LPG ECU. Toto si prepínaš ty — každá jazda a každé trhnutie sa opečiatkuje.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Button
          size="lg"
          variant={fuelMode === 'benzin' ? 'default' : 'outline'}
          className="h-28 flex-col text-lg"
          onClick={() => setFuelMode('benzin')}
        >
          <Fuel className="size-6" />
          Benzín
        </Button>
        <Button
          size="lg"
          variant={fuelMode === 'lpg' ? 'default' : 'outline'}
          className="h-28 flex-col text-lg"
          onClick={() => setFuelMode('lpg')}
        >
          <Fuel className="size-6" />
          LPG
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ceny v profile</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>Benzín {profile.benzinPriceEur.toFixed(2)} €/l · LPG {profile.lpgPriceEur.toFixed(2)} €/l</p>
          <p className="mt-2">
            {trip && !trip.endedAt
              ? `Aktívna jazda ide ako ${fuelMode === 'lpg' ? 'LPG' : 'benzín'}.`
              : 'Keď spustíš jazdu, spotreba a € sa počítajú z tohto režimu.'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
