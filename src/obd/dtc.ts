export type DtcStatus = 'stored' | 'pending'

export type DtcEntry = {
  code: string
  labelSk: string
  status: DtcStatus
}

const FIRST = ['P', 'C', 'B', 'U'] as const

export function decodeDtcWord(a: number, b: number): string | null {
  if (a === 0 && b === 0) return null
  const type = FIRST[(a >> 6) & 0x03] ?? 'P'
  const d1 = (a >> 4) & 0x03
  const d2 = a & 0x0f
  const d3 = (b >> 4) & 0x0f
  const d4 = b & 0x0f
  return `${type}${d1}${d2.toString(16).toUpperCase()}${d3.toString(16).toUpperCase()}${d4.toString(16).toUpperCase()}`
}

export function parseDtcPayload(bytes: number[], status: DtcStatus): DtcEntry[] {
  const start = bytes[0] === 0x43 || bytes[0] === 0x47 ? 1 : 0
  const rest = bytes.slice(start)
  const codes: DtcEntry[] = []
  const seen = new Set<string>()
  for (let i = 0; i + 1 < rest.length; i += 2) {
    const code = decodeDtcWord(rest[i] ?? 0, rest[i + 1] ?? 0)
    if (!code || seen.has(code)) continue
    seen.add(code)
    codes.push({ code, labelSk: describeDtc(code), status })
  }
  return codes
}

/** Common P0xxx — human Slovak, not a workshop bible. */
const DTC_SK: Record<string, string> = {
  P0100: 'Váha vzduchu (MAF) — okruh',
  P0101: 'Váha vzduchu (MAF) — rozsah / výkon',
  P0102: 'Váha vzduchu (MAF) — príliš nízky signál',
  P0103: 'Váha vzduchu (MAF) — príliš vysoký signál',
  P0105: 'Snímač podtlaku (MAP) — okruh',
  P0106: 'MAP — rozsah / výkon',
  P0107: 'MAP — nízky signál',
  P0108: 'MAP — vysoký signál',
  P0110: 'Teplota nasávaného vzduchu — okruh',
  P0112: 'Teplota nasávaného vzduchu — nízky signál',
  P0113: 'Teplota nasávaného vzduchu — vysoký signál',
  P0115: 'Teplota chladiacej kvapaliny — okruh',
  P0117: 'Teplota vody — nízky signál',
  P0118: 'Teplota vody — vysoký signál',
  P0120: 'Škrtiaca klapka / pedál — okruh A',
  P0121: 'Škrtiaca klapka — rozsah / výkon',
  P0122: 'Škrtiaca klapka — nízky signál',
  P0123: 'Škrtiaca klapka — vysoký signál',
  P0130: 'Lambda sonda bank 1 snímač 1 — okruh',
  P0131: 'Lambda 1 — nízke napätie',
  P0132: 'Lambda 1 — vysoké napätie',
  P0133: 'Lambda 1 — pomalá odozva (typické pri LPG)',
  P0134: 'Lambda 1 — žiadna aktivita',
  P0135: 'Ohrev lambdy bank 1 snímač 1',
  P0136: 'Lambda bank 1 snímač 2 — okruh',
  P0170: 'Úprava zmesi bank 1',
  P0171: 'Zmes príliš chudá (bank 1) — často sanie / LPG',
  P0172: 'Zmes príliš bohatá (bank 1)',
  P0201: 'Vstrekovač valec 1',
  P0202: 'Vstrekovač valec 2',
  P0203: 'Vstrekovač valec 3',
  P0204: 'Vstrekovač valec 4',
  P0300: 'Vynechávanie zapaľovania — náhodné',
  P0301: 'Vynechávanie — valec 1',
  P0302: 'Vynechávanie — valec 2',
  P0303: 'Vynechávanie — valec 3',
  P0304: 'Vynechávanie — valec 4',
  P0325: 'Klepací snímač — okruh',
  P0335: 'Snímač kľukového hriadeľa — okruh',
  P0340: 'Snímač vačky — okruh',
  P0400: 'EGR — prietok',
  P0420: 'Katalyzátor — účinnosť pod prahom (bank 1)',
  P0440: 'EVAP — systém',
  P0442: 'EVAP — malý únik',
  P0455: 'EVAP — veľký únik (často viečko nádrže)',
  P0500: 'Snímač rýchlosti vozidla',
  P0560: 'Napätie systému',
  P0562: 'Napätie systému — nízke',
  P0563: 'Napätie systému — vysoké',
  P0600: 'Komunikácia riadiacich jednotiek',
  P0606: 'Riadiaca jednotka motora — procesor',
  P0700: 'Prevodovka — požiadavka na kontrolku',
  P2135: 'Škrtiaca klapka — korelácia snímačov',
  P2177: 'Systém príliš chudý mimo voľnobehu',
  P2187: 'Systém príliš chudý na voľnobehu',
  P2188: 'Systém príliš bohatý na voľnobehu',
  P2195: 'Lambda 1 — stále chudá',
  P2196: 'Lambda 1 — stále bohatá',
  P2270: 'Lambda za katalyzátorom — stále chudá',
  P2271: 'Lambda za katalyzátorom — stále bohatá',
}

export function describeDtc(code: string): string {
  return DTC_SK[code] ?? `Kód ${code} — v slovníku ho zatiaľ nemám, pozri podľa kódu.`
}

export type MilStatus = {
  milOn: boolean
  dtcCount: number
  readySk: string[]
  notReadySk: string[]
}

const MONITORS = [
  'Katalyzátor',
  'Ohrev katalyzátora',
  'Odparovanie paliva (EVAP)',
  'Sekundárny vzduch',
  'A/C chladivo',
  'Kyslíkové sondy',
  'Ohrev lambda sond',
  'EGR / VVT',
] as const

export function parsePid01(data: number[]): MilStatus {
  const a = data[0] ?? 0
  const b = data[1] ?? 0
  const c = data[2] ?? 0
  const d = data[3] ?? 0
  const milOn = (a & 0x80) !== 0
  const dtcCount = a & 0x7f
  const readySk: string[] = []
  const notReadySk: string[] = []
  // Continuous monitors in B bits 0-2 are inverted (0 = ready)
  const continuous = ['Vynechávanie zapaľovania', 'Palivový systém', 'Komponenty']
  for (let i = 0; i < 3; i++) {
    const supported = (b & (1 << i)) !== 0
    const incomplete = (b & (1 << (4 + i))) !== 0
    if (!supported) continue
    if (incomplete) notReadySk.push(continuous[i] ?? 'Monitor')
    else readySk.push(continuous[i] ?? 'Monitor')
  }
  for (let i = 0; i < 8; i++) {
    const supported = (c & (1 << i)) !== 0
    const incomplete = (d & (1 << i)) !== 0
    if (!supported) continue
    const name = MONITORS[i] ?? `Monitor ${i}`
    if (incomplete) notReadySk.push(name)
    else readySk.push(name)
  }
  return { milOn, dtcCount, readySk, notReadySk }
}
