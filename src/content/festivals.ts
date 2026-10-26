import { z } from 'zod';
import festivalsJson from '../../content/festivals.json';
import { l10nSchema, type L10n } from './langs';

export type FestivalWhen =
  | { kind: 'tithi'; masa: number; paksha: 'shukla' | 'krishna'; tithi: number; days?: number }
  | { kind: 'sankranti'; rashi: number; offsetDays?: number; days?: number }
  | { kind: 'weekday-in-masa'; masa: number; weekday: number };

export interface FestivalDef {
  id: string;
  name: L10n;
  when: FestivalWhen;
  months: number[];
}

export interface CalendarTerms {
  masas: string[];
  rashis: string[];
  weekdaysPlural: string[];
  shukla: string;
  krishna: string;
  purnima: string;
  amavasya: string;
  tpl: {
    tithi: string;
    tithiRange: string;
    special: string;
    sankranti: string;
    sankrantiFrom: string;
    weekdayInMasa: string;
    withMonths: string;
  };
}

const masa = z.number().int().min(0).max(11);
const whenSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('tithi'),
    masa,
    paksha: z.enum(['shukla', 'krishna']),
    tithi: z.number().int().min(1).max(15),
    days: z.number().int().min(1).optional(),
  }),
  z.object({
    kind: z.literal('sankranti'),
    rashi: z.number().int().min(0).max(11),
    offsetDays: z.number().int().min(0).optional(),
    days: z.number().int().min(1).optional(),
  }),
  z.object({
    kind: z.literal('weekday-in-masa'),
    masa,
    weekday: z.number().int().min(0).max(6),
  }),
]);

// Built per call so the ALLOW_UNTRANSLATED env is read at parse time.
export const FestivalSchema: z.ZodType<FestivalDef> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    name: l10nSchema(),
    when: whenSchema,
    months: z.array(z.number().int().min(1).max(12)).min(1),
  }),
);

export function loadFestivals(): FestivalDef[] {
  return z.array(FestivalSchema).parse(festivalsJson);
}

const fill = (tpl: string, vars: Record<string, string | number>): string =>
  tpl.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k]));

function monthsText(months: number[], locale: string): string {
  const fmt = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });
  const name = (m: number) => fmt.format(new Date(Date.UTC(2000, m - 1, 1)));
  const first = months[0]!;
  const last = months[months.length - 1]!;
  return months.length === 1 ? name(first) : `${name(first)}–${name(last)}`;
}

function baseText(w: FestivalWhen, t: CalendarTerms): string {
  switch (w.kind) {
    case 'tithi': {
      const m = t.masas[w.masa]!;
      const paksha = w.paksha === 'shukla' ? t.shukla : t.krishna;
      if (w.tithi === 15) {
        return fill(t.tpl.special, { masa: m, name: w.paksha === 'shukla' ? t.purnima : t.amavasya });
      }
      const days = w.days ?? 1;
      return days > 1
        ? fill(t.tpl.tithiRange, { masa: m, paksha, from: w.tithi, to: w.tithi + days - 1 })
        : fill(t.tpl.tithi, { masa: m, paksha, tithi: w.tithi });
    }
    case 'sankranti':
      return w.offsetDays !== undefined || w.days !== undefined
        ? fill(t.tpl.sankrantiFrom, {
            n: (w.offsetDays ?? 0) + 1,
            masa: t.masas[(w.rashi + 1) % 12]!,
            days: w.days ?? 1,
          })
        : fill(t.tpl.sankranti, { rashi: t.rashis[w.rashi]! });
    case 'weekday-in-masa':
      return fill(t.tpl.weekdayInMasa, { weekdays: t.weekdaysPlural[w.weekday]!, masa: t.masas[w.masa]! });
  }
}

/** "Phalguna Krishna 14 (Feb–Mar)". The "Name — " prefix belongs to the temple sheet. */
export function festivalWhenText(f: FestivalDef, terms: CalendarTerms, locale: string): string {
  return fill(terms.tpl.withMonths, {
    when: baseText(f.when, terms),
    months: monthsText(f.months, locale),
  });
}
