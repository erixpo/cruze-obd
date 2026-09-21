import type { BtDevice, SerialTransport } from './types'

/** Demo transport — no bytes on the wire. The mock OBD client drives gauges. */
export class MockSerialTransport implements SerialTransport {
  kind = 'mock' as const
  private connected = false

  async listPaired(): Promise<BtDevice[]> {
    return [
      { name: 'ELM327 Mini (demo)', address: '00:1D:A5:00:00:01' },
      { name: 'OBDII (demo)', address: 'AA:BB:CC:11:22:33' },
    ]
  }

  async scanNearby(): Promise<BtDevice[]> {
    return this.listPaired()
  }

  async ensureReady(): Promise<void> {}

  async connect(_address: string): Promise<void> {
    this.connected = true
  }

  async disconnect(): Promise<void> {
    this.connected = false
  }

  async isConnected(): Promise<boolean> {
    return this.connected
  }

  async write(_value: string): Promise<void> {}

  async read(): Promise<string> {
    return ''
  }
}
