import { useState } from 'preact/hooks';
import type { Temple } from '../content/schema';
import { searchTemples } from '../content/search';
import { loc, t } from '../i18n';

const MAX = 8;

/** Combobox + listbox: arrows move, Enter selects, Escape closes. */
export function SearchBox({ temples, onSelect }: { temples: Temple[]; onSelect: (id: string) => void }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const results = q.trim() ? searchTemples(temples, q).slice(0, MAX) : [];
  const expanded = open && q.trim() !== '';
  const optId = (i: number) => `search-opt-${i}`;

  function choose(tp: Temple): void {
    setOpen(false);
    setQ('');
    setActive(-1);
    onSelect(tp.id);
  }
  function onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      const tp = results[active] ?? (results.length === 1 ? results[0] : undefined);
      if (expanded && tp) {
        e.preventDefault();
        choose(tp);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    }
  }

  return (
    <div class="search">
      <input
        type="search"
        role="combobox"
        aria-label={t('search.label')}
        placeholder={t('search.placeholder')}
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls="search-list"
        aria-activedescendant={expanded && active >= 0 ? optId(active) : undefined}
        value={q}
        onInput={(e) => {
          setQ((e.target as HTMLInputElement).value);
          setOpen(true);
          setActive(-1);
        }}
        onKeyDown={onKeyDown}
      />
      {expanded && (
        <ul id="search-list" role="listbox" aria-label={t('search.label')} class="search__list">
          {results.length === 0 && <li class="search__empty">{t('search.empty')}</li>}
          {results.map((tp, i) => (
            <li
              key={tp.id}
              id={optId(i)}
              role="option"
              data-id={tp.id}
              aria-selected={i === active}
              class={i === active ? 'is-active' : ''}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(tp);
              }}
            >
              {loc(tp.name).text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
