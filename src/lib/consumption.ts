import type { FuelMode } from '../car/cruze-profile'
import type { LiveValues } from '../obd/client'

/** Gasoline AFR ~14.7, density ~0.745 kg/L. LPG is leaner AFR and lighter. */
const FUEL = {
  benzin: { afr: 14.7, densityKgL: 0.745 },
  lpg: { afr: 15.5, densityKgL: 0.54 },
} as const

export type Consumption = {
  instantL100?: number
  litersPerHour?: number
  available: boolean
  noteSk: string
}

export function estimateConsumption(values: LiveValues, mode: FuelMode): Consumption {
  if (values.fuelRate !== undefined && Number.isFinite(values.fuelRate)) {
    const lph = values.fuelRate
    const speed = values.speed ?? 0
    const instant = speed > 8 ? (lph / speed) * 100 : undefined
    return {
      litersPerHour: lph,
      instantL100: instant,
      available: true,
      noteSk: 'Z prietoku paliva (PID 5E).',
    }
  }

  if (values.maf !== undefined && Number.isFinite(values.maf)) {
    const spec = FUEL[mode]
    const fuelGPerS = values.maf / spec.afr
    const lph = (fuelGPerS / (spec.densityKgL * 1000)) * 3600
    const speed = values.speed ?? 0
    const instant = speed > 8 ? (lph / speed) * 100 : undefined
    return {
      litersPerHour: lph,
      instantL100: instant,
      available: true,
      noteSk: mode === 'lpg' ? 'Odhad z MAF pre LPG (hrubý).' : 'Odhad z MAF pre benzín.',
    }
  }

  return {
    available: false,
    noteSk: 'Odhad nedostupný — auto neposiela MAF ani prietok paliva.',
  }
}

export function litersFromRate(lph: number | undefined, dtMs: number): number {
  if (lph === undefined || !Number.isFinite(lph) || dtMs <= 0) return 0
  return (lph * dtMs) / 3_600_000
}

export function distanceFromSpeed(speedKmh: number | undefined, dtMs: number): number {
  if (speedKmh === undefined || !Number.isFinite(speedKmh) || dtMs <= 0) return 0
  return (speedKmh * dtMs) / 3_600_000
}
