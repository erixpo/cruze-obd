import { describe, expect, it } from 'vitest'
import { decodeBitmap, hexBytes, normalizeElm, parsePidReply } from './parse'
import { decodeDtcWord, parseDtcPayload, parsePid01 } from './dtc'
import { nextBitmapPid } from './capability'

describe('ELM parse', () => {
  it('strips prompt and SEARCHING', () => {
    expect(normalizeElm('SEARCHING...\r\n41 0C 1A F8\r\n>')).toBe('410C1AF8')
  })

  it('decodes RPM', () => {
    const reply = parsePidReply('410C1AF8>', 0x01, 0x0c)
    expect(((reply.data[0] ?? 0) * 256 + (reply.data[1] ?? 0)) / 4).toBe(1726)
  })

  it('decodes capability bitmap 0100', () => {
    const supported = decodeBitmap(hexBytes('BE1FA813'), 0)
    expect(supported).toContain(0x0c)
    expect(supported).toContain(0x0d)
    expect(supported).toContain(0x20)
    expect(nextBitmapPid(supported, 0x00)).toBe(0x20)
  })
})

describe('DTC', () => {
  it('decodes P0171', () => {
    expect(decodeDtcWord(0x01, 0x71)).toBe('P0171')
  })

  it('parses mode 03 payload', () => {
    const list = parseDtcPayload(hexBytes('4301710133'), 'stored')
    expect(list.map((d) => d.code)).toEqual(['P0171', 'P0133'])
  })

  it('reads MIL from PID 01', () => {
    const mil = parsePid01([0x81, 0x07, 0x00, 0x00])
    expect(mil.milOn).toBe(true)
    expect(mil.dtcCount).toBe(1)
  })
})
