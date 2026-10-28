import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { apiUrl, batches, collectPhotos, creditProblems, parseImageInfo } from '../../../scripts/fetch-photo-credits';

// A real response from the Commons API (2026-10-28) for the three titles below.
const api = JSON.parse(readFileSync('tests/fixtures/commons/imageinfo.json', 'utf8'));
const KEDAR = 'File:Kedarnath Temple.jpg';
const KAMAKHYA = 'File:Kamakhya_Temple,_Guwahati.jpg'; // Commons normalises it to spaces
const NONE = 'File:Shiv-Shakti no such photo.jpg';

describe('parseImageInfo', () => {
  const { credits, missing } = parseImageInfo(api, [KEDAR, KAMAKHYA, NONE]);

  it('strips the HTML from the author', () => {
    expect(credits[KEDAR].author).toBe('Shaq774 at en.wikipedia');
    expect(credits[KAMAKHYA].author).toBe('Kunal Dalui');
  });

  it('maps the licence, the image URLs without tracking parameters, and the Commons page', () => {
    expect(credits[KAMAKHYA]).toEqual({
      thumb: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dc/Kamakhya_Temple%2C_Guwahati.jpg/960px-Kamakhya_Temple%2C_Guwahati.jpg',
      full: 'https://upload.wikimedia.org/wikipedia/commons/d/dc/Kamakhya_Temple%2C_Guwahati.jpg',
      author: 'Kunal Dalui',
      licence: 'CC BY-SA 3.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
      page: 'https://commons.wikimedia.org/wiki/File:Kamakhya_Temple,_Guwahati.jpg',
    });
  });

  it('keys a normalised title by the spelling the temple file uses', () => {
    expect(Object.keys(credits).sort()).toEqual([KAMAKHYA, KEDAR]);
  });

  it('links a public-domain photo with no licence URL to its Commons page', () => {
    expect(credits[KEDAR].licence).toBe('Public domain');
    expect(credits[KEDAR].licenceUrl).toBe('https://commons.wikimedia.org/wiki/File:Kedarnath_Temple.jpg');
  });

  it('leaves a missing file out of the output and reports it', () => {
    expect(credits[NONE]).toBeUndefined();
    expect(missing).toEqual([NONE]);
  });

  it('reports a requested file the response does not mention at all', () => {
    expect(parseImageInfo(api, [KEDAR, 'File:Never asked.jpg']).missing).toEqual(['File:Never asked.jpg']);
  });

  it('decodes entities in the author', () => {
    const one = structuredClone(api);
    one.query.pages['4624438'].imageinfo[0].extmetadata.Artist.value = '<span>R&amp;D &quot;Photo&quot; &#039;Unit&#x27;</span>\n  Team';
    expect(parseImageInfo(one, [KEDAR]).credits[KEDAR].author).toBe(`R&D "Photo" 'Unit' Team`);
  });
});

describe('creditProblems', () => {
  const base = { thumb: 't', full: 'f', author: 'A', licenceUrl: 'u', page: 'p' };
  it('accepts CC0, CC BY, CC BY-SA and public domain', () => {
    const ok = ['CC0', 'CC0 1.0', 'CC BY 4.0', 'CC BY-SA 3.0', 'CC BY-SA 2.5 in', 'Public domain', 'PD-India'];
    expect(creditProblems(Object.fromEntries(ok.map((l) => [l, { ...base, licence: l }])))).toEqual([]);
  });
  it('rejects non-commercial, no-derivatives and unknown licences, and a missing author', () => {
    const credits = {
      'File:A.jpg': { ...base, licence: 'CC BY-NC 4.0' },
      'File:B.jpg': { ...base, licence: 'CC BY-ND 4.0' },
      'File:C.jpg': { ...base, licence: '' },
      'File:D.jpg': { ...base, licence: 'CC BY 4.0', author: ' ' },
    };
    expect(creditProblems(credits)).toEqual([
      'File:A.jpg: licence "CC BY-NC 4.0" is not CC0, CC BY, CC BY-SA or public domain',
      'File:B.jpg: licence "CC BY-ND 4.0" is not CC0, CC BY, CC BY-SA or public domain',
      'File:C.jpg: licence "" is not CC0, CC BY, CC BY-SA or public domain',
      'File:D.jpg: no author',
    ]);
  });
});

describe('request helpers', () => {
  it('splits titles into batches of 50', () => {
    const titles = Array.from({ length: 120 }, (_, i) => `File:${i}.jpg`);
    expect(batches(titles, 50).map((b) => b.length)).toEqual([50, 50, 20]);
  });
  it('builds the imageinfo query for a batch', () => {
    const u = new URL(apiUrl([KEDAR, KAMAKHYA]));
    expect(u.origin + u.pathname).toBe('https://commons.wikimedia.org/w/api.php');
    expect(Object.fromEntries(u.searchParams)).toMatchObject({
      action: 'query',
      prop: 'imageinfo',
      iiprop: 'url|extmetadata',
      iiurlwidth: '800',
      format: 'json',
      titles: `${KEDAR}|${KAMAKHYA}`,
    });
  });
  it('collects every photo once, in a stable order', () => {
    expect(collectPhotos([{ photos: ['File:B.jpg', 'File:A.jpg'] }, { photos: ['File:A.jpg'] }, { photos: [] }])).toEqual([
      'File:A.jpg',
      'File:B.jpg',
    ]);
  });
});
