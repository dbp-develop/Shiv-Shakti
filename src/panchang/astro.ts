/**
 * Pure astronomy layer for the panchang: sidereal (Lahiri) longitudes, rise/set
 * times and a generic angle-crossing search. No DOM, no UI imports.
 */
import { Body, C_AUDAY, EclipticGeoMoon, MakeTime, Observer, SearchRiseSet, SunPosition, e_tilt } from 'astronomy-engine';
import type { GeoLocation } from './types';

const MS_PER_DAY = 86_400_000;

function norm360(x: number): number {
  const r = x % 360;
  return r < 0 ? r + 360 : r;
}

/** IAU 2006 general precession in longitude p_A, arcseconds; T = Julian centuries (TT) from J2000. */
function generalPrecessionArcsec(T: number): number {
  return ((((-0.0000000235 * T - 0.00003173) * T + 0.0000001) * T + 1.1054348) * T + 5028.796195) * T;
}

/** Lahiri epoch (Indian Astronomical Ephemeris): mean ayanamsa 23°15′00.658″ at 1956-03-21 00:00 TT (JD 2435553.5). */
const LAHIRI_EPOCH_T = (2435553.5 - 2451545.0) / 36525;
const LAHIRI_EPOCH_DEG = 23 + 15 / 60 + 0.658 / 3600;
const LAHIRI_EPOCH_PA = generalPrecessionArcsec(LAHIRI_EPOCH_T);

/**
 * True Lahiri (Chitrapaksha) ayanamsa in degrees: the IAE mean value at its 1956 epoch,
 * advanced by IAU 2006 general precession in longitude, plus nutation in longitude
 * (IAU 2000B, from astronomy-engine), so it pairs with true-equinox-of-date longitudes.
 */
export function lahiriAyanamsa(date: Date): number {
  const time = MakeTime(date);
  const T = time.tt / 36525;
  const meanDeg = LAHIRI_EPOCH_DEG + (generalPrecessionArcsec(T) - LAHIRI_EPOCH_PA) / 3600;
  return meanDeg + e_tilt(time).dpsi / 3600;
}

/**
 * Sidereal (Lahiri) ecliptic longitude of the Sun, degrees in [0, 360).
 * `SunPosition` is apparent: light-time (≈ aberration) corrected, true ecliptic/equinox of date.
 */
export function sunSidereal(date: Date): number {
  return norm360(SunPosition(date).elon - lahiriAyanamsa(date));
}

/**
 * Apparent geocentric tropical longitude of the Moon, true ecliptic/equinox of date.
 * `EclipticGeoMoon` is geometric (true equinox of date, nutation included); evaluating it
 * one light-time earlier (~1.3 s, ~0.7″) makes it apparent, matching `SunPosition`.
 */
function moonApparentLon(date: Date): number {
  const lightDays = EclipticGeoMoon(date).dist / C_AUDAY;
  return EclipticGeoMoon(new Date(date.getTime() - lightDays * MS_PER_DAY)).lon;
}

/** Sidereal (Lahiri) ecliptic longitude of the Moon (apparent), degrees in [0, 360). */
export function moonSidereal(date: Date): number {
  return norm360(moonApparentLon(date) - lahiriAyanamsa(date));
}

// ---------------------------------------------------------------- time zones

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function formatter(tz: string): Intl.DateTimeFormat {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    fmtCache.set(tz, f);
  }
  return f;
}

function zonedParts(d: Date, tz: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of formatter(tz).formatToParts(d)) {
    if (p.type !== 'literal') out[p.type] = Number(p.value);
  }
  return out;
}

/** Offset (local − UTC) in ms of `tz` at instant `d`. */
function tzOffsetMs(d: Date, tz: string): number {
  const p = zonedParts(d, tz);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(d.getTime() / 1000) * 1000;
}

