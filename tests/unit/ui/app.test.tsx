// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/preact';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Temple } from '../../../src/content/schema';

const fx = (n: string): Temple => JSON.parse(readFileSync(`tests/fixtures/temples/${n}.json`, 'utf8'));
const TEMPLES = vi.hoisted(() => ({ list: [] as Temple[] }));
TEMPLES.list = [fx('kedarnath'), fx('mahakaleshwar'), fx('kamakhya')];

vi.mock('../../../src/content/load', () => ({
  loadTemples: vi.fn(() => TEMPLES.list),
  getTemple: (id: string) => TEMPLES.list.find((t) => t.id === id),
}));
vi.mock('../../../src/map/icons', () => ({
  ICON_PIXEL_RATIO: 1.5,
  ICON_IDS: [],
  renderIcon: () => ({}),
}));

vi.mock('../../../src/content/saraswati', async (orig) => {
  const actual = await orig<typeof import('../../../src/content/saraswati')>();
  return { ...actual, loadSaraswati: vi.fn(actual.loadSaraswati) };
});

const ctl = vi.hoisted(() => {
  const handlers: { select?: (id: string) => void; river?: (id: string) => void; terrain?: () => void } = {};
  const c = {
    setTheme: vi.fn(),
    setLang: vi.fn(),
    set3D: vi.fn(),
    resetView: vi.fn(),
    setTemples: vi.fn(),
    select: vi.fn(),
    onSelect: vi.fn((cb: (id: string) => void) => void (handlers.select = cb)),
    onRiver: vi.fn((cb: (id: string) => void) => void (handlers.river = cb)),
    onStyleReady: vi.fn(),
    onTerrainFail: vi.fn((cb: () => void) => void (handlers.terrain = cb)),
    map: { easeTo: vi.fn() },
    destroy: vi.fn(),
  };
  return { c, handlers, createMap: vi.fn() };
});
vi.mock('../../../src/map/controller', () => ({ createMap: ctl.createMap }));

import { loadSaraswati } from '../../../src/content/saraswati';
import { loadTemples } from '../../../src/content/load';
import { App } from '../../../src/app';
import { buildMarkerList } from '../../../src/map/pins';
import { route } from '../../../src/router';
import { filters, notice } from '../../../src/state';
import { setLang, setTheme, is3D } from '../../../src/state';
import { t } from '../../../src/i18n';

