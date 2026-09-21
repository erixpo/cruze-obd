import type { JerkEvent } from '../store/types'
import type { LiveSnapshot } from '../store/types'

export type DriveAlert = {
  title: string
  detail: string
  severity: 'warn' | 'bad'
}

export type DriveScore = {
  score: number
  headline: string
  alerts: DriveAlert[]
}

export function scoreDrive(
  samples: LiveSnapshot[],
  events: JerkEvent[],
  durationMs: number,
): DriveScore {
  const alerts: DriveAlert[] = []
  if (samples.length < 4) {
    return {
      score: 50,
      headline: 'Málo dát — prejdite sa dlhšie, aby som vedel hodnotiť.',
      alerts,
    }
  }

  const stft = avg(samples.map((s) => s.stft).filter(isNum))
  const ltft = avg(samples.map((s) => s.ltft).filter(isNum))
  const voltage = avg(samples.map((s) => s.voltage).filter(isNum))
  const loadVar = variance(samples.map((s) => s.load).filter(isNum))
  const speedVar = variance(samples.map((s) => s.speed).filter(isNum))

  let score = 82
  score -= Math.min(25, events.length * 8)
  score -= Math.min(15, loadVar / 18)
  score -= Math.min(10, speedVar / 40)

  if (Math.abs(stft) > 10 || Math.abs(ltft) > 10) {
    score -= 12
    alerts.push({
      severity: 'bad',
      title: 'Korekcie zmesi mimo ±10 %',
      detail: `STFT ${fmt(stft)} %, LTFT ${fmt(ltft)} %. Na LPG to často znamená zlé nastavenie / podtlak.`,
    })
  }
  if (voltage > 0 && voltage < 12.6) {
    score -= 10
    alerts.push({
      severity: 'bad',
      title: 'Nízke napätie',
      detail: `Priemer ${fmt(voltage)} V. Alternátor, batéria alebo slabý kontakt na ELM.`,
    })
  }

  const coldMs = coldEngineMs(samples)
  if (coldMs > 10 * 60_000 && durationMs > 12 * 60_000) {
    score -= 8
    alerts.push({
      severity: 'warn',
      title: 'Dlho studený motor',
      detail: 'Voda ostala pod 70 °C vyše 10 minút za jazdy. Termostat, čidlo, alebo krátke trasy.',
    })
  }

  if (events.length >= 2) {
    alerts.push({
      severity: 'warn',
      title: `${events.length}× trhnutie`,
      detail: 'Zachytené ako otras telefónu + prepad otáčok. Porovnaj benzín vs LPG na ďalšej jazde.',
    })
  }

  score = Math.round(clamp(score, 12, 99))
  const headline =
    score >= 80
      ? 'Kľudná jazda, motor vyzerá v pohode.'
      : score >= 60
        ? 'Ide to, ale niečo si zaslúži pozornosť.'
        : 'Táto jazda bola rozhádzańa — pozri upozornenia.'

  return { score, headline, alerts: alerts.slice(0, 3) }
}

function isNum(n: number | undefined): n is number {
  return typeof n === 'number' && Number.isFinite(n)
}

function avg(xs: number[]): number {
  if (xs.length === 0) return 0
  return xs.reduce((a, b) => a + b, 0) / xs.length
}

function variance(xs: number[]): number {
  if (xs.length < 2) return 0
  const m = avg(xs)
  return xs.reduce((s, x) => s + (x - m) ** 2, 0) / xs.length
}

function coldEngineMs(samples: LiveSnapshot[]): number {
  if (samples.length < 2) return 0
  let ms = 0
  for (let i = 1; i < samples.length; i++) {
    const prev = samples[i - 1]
    const cur = samples[i]
    if (!prev || !cur) continue
    const moving = (cur.speed ?? 0) > 5
    const cold = (cur.coolant ?? 90) < 70
    if (moving && cold) ms += Math.max(0, cur.timestamp - prev.timestamp)
  }
  return ms
}

function fmt(n: number): string {
  return n.toFixed(1)
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}
