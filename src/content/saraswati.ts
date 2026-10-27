import { z } from 'zod';
import { l10nSchema } from './langs';
import data from '../../content/rivers/saraswati.json';

const sourceSchema = z.object({ title: z.string().min(1), url: z.string().url() });

export const saraswatiSchema = (strict = true) =>
  z.object({
    id: z.literal('saraswati'),
    title: l10nSchema(strict),
    sections: z
      .array(
        z.object({
          id: z.string().min(1),
          heading: l10nSchema(strict),
          body: l10nSchema(strict),
          /** Every claim needs a source. */
          sources: z.array(sourceSchema).min(1),
        }),
      )
      .min(1),
  });

export type Saraswati = z.infer<ReturnType<typeof saraswatiSchema>>;

let cache: Saraswati | undefined;

/** Parsed on first use (not at import) and leniently, so bad or untranslated content cannot blank the app. */
export function loadSaraswati(): Saraswati {
  cache ??= saraswatiSchema(false).parse(data);
  return cache;
}