beforeEach(() => {
  for (const f of Object.values(ctl.c)) if (typeof f === 'function' && 'mockClear' in f) (f as any).mockClear();
  ctl.createMap.mockReset();
  ctl.createMap.mockResolvedValue(ctl.c);
  location.hash = '';
  route.value = { kind: 'map' };
  notice.value = null;
  is3D.value = true;
  setLang('en');
  setTheme('dark');
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const ready = () => waitFor(() => expect(ctl.c.setTemples).toHaveBeenCalled());

describe('App shell', () => {
  it('still renders the header and map when the Saraswati content fails to load', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(loadSaraswati).mockImplementationOnce(() => {
      throw new Error('bad content');
    });
    const { container } = render(<App />);
    await ready();
    ctl.handlers.river!('saraswati');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(container.querySelector('h1')).toBeTruthy();
    expect(container.querySelector('#map')).toBeTruthy();
  });

  it('still renders the header when the temple content fails to load', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const bad = vi.fn(() => {
      throw new Error('bad temples');
    });
    vi.mocked(loadTemples).mockImplementationOnce(bad);
    const { container } = render(<App />);
    expect(container.querySelector('h1')).toBeTruthy();
  });

  it('shows the not-found notice and keeps the map for an unknown temple id', async () => {
    location.hash = '#/xyz';
    route.value = { kind: 'temple', id: 'xyz' };
    const { container } = render(<App />);
    expect(screen.getByText(t('notice.templeNotFound'))).toBeTruthy();
    expect(container.querySelector('#map')).toBeTruthy();
    await ready();
    expect(ctl.c.select).not.toHaveBeenCalledWith('xyz', expect.anything());
  });

  it('renders the ListView with all temples when createMap rejects', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    ctl.createMap.mockRejectedValue(new Error('WebGL is unavailable'));
    const { container } = render(<App />);
    await waitFor(() => expect(screen.getByRole('list', { name: t('list.title') })).toBeTruthy());
    const list = screen.getByRole('list', { name: t('list.title') });
    expect(within(list).getAllByRole('button')).toHaveLength(3);
    expect(container.querySelector('#map')).toBeNull();
    expect(err).toHaveBeenCalled();
    fireEvent.click(within(list).getByRole('button', { name: /Kedarnath/ }));
    expect(location.hash).toBe('#/kedarnath');
  });

  it('lists the seven endonyms in the language menu and switches language', async () => {
    render(<App />);
    await ready();
    const names = ['English', 'हिन्दी', 'বাংলা', 'मराठी', 'தமிழ்', 'తెలుగు', 'ગુજરાતી'];
    fireEvent.click(screen.getByRole('button', { name: t('lang.menuLabel') }));
    for (const n of names) expect(screen.getByRole('button', { name: n })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'हिन्दी' }));
    expect(document.documentElement.lang).toBe('hi');
    expect(ctl.c.setLang).toHaveBeenLastCalledWith('hi');
    expect(screen.getByText('शिव-शक्ति')).toBeTruthy();
  });

  it('toggles the theme and tells the map', async () => {
    render(<App />);
    await ready();
    fireEvent.click(screen.getByRole('button', { name: t('theme.toLight') }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(ctl.c.setTheme).toHaveBeenLastCalledWith('light');
  });

  it('toggles 2D/3D and resets the view', async () => {
    render(<App />);
    await ready();
    fireEvent.click(screen.getByRole('button', { name: t('map.to2D') }));
    expect(ctl.c.set3D).toHaveBeenLastCalledWith(false);
    expect(is3D.value).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: t('map.reset') }));
    expect(ctl.c.resetView).toHaveBeenCalled();
  });

  it('shows geoDenied and keeps the map when location is refused', async () => {
    const getCurrentPosition = vi.fn((_ok: unknown, bad: (e: unknown) => void) => bad({ code: 1 }));
    Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition }, configurable: true });
    const { container } = render(<App />);
    await ready();
    expect(getCurrentPosition).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: t('nearest.button') }));
    expect(await screen.findByText(t('notice.geoDenied'))).toBeTruthy();
    expect(container.querySelector('#map')).toBeTruthy();
  });

  it('lists the nearest temples with distances and opens one', async () => {
    const getCurrentPosition = vi.fn((ok: (p: unknown) => void) => ok({ coords: { latitude: 26.2, longitude: 91.7 } }));
    Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition }, configurable: true });
    render(<App />);
    await ready();
    fireEvent.click(screen.getByRole('button', { name: t('nearest.button') }));
    const list = await screen.findByRole('list', { name: t('nearest.title') });
    const items = within(list).getAllByRole('button');
    expect(items).toHaveLength(3);
    expect(items[0]!.textContent).toMatch(/Kamakhya.*\d+ km/);
    fireEvent.click(items[0]!);
    expect(location.hash).toBe('#/kamakhya');
  });

  it('opens the river card on a river tap, focuses it, and closes on Escape with focus restored', async () => {
    render(<App />);
    await ready();
    const opener = screen.getByRole('button', { name: t('map.reset') });
    opener.focus();
    ctl.handlers.river!('saraswati');
    const dlg = await screen.findByRole('dialog');
    await waitFor(() => expect(dlg.contains(document.activeElement)).toBe(true));
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(document.activeElement).toBe(opener);
  });

  it('closes the river card with its close button', async () => {
    render(<App />);
    await ready();
    ctl.handlers.river!('saraswati');
    fireEvent.click(await screen.findByRole('button', { name: t('river.close') }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('ignores rivers that have no card', async () => {
    render(<App />);
    await ready();
    ctl.handlers.river!('ganga');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('falls back to a flat map with a notice when the terrain fails', async () => {
    render(<App />);
    await ready();
    ctl.handlers.terrain!();
    expect(ctl.c.set3D).toHaveBeenLastCalledWith(false);
    expect(is3D.value).toBe(false);
    expect(await screen.findByText(t('notice.terrainFailed'))).toBeTruthy();
  });

  it('routes map selection to the hash and hash changes to controller.select', async () => {
    render(<App />);
    await ready();
    ctl.handlers.select!('kedarnath');
    expect(location.hash).toBe('#/kedarnath');
    ctl.c.select.mockClear();
    location.hash = '#/kamakhya';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await waitFor(() => expect(ctl.c.select).toHaveBeenCalledWith('kamakhya'));
    expect(ctl.c.onSelect).toHaveBeenCalledTimes(1);
  });

  it('search is a combobox: arrows move, Enter selects, Escape closes', async () => {
    render(<App />);
    await ready();
    const box = screen.getByRole('combobox', { name: t('search.label') });
    fireEvent.input(box, { target: { value: 'ka' } });
    const opts = screen.getAllByRole('option');
    expect(opts.length).toBeGreaterThanOrEqual(2);
    expect(box.getAttribute('aria-expanded')).toBe('true');
    fireEvent.keyDown(box, { key: 'ArrowDown' });
    fireEvent.keyDown(box, { key: 'ArrowDown' });
    expect(box.getAttribute('aria-activedescendant')).toBe(opts[1]!.id);
    fireEvent.keyDown(box, { key: 'Enter' });
    expect(location.hash).toBe(`#/${opts[1]!.getAttribute('data-id')}`);
    fireEvent.input(box, { target: { value: 'ka' } });
    fireEvent.keyDown(box, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(box.getAttribute('aria-expanded')).toBe('false');
  });

  it('filters feed the map', async () => {
    render(<App />);
    await ready();
    fireEvent.click(screen.getByRole('button', { name: t('pins.jyotirlinga') }));
    await waitFor(() => {
      const last = ctl.c.setTemples.mock.calls.at(-1)![0] as Temple[];
      expect(last.map((x) => x.id).sort()).toEqual(['kamakhya']);
    });
    fireEvent.click(screen.getByRole('button', { name: t('pins.jyotirlinga') }));
    fireEvent.change(screen.getByLabelText(t('filters.region')), { target: { value: fx('kedarnath').location.region } });
    await waitFor(() => {
      const last = ctl.c.setTemples.mock.calls.at(-1)![0] as Temple[];
      expect(last.map((x) => x.id)).toEqual(['kedarnath']);
    });
    expect(filters.value.region).toBe(fx('kedarnath').location.region);
    expect(screen.getByLabelText(t('filters.month'))).toBeTruthy();
    expect(screen.getByRole('button', { name: t('filters.list.maha') })).toBeTruthy();
  });

  it('R14: activating "Skip temple list" moves focus outside and after the marker list', async () => {
    let host!: HTMLElement;
    ctl.createMap.mockImplementation(async (el: HTMLElement, init: { onSkip?: () => void }) => {
      host = document.createElement('div');
      host.className = 'sr-only';
      el.append(host);
      ctl.c.setTemples.mockImplementation((ts: Temple[]) =>
        buildMarkerList(host, ts, 'en', () => {}, init.onSkip),
      );
      return ctl.c;
    });
    render(<App />);
    await ready();
    const skip = within(host).getByRole('button', { name: t('pins.skip') });
    skip.focus();
    fireEvent.click(skip);
    const active = document.activeElement as HTMLElement;
    expect(host.contains(active)).toBe(false);
    expect(active).not.toBe(document.body);
    expect(host.compareDocumentPosition(active) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
