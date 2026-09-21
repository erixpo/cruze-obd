import { Preferences } from '@capacitor/preferences'
import { CRUZE_DEFAULTS, type CarProfile } from '../car/cruze-profile'
import type { Capability } from '../obd/capability'
import type { JerkEvent, Settings, TripRecord } from './types'

const KEYS = {
  settings: 'cruze.settings',
  profile: 'cruze.profile',
  trips: 'cruze.trips',
  events: 'cruze.events',
  capability: 'cruze.capability',
} as const

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const { value } = await Preferences.get({ key })
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  await Preferences.set({ key, value: JSON.stringify(value) })
}

export async function loadSettings(): Promise<Settings> {
  return readJson<Settings>(KEYS.settings, {
    demoMode: true,
    lastAddress: '',
    lastName: '',
  })
}

export async function saveSettings(settings: Settings): Promise<void> {
  await writeJson(KEYS.settings, settings)
}

export async function loadProfile(): Promise<CarProfile> {
  const stored = await readJson<Partial<CarProfile>>(KEYS.profile, {})
  return { ...CRUZE_DEFAULTS, ...stored }
}

export async function saveProfile(profile: CarProfile): Promise<void> {
  await writeJson(KEYS.profile, profile)
}

export async function loadTrips(): Promise<TripRecord[]> {
  return readJson<TripRecord[]>(KEYS.trips, [])
}

export async function saveTrips(trips: TripRecord[]): Promise<void> {
  await writeJson(KEYS.trips, trips.slice(0, 40))
}

export async function loadEvents(): Promise<JerkEvent[]> {
  return readJson<JerkEvent[]>(KEYS.events, [])
}

export async function saveEvents(events: JerkEvent[]): Promise<void> {
  await writeJson(KEYS.events, events.slice(0, 80))
}

export async function loadCapability(): Promise<Capability | null> {
  return readJson<Capability | null>(KEYS.capability, null)
}

export async function saveCapability(cap: Capability): Promise<void> {
  await writeJson(KEYS.capability, cap)
}
