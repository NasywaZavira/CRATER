/**
 * Mars solar time calculations based on the NASA GISS Mars24 algorithm
 * (Allison & McEwen 2000, with the Mars24 modified MST expression).
 *
 * The browser supplies Unix-epoch milliseconds (the UT-like system time used by the Mars24 recipe). We estimate TT−UTC from the
 * historical leap-second table (and Mars24's pre-1972 polynomial), then calculate
 * Mars Mean Solar Time and Local Mean Solar Time.
 *
 * The base longitude is deliberately 0 degrees west (Airy-0/prime-meridian
 * reference) until the ENAM mission's actual Mars outpost longitude is agreed.
 */

export const MARS_SOL_LENGTH_EARTH_DAYS = 1.0274912517
export const MARS_SOL_LENGTH_EARTH_SECONDS = MARS_SOL_LENGTH_EARTH_DAYS * 86_400
export const MARS_SITE_LONGITUDE_WEST_DEG = 0
export const MARS_SITE_LABEL = 'AIRY-0 / PRIME MERIDIAN REFERENCE'

// IERS Bulletin C 72 (2026-07-06): TAI - UTC = 37 s from 2017-01-01.
// TT - UTC = (TAI - UTC) + 32.184 s = 69.184 s.
// IERS Bulletin C 72 also states that no leap second is planned for 2026-12-31.
// Update this constant only when IERS announces a later leap-second change.
const JD_UNIX_EPOCH = 2_440_587.5
const SECONDS_PER_EARTH_DAY = 86_400
const MARS24_JD_REFERENCE_TT = 2_451_549.5
const MARS24_SOL_EPOCH = 44_796.0
const MARS24_EPOCH_CORRECTION = 0.0009626

export interface MarsTimeReading {
  /** Integer part of the global Mars Sol Date (MSD), independent of longitude. */
  solNumber: number
  /** Fractional global Mars Sol Date before applying the local longitude offset. */
  marsSolDate: number
  /** 24-hour Mars clock, formatted HH:MM:SS. */
  clock: string
  hour: number
  minute: number
  second: number
  /** Local Mean Solar Time in decimal Mars hours. */
  localMeanSolarHours: number
  /** Julian Date in Terrestrial Time, useful for diagnostics. */
  julianDateTT: number
  /** Configured west longitude in degrees. */
  longitudeWestDegrees: number
  ttMinusUtcSeconds: number
}

const TAI_MINUS_UTC_EFFECTIVE: ReadonlyArray<readonly [number, number]> = [
  [Date.UTC(1972, 0, 1), 10],
  [Date.UTC(1972, 6, 1), 11],
  [Date.UTC(1973, 0, 1), 12],
  [Date.UTC(1974, 0, 1), 13],
  [Date.UTC(1975, 0, 1), 14],
  [Date.UTC(1976, 0, 1), 15],
  [Date.UTC(1977, 0, 1), 16],
  [Date.UTC(1978, 0, 1), 17],
  [Date.UTC(1979, 0, 1), 18],
  [Date.UTC(1980, 0, 1), 19],
  [Date.UTC(1981, 6, 1), 20],
  [Date.UTC(1982, 6, 1), 21],
  [Date.UTC(1983, 6, 1), 22],
  [Date.UTC(1985, 6, 1), 23],
  [Date.UTC(1988, 0, 1), 24],
  [Date.UTC(1990, 0, 1), 25],
  [Date.UTC(1991, 0, 1), 26],
  [Date.UTC(1992, 6, 1), 27],
  [Date.UTC(1993, 6, 1), 28],
  [Date.UTC(1994, 6, 1), 29],
  [Date.UTC(1996, 0, 1), 30],
  [Date.UTC(1997, 6, 1), 31],
  [Date.UTC(1999, 0, 1), 32],
  [Date.UTC(2006, 0, 1), 33],
  [Date.UTC(2009, 0, 1), 34],
  [Date.UTC(2012, 6, 1), 35],
  [Date.UTC(2015, 6, 1), 36],
  [Date.UTC(2017, 0, 1), 37],
]

