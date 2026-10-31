import { signal } from '@preact/signals';

export type Route = { kind: 'map' } | { kind: 'temple'; id: string };

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export function parseRoute(hash: string): Route {
  const id = safeDecode(hash.replace(/^#\/?/, '').replace(/\/+$/, ''));
  return id ? { kind: 'temple', id } : { kind: 'map' };
}

export function routeHash(r: Route): string {
  return r.kind === 'temple' ? `#/${encodeURIComponent(r.id)}` : '#/';
}

const current = (): string => (typeof location === 'undefined' ? '' : location.hash);

export const route = signal<Route>(parseRoute(current()));

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    route.value = parseRoute(location.hash);
  });
}

/** Sets the URL hash and the route together (the hashchange that follows is then a no-op). */
export function navigate(r: Route): void {
  route.value = r;
  const h = routeHash(r);
  if (typeof location !== 'undefined' && location.hash !== h) location.hash = h;
}
