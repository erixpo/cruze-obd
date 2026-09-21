import { Bluetooth, Loader2, PlugZap } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useSession } from '../../session/AppSession'

export function ConnectScreen() {
  const {
    settings,
    setDemo,
    devices,
    refreshDevices,
    scanning,
    connectDevice,
    disconnect,
    status,
    error,
    capability,
    vin,
    initLog,
    native,
    mil,
  } = useSession()

  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Cruze OBD</p>
        <h1 className="text-2xl font-semibold tracking-tight">Pripojenie</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ELM327 Mini cez Bluetooth Classic (SPP). Lacné klony vedia vypadnúť — appka sa skúsi znova
          pripojiť.
        </p>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Demo režim</CardTitle>
            <p className="text-sm text-muted-foreground">Bez auta, budíky ožijú falošnými dátami.</p>
          </div>
          <Switch checked={settings.demoMode} onCheckedChange={(on) => void setDemo(on)} />
        </CardHeader>
      </Card>

      {!native && !settings.demoMode ? (
        <Alert>
          <AlertTitle>Toto je web</AlertTitle>
          <AlertDescription>
            Skutočný Bluetooth Classic ide len v Android aplikácii. Zapni demo, alebo nainštaluj APK
            na S23 Ultra.
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Nepodarilo sa</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {settings.demoMode ? (
        <Button
          size="lg"
          onClick={() =>
            void connectDevice({ name: 'ELM327 Mini (demo)', address: '00:1D:A5:00:00:01' })
          }
        >
          Spustiť demo budíky
        </Button>
      ) : null}

      <div className="flex gap-2">
        <Button onClick={() => void refreshDevices()} disabled={scanning} className="flex-1">
          {scanning ? <Loader2 className="animate-spin" /> : <Bluetooth />}
          {scanning ? 'Hľadám…' : 'Načítať spárované'}
        </Button>
        {status === 'ready' || status === 'reconnecting' ? (
          <Button variant="outline" onClick={() => void disconnect()}>
            Odpojiť
          </Button>
        ) : null}
      </div>

      <div className="flex items-center gap-2 text-sm">
        <Badge variant={status === 'ready' ? 'default' : 'secondary'}>
          {status === 'ready'
            ? 'Pripojené'
            : status === 'connecting'
              ? 'Pripájam…'
              : status === 'reconnecting'
                ? 'Obnovujem…'
                : status === 'error'
                  ? 'Chyba'
                  : 'Čakám'}
        </Badge>
        {settings.lastName ? (
          <span className="text-muted-foreground">Naposledy: {settings.lastName}</span>
        ) : null}
      </div>

      <section className="grid gap-2">
        {devices.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            Žiadne zariadenia. Na telefóne najprv spáruj ELM327 v systémovom Bluetooth (PIN často
            1234). Potom sem.
          </p>
        ) : (
          devices.map((d) => (
            <button
              key={d.address}
              type="button"
              onClick={() => void connectDevice(d)}
              className="flex items-center justify-between rounded-xl border bg-card px-3 py-3 text-left"
            >
              <span>
                <span className="block font-medium">{d.name}</span>
                <span className="font-mono text-xs text-muted-foreground">{d.address}</span>
              </span>
              <PlugZap className="size-4 text-primary" />
            </button>
          ))
        )}
      </section>

      {capability ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Capability scan</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <p className="text-sm text-muted-foreground">
              Čo Cruze cez Mode 01 naozaj posiela. Ak chýba PID, budík ostane prázdny — nehádžem
              čísla.
            </p>
            {vin ? (
              <p className="text-sm">
                VIN: <span className="font-mono">{vin}</span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">VIN auto neposlalo (Mode 09).</p>
            )}
            {mil ? (
              <p className="text-sm">
                Kontrolka motora: {mil.milOn ? 'svieti' : 'nesvieti'} · uložené chyby: {mil.dtcCount}
              </p>
            ) : null}
            <ul className="grid grid-cols-2 gap-1 text-sm">
              {capability.labels.map((row) => (
                <li key={row.pid} className="flex items-center justify-between rounded-md bg-muted/50 px-2 py-1">
                  <span>{row.labelSk}</span>
                  <Badge variant={row.supported ? 'default' : 'outline'}>
                    {row.supported ? 'áno' : 'nie'}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {initLog.length > 0 ? (
        <div>
          <Label>ELM init</Label>
          <pre className="mt-1 overflow-x-auto rounded-lg bg-muted p-2 font-mono text-[11px] leading-relaxed">
            {initLog.join('\n')}
          </pre>
        </div>
      ) : null}
    </div>
  )
}
