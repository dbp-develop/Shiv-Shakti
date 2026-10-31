import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { TempleSchema, EXTENT, type Temple } from '../../src/content/schema';
import { loadFestivals } from '../../src/content/festivals';
import credits from '../../src/generated/photo-credits.json';

const raw = Object.entries(import.meta.glob('/content/temples/*.json', { eager: true, import: 'default' }));
const lists = Object.values(
  import.meta.glob('/content/lists/shakti-peethas.json', { eager: true, import: 'default' }),
)[0] as { id: string }[] | undefined; // missing file = empty list until the master list lands

describe('content/temples', () => {
  const parsed = z.array(z.unknown()).parse(raw.map(([, v]) => v));
  const temples: Temple[] = parsed.map((p, i) => {
    const r = TempleSchema.safeParse(p);
    if (!r.success) throw new Error(`${raw[i]![0]}: ${r.error.message}`);
    return r.data;
  });

  it('has unique ids matching file names', () => {
    expect(new Set(temples.map((t) => t.id)).size).toBe(temples.length);
    raw.forEach(([path], i) => expect(path.endsWith(`/${temples[i]!.id}.json`)).toBe(true));
  });

  it('keeps every coordinate inside the extent', () => {
    for (const t of temples) {
      for (const p of [t.location, ...t.alternateSites]) {
        expect(p.lng, t.id).toBeGreaterThanOrEqual(EXTENT.minLng);
        expect(p.lng, t.id).toBeLessThanOrEqual(EXTENT.maxLng);
        expect(p.lat, t.id).toBeGreaterThanOrEqual(EXTENT.minLat);
        expect(p.lat, t.id).toBeLessThanOrEqual(EXTENT.maxLat);
      }
    }
  });

  it('references only existing festivals', () => {
    const known = new Set(loadFestivals().map((f) => f.id));
    for (const t of temples) for (const f of t.festivals) expect(known.has(f.festivalId), `${t.id}: ${f.festivalId}`).toBe(true);
  });

  it('has a credit entry for every photo', () => {
    for (const t of temples) for (const p of t.photos) expect(p in credits, `${t.id}: ${p}`).toBe(true);
  });

  it('lists every Shakti Peetha id in content/lists/shakti-peethas.json', () => {
    const listed = new Set((lists ?? []).map((e) => e.id));
    for (const t of temples.filter((x) => x.type === 'shakti-peetha')) expect(listed.has(t.id), t.id).toBe(true);
  });
});
