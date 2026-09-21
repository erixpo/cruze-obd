import { ObdError, SK, type SerialTransport } from '../bt/types'

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export class ElmLink {
  private readonly transport: SerialTransport

  constructor(transport: SerialTransport) {
    this.transport = transport
  }

  async request(command: string, timeoutMs = 2500): Promise<string> {
    const payload = command.endsWith('\r') ? command : `${command}\r`
    try {
      await this.transport.write(payload)
    } catch (err) {
      throw new ObdError('write', SK.generic, err)
    }

    const started = Date.now()
    let buffer = ''
    while (Date.now() - started < timeoutMs) {
      let chunk = ''
      try {
        chunk = await this.transport.read()
      } catch (err) {
        throw new ObdError('read', SK.timeout, err)
      }
      buffer += chunk
      if (buffer.includes('>')) {
        return buffer
      }
      await sleep(40)
    }
    if (!buffer.trim()) {
      throw new ObdError('timeout', SK.timeout)
    }
    return buffer
  }

  async init(): Promise<string[]> {
    const log: string[] = []
    const steps: { cmd: string; wait: number }[] = [
      { cmd: 'ATZ', wait: 4000 },
      { cmd: 'ATE0', wait: 1500 },
      { cmd: 'ATL0', wait: 1200 },
      { cmd: 'ATS0', wait: 1200 },
      { cmd: 'ATH0', wait: 1200 },
      { cmd: 'ATSP0', wait: 4000 },
    ]
    for (const step of steps) {
      const reply = await this.request(step.cmd, step.wait)
      log.push(`${step.cmd} → ${reply.replace(/\s+/g, ' ').trim()}`)
      await sleep(80)
    }
    return log
  }
}
