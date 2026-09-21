import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { fmtNum } from '../../lib/format'
import { useSession } from '../../session/AppSession'

export function DtcScreen() {
  const { dtcs, freeze, mil, refreshDtcs, clearDtcs, dtcBusy, status } = useSession()
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Diagnostika</p>
        <h1 className="text-2xl font-semibold tracking-tight">Chyby motora</h1>
      </header>

      {mil ? (
        <Alert>
          <AlertTitle>{mil.milOn ? 'Kontrolka motora svieti' : 'Kontrolka nesvieti'}</AlertTitle>
          <AlertDescription>
            Uložené kódy podľa ECU: {mil.dtcCount}. Pripravenosť:{' '}
            {mil.notReadySk.length === 0 ? 'monitory hotové.' : `čaká ${mil.notReadySk.join(', ')}.`}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex gap-2">
        <Button onClick={() => void refreshDtcs()} disabled={dtcBusy || status === 'idle'} className="flex-1">
          {dtcBusy ? 'Čítam…' : 'Načítať chyby'}
        </Button>
        <Button variant="destructive" disabled={dtcs.length === 0 || dtcBusy} onClick={() => setOpen(true)}>
          Zmazať
        </Button>
      </div>

      {dtcs.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
          Žiadne načítané kódy. Stlač „Načítať chyby“ po pripojení. Pending (Mode 07) sa ukážu ako
          čakajúce.
        </p>
      ) : (
        <ul className="grid gap-2">
          {dtcs.map((d) => (
            <li key={`${d.status}-${d.code}`} className="rounded-xl border bg-card p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-lg font-semibold">{d.code}</span>
                <Badge variant={d.status === 'pending' ? 'outline' : 'secondary'}>
                  {d.status === 'pending' ? 'čakajúca' : 'uložená'}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{d.labelSk}</p>
            </li>
          ))}
        </ul>
      )}

      {freeze ? (
        <div className="rounded-xl border bg-card p-3 text-sm">
          <p className="font-medium">Zamrznutý snímok (Mode 02)</p>
          <p className="text-muted-foreground">Pri chybe {freeze.dtc ?? 'neznámej'}</p>
          <p className="mt-2">
            {fmtNum(freeze.values.rpm)} ot · {fmtNum(freeze.values.speed)} km/h · voda{' '}
            {fmtNum(freeze.values.coolant)} °C · STFT {fmtNum(freeze.values.stft, 1)} %
          </p>
        </div>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Naozaj zmazať chyby?</DialogTitle>
            <DialogDescription>
              Mode 04 vymaže uložené kódy a resetuje pripravenosť. Kontrolka môže na chvíľu zhasnúť,
              aj keď problém ostal. Rob to len keď vieš prečo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Nechať
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setOpen(false)
                void clearDtcs()
              }}
            >
              Zmazať teraz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
