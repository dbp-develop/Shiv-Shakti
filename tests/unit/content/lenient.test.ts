import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadFestivals, festivalSchema } from '../../../src/content/festivals';
import { l10nSchema } from '../../../src/content/langs';
import { loadSaraswati } from '../../../src/content/saraswati';
import { templeSchema } from '../../../src/content/schema';

const kedar = JSON.parse(readFileSync('tests/fixtures/temples/kedarnath.json', 'utf8'));
const blank = { en: 'x', hi: '', bn: '', mr: '', ta: '', te: '', gu: '' };

afterEach(() => vi.unstubAllGlobals());

describe('runtime (lenient) loaders, as in the browser', () => {
  it('accept empty non-en strings when ALLOW_UNTRANSLATED is unset', () => {
    vi.stubGlobal('process', undefined);
    expect(l10nSchema(false).safeParse(blank).success).toBe(true);
    expect(templeSchema(false).safeParse({ ...kedar, name: blank }).success).toBe(true);
    expect(festivalSchema(false).safeParse({ id: 'a', name: blank, when: { kind: 'sankranti', rashi: 0 }, months: [1] }).success).toBe(true);
    expect(() => loadSaraswati()).not.toThrow();
    expect(() => loadFestivals()).not.toThrow();
  });
  it('still require en and all seven keys', () => {
    expect(l10nSchema(false).safeParse({ ...blank, en: '' }).success).toBe(false);
    const { gu: _gu, ...missing } = blank;
    expect(l10nSchema(false).safeParse(missing).success).toBe(false);
  });
  it('strict mode still rejects empty non-en strings unless ALLOW_UNTRANSLATED=1', () => {
    const prev = process.env.ALLOW_UNTRANSLATED;
    process.env.ALLOW_UNTRANSLATED = '0';
    try {
      expect(l10nSchema(true).safeParse(blank).success).toBe(false);
      expect(l10nSchema().safeParse(blank).success).toBe(false);
      expect(templeSchema(true).safeParse({ ...kedar, name: blank }).success).toBe(false);
    } finally {
      if (prev === undefined) delete process.env.ALLOW_UNTRANSLATED;
      else process.env.ALLOW_UNTRANSLATED = prev;
    }
  });
});