/** Returns TT−UTC in seconds using the leap-second history and the pre-1972 Mars24 polynomial. */
export function getTtMinusUtcSeconds(earthDate: Date): number {
  const unixMilliseconds = earthDate.getTime()
  const firstLeapSecondEpoch = TAI_MINUS_UTC_EFFECTIVE[0][0]

  if (unixMilliseconds >= firstLeapSecondEpoch) {
    let taiMinusUtc = 10
    for (const [effectiveUtc, offset] of TAI_MINUS_UTC_EFFECTIVE) {
      if (unixMilliseconds < effectiveUtc) break
      taiMinusUtc = offset
    }
    // IERS Bulletin C 72 (2026-07-06): TAI−UTC remains 37 s; no leap second at 2026-12-31.
    // TT−UTC = TAI−UTC + 32.184 s. Update the table if a later IERS bulletin announces a change.
    return taiMinusUtc + 32.184
  }

  const jdUT = JD_UNIX_EPOCH + unixMilliseconds / (SECONDS_PER_EARTH_DAY * 1_000)
  const centuriesSinceJ2000 = (jdUT - 2_451_545.0) / 36_525
  return (
    64.184 +
    59 * centuriesSinceJ2000 -
    51.2 * centuriesSinceJ2000 ** 2 -
    67.1 * centuriesSinceJ2000 ** 3 -
    16.4 * centuriesSinceJ2000 ** 4
  )
}

function positiveModulo(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus
}

function twoDigits(value: number): string {
  return String(value).padStart(2, '0')
}

/**
 * Calculate Mars Local Mean Solar Time (LMST).
 *
 * 1) JD_UT = 2440587.5 + UnixMilliseconds / 86400000
 * 2) JD_TT = JD_UT + (TT - UTC) / 86400
 * 3) d = (JD_TT - 2451549.5) / 1.0274912517 + 44796 - 0.0009626
 * 4) MST = mod_24(24 d)
 * 5) LMST = mod_24(MST - longitudeWest / 15)
 * 6) Global Mars Sol Date (MSD) = d; its integer part is the global Sol count.
 * 7) Local clock fraction = mod_1(d - longitudeWest / 360).
 *
 * NASA Mars24 expresses local longitude in degrees west. East longitudes
 * should therefore be supplied as a negative west longitude.
 */
export function calculateMarsTime(
  earthDate: Date = new Date(),
  longitudeWestDegrees: number = MARS_SITE_LONGITUDE_WEST_DEG,
): MarsTimeReading {
  const unixMilliseconds = earthDate.getTime()
  if (!Number.isFinite(unixMilliseconds)) {
    throw new Error('calculateMarsTime requires a valid Earth Date.')
  }
  if (!Number.isFinite(longitudeWestDegrees) || Math.abs(longitudeWestDegrees) > 360) {
    throw new Error('Mars longitude must be a finite degree value between -360 and 360.')
  }

  const julianDateUT = JD_UNIX_EPOCH + unixMilliseconds / (SECONDS_PER_EARTH_DAY * 1_000)
  const ttMinusUtcSeconds = getTtMinusUtcSeconds(earthDate)
  const julianDateTT = julianDateUT + ttMinusUtcSeconds / SECONDS_PER_EARTH_DAY

  const solDateAtPrimeMeridian =
    (julianDateTT - MARS24_JD_REFERENCE_TT) / MARS_SOL_LENGTH_EARTH_DAYS +
    MARS24_SOL_EPOCH -
    MARS24_EPOCH_CORRECTION

  const localSolDate = solDateAtPrimeMeridian - longitudeWestDegrees / 360
  // MSD is a global sequential count. Longitude shifts local time, not the global MSD label.
  const solNumber = Math.floor(solDateAtPrimeMeridian)
  const fractionalSol = positiveModulo(localSolDate, 1)
  const totalMarsSeconds = Math.min(
    SECONDS_PER_EARTH_DAY - 1,
    Math.floor(fractionalSol * SECONDS_PER_EARTH_DAY),
  )

  const hour = Math.floor(totalMarsSeconds / 3_600)
  const minute = Math.floor((totalMarsSeconds % 3_600) / 60)
  const second = totalMarsSeconds % 60
  const localMeanSolarHours = totalMarsSeconds / 3_600

  return {
    solNumber,
    marsSolDate: solDateAtPrimeMeridian,
    clock: `${twoDigits(hour)}:${twoDigits(minute)}:${twoDigits(second)}`,
    hour,
    minute,
    second,
    localMeanSolarHours,
    julianDateTT,
    longitudeWestDegrees,
    ttMinusUtcSeconds,
  }
}
