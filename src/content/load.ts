import { z } from 'zod';
import { templeSchema, type Temple } from './schema';

const modules = import.meta.glob('/content/temples/*.json', { eager: true, import: 'default' });

let cache: Temple[] | undefined;

/** Lenient: untranslated (empty) non-en strings are valid at runtime and fall back to English. */
export function loadTemples(): Temple[] {
  cache ??= z.array(templeSchema(false)).parse(Object.values(modules));
  return cache;
}

export function getTemple(id: string): Temple | undefined {
  return loadTemples().find((t) => t.id === id);
}
