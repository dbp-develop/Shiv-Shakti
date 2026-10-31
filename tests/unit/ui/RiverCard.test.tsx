// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RiverCard } from '../../../src/ui/RiverCard';
import { setLang } from '../../../src/state';

afterEach(() => {
  cleanup();
  setLang('en');
});

describe('RiverCard', () => {
  it('shows the Saraswati text, the reconstruction note and linked sources', () => {
    render(<RiverCard onClose={() => {}} />);
    expect(screen.getByRole('dialog').getAttribute('aria-labelledby')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'The ancient Saraswati' })).toBeTruthy();
    expect(screen.getByText(/RV 2\.41\.16/)).toBeTruthy();
    expect(screen.getByText(/is a reconstruction/i)).toBeTruthy();
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(4);
    for (const a of links) expect(a.getAttribute('href')).toMatch(/^https:\/\//);
    expect(links.some((a) => /nrsc\.gov\.in/.test(a.getAttribute('href') ?? ''))).toBe(true);
    expect(screen.queryByText('Shown in English')).toBeNull();
  });

  it('shows the translated text without the English-fallback notice', () => {
    setLang('hi');
    render(<RiverCard onClose={() => {}} />);
    expect(screen.getByRole('heading', { name: 'प्राचीन सरस्वती' })).toBeTruthy();
    expect(screen.queryByText('अंग्रेज़ी में दिखाया गया')).toBeNull();
  });

  it('calls onClose', () => {
    const onClose = vi.fn();
    render(<RiverCard onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });
});
