import { z } from 'zod';

export const LANGS = ['en', 'hi', 'bn', 'mr', 'ta', 'te', 'gu'] as const;
export type Lang = (typeof LANGS)[number];
export type L10n = Record<Lang, string>;

/** Every lang key present; `en` non-empty; others non-empty unless ALLOW_UNTRANSLATED=1 (ruling R2). */
export function l10nSchema(): z.ZodType<L10n> {
  const allowUntranslated = process.env.ALLOW_UNTRANSLATED === '1';
  const shape = Object.fromEntries(
    LANGS.map((l) => [l, l === 'en' || !allowUntranslated ? z.string().min(1) : z.string()]),
  ) as Record<Lang, z.ZodString>;
  return z.object(shape);
}
