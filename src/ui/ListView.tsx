import { useState } from 'preact/hooks';
import type { Temple } from '../content/schema';
import { searchTemples } from '../content/search';
import { loc, t } from '../i18n';

/** Fallback when the map cannot start: a searchable list of every temple. */
export function ListView({ temples, onSelect }: { temples: Temple[]; onSelect: (id: string) => void }) {
  const [q, setQ] = useState('');
  const shown = searchTemples(temples, q);
  return (
    <section class="list-view">
      <p>{t('list.fallback')}</p>
      <input type="search" aria-label={t('search.label')} placeholder={t('search.placeholder')} value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} />
      {shown.length === 0 && <p>{t('list.empty')}</p>}
      <ul aria-label={t('list.title')}>
        {shown.map((tp) => (
          <li key={tp.id}>
            <button type="button" onClick={() => onSelect(tp.id)}>
              {loc(tp.name).text}
              <small> · {loc(tp.deity).text}</small>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
