import type { Temple } from './schema';

const LATIN = /\p{Script=Latin}/u;
const MARK = /\p{M}/u;

/** Lowercase + NFD; strip combining marks only when they follow a Latin base (Indic vowel signs must stay). */
export function normalize(s: string): string {
  let out = '';
  let baseIsLatin = false;
  for (const ch of s.toLowerCase().normalize('NFD')) {
    if (MARK.test(ch)) {
      if (!baseIsLatin) out += ch;
    } else {
      baseIsLatin = LATIN.test(ch);
      out += ch;
    }
  }
  return out.normalize('NFC');
}

function haystack(t: Temple): string[] {
  return [...Object.values(t.name), ...Object.values(t.deity), ...(t.aliases ?? [])]
    .filter(Boolean)
    .map(normalize);
}

export function searchTemples(ts: Temple[], q: string): Temple[] {
  const needle = normalize(q.trim());
  if (!needle) return ts;
  return ts.filter((t) => haystack(t).some((h) => h.includes(needle)));
}
