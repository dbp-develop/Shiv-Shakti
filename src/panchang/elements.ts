/**
 * Panchang elements: tithi, nakshatra, yoga and karana as angles with fixed-size
 * divisions, and the spans of each that overlap a window of time.
 */
import { elongation, findAngleCrossing, moonSidereal, sunSidereal } from './astro';
import type { Span } from './types';

const MS_PER_DAY = 86_400_000;
const NAKSHATRA_DEG = 360 / 27;

export type KaranaId =
  | 'kimstughna'
  | 'bava'
  | 'balava'
  | 'kaulava'
  | 'taitila'
  | 'gara'
  | 'vanija'
  | 'vishti'
  | 'shakuni'
  | 'chatushpada'
  | 'naga';

const MOVABLE_KARANAS: KaranaId[] = ['bava', 'balava', 'kaulava', 'taitila', 'gara', 'vanija', 'vishti'];

/** Karana for a half-tithi index 1–60: 1 Kimstughna, 2–57 the seven movable ones in turn, then Shakuni, Chatushpada, Naga. */
export function karanaName(index: number): KaranaId {
  if (!Number.isInteger(index) || index < 1 || index > 60) throw new RangeError(`karana index out of range: ${index}`);
  if (index === 1) return 'kimstughna';
  if (index === 58) return 'shakuni';
  if (index === 59) return 'chatushpada';
  if (index === 60) return 'naga';
  return MOVABLE_KARANAS[(index - 2) % 7];
}

/** An element: a monotonically increasing angle cut into `count` equal divisions of `unit` degrees. */
interface ElementDef {
  angle: (d: Date) => number;
  unit: number;
  count: number;
}

const norm360 = (x: number) => ((x % 360) + 360) % 360;

const TITHI: ElementDef = { angle: elongation, unit: 12, count: 30 };
const KARANA: ElementDef = { angle: elongation, unit: 6, count: 60 };
const NAKSHATRA: ElementDef = { angle: moonSidereal, unit: NAKSHATRA_DEG, count: 27 };
const YOGA: ElementDef = {
  angle: (d) => norm360(sunSidereal(d) + moonSidereal(d)),
  unit: NAKSHATRA_DEG,
  count: 27,
};

/** The longest any element division lasts is under 2 days; look back this far for the current one's start. */
const LOOKBACK_DAYS = 2.5;

/** 1-based index of the division of `def` containing instant `d`. */
function indexAt(def: ElementDef, d: Date): number {
  return Math.min(def.count, Math.floor(def.angle(d) / def.unit) + 1);
}

/** All divisions of `def` overlapping [from, to), in order, with exact start and end instants. */
function spansBetween(def: ElementDef, from: Date, to: Date): Span[] {
  const lookback = new Date(from.getTime() - LOOKBACK_DAYS * MS_PER_DAY);
  const boundary = (index: number) => (index - 1) * def.unit;
  let index = indexAt(def, from);
  let start = findAngleCrossing(def.angle, boundary(index), lookback, LOOKBACK_DAYS);
  const spans: Span[] = [];
  for (;;) {
    const nextIndex = (index % def.count) + 1;
    const end = findAngleCrossing(def.angle, boundary(nextIndex), new Date(start.getTime() + 1000), LOOKBACK_DAYS);
    spans.push({ index, start, end });
    if (end.getTime() >= to.getTime()) return spans;
    index = nextIndex;
    start = end;
  }
}

export const tithiSpans = (from: Date, to: Date) => spansBetween(TITHI, from, to);
export const karanaSpans = (from: Date, to: Date) => spansBetween(KARANA, from, to);
export const nakshatraSpans = (from: Date, to: Date) => spansBetween(NAKSHATRA, from, to);
export const yogaSpans = (from: Date, to: Date) => spansBetween(YOGA, from, to);
