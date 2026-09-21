export type PidId = string

export type LiveKey =
  | 'rpm'
  | 'speed'
  | 'load'
  | 'coolant'
  | 'voltage'
  | 'throttle'
  | 'stft'
  | 'ltft'
  | 'o2b1s1'
  | 'intakeTemp'
  | 'map'
  | 'maf'
  | 'runtime'
  | 'fuelRate'
  | 'fuelLevel'

export type PidDef = {
  mode: number
  pid: number
  key: LiveKey
  bytes: number
  unit: string
  labelSk: string
  decode: (data: number[]) => number
}

function u8(data: number[], i = 0): number {
  return data[i] ?? 0
}

function u16(data: number[]): number {
  return (u8(data, 0) << 8) + u8(data, 1)
}

export const LIVE_PIDS: PidDef[] = [
  {
    mode: 1,
    pid: 0x0c,
    key: 'rpm',
    bytes: 2,
    unit: 'ot/min',
    labelSk: 'Otáčky',
    decode: (d) => u16(d) / 4,
  },
  {
    mode: 1,
    pid: 0x0d,
    key: 'speed',
    bytes: 1,
    unit: 'km/h',
    labelSk: 'Rýchlosť',
    decode: (d) => u8(d),
  },
  {
    mode: 1,
    pid: 0x04,
    key: 'load',
    bytes: 1,
    unit: '%',
    labelSk: 'Záťaž motora',
    decode: (d) => (u8(d) * 100) / 255,
  },
  {
    mode: 1,
    pid: 0x05,
    key: 'coolant',
    bytes: 1,
    unit: '°C',
    labelSk: 'Teplota vody',
    decode: (d) => u8(d) - 40,
  },
  {
    mode: 1,
    pid: 0x42,
    key: 'voltage',
    bytes: 2,
    unit: 'V',
    labelSk: 'Napätie palubnej siete',
    decode: (d) => u16(d) / 1000,
  },
  {
    mode: 1,
    pid: 0x11,
    key: 'throttle',
    bytes: 1,
    unit: '%',
    labelSk: 'Plyn (škrtiaca klapka)',
    decode: (d) => (u8(d) * 100) / 255,
  },
  {
    mode: 1,
    pid: 0x06,
    key: 'stft',
    bytes: 1,
    unit: '%',
    labelSk: 'Krátkodobá korekcia (STFT)',
    decode: (d) => ((u8(d) - 128) * 100) / 128,
  },
  {
    mode: 1,
    pid: 0x07,
    key: 'ltft',
    bytes: 1,
    unit: '%',
    labelSk: 'Dlhodobá korekcia (LTFT)',
    decode: (d) => ((u8(d) - 128) * 100) / 128,
  },
  {
    mode: 1,
    pid: 0x14,
    key: 'o2b1s1',
    bytes: 2,
    unit: 'V',
    labelSk: 'Lambda sonda (bank 1)',
    decode: (d) => u8(d) / 200,
  },
  {
    mode: 1,
    pid: 0x0f,
    key: 'intakeTemp',
    bytes: 1,
    unit: '°C',
    labelSk: 'Teplota nasávaného vzduchu',
    decode: (d) => u8(d) - 40,
  },
  {
    mode: 1,
    pid: 0x0b,
    key: 'map',
    bytes: 1,
    unit: 'kPa',
    labelSk: 'Podtlak v sací (MAP)',
    decode: (d) => u8(d),
  },
  {
    mode: 1,
    pid: 0x10,
    key: 'maf',
    bytes: 2,
    unit: 'g/s',
    labelSk: 'Množstvo vzduchu (MAF)',
    decode: (d) => u16(d) / 100,
  },
  {
    mode: 1,
    pid: 0x1f,
    key: 'runtime',
    bytes: 2,
    unit: 's',
    labelSk: 'Čas od štartu',
    decode: (d) => u16(d),
  },
  {
    mode: 1,
    pid: 0x5e,
    key: 'fuelRate',
    bytes: 2,
    unit: 'l/h',
    labelSk: 'Prietok paliva',
    decode: (d) => u16(d) / 20,
  },
  {
    mode: 1,
    pid: 0x2f,
    key: 'fuelLevel',
    bytes: 1,
    unit: '%',
    labelSk: 'Hladina paliva',
    decode: (d) => (u8(d) * 100) / 255,
  },
]

export const PID_BY_HEX = new Map(
  LIVE_PIDS.map((p) => [pidHex(p.mode, p.pid), p]),
)

export function pidHex(mode: number, pid: number): string {
  return `${mode.toString(16).padStart(2, '0')}${pid.toString(16).padStart(2, '0')}`.toUpperCase()
}

export function pidKey(pid: number): string {
  return pid.toString(16).padStart(2, '0').toUpperCase()
}

export const BITMAP_PIDS = [0x00, 0x20, 0x40, 0x60, 0x80, 0xa0, 0xc0] as const
