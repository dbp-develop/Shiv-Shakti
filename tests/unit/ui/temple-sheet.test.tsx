// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/preact';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadFestivals } from '../../../src/content/festivals';
import type { Temple } from '../../../src/content/schema';
import { t } from '../../../src/i18n';
import { reducedMotion, setLang } from '../../../src/state';
import { TempleSheet } from '../../../src/ui/TempleSheet';

const fx = (n: string): Temple => JSON.parse(readFileSync(`tests/fixtures/temples/${n}.json`, 'utf8'));
const L = (en: string, extra: Partial<Record<string, string>> = {}) => ({
  en, hi: '', bn: '', mr: '', ta: '', te: '', gu: '', ...extra,
});
const credit = (n: number) => ({
  thumb: `https://upload.wikimedia.org/thumb${n}.jpg`,
  full: `https://upload.wikimedia.org/full${n}.jpg`,
  author: `Author ${n}`,
  licence: 'CC BY-SA 4.0',
  licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  page: `https://commons.wikimedia.org/wiki/File:P${n}.jpg`,
});
const CREDITS = { 'File:A.jpg': credit(1), 'File:B.jpg': credit(2) };

const kedar = (over: Partial<Temple> = {}): Temple => ({
  ...fx('kedarnath'),
  festivals: [{ festivalId: 'maha-shivaratri', localNote: L('Night vigil at the shrine.') }],
  ...over,
});
const show = (temple: Temple, onClose = () => {}) =>
  render(<TempleSheet temple={temple} festivals={loadFestivals()} credits={CREDITS} onClose={onClose} />);

beforeEach(() => {
  setLang('en');
  reducedMotion.value = false;
});
afterEach(() => {
  cleanup();
  setLang('en');
});

