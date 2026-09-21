import { describe, expect, it } from 'vitest'
import { scoreDrive } from './score'
import type { LiveSnapshot } from '../store/types'

function sample(partial: Partial<LiveSnapshot>): LiveSnapshot {
  return {
    timestamp: Date.now(),
    fuelMode: 'lpg',
    rpm: 1800,
    speed: 50,
    load: 30,
    coolant: 88,
    voltage: 14.1,
    stft: 1,
    ltft: 2,
    ...partial,
  }
}

describe('after-drive score', () => {
  it('flags fat trims', () => {
    const samples = Array.from({ length: 8 }, (_, i) =>
      sample({ timestamp: 1000 + i * 900, stft: 14, ltft: 12 }),
    )
    const result = scoreDrive(samples, [], 20_000)
    expect(result.alerts.some((a) => a.title.includes('Korekcie'))).toBe(true)
    expect(result.score).toBeLessThan(80)
  })
})
