import type { Temple } from '../content/schema';
import { t } from '../i18n';

type DarshanInfo = NonNullable<Temple['darshan']>;

function embedUrl(d: DarshanInfo): string | null {
  switch (d.kind) {
    case 'youtube-channel':
      return `https://www.youtube.com/embed/live_stream?channel=${encodeURIComponent(d.channelId)}`;
    case 'youtube-video':
      return `https://www.youtube.com/embed/${encodeURIComponent(d.videoId)}`;
    default:
      return null;
  }
}

/**
 * The temple's own stream. Iframe load failures are not reliably detectable, so the official-site
 * button is always shown (spec §8) as the way out when the embed is blank or there is no stream.
 */
export function Darshan({ darshan, name }: { darshan: DarshanInfo; name: string }) {
  const src = embedUrl(darshan);
  return (
    <div class="darshan">
      {src && (
        <iframe
          src={src}
          title={t('sheet.darshanTitle', { name })}
          loading="lazy"
          allow="autoplay; encrypted-media"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      )}
      <p>
        <a class="button" href={darshan.url} target="_blank" rel="noopener noreferrer">
          {t('sheet.openOfficial')}
        </a>
      </p>
      <p class="darshan__verified">{t('sheet.lastVerified', { date: darshan.lastVerified })}</p>
    </div>
  );
}
