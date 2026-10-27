import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { festivalWhenText, type FestivalDef } from '../content/festivals';
import { pinCategory, type PeethaList, type Temple } from '../content/schema';
import { calendarTerms, loc, t } from '../i18n';
import { lang, reducedMotion } from '../state';
import { Darshan } from './Darshan';
import { hasCreditedPhotos, PhotoGallery, type PhotoCredits } from './PhotoGallery';

const CATEGORY_KEY = { jyotirlinga: 'pins.jyotirlinga', 'maha-peetha': 'pins.mahaPeetha', peetha: 'pins.peetha' } as const;
const LIST_KEY: Record<PeethaList, string> = {
  'peetha-nirnaya-51': 'lists.peethaNirnaya51',
  'ashtadasha-18': 'lists.ashtadasha18',
  'adi-4': 'lists.adi4',
};

function countryName(code: string): string {
  try {
    return new Intl.DisplayNames([lang.value], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** One "Shown in English" marker per section, never per paragraph. */
const Fallback = ({ show }: { show: boolean }) => (show ? <p class="sheet__marker">{t('marker.englishFallback')}</p> : null);

function Section({ id, title, fallback, children }: { id: string; title: string; fallback?: boolean; children: ComponentChildren }) {
  return (
    <section class="sheet__section" aria-labelledby={`sheet-${id}`}>
      <h3 id={`sheet-${id}`}>{title}</h3>
      <Fallback show={!!fallback} />
      {children}
    </section>
  );
}

export function TempleSheet({
  temple,
  festivals,
  credits,
  onClose,
}: {
  temple: Temple;
  festivals: FestivalDef[];
  credits?: PhotoCredits;
  onClose: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [expanded, setExpanded] = useState(false);
  const drag = useRef<{ y: number; moved: boolean } | null>(null);

  // Focus the heading on open; give focus back to whatever opened the sheet (or the map) on close.
  useEffect(() => {
    const opener = document.activeElement;
    heading.current?.focus();
    return () => {
      const back =
        opener instanceof HTMLElement && opener.isConnected && opener !== document.body
          ? opener
          : document.querySelector<HTMLElement>('#map canvas');
      back?.focus();
    };
  }, []);

  const name = loc(temple.name);
  const deity = loc(temple.deity);
  const history = loc(temple.history);
  const story = loc(temple.story);
  const factsOwn = temple.facts[lang.value] ?? [];
  const facts = factsOwn.length > 0 ? factsOwn : temple.facts.en;
  const factsFallback = lang.value !== 'en' && factsOwn.length === 0;
  const v = temple.visiting;
  const visiting = [
    ['timings', loc(v.timings)],
    ['nearestAirport', loc(v.nearestAirport)],
    ['nearestRail', loc(v.nearestRail)],
    ['bestSeason', loc(v.bestSeason)],
  ] as const;
  const peetha = temple.peetha && {
    bodyPart: loc(temple.peetha.bodyPart),
    devi: loc(temple.peetha.devi),
    bhairava: loc(temple.peetha.bhairava),
  };
  const headFallback = name.fallback || deity.fallback || (!!peetha && Object.values(peetha).some((x) => x.fallback));
  const terms = calendarTerms();
  const fests = temple.festivals.flatMap((tf) => {
    const f = festivals.find((x) => x.id === tf.festivalId);
    return f ? [{ f, note: tf.localNote ? loc(tf.localNote) : undefined, title: loc(f.name) }] : [];
  });
  const festFallback = fests.some((x) => x.title.fallback || x.note?.fallback);
  const alts = temple.alternateSites.map((a) => ({ name: loc(a.name), note: loc(a.note) }));
  const machine = lang.value !== 'en' && !temple.translationReviewed[lang.value];
  const regionLine = [temple.location.region, countryName(temple.location.country)].join(', ');
  const toggle = () => setExpanded((e) => !e);

  return (
    <aside
      class={`temple-sheet${reducedMotion.value ? ' temple-sheet--still' : ''}`}
      role="dialog"
      aria-labelledby="temple-sheet-title"
      data-snap={expanded ? 'high' : 'low'}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <button
        type="button"
        class="temple-sheet__handle"
        aria-expanded={expanded}
        aria-label={expanded ? t('sheet.collapse') : t('sheet.expand')}
        onClick={() => {
          if (drag.current?.moved) return void (drag.current = null);
          toggle();
        }}
        onPointerDown={(e) => (drag.current = { y: e.clientY, moved: false })}
        onPointerUp={(e) => {
          const d = drag.current;
          if (!d) return;
          const dy = e.clientY - d.y;
          if (Math.abs(dy) > 24) {
            d.moved = true;
            setExpanded(dy < 0);
          } else drag.current = null;
        }}
      >
        <span aria-hidden="true" />
      </button>
      <div class="temple-sheet__body">
        <header class="sheet__head">
          <div class="sheet__title">
            <h2 id="temple-sheet-title" tabIndex={-1} ref={heading}>
              {name.text}
            </h2>
            <button type="button" class="sheet__close" onClick={onClose}>
              {t('sheet.close')}
            </button>
          </div>
          {machine && <p class="sheet__marker">{t('marker.machineTranslation')}</p>}
          <Fallback show={headFallback} />
          <ul class="sheet__badges">
            <li>{t(CATEGORY_KEY[pinCategory(temple)])}</li>
            {temple.lists.map((l) => (
              <li key={l}>{t(LIST_KEY[l])}</li>
            ))}
          </ul>
          <p>{deity.text}</p>
          <p>
            {regionLine}
            {temple.location.elevationM !== undefined && <> · {t('sheet.elevation', { m: temple.location.elevationM })}</>}
          </p>
          {peetha && (
            <dl class="sheet__peetha">
              <dt>{t('sheet.bodyPart')}</dt>
              <dd>{peetha.bodyPart.text}</dd>
              <dt>{t('sheet.devi')}</dt>
              <dd>{peetha.devi.text}</dd>
              <dt>{t('sheet.bhairava')}</dt>
              <dd>{peetha.bhairava.text}</dd>
            </dl>
          )}
        </header>

        {hasCreditedPhotos(temple.photos, credits) && (
          <Section id="photos" title={t('sheet.photos')}>
            <PhotoGallery files={temple.photos} alt={name.text} credits={credits} />
          </Section>
        )}
        {temple.darshan && (
          <Section id="darshan" title={t('sheet.liveDarshan')}>
            <Darshan darshan={temple.darshan} name={name.text} />
          </Section>
        )}
        <Section id="history" title={t('sheet.history')} fallback={history.fallback}>
          <p>{history.text}</p>
        </Section>
        <Section id="story" title={t('sheet.story')} fallback={story.fallback}>
          <p>{story.text}</p>
        </Section>
        <Section id="festivals" title={t('sheet.festivals')} fallback={festFallback}>
          <ul>
            {fests.map(({ f, note, title }) => (
              <li key={f.id}>
                <p>{`${title.text} — ${festivalWhenText(f, terms, lang.value)}`}</p>
                {note && <p>{note.text}</p>}
              </li>
            ))}
          </ul>
        </Section>
        <Section id="facts" title={t('sheet.uniqueFacts')} fallback={factsFallback}>
          <ul>
            {facts.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </Section>
        <Section id="visiting" title={t('sheet.visiting')} fallback={visiting.some(([, x]) => x.fallback)}>
          <dl>
            {visiting.map(([k, x]) => (
              <div key={k}>
                <dt>{t(`sheet.${k}`)}</dt>
                <dd>{x.text}</dd>
              </div>
            ))}
          </dl>
        </Section>
        {alts.length > 0 && (
          <Section
            id="alt"
            title={t('sheet.otherClaimedSites')}
            fallback={alts.some((a) => a.name.fallback || a.note.fallback)}
          >
            <ul>
              {alts.map((a) => (
                <li key={a.name.text}>
                  <strong>{a.name.text}</strong>
                  <p>{a.note.text}</p>
                </li>
              ))}
            </ul>
          </Section>
        )}
        <Section id="sources" title={t('sheet.sources')}>
          <ul>
            {temple.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </aside>
  );
}
