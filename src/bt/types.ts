export type BtDevice = {
  name: string
  address: string
}

export type SerialTransport = {
  kind: 'native' | 'mock'
  listPaired(): Promise<BtDevice[]>
  scanNearby(): Promise<BtDevice[]>
  ensureReady(): Promise<void>
  connect(address: string): Promise<void>
  disconnect(): Promise<void>
  isConnected(): Promise<boolean>
  write(value: string): Promise<void>
  read(): Promise<string>
}

export class ObdError extends Error {
  readonly code: string
  readonly slovak: string

  constructor(code: string, slovak: string, cause?: unknown) {
    super(slovak)
    this.name = 'ObdError'
    this.code = code
    this.slovak = slovak
    if (cause !== undefined) {
      this.cause = cause
    }
  }
}

export const SK = {
  btOff: 'Bluetooth nie je zapnuté. Zapni ho v nastaveniach telefónu.',
  btPerms: 'Chýbajú oprávnenia Bluetooth / poloha. Povoľ ich pre Cruze OBD.',
  btWeb: 'Bluetooth Classic (SPP) ide len na Androide. Na webe použi demo režim.',
  connectFail:
    'Nepodarilo sa pripojiť na ELM327. Skontroluj párovanie, vzdialenosť a že adaptér svieti.',
  timeout:
    'Adaptér neodpovedá. Lacné Mini klony občas vypadnú — skúsim znova, alebo ho odpoj a zapoj.',
  noData: 'Riadiaca jednotka na tento dotaz neodpovedala (NO DATA).',
  bus: 'Zbernica OBD sa nenaštartovala. Zapni zapaľovanie (nie len ACC) a skús znova.',
  unsupported: 'Tento parameter auto nevie — nie je v capability scan.',
  generic: 'Niečo sa pokazilo pri komunikácii s ELM327.',
  reconnecting: 'Spojenie spadlo. Pripájam znova…',
} as const
