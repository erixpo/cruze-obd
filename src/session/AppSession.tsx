import { Geolocation } from '@capacitor/geolocation'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createTransport, isAndroidNative, ObdError, SK, type BtDevice } from '../bt/transport'
import { CRUZE_DEFAULTS, fuelLabel, type CarProfile, type FuelMode } from '../car/cruze-profile'
import { detectJerk, accelMagnitude, type AccelSample, type RpmSample } from '../lib/jerk'
import { distanceFromSpeed, estimateConsumption, litersFromRate } from '../lib/consumption'
import { scoreDrive, type DriveScore } from '../lib/score'
import { ElmObdClient, type ObdClient } from '../obd/client'
import { MockObdClient } from '../obd/mock-stream'
import type { Capability } from '../obd/capability'
import type { DtcEntry, MilStatus } from '../obd/dtc'
import type { FreezeFrame } from '../obd/client'
import {
  loadCapability,
  loadEvents,
  loadProfile,
  loadSettings,
  loadTrips,
  saveCapability,
  saveEvents,
  saveProfile,
  saveSettings,
  saveTrips,
} from '../store/persistence'
import type { JerkEvent, LiveSnapshot, Settings, TripRecord } from '../store/types'

export type ConnStatus = 'idle' | 'connecting' | 'ready' | 'error' | 'reconnecting'

export type ScreenId =
  | 'connect'
  | 'dash'
  | 'fuel'
  | 'dtc'
  | 'trip'
  | 'events'
  | 'car'
  | 'score'

type SessionValue = {
  screen: ScreenId
  setScreen: (s: ScreenId) => void
  settings: Settings
  profile: CarProfile
  fuelMode: FuelMode
  setFuelMode: (m: FuelMode) => void
  status: ConnStatus
  error: string | null
  devices: BtDevice[]
  scanning: boolean
  live: LiveSnapshot | null
  capability: Capability | null
  mil: MilStatus | null
  vin: string | null
  initLog: string[]
  dtcs: DtcEntry[]
  freeze: FreezeFrame | null
  dtcBusy: boolean
  trip: TripRecord | null
  trips: TripRecord[]
  events: JerkEvent[]
  lastScore: DriveScore | null
  consumptionNote: string
  native: boolean
  refreshDevices: () => Promise<void>
  connectDevice: (device: BtDevice) => Promise<void>
  disconnect: () => Promise<void>
  setDemo: (on: boolean) => Promise<void>
  saveCar: (next: CarProfile) => Promise<void>
  startTrip: () => void
  stopTrip: () => Promise<void>
  refreshDtcs: () => Promise<void>
  clearDtcs: () => Promise<void>
  injectDemoJerk: () => void
}

