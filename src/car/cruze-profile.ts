export type FuelMode = 'benzin' | 'lpg'

export type CarProfile = {
  ownerNote: string
  make: string
  model: string
  year: number
  engine: string
  powerKw: number
  bodyCode: string
  engineCode: string
  fuel: string
  sparkPlugs: string
  stkDue: string
  lpgNotes: string
  benzinPriceEur: number
  lpgPriceEur: number
}

export const CRUZE_DEFAULTS: CarProfile = {
  ownerNote: 'Erikove auto — defaulty pre 2012 Cruze 1.8 LPG.',
  make: 'Chevrolet',
  model: 'Cruze',
  year: 2012,
  engine: '1.8 l, 104 kW',
  powerKw: 104,
  bodyCode: '2H0',
  engineCode: 'A18XER',
  fuel: 'Benzín + LPG',
  sparkPlugs: 'Bosch FQR8LEU2',
  stkDue: '2026-09-30',
  lpgNotes:
    'Pri trhnutí na LPG sleduj STFT/LTFT a otáčky. Reduktor a filtre nie sú cez ELM Mini — to ostáva vizuál / servis.',
  benzinPriceEur: 1.55,
  lpgPriceEur: 0.72,
}

export function fuelLabel(mode: FuelMode): string {
  return mode === 'lpg' ? 'LPG' : 'Benzín'
}
