import { saraswati } from '../content/saraswati';
import { loc, t } from '../i18n';

/** Info card for the ancient Saraswati: Rig Vedic references, palaeochannel findings, the debate, and sources. */
export function RiverCard({ onClose }: { onClose: () => void }) {
  const title = loc(saraswati.title);
  return (
    <section class="river-card" role="dialog" aria-labelledby="river-card-title">
      <header class="river-card__head">
        <h2 id="river-card-title">{title.text}</h2>
        <button type="button" class="river-card__close" onClick={onClose}>
          {t('river.close')}
        </button>
      </header>
      {title.fallback && <p class="river-card__fallback">{t('marker.englishFallback')}</p>}
      {saraswati.sections.map((s) => {
        const heading = loc(s.heading);
        const body = loc(s.body);
        return (
          <div class="river-card__section" key={s.id}>
            <h3>{heading.text}</h3>
            <p>{body.text}</p>
            {(heading.fallback || body.fallback) && <p class="river-card__fallback">{t('marker.englishFallback')}</p>}
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
