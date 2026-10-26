import { describe, expect, it } from 'vitest';
import { TempleSchema, pinCategory, type Temple } from '../../../src/content/schema';
import mahakal from '../../fixtures/temples/mahakaleshwar.json';
import kedar from '../../fixtures/temples/kedarnath.json';
import kamakhya from '../../fixtures/temples/kamakhya.json';

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

describe('TempleSchema', () => {
  it.each([['mahakaleshwar', mahakal], ['kedarnath', kedar], ['kamakhya', kamakhya]])('parses fixture %s', (_n, f) => {
    expect(TempleSchema.safeParse(f).success).toBe(true);
  });

  it('reports the path of a missing language', () => {
    const f = clone(kedar) as Record<string, any>;
    delete f.name.ta;
    const r = TempleSchema.safeParse(f);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.map((i) => i.path.join('.'))).toContain('name.ta');
  });

  it('rejects a darshan without verifiedVia', () => {
    const f = clone(kedar) as Record<string, any>;
    delete f.darshan.verifiedVia;
    const r = TempleSchema.safeParse(f);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.map((i) => i.path.join('.'))).toContain('darshan.verifiedVia');
  });

  it('rejects a darshan without official: true', () => {
    const f = clone(kedar) as Record<string, any>;
    f.darshan.official = false;
    expect(TempleSchema.safeParse(f).success).toBe(false);
  });

  it('allows a temple with no darshan', () => {
    const f = clone(kedar) as Record<string, any>;
    delete f.darshan;
    expect(TempleSchema.safeParse(f).success).toBe(true);
  });

  it('rejects coordinates outside the extent', () => {
    const f = clone(kedar) as Record<string, any>;
    f.location.lat = 51;
    expect(TempleSchema.safeParse(f).success).toBe(false);
  });

  it('requires peetha data on a shakti-peetha', () => {
    const f = clone(kamakhya) as Record<string, any>;
    delete f.peetha;
    expect(TempleSchema.safeParse(f).success).toBe(false);
  });
});

describe('pinCategory', () => {
  it('maps kamakhya to maha-peetha', () => expect(pinCategory(kamakhya as Temple)).toBe('maha-peetha'));
  it('maps kedarnath to jyotirlinga', () => expect(pinCategory(kedar as Temple)).toBe('jyotirlinga'));
  it('maps a non-ashtadasha peetha to peetha', () => {
    const t = { ...clone(kamakhya), lists: ['peetha-nirnaya-51'] } as Temple;
    expect(pinCategory(t)).toBe('peetha');
  });
});
