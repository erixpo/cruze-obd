import { buildCapability, type Capability } from './capability'
import type { DtcEntry, MilStatus } from './dtc'
import type { FreezeFrame, LiveValues, ObdClient } from './client'

const SUPPORTED = [
  0x01, 0x04, 0x05, 0x06, 0x07, 0x0b, 0x0c, 0x0d, 0x0f, 0x10, 0x11, 0x14, 0x1f, 0x2f, 0x42,
]

export class MockObdClient implements ObdClient {
  kind = 'mock' as const
  private t0 = Date.now()
  private jerkAt = 0

  triggerJerk(): void {
    this.jerkAt = Date.now()
  }

  async init(): Promise<string[]> {
    return [
      'ATZ → ELM327 v1.5 (demo)',
      'ATE0 → OK',
      'ATL0 → OK',
      'ATS0 → OK',
      'ATH0 → OK',
      'ATSP0 → OK / AUTO',
    ]
  }

  async scanCapabilities(): Promise<Capability> {
    return buildCapability(SUPPORTED)
  }

  async readLive(_supported: Set<number>): Promise<LiveValues> {
    const t = (Date.now() - this.t0) / 1000
    const warming = Math.min(1, t / 90)
    const cruise = 0.5 + 0.5 * Math.sin(t / 7)
    let rpm = 820 + cruise * 1600 + Math.sin(t * 3) * 40
    const sinceJerk = Date.now() - this.jerkAt
    if (sinceJerk < 900) {
      rpm -= 480 * (1 - sinceJerk / 900)
    }
    const speed = Math.max(0, 18 + cruise * 62 + Math.sin(t / 5) * 6)
    const load = 18 + cruise * 42 + (sinceJerk < 900 ? 18 : 0)
    const stft = Math.sin(t / 2.4) * 6 + (sinceJerk < 1200 ? 8 : 0)
    const ltft = 3.2 + Math.sin(t / 40) * 1.4
    return {
      rpm: clamp(rpm, 700, 4200),
      speed,
      load: clamp(load, 8, 95),
      coolant: 38 + warming * 52,
      voltage: 13.9 + Math.sin(t / 11) * 0.18 - (sinceJerk < 400 ? 0.35 : 0),
      throttle: clamp(8 + cruise * 28, 0, 100),
      stft,
      ltft,
      o2b1s1: 0.45 + Math.sin(t * 2.1) * 0.35,
      intakeTemp: 22 + warming * 8,
      map: 32 + cruise * 28,
      maf: 3.2 + cruise * 9.5,
      runtime: Math.floor(t),
      fuelLevel: 62,
    }
  }

  async readMil(): Promise<MilStatus | null> {
    return {
      milOn: false,
      dtcCount: 1,
      readySk: ['Vynechávanie zapaľovania', 'Palivový systém', 'Komponenty', 'Kyslíkové sondy'],
      notReadySk: ['Odparovanie paliva (EVAP)'],
    }
  }

  async readDtcs(): Promise<DtcEntry[]> {
    return [
      {
        code: 'P0171',
        labelSk: 'Zmes príliš chudá (bank 1) — často sanie / LPG',
        status: 'stored',
      },
    ]
  }

  async readPending(): Promise<DtcEntry[]> {
    return [
      {
        code: 'P0133',
        labelSk: 'Lambda 1 — pomalá odozva (typické pri LPG)',
        status: 'pending',
      },
    ]
  }

  async clearDtcs(): Promise<void> {}

  async readFreezeFrame(_supported: Set<number>): Promise<FreezeFrame | null> {
    return {
      dtc: 'P0171',
      values: { rpm: 1840, speed: 42, load: 38, coolant: 81, stft: 14.8, ltft: 9.4 },
    }
  }

  async readVin(): Promise<string | null> {
    return 'W0L0XCF68C4123456'
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}
