/** Lunar month (masa), adhik detection, and Vikram/Shaka year. */
import { elongation, findAngleCrossing, localDateOf, newMoonAfter, sunrise, sunSidereal } from './astro';
import type { GeoLocation } from './types';

const MS_PER_DAY = 86_400_000;

export interface Masa {
  /** 0 = Chaitra … 11 = Phalguna. */
  index: number;
  adhik: boolean;
  /** The Sun enters two signs within this lunation, so the following month is skipped (kshaya masa). */
  kshaya: boolean;
}

/** Sidereal sign of the Sun at `d`: 0 = Mesha … 11 = Meena. */
export function sunRashi(d: Date): number {
  return Math.floor(sunSidereal(d) / 30);
}

/** The new moons (as instants) bracketing `d`: last one at or before it, first one after it. */
export function surroundingNewMoons(d: Date): { prev: Date; next: Date } {
  let prev = newMoonAfter(new Date(d.getTime() - 32 * MS_PER_DAY));
  let next = newMoonAfter(new Date(prev.getTime() + MS_PER_DAY));
  while (next.getTime() <= d.getTime()) {
    prev = next;
    next = newMoonAfter(new Date(prev.getTime() + MS_PER_DAY));
  }
  return { prev, next };
}

/**
 * Amanta (new moon to new moon) month for the lunation [prev, next): named for the sign
 * the Sun is in at the start, plus one. A lunation in which the Sun stays in one sign is adhik;
 * one in which it crosses two sign boundaries is kshaya (it keeps the name by the same rule).
 */
export function amantaMasaOf(prev: Date, next: Date): Masa {
  const start = sunRashi(prev);
  const advance = (sunRashi(next) - start + 12) % 12;
  return { index: (start + 1) % 12, adhik: advance === 0, kshaya: advance === 2 };
}

/** Purnimanta month: the Krishna paksha half already belongs to the next month. */
export function purnimantaMasaOf(amanta: Masa, paksha: 'shukla' | 'krishna'): Masa {
  return paksha === 'shukla' ? amanta : { ...amanta, index: (amanta.index + 1) % 12 };
}

const newYearCache = new Map<string, string>();

/** The new moon that begins (nija) Chaitra in Gregorian year `year`: Sun in Meena at it, in Mesha at the next. */
function chaitraNewMoon(year: number): Date {
  let nm = newMoonAfter(new Date(Date.UTC(year, 1, 1)));
  for (;;) {
    const next = newMoonAfter(new Date(nm.getTime() + MS_PER_DAY));
    if (sunRashi(nm) === 11 && sunRashi(next) === 0) return nm;
    nm = next;
  }
}

function shiftDate(localDate: string, days: number): string {
  const [y, m, d] = localDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/**
 * Local date on which the Vikram year starting in Gregorian `year` begins. General rule: the
 * Hindu day (sunrise to next sunrise at `loc`) on which Chaitra Shukla Pratipada, which begins
 * at the preceding new moon, is in force at sunrise; when Pratipada is kshaya (begins and ends
 * between two sunrises, so no sunrise sees it), the Hindu day in which it occurs.
 */
function newYearDay(year: number, loc: GeoLocation): string {
  const key = `${year}|${loc.lat}|${loc.lng}|${loc.tz}`;
  const hit = newYearCache.get(key);
  if (hit) return hit;
  const nm = chaitraNewMoon(year);
  const pratipadaEnd = findAngleCrossing(elongation, 12, nm, 3);
  // First sunrise at or after the new moon, and the Hindu day that precedes it.
  const nmDate = localDateOf(nm, loc.tz);
  const firstSunrise = sunrise(nmDate, loc).getTime() >= nm.getTime() ? nmDate : shiftDate(nmDate, 1);
  const day =
    pratipadaEnd.getTime() <= sunrise(firstSunrise, loc).getTime() ? shiftDate(firstSunrise, -1) : firstSunrise;
  newYearCache.set(key, day);
  return day;
}

/**
 * Vikram Samvat (Chaitradi) of local date `localDate`: Gregorian year + 57 on or after the
 * new year day (see `newYearDay`), + 56 before it. Drik Panchang agrees, e.g. it switches to
 * 2083 on 2026-03-19 where Pratipada is kshaya, and on 2024-04-09 where it is not.
 */
export function vikramSamvat(localDate: string, loc: GeoLocation): number {
  const year = Number(localDate.slice(0, 4));
  return localDate >= newYearDay(year, loc) ? year + 57 : year + 56;
}
