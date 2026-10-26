/** Lunar month (masa), adhik detection, and Vikram/Shaka year. */
import { localDateOf, newMoonAfter, sunSidereal } from './astro';

const MS_PER_DAY = 86_400_000;

export interface Masa {
  /** 0 = Chaitra … 11 = Phalguna. */
  index: number;
  adhik: boolean;
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
 * the Sun is in at the start, plus one. A lunation in which the Sun stays in one sign is adhik.
 */
export function amantaMasaOf(prev: Date, next: Date): Masa {
  const start = sunRashi(prev);
  return { index: (start + 1) % 12, adhik: start === sunRashi(next) };
}

/** Purnimanta month: the Krishna paksha half already belongs to the next month. */
export function purnimantaMasaOf(amanta: Masa, paksha: 'shukla' | 'krishna'): Masa {
  return paksha === 'shukla' ? amanta : { index: (amanta.index + 1) % 12, adhik: amanta.adhik };
}

const chaitraStartCache = new Map<number, Date>();

/** The new moon that begins (nija) Chaitra in Gregorian year `year`: Sun in Meena at it, in Mesha at the next. */
function chaitraNewMoon(year: number): Date {
  const hit = chaitraStartCache.get(year);
  if (hit) return hit;
  let nm = newMoonAfter(new Date(Date.UTC(year, 1, 1)));
  for (;;) {
    const next = newMoonAfter(new Date(nm.getTime() + MS_PER_DAY));
    if (sunRashi(nm) === 11 && sunRashi(next) === 0) break;
    nm = next;
  }
  chaitraStartCache.set(year, nm);
  return nm;
}

/**
 * Vikram Samvat (Chaitradi) of local date `localDate`: Gregorian year + 57 on or after the
 * new year, + 56 before it. The new year counts from the civil day (in `tz`) on which the
 * new moon preceding Chaitra Shukla Pratipada falls, because Pratipada then begins that
 * very day (possibly as a kshaya tithi that never touches a sunrise); Drik Panchang
 * switches on that day too (2026-03-19).
 */
export function vikramSamvat(localDate: string, tz: string): number {
  const year = Number(localDate.slice(0, 4));
  const newYearDay = localDateOf(chaitraNewMoon(year), tz);
  return localDate >= newYearDay ? year + 57 : year + 56;
}
