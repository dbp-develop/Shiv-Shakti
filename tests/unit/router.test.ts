import { describe, expect, it } from 'vitest';
import { parseRoute, routeHash } from '../../src/router';

describe('router', () => {
  it('parses a temple hash', () => {
    expect(parseRoute('#/kedarnath')).toEqual({ kind: 'temple', id: 'kedarnath' });
    expect(parseRoute('#/kedarnath/')).toEqual({ kind: 'temple', id: 'kedarnath' });
  });
  it('parses empty and root hashes as the map', () => {
    expect(parseRoute('')).toEqual({ kind: 'map' });
    expect(parseRoute('#')).toEqual({ kind: 'map' });
    expect(parseRoute('#/')).toEqual({ kind: 'map' });
  });
  it('round-trips through routeHash', () => {
    expect(routeHash({ kind: 'temple', id: 'kamakhya' })).toBe('#/kamakhya');
    expect(routeHash({ kind: 'map' })).toBe('#/');
    expect(parseRoute(routeHash({ kind: 'temple', id: 'kamakhya' }))).toEqual({ kind: 'temple', id: 'kamakhya' });
  });
  it('survives a malformed escape', () => {
    expect(parseRoute('#/%E0%A4%A')).toEqual({ kind: 'temple', id: '%E0%A4%A' });
  });
});
