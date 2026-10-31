import { z } from 'zod';

export const LANGS = ['en', 'hi', 'bn', 'mr', 'ta', 'te', 'gu'] as const;
export type Lang = (typeof LANGS)[number];
export type L10n = Record<Lang, string>;

/** Browser-safe: Vite does not define `process` in the client bundle, so guard it. */
export function allowUntranslated(): boolean {
  return typeof process !== 'undefined' && process.env?.ALLOW_UNTRANSLATED === '1';
}

/**
 * Every lang key present and `en` non-empty. Strict (default, used by the content checks): others
 * non-empty too unless ALLOW_UNTRANSLATED=1 (ruling R2). Lenient (runtime loaders, ruling R15): others
 * may be "" and `loc()` falls back to English.
 */
export function l10nSchema(strict = true): z.ZodType<L10n> {
  const allowed = !strict || allowUntranslated();
  const shape = Object.fromEntries(
    LANGS.map((l) => [l, l === 'en' || !allowed ? z.string().min(1) : z.string()]),
  ) as Record<Lang, z.ZodString>;
  return z.object(shape);
}