const SessionContext = createContext<SessionValue | null>(null)

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<ScreenId>('connect')
  const [settings, setSettings] = useState<Settings>({
    demoMode: true,
    lastAddress: '',
    lastName: '',
  })
  const [profile, setProfile] = useState<CarProfile>(CRUZE_DEFAULTS)
  const [fuelMode, setFuelMode] = useState<FuelMode>('lpg')
  const [status, setStatus] = useState<ConnStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [devices, setDevices] = useState<BtDevice[]>([])
  const [scanning, setScanning] = useState(false)
  const [live, setLive] = useState<LiveSnapshot | null>(null)
  const [capability, setCapability] = useState<Capability | null>(null)
  const [mil, setMil] = useState<MilStatus | null>(null)
  const [vin, setVin] = useState<string | null>(null)
  const [initLog, setInitLog] = useState<string[]>([])
  const [dtcs, setDtcs] = useState<DtcEntry[]>([])
  const [freeze, setFreeze] = useState<FreezeFrame | null>(null)
  const [dtcBusy, setDtcBusy] = useState(false)
  const [trip, setTrip] = useState<TripRecord | null>(null)
  const [trips, setTrips] = useState<TripRecord[]>([])
  const [events, setEvents] = useState<JerkEvent[]>([])
  const [lastScore, setLastScore] = useState<DriveScore | null>(null)

  const clientRef = useRef<ObdClient | null>(null)
  const mockRef = useRef<MockObdClient | null>(null)
  const supportedRef = useRef<Set<number>>(new Set())
  const pollRef = useRef<number | null>(null)
  const tripRef = useRef<TripRecord | null>(null)
  const samplesRef = useRef<LiveSnapshot[]>([])
  const tripEventsRef = useRef<JerkEvent[]>([])
  const lastLiveRef = useRef<LiveSnapshot | null>(null)
  const lastTickRef = useRef<number>(0)
  const accelRef = useRef<AccelSample[]>([])
  const rpmRef = useRef<RpmSample[]>([])
  const lastJerkRef = useRef(0)
  const fuelModeRef = useRef<FuelMode>('lpg')
  const profileRef = useRef(profile)

  useEffect(() => {
    fuelModeRef.current = fuelMode
  }, [fuelMode])
  useEffect(() => {
    profileRef.current = profile
  }, [profile])
  useEffect(() => {
    tripRef.current = trip
  }, [trip])

  useEffect(() => {
    void (async () => {
      const [s, p, t, e, cap] = await Promise.all([
        loadSettings(),
        loadProfile(),
        loadTrips(),
        loadEvents(),
        loadCapability(),
      ])
      setSettings(s)
      setProfile(p)
      setTrips(t)
      setEvents(e)
      if (cap) {
        setCapability(cap)
        supportedRef.current = new Set(cap.supportedPids)
      }
    })()
  }, [])

  const stopPoll = useCallback(() => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const persistEvent = useCallback(async (event: JerkEvent) => {
    setEvents((prev) => {
      const next = [event, ...prev].slice(0, 80)
      void saveEvents(next)
      return next
    })
    tripEventsRef.current = [...tripEventsRef.current, event]
  }, [])

  const maybeJerk = useCallback(
    async (snapshot: LiveSnapshot) => {
      const now = snapshot.timestamp
      rpmRef.current = [...rpmRef.current, { t: now, rpm: snapshot.rpm ?? 0 }].slice(-20)
      const hit = detectJerk(accelRef.current, rpmRef.current, now)
      if (!hit) return
      if (now - lastJerkRef.current < 4000) return
      lastJerkRef.current = now
      let gps: JerkEvent['gps']
      try {
        const pos = await Geolocation.getCurrentPosition({ timeout: 2500, enableHighAccuracy: false })
        gps = { lat: pos.coords.latitude, lon: pos.coords.longitude }
      } catch {
        gps = undefined
      }
      const event: JerkEvent = {
        id: newId(),
        timestamp: now,
        fuelMode: snapshot.fuelMode,
        accelG: hit.accelG,
        rpm: hit.rpm,
        rpmDrop: hit.rpmDrop,
        speed: snapshot.speed,
        stft: snapshot.stft,
        ltft: snapshot.ltft,
        coolant: snapshot.coolant,
        voltage: snapshot.voltage,
        gps,
      }
      await persistEvent(event)
    },
    [persistEvent],
  )

  const tick = useCallback(async () => {
    const client = clientRef.current
    if (!client) return
    try {
      const values = await client.readLive(supportedRef.current)
      const now = Date.now()
      const snapshot: LiveSnapshot = {
        ...values,
        timestamp: now,
        fuelMode: fuelModeRef.current,
      }
      setLive(snapshot)
      lastLiveRef.current = snapshot
      samplesRef.current = [...samplesRef.current, snapshot].slice(-400)
      const prevT = lastTickRef.current || now
      const dt = now - prevT
      lastTickRef.current = now
      const running = tripRef.current
      if (running && !running.endedAt) {
        const cons = estimateConsumption(values, fuelModeRef.current)
        const addKm = distanceFromSpeed(values.speed, dt)
        const addL = litersFromRate(cons.litersPerHour, dt)
        setTrip((cur) => {
          if (!cur || cur.endedAt) return cur
          const distanceKm = cur.distanceKm + addKm
          const fuelLiters = (cur.fuelLiters ?? 0) + addL
          const durationMs = now - cur.startedAt
          const price =
            fuelModeRef.current === 'lpg'
              ? profileRef.current.lpgPriceEur
              : profileRef.current.benzinPriceEur
          const next: TripRecord = {
            ...cur,
            fuelMode: fuelModeRef.current,
            distanceKm,
            durationMs,
            samples: cur.samples + 1,
            fuelLiters: cons.available ? fuelLiters : undefined,
            avgL100: cons.available && distanceKm > 0.3 ? (fuelLiters / distanceKm) * 100 : undefined,
            costEur: cons.available ? fuelLiters * price : undefined,
          }
          tripRef.current = next
          return next
        })
      }
      void maybeJerk(snapshot)
      setError(null)
      setStatus('ready')
    } catch (err) {
      const msg = err instanceof ObdError ? err.slovak : SK.generic
      setError(msg)
      setStatus('error')
    }
  }, [maybeJerk])

  const startPoll = useCallback(() => {
    stopPoll()
    void tick()
    pollRef.current = window.setInterval(() => {
      void tick()
    }, 900)
  }, [stopPoll, tick])

  const disconnect = useCallback(async () => {
    stopPoll()
    clientRef.current = null
    mockRef.current = null
    setStatus('idle')
    setLive(null)
  }, [stopPoll])

  const connectDevice = useCallback(
    async (device: BtDevice) => {
      setError(null)
      setStatus('connecting')
      setInitLog([])
      stopPoll()
      try {
        const demo = settings.demoMode
        const transport = createTransport(demo)
        await transport.ensureReady()
        await transport.connect(device.address)
        const client: ObdClient = demo
          ? new MockObdClient()
          : new ElmObdClient(transport, device.address, (msg) => {
              setStatus('reconnecting')
              setError(msg)
            })
        if (client instanceof MockObdClient) mockRef.current = client
        clientRef.current = client
        const log = await client.init()
        setInitLog(log)
        const cap = await client.scanCapabilities()
        supportedRef.current = new Set(cap.supportedPids)
        setCapability(cap)
        await saveCapability(cap)
        const [milStatus, vinValue] = await Promise.all([client.readMil(), client.readVin()])
        setMil(milStatus)
        setVin(vinValue)
        const nextSettings = { ...settings, lastAddress: device.address, lastName: device.name }
        setSettings(nextSettings)
        await saveSettings(nextSettings)
        setStatus('ready')
        lastTickRef.current = Date.now()
        startPoll()
        setScreen('dash')
      } catch (err) {
        const msg = err instanceof ObdError ? err.slovak : SK.connectFail
        setError(msg)
        setStatus('error')
        clientRef.current = null
      }
    },
    [settings, startPoll, stopPoll],
  )

  const refreshDevices = useCallback(async () => {
    setScanning(true)
    setError(null)
    try {
      const transport = createTransport(settings.demoMode)
      await transport.ensureReady()
      const paired = await transport.listPaired()
      let extra: BtDevice[] = []
      if (!settings.demoMode && isAndroidNative()) {
        try {
          extra = await transport.scanNearby()
        } catch {
          extra = []
        }
      }
      const map = new Map<string, BtDevice>()
      for (const d of [...paired, ...extra]) map.set(d.address, d)
      setDevices([...map.values()])
    } catch (err) {
      const msg = err instanceof ObdError ? err.slovak : SK.btPerms
      setError(msg)
    } finally {
      setScanning(false)
    }
  }, [settings.demoMode])

  const setDemo = useCallback(
    async (on: boolean) => {
      await disconnect()
      const next = { ...settings, demoMode: on }
      setSettings(next)
      await saveSettings(next)
    },
    [disconnect, settings],
  )

  const saveCar = useCallback(async (next: CarProfile) => {
    setProfile(next)
    await saveProfile(next)
  }, [])

  const startTrip = useCallback(() => {
    const rec: TripRecord = {
      id: newId(),
      startedAt: Date.now(),
      fuelMode: fuelModeRef.current,
      distanceKm: 0,
      durationMs: 0,
      samples: 0,
    }
    samplesRef.current = []
    tripEventsRef.current = []
    lastTickRef.current = Date.now()
    tripRef.current = rec
    setTrip(rec)
    setLastScore(null)
    setScreen('trip')
  }, [])

  const stopTrip = useCallback(async () => {
    const cur = tripRef.current
    if (!cur) return
    const ended: TripRecord = {
      ...cur,
      endedAt: Date.now(),
      durationMs: Date.now() - cur.startedAt,
    }
    setTrip(ended)
    tripRef.current = ended
    const scored = scoreDrive(samplesRef.current, tripEventsRef.current, ended.durationMs)
    setLastScore(scored)
    setTrips((prev) => {
      const next = [ended, ...prev.filter((t) => t.id !== ended.id)].slice(0, 40)
      void saveTrips(next)
      return next
    })
    setScreen('score')
  }, [])

  const refreshDtcs = useCallback(async () => {
    const client = clientRef.current
    if (!client) {
      setError('Najprv sa pripoj na ELM (alebo zapni demo).')
      return
    }
    setDtcBusy(true)
    try {
      const [stored, pending, ff, milStatus] = await Promise.all([
        client.readDtcs(),
        client.readPending(),
        client.readFreezeFrame(supportedRef.current),
        client.readMil(),
      ])
      setDtcs([...stored, ...pending])
      setFreeze(ff)
      setMil(milStatus)
    } catch (err) {
      setError(err instanceof ObdError ? err.slovak : SK.generic)
    } finally {
      setDtcBusy(false)
    }
  }, [])

  const clearDtcs = useCallback(async () => {
    const client = clientRef.current
    if (!client) return
    setDtcBusy(true)
    try {
      await client.clearDtcs()
      setDtcs([])
      setFreeze(null)
      await refreshDtcs()
    } catch (err) {
      setError(err instanceof ObdError ? err.slovak : SK.generic)
    } finally {
      setDtcBusy(false)
    }
  }, [refreshDtcs])

  const injectDemoJerk = useCallback(() => {
    mockRef.current?.triggerJerk()
    const now = Date.now()
    const liveNow = lastLiveRef.current
    const rpm = liveNow?.rpm ?? 2100
    lastJerkRef.current = now
    accelRef.current = [
      ...accelRef.current,
      { t: now - 80, g: 1.05 },
      { t: now, g: 2.1 },
    ].slice(-30)
    rpmRef.current = [
      { t: now - 800, rpm },
      { t: now - 400, rpm: rpm - 120 },
      { t: now, rpm: rpm - 420 },
    ]
    void persistEvent({
      id: newId(),
      timestamp: now,
      fuelMode: fuelModeRef.current,
      accelG: 2.1,
      rpm: rpm - 420,
      rpmDrop: 420,
      speed: liveNow?.speed,
      stft: liveNow?.stft,
      ltft: liveNow?.ltft,
      coolant: liveNow?.coolant,
      voltage: liveNow?.voltage,
    })
  }, [persistEvent])

  useEffect(() => {
    const handler = (ev: DeviceMotionEvent) => {
      const a = ev.accelerationIncludingGravity
      if (!a || a.x == null || a.y == null || a.z == null) return
      accelRef.current = [...accelRef.current, { t: Date.now(), g: accelMagnitude(a.x, a.y, a.z) }].slice(
        -30,
      )
    }
    window.addEventListener('devicemotion', handler)
    return () => window.removeEventListener('devicemotion', handler)
  }, [])

  useEffect(() => () => stopPoll(), [stopPoll])

  const consumptionNote = useMemo(() => {
    if (!live) return 'Čakám na dáta…'
    return estimateConsumption(live, fuelMode).noteSk
  }, [live, fuelMode])

  const value: SessionValue = {
    screen,
    setScreen,
    settings,
    profile,
    fuelMode,
    setFuelMode,
    status,
    error,
    devices,
    scanning,
    live,
    capability,
    mil,
    vin,
    initLog,
    dtcs,
    freeze,
    dtcBusy,
    trip,
    trips,
    events,
    lastScore,
    consumptionNote,
    native: isAndroidNative(),
    refreshDevices,
    connectDevice,
    disconnect,
    setDemo,
    saveCar,
    startTrip,
    stopTrip,
    refreshDtcs,
    clearDtcs,
    injectDemoJerk,
  }

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession mimo providera')
  return ctx
}

export { fuelLabel }
