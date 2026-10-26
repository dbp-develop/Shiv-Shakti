import { z } from 'zod';
import { TempleSchema, type Temple } from './schema';

const modules = import.meta.glob('/content/temples/*.json', { eager: true, import: 'default' });

let cache: Temple[] | undefined;

export function loadTemples(): Temple[] {
  cache ??= z.array(TempleSchema).parse(Object.values(modules));
  return cache;
}

export function getTemple(id: string): Temple | undefined {
  return loadTemples().find((t) => t.id === id);
}
