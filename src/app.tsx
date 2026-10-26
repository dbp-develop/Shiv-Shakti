import { useEffect, useRef } from 'preact/hooks';
import { createMap } from './map/controller';
import { lang, reducedMotion, theme } from './state';

// Minimal mount so the map can be seen; Task 11 replaces this with the real app shell.
export function App() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const p = createMap(ref.current, { theme: theme.value, lang: lang.value, reducedMotion: reducedMotion.value });
    p.catch(() => undefined);
    return () => void p.then((c) => c.destroy()).catch(() => undefined);
  }, []);
  return <main id="app-root" ref={ref} style={{ position: 'fixed', inset: 0 }} />;
}
