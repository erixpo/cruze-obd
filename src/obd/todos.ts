/**
 * TODO (not in MVP):
 * - GM Mode 22 enhanced PIDs (injector pulse, LPG-adjacent OEM data on E78 / A18XER)
 * - Deep Mode 06 (on-board test results, oxygen sensor thresholds)
 * - Full A/B fuel-trim maps vs load/RPM for LPG vs benzín comparison
 *
 * These need a confirmed Cruze PID list from a real capture, not guesswork.
 */
export const FUTURE_WORK = {
  gmMode22: 'TODO: GM Mode 22 enhanced PIDs — capture on this Cruze before mapping.',
  mode06: 'TODO: Mode 06 test IDs — do not invent TID/CID values.',
  abMaps: 'TODO: A/B trim maps (LPG vs benzín) after we have trip history.',
} as const
