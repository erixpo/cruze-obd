import { BITMAP_PIDS, pidKey } from './pids'
import { decodeBitmap, parsePidReply } from './parse'

export type Capability = {
  supportedPids: number[]
  labels: { pid: string; supported: boolean; labelSk: string }[]
  scannedAt: number
}

const PID_LABELS: Record<number, string> = {
  0x01: 'Kontrolka motora / pripravenosť',
  0x04: 'Záťaž motora',
  0x05: 'Teplota vody',
  0x06: 'Krátkodobá korekcia',
  0x07: 'Dlhodobá korekcia',
  0x0b: 'MAP',
  0x0c: 'Otáčky',
  0x0d: 'Rýchlosť',
  0x0f: 'Teplota sania',
  0x10: 'MAF',
  0x11: 'Plyn',
  0x14: 'Lambda sonda',
  0x1f: 'Čas od štartu',
  0x2f: 'Hladina paliva',
  0x42: 'Napätie',
  0x5e: 'Prietok paliva',
}

export function buildCapability(supported: number[]): Capability {
  const curated = [0x01, 0x04, 0x05, 0x06, 0x07, 0x0b, 0x0c, 0x0d, 0x0f, 0x10, 0x11, 0x14, 0x1f, 0x2f, 0x42, 0x5e]
  const set = new Set(supported)
  return {
    supportedPids: [...supported].sort((a, b) => a - b),
    labels: curated.map((pid) => ({
      pid: pidKey(pid),
      supported: set.has(pid),
      labelSk: PID_LABELS[pid] ?? `PID ${pidKey(pid)}`,
    })),
    scannedAt: Date.now(),
  }
}

export function parseSupportedFromReply(raw: string, bitmapPid: number): number[] {
  const reply = parsePidReply(raw, 0x01, bitmapPid)
  return decodeBitmap(reply.data, bitmapPid)
}

export function nextBitmapPid(supported: number[], current: number): number | null {
  const idx = BITMAP_PIDS.indexOf(current as (typeof BITMAP_PIDS)[number])
  if (idx < 0 || idx + 1 >= BITMAP_PIDS.length) return null
  const upcoming = BITMAP_PIDS[idx + 1]
  if (upcoming === undefined) return null
  if (supported.includes(upcoming)) return upcoming
  return null
}