describe('TempleSheet', () => {
  it('is a labelled dialog whose heading is the temple name, with the spec section order', () => {
    show(
      kedar({
        photos: ['File:A.jpg'],
        alternateSites: [{ name: L('Other'), lat: 20, lng: 80, note: L('A rival claim.') }],
      }),
    );
    const dlg = screen.getByRole('dialog', { name: 'Kedarnath' });
    expect(within(dlg).getByRole('heading', { level: 2, name: 'Kedarnath' })).toBeTruthy();
    const h3 = within(dlg).getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(h3).toEqual(
      ['photos', 'liveDarshan', 'history', 'story', 'festivals', 'uniqueFacts', 'visiting', 'otherClaimedSites', 'sources'].map(
        (k) => t(`sheet.${k}`),
      ),
    );
  });

  it('shows the header badges, region, country and elevation', () => {
    show(kedar());
    const dlg = screen.getByRole('dialog');
    expect(within(dlg).getByText(t('pins.jyotirlinga'))).toBeTruthy();
    expect(within(dlg).getByText(/Uttarakhand, India/)).toBeTruthy();
    expect(within(dlg).getByText(/3583 m/)).toBeTruthy();
    expect(within(dlg).getByText('Shiva as Kedara')).toBeTruthy();
  });

  it('renders each festival as name — when, then the temple note', () => {
    show(kedar());
    const sec = screen.getByRole('region', { name: t('sheet.festivals') });
    expect(within(sec).getByText('Maha Shivaratri — Phalguna Krishna 14 (Feb–Mar)')).toBeTruthy();
    expect(within(sec).getByText('Night vigil at the shrine.')).toBeTruthy();
  });

  it('skips a festival id that does not exist', () => {
    show(kedar({ festivals: [{ festivalId: 'nope' }] }));
    const sec = screen.getByRole('region', { name: t('sheet.festivals') });
    expect(within(sec).queryAllByRole('listitem')).toHaveLength(0);
  });

  it('embeds the youtube-channel live stream and always offers the official site', () => {
    const d = { kind: 'youtube-channel', channelId: 'UC123', url: 'https://example.org/live', official: true, lastVerified: '2026-10-25', verifiedVia: 'https://example.org' } as const;
    show(kedar({ darshan: d }));
    const sec = screen.getByRole('region', { name: t('sheet.liveDarshan') });
    const frame = sec.querySelector('iframe')!;
    expect(frame.getAttribute('src')).toContain('embed/live_stream?channel=UC123');
    expect(frame.getAttribute('loading')).toBe('lazy');
    expect(frame.getAttribute('allow')).toBe('autoplay; encrypted-media');
    expect(frame.getAttribute('title')).toBeTruthy();
    const link = within(sec).getByRole('link', { name: t('sheet.openOfficial') });
    expect(link.getAttribute('href')).toBe('https://example.org/live');
    expect(within(sec).getByText(/2026-10-25/)).toBeTruthy();
  });

  it('embeds a youtube-video by its id', () => {
    const d = { kind: 'youtube-video', videoId: 'abc_DEF', url: 'https://example.org', official: true, lastVerified: '2026-10-25', verifiedVia: 'https://example.org' } as const;
    show(kedar({ darshan: d }));
    expect(document.querySelector('iframe')!.getAttribute('src')).toBe('https://www.youtube.com/embed/abc_DEF');
  });

  it('renders only the link for a website darshan', () => {
    show(kedar());
    const sec = screen.getByRole('region', { name: t('sheet.liveDarshan') });
    expect(sec.querySelector('iframe')).toBeNull();
    expect(within(sec).getByRole('link', { name: t('sheet.openOfficial') }).getAttribute('href')).toBe('https://badrinath-kedarnath.gov.in');
  });

  it('omits the darshan section when the temple has none', () => {
    show(kedar({ darshan: undefined }));
    expect(screen.queryByRole('region', { name: t('sheet.liveDarshan') })).toBeNull();
  });

  it('shows author and licence credit under each photo and skips photos without a credit', () => {
    show(kedar({ photos: ['File:A.jpg', 'File:B.jpg', 'File:Missing.jpg'] }));
    const sec = screen.getByRole('region', { name: t('sheet.photos') });
    const figs = within(sec).getAllByRole('figure');
    expect(figs).toHaveLength(2);
    const first = figs[0]!;
    expect(within(first).getByText(/Author 1/)).toBeTruthy();
    const lic = within(first).getByRole('link', { name: 'CC BY-SA 4.0' });
    expect(lic.getAttribute('href')).toBe('https://creativecommons.org/licenses/by-sa/4.0/');
    expect(within(first).getByRole('link', { name: t('sheet.commonsPage') }).getAttribute('href')).toBe(credit(1).page);
    const img = first.querySelector('img')!;
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.getAttribute('src')).toBe(credit(1).thumb);
  });

  it('hides a photo that fails to load but keeps its credit', () => {
    show(kedar({ photos: ['File:A.jpg'] }));
    const fig = screen.getByRole('figure');
    fireEvent.error(fig.querySelector('img')!);
    expect(fig.querySelector('img')).toBeNull();
    expect(within(fig).getByText(/Author 1/)).toBeTruthy();
  });

  it('omits the photos section when nothing is credited', () => {
    show(kedar({ photos: [] }));
    expect(screen.queryByRole('region', { name: t('sheet.photos') })).toBeNull();
  });

  it('shows Other claimed sites only when alternateSites is non-empty', () => {
    const { unmount } = show(kedar());
    expect(screen.queryByRole('region', { name: t('sheet.otherClaimedSites') })).toBeNull();
    unmount();
    show(kedar({ alternateSites: [{ name: L('Guptakashi'), lat: 30, lng: 79, note: L('Also claimed.') }] }));
    const sec = screen.getByRole('region', { name: t('sheet.otherClaimedSites') });
    expect(within(sec).getByText('Guptakashi')).toBeTruthy();
    expect(within(sec).getByText('Also claimed.')).toBeTruthy();
  });

  it('shows the body part, Devi, Bhairava and scriptures for a Shakti Peetha', () => {
    show(fx('kamakhya'));
    const dlg = screen.getByRole('dialog');
    expect(within(dlg).getByText('Yoni')).toBeTruthy();
    expect(within(dlg).getByText('Kamakhya', { selector: 'dd' })).toBeTruthy();
    expect(within(dlg).getByText('Umananda')).toBeTruthy();
    expect(within(dlg).getByText('Peetha Nirnaya Tantra (51)')).toBeTruthy();
    expect(within(dlg).getByText('Ashtadasha Shakti Peetha Stotram (18)')).toBeTruthy();
    expect(within(dlg).getByText('Adi Shakti Peethas (4)')).toBeTruthy();
    expect(within(dlg).getByText(t('pins.mahaPeetha'))).toBeTruthy();
  });

  it('marks English fallback once per section and shows the machine-translation note once', () => {
    setLang('hi');
    show(kedar());
    const hist = screen.getByRole('region', { name: t('sheet.history') });
    expect(within(hist).getAllByText(t('marker.englishFallback'))).toHaveLength(1);
    expect(screen.getAllByText(t('marker.machineTranslation'))).toHaveLength(1);
    expect(hist.textContent).toContain('Garhwal');
  });

  it('shows no markers in English', () => {
    show(kedar());
    expect(screen.queryByText(t('marker.englishFallback'))).toBeNull();
    expect(screen.queryByText(t('marker.machineTranslation'))).toBeNull();
  });

  it('skips the machine-translation note when the language is reviewed', () => {
    setLang('hi');
    show(kedar({ translationReviewed: { ...kedar().translationReviewed, hi: true } }));
    expect(screen.queryByText(t('marker.machineTranslation'))).toBeNull();
  });

  it('moves focus to the heading and returns it to the opener on close', () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const { unmount } = show(kedar());
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 2 }));
    unmount();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it('closes with Escape and with the close button', () => {
    const onClose = vi.fn();
    show(kedar(), onClose);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: t('sheet.close') }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('toggles between the 35% and 90% snap points from a keyboard-operable handle', () => {
    show(kedar());
    const dlg = screen.getByRole('dialog');
    const handle = screen.getByRole('button', { name: t('sheet.expand') });
    expect(handle.getAttribute('aria-expanded')).toBe('false');
    expect(dlg.getAttribute('data-snap')).toBe('low');
    fireEvent.click(handle);
    expect(dlg.getAttribute('data-snap')).toBe('high');
    expect(screen.getByRole('button', { name: t('sheet.collapse') }).getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: t('sheet.collapse') }));
    expect(dlg.getAttribute('data-snap')).toBe('low');
  });

  it('turns transitions off under reduced motion', () => {
    reducedMotion.value = true;
    show(kedar());
    expect(screen.getByRole('dialog').className).toContain('temple-sheet--still');
  });
});
