// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

const MapCtor = vi.hoisted(() => vi.fn());
vi.mock('maplibre-gl', () => ({ default: { Map: MapCtor } }));
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}));

import { createMap } from '../../../src/map/controller';

describe('createMap', () => {
  it('rejects without constructing a map when WebGL is unavailable', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    await expect(
      createMap(document.createElement('div'), { theme: 'dark', lang: 'en', reducedMotion: false }),
    ).rejects.toThrow(/WebGL/);
    expect(MapCtor).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
