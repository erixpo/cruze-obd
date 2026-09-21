import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CRUZE_DEFAULTS } from '../../car/cruze-profile'
import { useSession } from '../../session/AppSession'

export function CarProfileScreen() {
  const { profile, saveCar } = useSession()
  const [spark, setSpark] = useState(profile.sparkPlugs)
  const [stk, setStk] = useState(profile.stkDue)
  const [notes, setNotes] = useState(profile.lpgNotes)
  const [benzin, setBenzin] = useState(String(profile.benzinPriceEur))
  const [lpg, setLpg] = useState(String(profile.lpgPriceEur))
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSpark(profile.sparkPlugs)
    setStk(profile.stkDue)
    setNotes(profile.lpgNotes)
    setBenzin(String(profile.benzinPriceEur))
    setLpg(String(profile.lpgPriceEur))
  }, [profile])

  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Profil</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {profile.year} {profile.make} {profile.model}
        </h1>
        <p className="text-sm text-muted-foreground">
          {profile.engine} · {profile.engineCode} · karoséria {profile.bodyCode}
        </p>
      </header>

      <div className="rounded-xl border bg-card p-3 text-sm">
        <p>Sviečky: {profile.sparkPlugs}</p>
        <p>STK do: {profile.stkDue}</p>
        <p className="mt-2 text-muted-foreground">{profile.ownerNote}</p>
      </div>

      <form
        className="grid gap-3"
        onSubmit={(ev) => {
          ev.preventDefault()
          void saveCar({
            ...profile,
            sparkPlugs: spark,
            stkDue: stk,
            lpgNotes: notes,
            benzinPriceEur: Number.parseFloat(benzin) || profile.benzinPriceEur,
            lpgPriceEur: Number.parseFloat(lpg) || profile.lpgPriceEur,
          })
          setSaved(true)
          window.setTimeout(() => setSaved(false), 2000)
        }}
      >
        <Field label="Sviečky" value={spark} onChange={setSpark} />
        <Field label="STK (dátum)" value={stk} onChange={setStk} />
        <Field label="Benzín €/l" value={benzin} onChange={setBenzin} />
        <Field label="LPG €/l" value={lpg} onChange={setLpg} />
        <div className="grid gap-1.5">
          <Label htmlFor="lpg-notes">Poznámky k LPG</Label>
          <textarea
            id="lpg-notes"
            className="min-h-24 rounded-lg border bg-background px-3 py-2 text-sm"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">
            {saved ? 'Uložené' : 'Uložiť'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSpark(CRUZE_DEFAULTS.sparkPlugs)
              setStk(CRUZE_DEFAULTS.stkDue)
              setNotes(CRUZE_DEFAULTS.lpgNotes)
              setBenzin(String(CRUZE_DEFAULTS.benzinPriceEur))
              setLpg(String(CRUZE_DEFAULTS.lpgPriceEur))
              void saveCar(CRUZE_DEFAULTS)
            }}
          >
            Defaulty
          </Button>
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  const id = label
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
