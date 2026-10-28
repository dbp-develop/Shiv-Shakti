// Fetches author, licence and image URLs for every Commons photo the temples use, into
// src/generated/photo-credits.json. Usage: npm run credits
// Exits non-zero if a file is missing, has no author, or is not CC0 / CC BY / CC BY-SA / public domain;
// those files are left out of the output, so the app never shows them.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import type { PhotoCredit } from '../src/ui/PhotoGallery';

const API = 'https://commons.wikimedia.org/w/api.php';
const USER_AGENT = 'Shiv-Shakti/0.1 (https://github.com/dbp-develop/Shiv-Shakti; photo credits build script)';
const BATCH = 50;
const TEMPLES_DIR = 'content/temples';
const OUT = 'src/generated/photo-credits.json';

interface ImageInfo {
  thumburl?: string;
  url?: string;
  descriptionurl?: string;
  extmetadata?: Record<string, { value?: string } | undefined>;
}
interface ApiResponse {
  query?: {
    normalized?: Array<{ from: string; to: string }>;
    pages?: Record<string, { title: string; missing?: string; invalid?: string; imageinfo?: ImageInfo[] }>;
  };
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

/** extmetadata values are HTML: drop the tags, decode entities, collapse whitespace. */
function plainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
      if (e[0] !== '#') return ENTITIES[e.toLowerCase()] ?? m;
      return String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    })
    .replace(/\s+/g, ' ')
    .trim();
}

/** Commons appends utm_* tracking parameters to image URLs; keep the bare URL. */
function untracked(url: string): string {
  const u = new URL(url);
  for (const k of [...u.searchParams.keys()]) if (k.startsWith('utm_')) u.searchParams.delete(k);
  return u.toString();
}

/** Credits keyed by the titles as requested (the API may normalise them); files without image info go to `missing`. */
export function parseImageInfo(api: ApiResponse, requested: string[]): { credits: Record<string, PhotoCredit>; missing: string[] } {
  const canonical = new Map((api.query?.normalized ?? []).map((n) => [n.from, n.to]));
  const byTitle = new Map(Object.values(api.query?.pages ?? {}).map((p) => [p.title, p]));
  const credits: Record<string, PhotoCredit> = {};
  const missing: string[] = [];
  for (const file of requested) {
    const info = byTitle.get(canonical.get(file) ?? file)?.imageinfo?.[0];
    if (!info?.url || !info.thumburl || !info.descriptionurl) {
      missing.push(file);
      continue;
    }
    const meta = (k: string) => plainText(info.extmetadata?.[k]?.value ?? '');
    credits[file] = {
      thumb: untracked(info.thumburl),
      full: untracked(info.url),
      author: meta('Artist'),
      licence: meta('LicenseShortName'),
      // Public-domain files have no licence URL; their Commons page states the status.
      licenceUrl: meta('LicenseUrl') || info.descriptionurl,
      page: info.descriptionurl,
    };
  }
  return { credits, missing };
}

const FREE = /^(CC0( 1\.0)?|CC BY(-SA)? \d\.\d( [a-z-]+)?|Public domain|PD(-.+)?)$/i;

/** One line per credit that must not be shown: a licence that isn't free in our sense, or no author. */
export function creditProblems(credits: Record<string, PhotoCredit>): string[] {
  return Object.entries(credits).flatMap(([file, c]) => {
    if (!FREE.test(c.licence)) return [`${file}: licence "${c.licence}" is not CC0, CC BY, CC BY-SA or public domain`];
    if (!c.author.trim()) return [`${file}: no author`];
    return [];
  });
}

export function batches<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export function apiUrl(titles: string[]): string {
  const q = new URLSearchParams({
    action: 'query',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl',
    iiurlwidth: '800',
    format: 'json',
    titles: titles.join('|'),
  });
  return `${API}?${q}`;
}

export function collectPhotos(temples: Array<{ photos: string[] }>): string[] {
  return [...new Set(temples.flatMap((t) => t.photos))].sort();
}

async function main(): Promise<number> {
  const temples = readdirSync(TEMPLES_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(`${TEMPLES_DIR}/${f}`, 'utf8')) as { photos?: string[] });
  const files = collectPhotos(temples.map((t) => ({ photos: t.photos ?? [] })));
  const credits: Record<string, PhotoCredit> = {};
  const missing: string[] = [];
  for (const batch of batches(files, BATCH)) {
    const res = await fetch(apiUrl(batch), { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) throw new Error(`Commons API ${res.status} ${res.statusText}`);
    const got = parseImageInfo((await res.json()) as ApiResponse, batch);
    Object.assign(credits, got.credits);
    missing.push(...got.missing);
  }
  const problems = [...missing.map((f) => `${f}: not found on Commons`), ...creditProblems(credits)];
  const sorted = Object.fromEntries(
    Object.entries(credits)
      .filter(([f, c]) => creditProblems({ [f]: c }).length === 0)
      .sort(([a], [b]) => a.localeCompare(b)),
  );
  writeFileSync(OUT, `${JSON.stringify(sorted, null, 2)}\n`);
  console.log(`credits: ${Object.keys(sorted).length} of ${files.length} photos written to ${OUT}`);
  for (const p of problems) console.error(`credits: ${p}`);
  return problems.length > 0 ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then(
    (code) => process.exit(code),
    (e) => {
      console.error(e);
      process.exit(1);
    },
  );
}
