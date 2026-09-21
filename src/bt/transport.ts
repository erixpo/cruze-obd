import { MockSerialTransport } from './mock-serial'
import { isAndroidNative, NativeSerialTransport } from './native-serial'
import { ObdError, SK, type SerialTransport } from './types'

export function createTransport(demo: boolean): SerialTransport {
  if (demo) return new MockSerialTransport()
  if (!isAndroidNative()) {
    throw new ObdError('web', SK.btWeb)
  }
  return new NativeSerialTransport()
}

export { isAndroidNative } from './native-serial'
export { MockSerialTransport } from './mock-serial'
export { NativeSerialTransport } from './native-serial'
export { ObdError, SK } from './types'
export type { BtDevice, SerialTransport } from './types'
