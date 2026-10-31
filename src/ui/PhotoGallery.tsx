import { useState } from 'preact/hooks';
import photoCredits from '../generated/photo-credits.json';
import { t } from '../i18n';

export interface PhotoCredit {
  thumb: string;
  full: string;
  author: string;
  licence: string;
  licenceUrl: string;
  page: string;
}
export type PhotoCredits = Record<string, PhotoCredit | undefined>;

/** Commons photos with credits. A file without a credit entry is never rendered (licence safety). */
export function PhotoGallery({
  files,
  alt,
  credits = photoCredits as PhotoCredits,
}: {
  files: string[];
  alt: string;
  credits?: PhotoCredits;
}) {
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const shown = files.flatMap((f) => {
    const c = Object.hasOwn(credits, f) ? credits[f] : undefined;
    return c ? [{ file: f, c }] : [];
  });
  if (shown.length === 0) return null;
  return (
    <div class="photos">
      {shown.map(({ file, c }) => (
        <figure key={file}>
          {!failed.has(file) && (
            <a href={c.full} target="_blank" rel="noopener noreferrer">
              <img
                src={c.thumb}
                alt={alt}
                loading="lazy"
                onError={() => setFailed((s) => new Set(s).add(file))}
              />
            </a>
          )}
          <figcaption>
            {t('sheet.photoBy', { author: c.author })} ·{' '}
            <a href={c.licenceUrl} target="_blank" rel="noopener noreferrer">
              {c.licence}
            </a>{' '}
            ·{' '}
            <a href={c.page} target="_blank" rel="noopener noreferrer">
              {t('sheet.commonsPage')}
            </a>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

/** True when at least one of the files has a credit entry (so the section is worth showing). */
export function hasCreditedPhotos(files: string[], credits: PhotoCredits = photoCredits as PhotoCredits): boolean {
  return files.some((f) => Object.hasOwn(credits, f) && credits[f]);
}