/** 'YYYY-MM-DD' of instant `d` in time zone `tz`. */
export function localDateOf(d: Date, tz: string): string {
  const p = zonedParts(d, tz);
  return `${String(p.year).padStart(4, '0')}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

/** The instant of local midnight starting `localDate` ('YYYY-MM-DD') in `tz`. */
function localMidnight(localDate: string, tz: string): Date {
  const [y, m, d] = localDate.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d);
  let t = guess - tzOffsetMs(new Date(guess), tz);
  // Re-evaluate once in case the offset differs at the corrected instant (DST edges).
  t = guess - tzOffsetMs(new Date(t), tz);
  return new Date(t);
}

function nextLocalDate(localDate: string): string {
  const [y, m, d] = localDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

// ---------------------------------------------------------------- rise / set

function observer(loc: GeoLocation): Observer {
  return new Observer(loc.lat, loc.lng, 0);
}

/** First rise (+1) or set (−1) of `body` within the local calendar day, or null. */
function riseSetOnDay(body: Body, direction: 1 | -1, localDate: string, loc: GeoLocation): Date | null {
  const start = localMidnight(localDate, loc.tz);
  const end = localMidnight(nextLocalDate(localDate), loc.tz);
  const limitDays = (end.getTime() - start.getTime()) / MS_PER_DAY;
  const t = SearchRiseSet(body, observer(loc), direction, start, limitDays);
  if (!t || t.date.getTime() >= end.getTime()) return null;
  return t.date;
}

function mustExist(d: Date | null, what: string, localDate: string, loc: GeoLocation): Date {
  if (!d) throw new Error(`No ${what} on ${localDate} at ${loc.lat},${loc.lng}`);
  return d;
}

/** Sunrise (upper limb, standard refraction) on local date `localDate` at `loc`. */
export function sunrise(localDate: string, loc: GeoLocation): Date {
  return mustExist(riseSetOnDay(Body.Sun, +1, localDate, loc), 'sunrise', localDate, loc);
}

/** Sunset (upper limb, standard refraction) on local date `localDate` at `loc`. */
export function sunset(localDate: string, loc: GeoLocation): Date {
  return mustExist(riseSetOnDay(Body.Sun, -1, localDate, loc), 'sunset', localDate, loc);
}

/** Moonrise on the local date, or null when the Moon does not rise that day. */
export function moonrise(localDate: string, loc: GeoLocation): Date | null {
  return riseSetOnDay(Body.Moon, +1, localDate, loc);
}

/** Moonset on the local date, or null when the Moon does not set that day. */
export function moonset(localDate: string, loc: GeoLocation): Date | null {
  return riseSetOnDay(Body.Moon, -1, localDate, loc);
}

// ---------------------------------------------------------------- angle search

const SCAN_STEP_MS = 6 * 3_600_000;

/**
 * First instant after `from` at which the increasing angle `f` (degrees, mod 360)
 * crosses `target`. Scans in 6-hour steps (f must advance < 360° per step), then
 * bisects to 1 second. Throws if no crossing is found within `maxDays`.
 */
export function findAngleCrossing(f: (d: Date) => number, target: number, from: Date, maxDays: number): Date {
  const g = (t: number) => norm360(f(new Date(t)) - target);
  const limit = from.getTime() + maxDays * MS_PER_DAY;
  let lo = from.getTime();
  let gLo = g(lo);
  while (lo < limit) {
    const hi = Math.min(lo + SCAN_STEP_MS, limit);
    const gHi = g(hi);
    if (gHi < gLo) return bisect(g, lo, hi, gLo);
    lo = hi;
    gLo = gHi;
  }
  throw new Error(`findAngleCrossing: no crossing of ${target}° within ${maxDays} days of ${from.toISOString()}`);
}

function bisect(g: (t: number) => number, lo: number, hi: number, gLo: number): Date {
  while (hi - lo > 1000) {
    const mid = (lo + hi) / 2;
    const gMid = g(mid);
    if (gMid < gLo) hi = mid;
    else {
      lo = mid;
      gLo = gMid;
    }
  }
  return new Date(hi);
}

// ---------------------------------------------------------------- lunation

/** Moon − Sun sidereal elongation, degrees in [0, 360): 0 at new moon, 180 at full moon. */
export function elongation(date: Date): number {
  return norm360(moonSidereal(date) - sunSidereal(date));
}

/** First new moon (elongation crossing 0°) strictly after `from`. */
export function newMoonAfter(from: Date): Date {
  return findAngleCrossing(elongation, 0, from, 31);
}
