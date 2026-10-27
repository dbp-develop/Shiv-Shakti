import { useEffect, useRef } from 'preact/hooks';
import { saraswati } from '../content/saraswati';
import { loc, t } from '../i18n';

/** Info card for the ancient Saraswati: Rig Vedic references, palaeochannel findings, the debate, and sources. */
export function RiverCard({ onClose }: { onClose: () => void }) {
  const title = loc(saraswati.title);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => ref.current?.focus(), []);
  const parts = saraswati.sections.map((s) => ({ s, heading: loc(s.heading), body: loc(s.body) }));
  // One "Shown in English" marker per card, not per section.
  const fallback = title.fallback || parts.some((p) => p.heading.fallback || p.body.fallback);
  return (
    <section
      class="river-card"
      role="dialog"
      aria-labelledby="river-card-title"
      tabIndex={-1}
      ref={ref}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <header class="river-card__head">
        <h2 id="river-card-title">{title.text}</h2>
        <button type="button" class="river-card__close" onClick={onClose}>
          {t('river.close')}
        </button>
      </header>
      {fallback && <p class="river-card__fallback">{t('marker.englishFallback')}</p>}
      {parts.map(({ s, heading, body }) => {
        return (
          <div class="river-card__section" key={s.id}>
            <h3>{heading.text}</h3>
            <p>{body.text}</p>
            <h4>{t('sheet.sources')}</h4>
            <ul>
              {s.sources.map((src) => (
                <li key={src.url}>
                  <a href={src.url} target="_blank" rel="noopener noreferrer">
                    {src.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
