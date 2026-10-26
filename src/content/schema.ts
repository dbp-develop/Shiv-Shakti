import { z } from 'zod';
import { LANGS, l10nSchema, type Lang, type L10n } from './langs';

export { LANGS };
export type { Lang, L10n };

export const PEETHA_LISTS = ['peetha-nirnaya-51', 'ashtadasha-18', 'adi-4'] as const;
export type PeethaList = (typeof PEETHA_LISTS)[number];
export type PinCategory = 'jyotirlinga' | 'maha-peetha' | 'peetha';

/** Map extent (global constraint): lng 60–98.5, lat 5–37.5. */
export const EXTENT = { minLng: 60, maxLng: 98.5, minLat: 5, maxLat: 37.5 } as const;

const lat = z.number().min(EXTENT.minLat).max(EXTENT.maxLat);
const lng = z.number().min(EXTENT.minLng).max(EXTENT.maxLng);
const url = z.string().url();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');

const darshanBase = {
  url,
  official: z.literal(true),
  lastVerified: isoDate,
  verifiedVia: url,
};

// Built per call so ALLOW_UNTRANSLATED is read at parse time (see langs.ts).
function build() {
  const l10n = l10nSchema();
  const facts = z.object(
    Object.fromEntries(LANGS.map((l) => [l, z.array(z.string())])) as Record<Lang, z.ZodArray<z.ZodString>>,
  );
  const reviewed = z.object(
    Object.fromEntries(LANGS.map((l) => [l, z.boolean()])) as Record<Lang, z.ZodBoolean>,
  );
  return z
    .object({
      id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
      type: z.enum(['jyotirlinga', 'shakti-peetha']),
      lists: z.array(z.enum(PEETHA_LISTS)),
      location: z.object({
        lat,
        lng,
        elevationM: z.number().optional(),
        country: z.string().min(2),
        region: z.string().min(1),
      }),
      alternateSites: z.array(z.object({ name: l10n, lat, lng, note: l10n })),
      name: l10n,
      aliases: z.array(z.string().min(1)).optional(),
      deity: l10n,
      peetha: z.object({ bodyPart: l10n, devi: l10n, bhairava: l10n }).optional(),
      history: l10n,
      story: l10n,
      facts,
      visiting: z.object({
        timings: l10n,
        nearestAirport: l10n,
        nearestRail: l10n,
        bestSeason: l10n,
      }),
      festivals: z.array(z.object({ festivalId: z.string().min(1), localNote: l10n.optional() })),
      darshan: z
        .discriminatedUnion('kind', [
          z.object({ kind: z.literal('youtube-channel'), channelId: z.string().min(1), ...darshanBase }),
          z.object({ kind: z.literal('youtube-video'), videoId: z.string().min(1), ...darshanBase }),
          z.object({ kind: z.literal('website'), ...darshanBase }),
        ])
        .optional(),
      photos: z.array(z.string().regex(/^File:.+/)),
      sources: z.array(z.object({ title: z.string().min(1), url })).min(1),
      translationReviewed: reviewed,
    })
    .superRefine((t, ctx) => {
      if (t.type === 'shakti-peetha' && !t.peetha) {
        ctx.addIssue({ code: 'custom', path: ['peetha'], message: 'required for shakti-peetha' });
      }
      if (t.type === 'shakti-peetha' && t.lists.length === 0) {
        ctx.addIssue({ code: 'custom', path: ['lists'], message: 'required for shakti-peetha' });
      }
    });
}

export type Temple = z.infer<ReturnType<typeof build>>;

export const TempleSchema: z.ZodType<Temple> = z.lazy(build);

export function pinCategory(t: Temple): PinCategory {
  if (t.type === 'jyotirlinga') return 'jyotirlinga';
  return t.lists.includes('ashtadasha-18') ? 'maha-peetha' : 'peetha';
}
