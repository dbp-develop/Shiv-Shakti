import { LANGS, type Lang } from '../content/langs';

export function isLang(v: unknown): v is Lang {
  return typeof v === 'string' && (LANGS as readonly string[]).includes(v);
}

/** First browser language whose primary subtag we support, else 'en'. */
export function detectLang(navLangs: readonly string[]): Lang {
  for (const tag of navLangs) {
    const primary = tag.toLowerCase().split(/[-_]/)[0];
    if (isLang(primary)) return primary;
  }
  return 'en';
}
