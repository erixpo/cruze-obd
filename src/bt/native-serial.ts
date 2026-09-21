import { Capacitor } from '@capacitor/core'
import { BluetoothSerial } from '@ascentio-it/capacitor-bluetooth-serial'
import { ObdError, SK, type BtDevice, type SerialTransport } from './types'

export function isAndroidNative(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
}

function asMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}

export class NativeSerialTransport implements SerialTransport {
  kind = 'native' as const
  private address = ''

  async listPaired(): Promise<BtDevice[]> {
    const result = await BluetoothSerial.getPairedDevices()
    return result.devices.map((d) => ({
      name: d.name || 'Neznáme zariadenie',
      address: d.address,
    }))
  }

  async scanNearby(): Promise<BtDevice[]> {
    const result = await BluetoothSerial.scan()
    return result.devices.map((d) => ({
      name: d.name || 'Neznáme zariadenie',
      address: d.address ?? d.id,
    }))
  }

  async ensureReady(): Promise<void> {
    try {
      const granted = await BluetoothSerial.checkBluetoothPermissions()
      if (!granted) {
        await BluetoothSerial.enable()
      }
    } catch (err) {
      throw new ObdError('bt-perm', SK.btPerms, err)
    }

    const state = await BluetoothSerial.isEnabled()
    if (!state.enabled) {
      const after = await BluetoothSerial.enable()
      if (!after.enabled) {
        throw new ObdError('bt-off', SK.btOff)
      }
    }
  }

  async connect(address: string): Promise<void> {
    this.address = address
    try {
      // Cheap ELM327 Mini clones almost always need insecure RFCOMM.
      await BluetoothSerial.connectInsecure({ address })
    } catch (insecureErr) {
      try {
        await BluetoothSerial.connect({ address })
      } catch (secureErr) {
        throw new ObdError(
          'connect',
          `${SK.connectFail} (${asMessage(secureErr) || asMessage(insecureErr)})`,
          secureErr,
        )
      }
    }
  }

  async disconnect(): Promise<void> {
    if (!this.address) return
    try {
      await BluetoothSerial.disconnect({ address: this.address })
    } catch {
      // ignore — already gone
    }
  }

  async isConnected(): Promise<boolean> {
    if (!this.address) return false
    try {
      const result = await BluetoothSerial.isConnected({ address: this.address })
      return result.connected
    } catch {
      return false
    }
  }

  async write(value: string): Promise<void> {
    if (!this.address) throw new ObdError('write', SK.generic)
    await BluetoothSerial.write({ address: this.address, value })
  }

  async read(): Promise<string> {
    if (!this.address) return ''
    const result = await BluetoothSerial.read({ address: this.address })
    return result.value ?? ''
  }
}
