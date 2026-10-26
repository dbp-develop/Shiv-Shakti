import type { CalendarTerms } from '../content/festivals';
import type { L10n, Lang } from '../content/langs';
import { lang } from '../state';
import bn from '../../content/i18n/bn.json';
import en from '../../content/i18n/en.json';
import gu from '../../content/i18n/gu.json';
import hi from '../../content/i18n/hi.json';
import mr from '../../content/i18n/mr.json';
import ta from '../../content/i18n/ta.json';
import te from '../../content/i18n/te.json';

export { detectLang } from './detect';
export { loadFont } from './fonts';

type Tree = { [k: string]: string | string[] | Tree };
const DICTS: Record<Lang, Tree> = { en, hi, bn, mr, ta, te, gu };

function lookup(dict: Tree, key: string): string | string[] | undefined {
  let cur: string | string[] | Tree | undefined = dict;
  for (const part of key.split('.')) {
    if (cur === undefined || typeof cur === 'string' || Array.isArray(cur)) return undefined;
    cur = cur[part];
  }
  return cur as string | string[] | undefined;
}

const get = (key: string): string | string[] | undefined => lookup(DICTS[lang.value], key) ?? lookup(DICTS.en, key);

/** UI string for the current language; falls back to en, then to the key itself. */
export function t(key: string, vars?: Record<string, string | number>): string {
  const v = get(key);
  if (typeof v !== 'string') return key;
  return vars ? v.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : v;
}

export function tList(key: string): string[] {
  const v = get(key);
  return Array.isArray(v) ? v : [];
}

export function calendarTerms(): CalendarTerms {
  const s = (k: string): string => t(`calendar.${k}`);
  return {
    masas: tList('calendar.masas'),
    rashis: tList('calendar.rashis'),
    weekdaysPlural: tList('calendar.weekdaysPlural'),
    shukla: s('shukla'),
    krishna: s('krishna'),
    purnima: s('purnima'),
    amavasya: s('amavasya'),
    tpl: {
      tithi: s('tpl.tithi'),
      tithiRange: s('tpl.tithiRange'),
      special: s('tpl.special'),
      sankranti: s('tpl.sankranti'),
      sankrantiFrom: s('tpl.sankrantiFrom'),
      weekdayInMasa: s('tpl.weekdayInMasa'),
      withMonths: s('tpl.withMonths'),
    },
  };
}

/** Content text for the current language; empty falls back to en and is flagged. */
export function loc(v: L10n): { text: string; fallback: boolean } {
  const own = v[lang.value];
  if (own && own.trim() !== '') return { text: own, fallback: false };
  return { text: v.en, fallback: lang.value !== 'en' };
}
