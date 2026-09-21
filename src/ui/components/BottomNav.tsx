import { AlertTriangle, Car, Gauge, MoreHorizontal, PlugZap, Route } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { type ScreenId, useSession } from '../../session/AppSession'

const PRIMARY: { id: ScreenId; label: string; icon: typeof Gauge }[] = [
  { id: 'connect', label: 'Pripojiť', icon: PlugZap },
  { id: 'dash', label: 'Budíky', icon: Gauge },
  { id: 'trip', label: 'Jazda', icon: Route },
  { id: 'dtc', label: 'Chyby', icon: AlertTriangle },
]

const MORE: { id: ScreenId; label: string; hint: string }[] = [
  { id: 'fuel', label: 'Palivo', hint: 'Benzín / LPG pre túto jazdu' },
  { id: 'events', label: 'Trhnutia', hint: 'Otras + prepad otáčok' },
  { id: 'car', label: 'Auto', hint: 'Cruze profil a servis' },
  { id: 'score', label: 'Hodnotenie', hint: 'Po jazde' },
]

export function BottomNav() {
  const { screen, setScreen } = useSession()
  return (
    <nav className="sticky bottom-0 z-20 border-t bg-background/95 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur">
      <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
        {PRIMARY.map((item) => {
          const Icon = item.icon
          const active = screen === item.id
          return (
            <Button
              key={item.id}
              variant={active ? 'secondary' : 'ghost'}
              size="sm"
              className="h-auto flex-col gap-0.5 py-2 text-[11px]"
              onClick={() => setScreen(item.id)}
            >
              <Icon className="size-4" />
              {item.label}
            </Button>
          )
        })}
        <Sheet>
          <SheetTrigger
            className={
              MORE.some((m) => m.id === screen)
                ? 'inline-flex h-auto flex-col items-center gap-0.5 rounded-lg bg-secondary px-2 py-2 text-[11px] font-medium'
                : 'inline-flex h-auto flex-col items-center gap-0.5 rounded-lg px-2 py-2 text-[11px] font-medium hover:bg-muted'
            }
          >
            <MoreHorizontal className="size-4" />
            Viac
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>Ďalšie obrazovky</SheetTitle>
            </SheetHeader>
            <div className="grid gap-2 p-4">
              {MORE.map((item) => (
                <Button
                  key={item.id}
                  variant={screen === item.id ? 'secondary' : 'outline'}
                  className="h-auto justify-start py-3"
                  onClick={() => setScreen(item.id)}
                >
                  <Car className="size-4" />
                  <span className="flex flex-col items-start">
                    <span>{item.label}</span>
                    <span className="text-xs font-normal text-muted-foreground">{item.hint}</span>
                  </span>
                </Button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}
