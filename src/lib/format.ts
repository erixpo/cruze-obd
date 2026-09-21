import type { FuelMode } from '../car/cruze-profile'

export function fmtNum(n: number | undefined, digits = 0, fallback = '—'): string {
  if (n === undefined || !Number.isFinite(n)) return fallback
  return n.toFixed(digits)
}

export function fmtDuration(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h} h ${m} min`
  if (m > 0) return `${m} min ${sec} s`
  return `${sec} s`
}

export function trimTalk(value: number | undefined): { tone: string; detail: string } {
  if (value === undefined || !Number.isFinite(value)) {
    return { tone: 'neviem', detail: 'Korekciu auto neposiela.' }
  }
  if (value > 4) {
    return {
      tone: 'chudá · pridávam',
      detail: `Zmes je chudá, riadiaca jednotka pridáva palivo (${value.toFixed(1)} %).`,
    }
  }
  if (value < -4) {
    return {
      tone: 'bohatá · uberám',
      detail: `Zmes je bohatá, riadiaca jednotka uberá palivo (${value.toFixed(1)} %).`,
    }
  }
  return {
    tone: 'v norme',
    detail: `Korekcia ${value.toFixed(1)} % — okolo nuly, zmes je v pohode.`,
  }
}

export function fuelChip(mode: FuelMode): string {
  return mode === 'lpg' ? 'LPG' : 'Benzín'
}

export function whenSk(ts: number): string {
  return new Date(ts).toLocaleString('sk-SK', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
