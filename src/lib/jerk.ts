export type AccelSample = {
  t: number
  g: number
}

export type RpmSample = {
  t: number
  rpm: number
}

export type JerkHit = {
  accelG: number
  rpmDrop: number
  rpm: number
}

const G0 = 9.81

export function accelMagnitude(x: number, y: number, z: number): number {
  return Math.hypot(x, y, z) / G0
}

export function detectJerk(
  accel: AccelSample[],
  rpm: RpmSample[],
  now = Date.now(),
): JerkHit | null {
  const recentA = accel.filter((s) => now - s.t < 400)
  if (recentA.length < 2) return null
  const peak = Math.max(...recentA.map((s) => s.g))
  const baseline = recentA.reduce((sum, s) => sum + s.g, 0) / recentA.length
  const spike = peak - Math.min(baseline, 1.05)
  if (spike < 0.55 && peak < 1.7) return null

  const window = rpm.filter((s) => now - s.t < 1400)
  if (window.length < 3) return null
  let maxDrop = 0
  let at = window[window.length - 1]?.rpm ?? 0
  for (let i = 1; i < window.length; i++) {
    const prev = window[i - 1]
    const cur = window[i]
    if (!prev || !cur) continue
    const drop = prev.rpm - cur.rpm
    if (drop > maxDrop) {
      maxDrop = drop
      at = cur.rpm
    }
  }
  if (maxDrop < 280) return null
  return { accelG: peak, rpmDrop: maxDrop, rpm: at }
}
