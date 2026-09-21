import { ObdError, SK, type SerialTransport } from '../bt/types'
import { buildCapability, nextBitmapPid, type Capability } from './capability'
import { parseDtcPayload, parsePid01, type DtcEntry, type MilStatus } from './dtc'
import { ElmLink } from './elm'
import { assertElmOk, decodeVin, hexBytes, parsePidReply } from './parse'
import { BITMAP_PIDS, LIVE_PIDS, type LiveKey } from './pids'

export type LiveValues = Partial<Record<LiveKey, number>>

export type FreezeFrame = {
  dtc?: string
  values: LiveValues
}

export type ObdClient = {
  kind: 'native' | 'mock'
  init(): Promise<string[]>
  scanCapabilities(): Promise<Capability>
  readLive(supported: Set<number>): Promise<LiveValues>
  readMil(): Promise<MilStatus | null>
  readDtcs(): Promise<DtcEntry[]>
  readPending(): Promise<DtcEntry[]>
  clearDtcs(): Promise<void>
  readFreezeFrame(supported: Set<number>): Promise<FreezeFrame | null>
  readVin(): Promise<string | null>
}

export class ElmObdClient implements ObdClient {
  kind = 'native' as const
  private readonly elm: ElmLink
  private reconnecting = false

  private readonly transport: SerialTransport
  private readonly address: string
  private readonly onReconnect?: (msg: string) => void

  constructor(transport: SerialTransport, address: string, onReconnect?: (msg: string) => void) {
    this.transport = transport
    this.address = address
    this.onReconnect = onReconnect
    this.elm = new ElmLink(transport)
  }

  async init(): Promise<string[]> {
    return this.elm.init()
  }

  async scanCapabilities(): Promise<Capability> {
    const supported: number[] = []
    let bitmap: number | null = BITMAP_PIDS[0] ?? 0x00
    while (bitmap !== null) {
      try {
        const raw = await this.safeRequest(`01${bitmap.toString(16).padStart(2, '0').toUpperCase()}`, 3500)
        const reply = parsePidReply(raw, 0x01, bitmap)
        const chunk = decodeBitmapSafe(reply.data, bitmap)
        supported.push(...chunk)
        bitmap = nextBitmapPid(supported, bitmap)
      } catch {
        break
      }
    }
    return buildCapability([...new Set(supported)])
  }

  async readLive(supported: Set<number>): Promise<LiveValues> {
    const values: LiveValues = {}
    for (const def of LIVE_PIDS) {
      if (!supported.has(def.pid)) continue
      try {
        const raw = await this.safeRequest(
          `${def.mode.toString(16).padStart(2, '0')}${def.pid.toString(16).padStart(2, '0')}`.toUpperCase(),
        )
        const reply = parsePidReply(raw, def.mode, def.pid)
        values[def.key] = def.decode(reply.data)
      } catch (err) {
        if (err instanceof ObdError && err.code === 'no-data') continue
        throw err
      }
    }
    return values
  }

  async readMil(): Promise<MilStatus | null> {
    try {
      const raw = await this.safeRequest('0101')
      const reply = parsePidReply(raw, 0x01, 0x01)
      return parsePid01(reply.data)
    } catch {
      return null
    }
  }

  async readDtcs(): Promise<DtcEntry[]> {
    const raw = await this.safeRequest('03', 4000)
    const compact = assertElmOk(raw)
    return parseDtcPayload(hexBytes(compact), 'stored')
  }

  async readPending(): Promise<DtcEntry[]> {
    try {
      const raw = await this.safeRequest('07', 4000)
      const compact = assertElmOk(raw)
      return parseDtcPayload(hexBytes(compact), 'pending')
    } catch {
      return []
    }
  }

  async clearDtcs(): Promise<void> {
    await this.safeRequest('04', 4000)
  }

  async readFreezeFrame(supported: Set<number>): Promise<FreezeFrame | null> {
    const values: LiveValues = {}
    try {
      const raw = await this.safeRequest('0202')
      const reply = parsePidReply(raw, 0x02, 0x02)
      const dtcBytes = reply.data
      const code = dtcBytes.length >= 2 ? formatFfDtc(dtcBytes[0] ?? 0, dtcBytes[1] ?? 0) : undefined
      for (const def of LIVE_PIDS) {
        if (def.pid === 0x02 || !supported.has(def.pid)) continue
        if (!['rpm', 'speed', 'load', 'coolant', 'stft', 'ltft'].includes(def.key)) continue
        try {
          const pidRaw = await this.safeRequest(`02${def.pid.toString(16).padStart(2, '0').toUpperCase()}`)
          const pidReply = parsePidReply(pidRaw, 0x02, def.pid)
          values[def.key] = def.decode(pidReply.data)
        } catch {
          // freeze frame may omit a PID
        }
      }
      if (!code && Object.keys(values).length === 0) return null
      return { dtc: code, values }
    } catch {
      return null
    }
  }

  async readVin(): Promise<string | null> {
    try {
      const raw = await this.safeRequest('0902', 4000)
      return decodeVin(raw)
    } catch {
      return null
    }
  }

  private async safeRequest(cmd: string, timeout = 2500): Promise<string> {
    try {
      return await this.elm.request(cmd, timeout)
    } catch (err) {
      if (this.reconnecting) throw err
      this.reconnecting = true
      this.onReconnect?.(SK.reconnecting)
      try {
        await this.transport.disconnect()
        await delay(600)
        await this.transport.connect(this.address)
        await this.elm.init()
        return await this.elm.request(cmd, timeout)
      } catch (retryErr) {
        throw retryErr instanceof ObdError
          ? retryErr
          : new ObdError('reconnect', SK.timeout, retryErr)
      } finally {
        this.reconnecting = false
      }
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function decodeBitmapSafe(data: number[], base: number): number[] {
  const supported: number[] = []
  for (let byteIndex = 0; byteIndex < 4; byteIndex++) {
    const value = data[byteIndex] ?? 0
    for (let bit = 0; bit < 8; bit++) {
      if (value & (1 << (7 - bit))) {
        supported.push(base + byteIndex * 8 + bit + 1)
      }
    }
  }
  return supported
}

function formatFfDtc(a: number, b: number): string | undefined {
  if (a === 0 && b === 0) return undefined
  const first = ['P', 'C', 'B', 'U'][(a >> 6) & 0x03] ?? 'P'
  return `${first}${((a >> 4) & 0x03).toString()}${(a & 0x0f).toString(16).toUpperCase()}${((b >> 4) & 0x0f).toString(16).toUpperCase()}${(b & 0x0f).toString(16).toUpperCase()}`
}
