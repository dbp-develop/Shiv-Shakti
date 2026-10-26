/** The full panchang for one local calendar day at a location. */
import { moonrise, moonset, sunSidereal, sunrise, sunset } from './astro';
import { karanaSpans, nakshatraSpans, tithiSpans, yogaSpans } from './elements';
import { amantaMasaOf, purnimantaMasaOf, surroundingNewMoons, vikramSamvat } from './masa';
import type { Masa } from './masa';
import { UJJAIN } from './types';
import type { GeoLocation, Span } from './types';

export type Paksha = 'shukla' | 'krishna';

export interface DayPanchang {
  date: string;
  loc: GeoLocation;
  prevSunset: Date;
  sunrise: Date;
  sunset: Date;
  nextSunrise: Date;
  moonrise: Date | null;
  moonset: Date | null;
  /** 0 = Sunday, weekday at sunrise in loc.tz. */
  vara: number;
  /** Spans of each element overlapping [sunrise, nextSunrise). */
  tithi: Span[];
  nakshatra: Span[];
  yoga: Span[];
  karana: Span[];
  /** At sunrise. */
  paksha: Paksha;
  amantaMasa: Masa;
  purnimantaMasa: Masa;
  /** 0 Vasanta … 5 Shishira. */
  ritu: number;
  ayana: 'uttarayana' | 'dakshinayana';
  vikramSamvat: number;
  shakaSamvat: number;
}

function shiftDate(localDate: string, days: number): string {
  const [y, m, d] = localDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function weekday(localDate: string): number {
  const [y, m, d] = localDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function panchangForDay(localDate: string, loc: GeoLocation = UJJAIN): DayPanchang {
  const rise = sunrise(localDate, loc);
  const nextRise = sunrise(shiftDate(localDate, 1), loc);

  const tithi = tithiSpans(rise, nextRise);
  const paksha: Paksha = tithi[0].index <= 15 ? 'shukla' : 'krishna';

  const { prev, next } = surroundingNewMoons(rise);
  const amantaMasa = amantaMasaOf(prev, next);

  const sunLon = sunSidereal(rise);
  const vs = vikramSamvat(localDate, loc.tz);

  return {
    date: localDate,
    loc,
    prevSunset: sunset(shiftDate(localDate, -1), loc),
    sunrise: rise,
    sunset: sunset(localDate, loc),
    nextSunrise: nextRise,
    moonrise: moonrise(localDate, loc),
    moonset: moonset(localDate, loc),
    vara: weekday(localDate),
    tithi,
    nakshatra: nakshatraSpans(rise, nextRise),
    yoga: yogaSpans(rise, nextRise),
    karana: karanaSpans(rise, nextRise),
    paksha,
    amantaMasa,
    purnimantaMasa: purnimantaMasaOf(amantaMasa, paksha),
    ritu: Math.floor(amantaMasa.index / 2),
    ayana: sunLon >= 270 || sunLon < 90 ? 'uttarayana' : 'dakshinayana',
    vikramSamvat: vs,
    shakaSamvat: vs - 135,
  };
}

