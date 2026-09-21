import { ObdError, SK } from '../bt/types'

const FATAL = ['UNABLE TO CONNECT', 'BUS INIT', 'CAN ERROR', 'STOPPED', 'ERROR']

export function normalizeElm(raw: string): string {
  return raw
    .replace(/\u0000/g, '')
    .split(/\r|\n/)
    .map((line) => line.trim())
    .filter((line) => {
      if (!line || line === '>' || line === 'OK') return false
      if (line.startsWith('SEARCHING')) return false
      if (line === 'ATZ' || line.startsWith('AT') || /^0[0-9A-F]{3}$/i.test(line)) {
        return false
      }
      return true
    })
    .join('')
    .replace(/\s+/g, '')
    .toUpperCase()
}

export function assertElmOk(raw: string): string {
  const upper = raw.toUpperCase()
  if (upper.includes('NO DATA')) {
    throw new ObdError('no-data', SK.noData)
  }
  if (upper.includes('?')) {
    throw new ObdError('unknown', 'ELM327 príkaz nepochopil. Skús znova, alebo reštartuj adaptér.')
  }
  for (const token of FATAL) {
    if (upper.includes(token)) {
      throw new ObdError('bus', SK.bus)
    }
  }
  return normalizeElm(raw)
}

export function hexBytes(compact: string): number[] {
  const clean = compact.replace(/[^0-9A-F]/g, '')
  const out: number[] = []
  for (let i = 0; i + 1 < clean.length; i += 2) {
    out.push(Number.parseInt(clean.slice(i, i + 2), 16))
  }
  return out
}

export type PidResponse = {
  mode: number
  pid: number
  data: number[]
}

/** Parse a Mode 01/02 style reply: 41 0C 1A F8 */
export function parsePidReply(raw: string, expectedMode: number, expectedPid: number): PidResponse {
  const compact = assertElmOk(raw)
  const bytes = hexBytes(compact)
  const wantMode = expectedMode + 0x40
  for (let i = 0; i < bytes.length - 1; i++) {
    if (bytes[i] === wantMode && bytes[i + 1] === expectedPid) {
      return {
        mode: expectedMode,
        pid: expectedPid,
        data: bytes.slice(i + 2),
      }
    }
  }
  throw new ObdError('parse', `Odpoveď na PID ${expectedPid.toString(16)} sa nepodarilo prečítať.`)
}

export function decodeBitmap(data: number[], basePid: number): number[] {
  const supported: number[] = []
  for (let byteIndex = 0; byteIndex < 4; byteIndex++) {
    const value = data[byteIndex] ?? 0
    for (let bit = 0; bit < 8; bit++) {
      if (value & (1 << (7 - bit))) {
        supported.push(basePid + byteIndex * 8 + bit + 1)
      }
    }
  }
  return supported
}

export function decodeVin(raw: string): string | null {
  const compact = normalizeElm(raw)
  if (!compact || compact.includes('NODATA')) return null
  const bytes = hexBytes(compact)
  const ascii = bytes
    .filter((b) => b >= 0x20 && b <= 0x7e)
    .map((b) => String.fromCharCode(b))
    .join('')
    .replace(/[^A-Za-z0-9]/g, '')
  if (ascii.length >= 11) {
    return ascii.slice(-17)
  }
  return ascii || null
}
