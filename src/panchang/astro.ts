/**
 * Pure astronomy layer for the panchang: sidereal (Lahiri) longitudes, rise/set
 * times and a generic angle-crossing search. No DOM, no UI imports.
 */
import { Body, EclipticGeoMoon, Observer, SearchRiseSet, SunPosition } from 'astronomy-engine';
import type { GeoLocation } from './types';

const MS_PER_DAY = 86_400_000;
const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0);

function norm360(x: number): number {
  const r = x % 360;
  return r < 0 ? r + 360 : r;
}

/** Lahiri (Chitrapaksha) ayanamsa in degrees: 23.853056 + 1.396971·T + 0.000308·T², T in Julian centuries from J2000. */
export function lahiriAyanamsa(date: Date): number {
  const T = (date.getTime() - J2000_MS) / MS_PER_DAY / 36525;
  return 23.853056 + 1.396971 * T + 0.000308 * T * T;
}

/** Sidereal (Lahiri) ecliptic longitude of the Sun, degrees in [0, 360). */
export function sunSidereal(date: Date): number {
  return norm360(SunPosition(date).elon - lahiriAyanamsa(date));
}

/** Sidereal (Lahiri) ecliptic longitude of the Moon, degrees in [0, 360). */
export function moonSidereal(date: Date): number {
  return norm360(EclipticGeoMoon(date).lon - lahiriAyanamsa(date));
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
