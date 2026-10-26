import { z } from 'zod';
import { l10nSchema } from './langs';
import data from '../../content/rivers/saraswati.json';

const sourceSchema = z.object({ title: z.string().min(1), url: z.string().url() });

export const saraswatiSchema = () =>
  z.object({
    id: z.literal('saraswati'),
    title: l10nSchema(),
    sections: z
      .array(
        z.object({
          id: z.string().min(1),
          heading: l10nSchema(),
          body: l10nSchema(),
          /** Every claim needs a source. */
          sources: z.array(sourceSchema).min(1),
        }),
      )
      .min(1),
  });

export type Saraswati = z.infer<ReturnType<typeof saraswatiSchema>>;

export const saraswati: Saraswati = saraswatiSchema().parse(data);
