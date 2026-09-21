import type { FuelMode } from '../car/cruze-profile'
import type { LiveValues } from '../obd/client'

export type GpsPoint = {
  lat: number
  lon: number
}

export type TripRecord = {
  id: string
  startedAt: number
  endedAt?: number
  fuelMode: FuelMode
  distanceKm: number
  durationMs: number
  fuelLiters?: number
  costEur?: number
  avgL100?: number
  samples: number
}

export type JerkEvent = {
  id: string
  timestamp: number
  fuelMode: FuelMode
  accelG: number
  rpm: number
  rpmDrop: number
  speed?: number
  stft?: number
  ltft?: number
  coolant?: number
  voltage?: number
  gps?: GpsPoint
}

export type Settings = {
  demoMode: boolean
  lastAddress: string
  lastName: string
}

export type LiveSnapshot = LiveValues & {
  timestamp: number
  fuelMode: FuelMode
}
