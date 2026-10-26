# Shiv-Shakti Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static, 7-language, dark/light website with a 3D-terrain MapLibre map of the Shakti Peethas and Jyotirlingas, temple pages and festivals described in Hindu-calendar terms, deployed to GitHub Pages. (Revised 2026-10-26: panchang removed from scope.)

**Architecture:** Vite + TypeScript + Preact SPA. No panchang and no astronomy: festivals carry a structured `when` that is rendered as text. `src/map/` wraps MapLibre behind a `MapController` interface. All temple, river, festival and UI text lives in `content/` as JSON and GeoJSON, validated by tests. GitHub Actions runs the tests, builds and deploys.

**Tech Stack:** Node 22 LTS, Vite 6, TypeScript 5 (strict), Preact 10 + @preact/signals, maplibre-gl 5, zod 3, Vitest 3, Playwright, @axe-core/playwright, @lhci/cli.

**Spec:** `docs/superpowers/specs/2026-10-25-shakti-jyotirlinga-map-design.md`

## Global Constraints

- Languages, exactly: `en, hi, bn, mr, ta, te, gu`. Every user-visible string exists in all 7.
- Dark theme is the default; light theme via `data-theme="light"` on `<html>`. The choice is saved in `localStorage` key `theme`; the language in key `lang`.
- Text and muted text contrast ≥ 4.5:1 against the background in both themes (WCAG 2.1 AA).
- No panchang of any kind: no panchang menu, no time or Vikram Samvat widget, no muhurats or Choghadiya, no calculated festival dates, no astronomy library.
- Festival month names follow the Purnimanta convention.
- Map: default pitch 45°, terrain exaggeration 1.5, terrain DEM `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png` (Terrarium encoding), basemap from OpenFreeMap (no API key). The basemap's own country boundary layers are never shown.
- The content extent check: every coordinate within lng 60–98.5, lat 5–37.5.
- Darshan entries: `official: true`, a `lastVerified` ISO date and a `verifiedVia` URL on the temple's official site. Never invent a stream URL.
- Photos only from Wikimedia Commons, always shown with the author and licence.
- No backend, no API keys, no paid services. Exact versions pinned in `package.json` (no `^`).
- Vite `base` is `/Shiv-Shakti/` (Pages URL https://dbp-develop.github.io/Shiv-Shakti/) (overridable via env `VITE_BASE`).
- Commit after each green step group; messages are imperative, one line, plus the Co-Authored-By trailer.

## Review Focus

1. **Unknown deep link `#/xyz`:** shows the map plus a "temple not found" notice, never a blank page. → unit test in Task 11, e2e in Task 18.
2. **Long scripts on small phones:** Tamil and Telugu text at 320px width causes no horizontal scroll in the sheet or header. → e2e in Task 18.
3. **Festival season across the year end:** a festival with `months: [12, 1]` renders "(Dec–Jan)", not "(Jan–Dec)" or "(Dec, Jan)". → unit test in Task 5.
4. **Festival-month filter on a two-month festival:** Maha Shivaratri (`months: [2, 3]`) keeps its temples under both February and March. → unit test in Task 6.
5. **Geolocation denied:** "locate me" / "nearest temples" show the `notice.geoDenied` text and leave the map usable. → unit test in Task 11.

---

## File Structure

```
index.html                     inline pre-paint theme script, #app root
vite.config.ts  tsconfig.json  package.json  playwright.config.ts  lighthouserc.json
.github/workflows/deploy.yml
content/
  temples/<id>.json            one file per temple (schema: src/content/schema.ts)
  lists/shakti-peethas.json    master list: ids, lists membership, candidate sites, sources
  lists/jyotirlingas.json
  rivers/<id>.geojson          LineString(s) + properties.name (7 langs)
  rivers/saraswati.json        info card text (7 langs) + sources
  boundary/india.geojson       India boundary (polygon)
  boundary/neighbours.geojson  neighbouring countries, Natural Earth India point-of-view
  boundary/SOURCE.md           provenance + licence of the boundary files
  festivals.json               festival definitions (`when` + months + 7-lang names)
  i18n/<lang>.json             UI strings + calendar terms (months, paksha, rashis, weekdays)
src/
  main.tsx  app.tsx  state.ts  router.ts
  content/  langs.ts festivals.ts schema.ts load.ts filters.ts search.ts geo.ts
  i18n/     index.ts fonts.ts
  map/      controller.ts style.ts terrain.ts boundary.ts rivers.ts pins.ts icons.ts
  ui/       Header.tsx FilterBar.tsx SearchBox.tsx TempleSheet.tsx PhotoGallery.tsx Darshan.tsx
            ListView.tsx RiverCard.tsx Notice.tsx
  styles/   tokens.css base.css
  generated/photo-credits.json
scripts/fetch-photo-credits.ts
tests/      unit/**  content/**  e2e/**  fixtures/**
```

---

### Task 1: Scaffold, toolchain, CI

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/app.tsx`, `tests/unit/smoke.test.ts`, `.github/workflows/deploy.yml`, `.gitignore`, `README.md`

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `preview`, `test` (vitest run), `typecheck` (tsc --noEmit), `check` (typecheck + test), `test:e2e` (playwright test), `credits` (photo credits script).

- [ ] **Step 1: Install Node 22 LTS into the user's home, no sudo.** Download the latest v22 linux-x64 tarball from nodejs.org into `~/.local/node`, symlink `node`, `npm` and `npx` into `~/.local/bin` (already on PATH). Verify: `node --version` prints `v22.x`.
- [ ] **Step 2: Create the Vite + Preact + TS project by hand** (no interactive scaffolder). Install the pinned deps from the Tech Stack line with `npm i -E`. tsconfig is `strict: true`, `jsx: react-jsx`, `jsxImportSource: preact`, `resolveJsonModule: true`. Add `tsx` as a dev dep for scripts.
- [ ] **Step 3: Write the failing smoke test** `tests/unit/smoke.test.ts`: `expect(typeof App).toBe('function')`, importing `App` from `src/app.tsx`. Run `npm test` → FAIL (module missing).
- [ ] **Step 4: Implement `App()`**, rendering `<main id="app-root">` with the text "Shiv-Shakti". `index.html` holds an inline script that sets `document.documentElement.dataset.theme = localStorage.getItem('theme') ?? 'dark'` (in try/catch) before CSS loads.
- [ ] **Step 5: Verify:** `npm run check && npm run build` both succeed; `dist/index.html` references assets under `/Shiv-Shakti/`.
- [ ] **Step 6: CI workflow** `.github/workflows/deploy.yml`: on push to `main` and on PRs → checkout, setup-node 22 with npm cache, `npm ci`, `npm run check`, `npm run build`, `npx playwright install --with-deps chromium`, `npm run test:e2e` (skipped until Task 18 adds tests: guard with `--pass-with-no-tests`), then (main only) `actions/upload-pages-artifact` with `dist` + `actions/deploy-pages`. Permissions: `pages: write`, `id-token: write`.
- [ ] **Step 7: Commit** `chore: scaffold Vite + Preact + TS project with CI`.

---

### Task 2: Panchang astronomy core — DONE (e0079e1..e4e5eae), REMOVED by Task 4

> Superseded 2026-10-26: the panchang is out of scope. Kept only as the record of what Task 4 removes; do not execute.

**Files:**
- Create: `src/panchang/types.ts`, `src/panchang/astro.ts`
- Test: `tests/unit/panchang/astro.test.ts`

**Interfaces:**
- Produces (`types.ts`):
  ```ts
  export interface GeoLocation { lat: number; lng: number; tz: string; name?: string }
  export const UJJAIN: GeoLocation   // {lat: 23.1765, lng: 75.7885, tz: 'Asia/Kolkata', name: 'Ujjain'}
  export interface Span { index: number; start: Date; end: Date }
  export interface Period { start: Date; end: Date }
  ```
- Produces (`astro.ts`):
  ```ts
  lahiriAyanamsa(date: Date): number                 // degrees
  sunSidereal(date: Date): number                    // degrees 0–360
  moonSidereal(date: Date): number
  sunrise(localDate: string, loc: GeoLocation): Date // localDate 'YYYY-MM-DD' in loc.tz
  sunset(localDate: string, loc: GeoLocation): Date
  moonrise(localDate: string, loc: GeoLocation): Date | null
  moonset(localDate: string, loc: GeoLocation): Date | null
  findAngleCrossing(f: (d: Date) => number, target: number, from: Date, maxDays: number): Date
      // first instant after `from` where f (an increasing angle, mod 360) crosses `target`; bisection to 1 s
  localDateOf(d: Date, tz: string): string           // 'YYYY-MM-DD' via Intl.DateTimeFormat
  ```

- [ ] **Step 1: Collect the reference fixtures** `tests/fixtures/panchang-ujjain.json` (used here and in Tasks 3–4). From a published panchang for Ujjain (Drik Panchang with the city set to Ujjain, or the Rashtriya Panchang), record 25 dates: `{date, sunrise, sunset, tithi:[{index,end}], nakshatra:[…], yoga:[…], karana:[…], amantaMasa, adhik, vikramSamvat, rahuKaal, choghadiyaDay:[names], source}`. They must include: 2026-03-18 and 2026-03-20 (Vikram Samvat rollover around Chaitra Shukla Pratipada), two dates inside Adhik Jyeshtha 2026 (≈ 17 May – 15 Jun), at least one kshaya-tithi day and one vriddhi-tithi day in 2026, a Purnima, an Amavasya, today (2026-10-25), and dates spread across all months. Write the source URL into each entry.
- [ ] **Step 2: Write the failing tests:**
  - `lahiriAyanamsa(new Date('2000-01-01T12:00:00Z'))` ≈ `23.8531` (±0.01); for `2026-01-01T00:00Z` ≈ `24.216` (±0.01).
  - For every fixture date, `sunrise(date, UJJAIN)` and `sunset(...)` match (±2 min).
  - `findAngleCrossing` on a synthetic linear angle `f(d) = (d.getTime()/3.6e6) % 360` (1°/hour) with target 10 and `from` = epoch + 5 h returns epoch + 10 h (±1 s).
  - `localDateOf(new Date('2026-10-25T20:00:00Z'), 'Asia/Kolkata')` = `'2026-10-26'`.
- [ ] **Step 3: Run** `npx vitest run tests/unit/panchang/astro.test.ts` → FAIL.
- [ ] **Step 4: Implement.** Ayanamsa: `23.853056 + 1.396971*T + 0.000308*T*T` with T = Julian centuries from J2000. Tropical longitudes come from astronomy-engine `SunPosition` / `EclipticGeoMoon` (true equinox of date); sidereal = tropical − ayanamsa, normalised to [0, 360). Rise/set use `SearchRiseSet` starting at local midnight of `localDate` (computed from `loc.tz`), with the default upper-limb + refraction behaviour.
- [ ] **Step 5: Run** → PASS.
- [ ] **Step 6: Commit** `feat(panchang): astronomy core with Lahiri ayanamsa and rise/set`.

---

### Task 3: Panchang day (tithi, nakshatra, yoga, karana, masa, samvat) — DONE (e4e5eae..be67f24), REMOVED by Task 4

> Superseded 2026-10-26: the panchang is out of scope. Kept only as the record of what Task 4 removes; do not execute.

**Files:**
- Create: `src/panchang/elements.ts`, `src/panchang/masa.ts`, `src/panchang/day.ts`, `src/panchang/index.ts`
- Test: `tests/unit/panchang/day.test.ts`

**Interfaces:**
- Consumes: Task 2.
- Produces:
  ```ts
  export type Paksha = 'shukla' | 'krishna'
  export interface Masa { index: number; adhik: boolean }   // 0 = Chaitra … 11 = Phalguna
  export interface DayPanchang {
    date: string; loc: GeoLocation
    prevSunset: Date; sunrise: Date; sunset: Date; nextSunrise: Date; moonrise: Date | null; moonset: Date | null
    vara: number                                   // 0 = Sunday, weekday at sunrise in loc.tz
    tithi: Span[]; nakshatra: Span[]; yoga: Span[]; karana: Span[]  // all spans overlapping [sunrise, nextSunrise)
    paksha: Paksha                                  // at sunrise
    amantaMasa: Masa; purnimantaMasa: Masa
    ritu: number                                    // 0 Vasanta … 5 Shishira
    ayana: 'uttarayana' | 'dakshinayana'
    vikramSamvat: number; shakaSamvat: number
  }
  panchangForDay(localDate: string, loc?: GeoLocation): DayPanchang   // loc defaults to UJJAIN
  karanaName(index: number): KaranaId   // index 1–60 → 'kimstughna' | 'bava' | … | 'naga'
  ```
  Indices: tithi 1–30 (1–15 Shukla, 16–30 Krishna; 15 = Purnima, 30 = Amavasya), nakshatra 1–27, yoga 1–27, karana 1–60.

- [ ] **Step 1: Write the failing table-driven test** (fixtures from Task 2): for each fixture, `panchangForDay(date)` matches the sunrise and sunset (±2 min), each listed span's index and end (±2 min), `amantaMasa`, `adhik` and `vikramSamvat`. Also assert `shakaSamvat === vikramSamvat - 135`, and that the kshaya day's `tithi.length === 2`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.** Use these rules, which a signature alone doesn't fix:
  - Tithi = floor(((moon − sun) mod 360) / 12) + 1. Nakshatra = floor(moonSid / (360/27)) + 1. Yoga = floor(((sunSid + moonSid) mod 360) / (360/27)) + 1. Karana = floor(((moon − sun) mod 360) / 6) + 1. Span ends come from `findAngleCrossing`.
  - Karana names: 1 = Kimstughna; 2–57 cycle Bava, Balava, Kaulava, Taitila, Gara, Vanija, Vishti by `(i−2) % 7`; 58 Shakuni, 59 Chatushpada, 60 Naga.
  - Amanta masa: find the new moons before and after the date. masa index = `(sunRashi(at previous new moon) + 1) % 12` (Rashi 0 = Mesha … 11 = Meena; Meena → 0 Chaitra). `adhik = sunRashi(prev new moon) === sunRashi(next new moon)`.
  - Purnimanta masa: same as Amanta in Shukla paksha; Amanta index + 1 (mod 12) in Krishna paksha.
  - Vikram Samvat (Chaitradi) = year of the Gregorian date + 57 if the date is on or after the Chaitra Shukla Pratipada of that year, else + 56. Shaka = VS − 135.
  - Ritu = floor(amantaMasa.index / 2). Ayana: Uttarayana when sunSid ∈ [270, 360) ∪ [0, 90).
- [ ] **Step 4: Run** → PASS. If a fixture disagrees by more than tolerance, investigate before loosening anything (superpowers:systematic-debugging).
- [ ] **Step 5: Commit** `feat(panchang): daily panchang with masa, adhik and samvat`.

---

### Task 4: Remove the panchang

**Files:**
- Delete: `src/panchang/` (all files), `tests/unit/panchang/` (all files), `tests/fixtures/panchang-ujjain.json`
- Modify: `package.json`, `package-lock.json` (drop `astronomy-engine`), `README.md` (only if it mentions the panchang)

**Interfaces:**
- Consumes: nothing. Produces: nothing — afterwards no code imports anything panchang-related.

- [ ] **Step 1: Delete** the files above with `git rm -r`, and run `npm uninstall astronomy-engine`.
- [ ] **Step 2: Verify removal:** `grep -rniE "panchang|astronomy-engine|samvat|choghadiya" src tests package.json README.md vite.config.ts` prints nothing; `test -d node_modules/astronomy-engine` fails.
- [ ] **Step 3: Verify the build:** `npm run check` passes (the smoke test remains) and `npm run build` succeeds; `grep -l astronomy dist/assets/*.js` prints nothing.
- [ ] **Step 4: Commit** `chore: remove panchang engine and astronomy-engine`.

---

### Task 5: Festival data and "when" text

**Files:**
- Create: `src/content/langs.ts`, `src/content/festivals.ts`, `content/festivals.json`
- Test: `tests/unit/content/festivals.test.ts`

**Interfaces:**
- Produces (`langs.ts`, per ruling R1; `schema.ts` in Task 6 re-exports these):
  ```ts
  export const LANGS = ['en','hi','bn','mr','ta','te','gu'] as const; export type Lang = typeof LANGS[number]
  export type L10n = Record<Lang, string>
  ```
- Produces (`festivals.ts`):
  ```ts
  type FestivalWhen =
    | { kind: 'tithi'; masa: number; paksha: 'shukla' | 'krishna'; tithi: number; days?: number }
        // masa 0 = Chaitra … 11 = Phalguna (Purnimanta); tithi 1–15 within the paksha (15 = Purnima in shukla, Amavasya in krishna)
    | { kind: 'sankranti'; rashi: number; offsetDays?: number; days?: number }   // rashi 0 = Mesha … 11 = Meena
    | { kind: 'weekday-in-masa'; masa: number; weekday: number }                 // weekday 0 = Sunday
  interface FestivalDef { id: string; name: L10n; when: FestivalWhen; months: number[] }  // months 1–12, in order of occurrence
  const FestivalSchema: z.ZodType<FestivalDef>
  loadFestivals(): FestivalDef[]                     // content/festivals.json, parsed with FestivalSchema
  interface CalendarTerms {
    masas: string[]; rashis: string[]; weekdaysPlural: string[]   // 12, 12, 7
    shukla: string; krishna: string; purnima: string; amavasya: string
    tpl: { tithi: string; tithiRange: string; special: string; sankranti: string; sankrantiFrom: string;
           weekdayInMasa: string; withMonths: string }
  }
  festivalWhenText(f: FestivalDef, terms: CalendarTerms, locale: string): string
  ```
- English templates (Task 7 moves them into `content/i18n/en.json` under `calendar.*`; the test holds them inline until then): `tithi` `"{masa} {paksha} {tithi}"`, `tithiRange` `"{masa} {paksha} {from}–{to}"`, `special` `"{masa} {name}"` (Purnima/Amavasya), `sankranti` `"Sun enters {rashi}"`, `sankrantiFrom` `"From day {n} of solar {masa}, {days} days"` (solar masa index = (rashi + 1) % 12), `weekdayInMasa` `"{weekdays} of {masa}"`, `withMonths` `"{when} ({months})"`. Month names come from `Intl.DateTimeFormat(locale, { month: 'short' })`; one month → `Jan`; several → first `–` last.
- Purnimanta masa names (en): Chaitra, Vaishakha, Jyeshtha, Ashadha, Shravana, Bhadrapada, Ashvina, Kartika, Margashirsha, Pausha, Magha, Phalguna. Rashis (en): Mesha, Vrishabha, Mithuna, Karka, Simha, Kanya, Tula, Vrishchika, Dhanu, Makara, Kumbha, Meena.
- `content/festivals.json` holds exactly these to start (English names; the other languages arrive in Task 17):

  | id | when | months | expected English text |
  |---|---|---|---|
  | maha-shivaratri | tithi, masa 11, krishna, 14 | [2, 3] | Phalguna Krishna 14 (Feb–Mar) |
  | chaitra-navratri | tithi, masa 0, shukla, 1, days 9 | [3, 4] | Chaitra Shukla 1–9 (Mar–Apr) |
  | sharad-navratri | tithi, masa 6, shukla, 1, days 9 | [9, 10] | Ashvina Shukla 1–9 (Sep–Oct) |
  | durga-puja | tithi, masa 6, shukla, 6, days 5 | [9, 10] | Ashvina Shukla 6–10 (Sep–Oct) |
  | diwali | tithi, masa 7, krishna, 15 | [10, 11] | Kartika Amavasya (Oct–Nov) |
  | kartik-purnima | tithi, masa 7, shukla, 15 | [10, 11] | Kartika Purnima (Oct–Nov) |
  | guru-purnima | tithi, masa 3, shukla, 15 | [6, 7] | Ashadha Purnima (Jun–Jul) |
  | nag-panchami | tithi, masa 4, shukla, 5 | [7, 8] | Shravana Shukla 5 (Jul–Aug) |
  | shravan-somvar | weekday-in-masa, masa 4, weekday 1 | [7, 8] | Mondays of Shravana (Jul–Aug) |
  | makar-sankranti | sankranti, rashi 9 | [1] | Sun enters Makara (Jan) |
  | ambubachi | sankranti, rashi 2, offsetDays 6, days 4 | [6] | From day 7 of solar Ashadha, 4 days (Jun) |

- [ ] **Step 1: Write the failing tests:** every row of the table renders its expected English text with locale `en`; `content/festivals.json` parses with `FestivalSchema` and ids are unique; the schema rejects `months: []`, `months: [13]`, `tithi: 16`, `masa: 12` and a missing `name.en`; **Review Focus 3:** a synthetic festival with `months: [12, 1]` renders `(Dec–Jan)`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/content/festivals.test.ts` → FAIL.
- [ ] **Step 3: Implement.** A day range is `tithi`…`tithi + days − 1`. Non-en names may be `""` while `ALLOW_UNTRANSLATED=1` (ruling R2).
- [ ] **Step 4: Run** → PASS; `npm run check` → PASS.
- [ ] **Step 5: Commit** `feat(content): festival data described in Hindu-calendar terms`.

---

### Task 6: Content schema, loader, filters, search, master lists

**Files:**
- Create: `src/content/schema.ts`, `src/content/load.ts`, `src/content/filters.ts`, `src/content/search.ts`, `src/content/geo.ts`, `content/lists/jyotirlingas.json`, `content/lists/shakti-peethas.json`, `tests/fixtures/temples/*.json` (3 complete samples: mahakaleshwar, kedarnath, kamakhya)
- Test: `tests/unit/content/schema.test.ts`, `tests/unit/content/filters.test.ts`, `tests/content/content.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // re-exports LANGS, Lang, L10n from langs.ts (Task 5)
  export type PeethaList = 'peetha-nirnaya-51' | 'ashtadasha-18' | 'adi-4'
  export type PinCategory = 'jyotirlinga' | 'maha-peetha' | 'peetha'
  export const TempleSchema: z.ZodType<Temple>    // fields per spec §5, plus `aliases?: string[]`
  // darshan: { kind: 'youtube-channel'; channelId } | { kind: 'youtube-video'; videoId } | { kind: 'website' }
  //          & { url, official: true, lastVerified: 'YYYY-MM-DD', verifiedVia: url }   (optional field)
  loadTemples(): Temple[]                          // import.meta.glob('/content/temples/*.json', { eager: true }), parsed
  getTemple(id: string): Temple | undefined
  pinCategory(t: Temple): PinCategory              // 'ashtadasha-18' ∈ lists → 'maha-peetha'
  interface Filters { categories: Set<PinCategory>; list?: PeethaList; region?: string; festivalMonth?: number }  // 1–12, matches FestivalDef.months
  applyFilters(ts: Temple[], f: Filters, festivals: FestivalDef[]): Temple[]
  searchTemples(ts: Temple[], q: string): Temple[] // any language name, deity or alias; case- and diacritic-insensitive (NFD, strip \p{M} only for Latin)
  nearestTemples(ts: Temple[], p: { lat: number; lng: number }, n?: number): { temple: Temple; km: number }[]  // haversine, n = 5
  ```

- [ ] **Step 1: Write the failing tests:** the 3 fixtures parse; a fixture missing `name.ta` fails with a path mentioning `name.ta`; a darshan without `verifiedVia` fails; `pinCategory(kamakhya)` = 'maha-peetha' (Kamarupa is in the Ashtadasha stotram, so its fixture lists all three); `pinCategory(kedarnath)` = 'jyotirlinga'; `searchTemples(…, 'केदार')` and `'kedar'` both find kedarnath; `nearestTemples` from Ujjain puts mahakaleshwar first with `km < 1`; `applyFilters` with categories {jyotirlinga} drops kamakhya; **Review Focus 4:** with `festivalMonth` 2 and then 3, a temple whose festivals include maha-shivaratri is kept both times, and with 8 it is dropped.
- [ ] **Step 2: Write `tests/content/content.test.ts`** over the real `content/temples/*` (passes vacuously while empty): schema-valid, unique ids, coordinates inside the extent, every `festivalId` exists in festivals.json, every photo has an entry in `src/generated/photo-credits.json`, every Shakti Peetha id appears in `content/lists/shakti-peethas.json`.
- [ ] **Step 3: Run** → FAIL. **Implement** the schema and helpers. **Run** → PASS.
- [ ] **Step 4: Research the master lists.** `jyotirlingas.json`: 12 entries `{id, nameEn, primary: {lat,lng,place}, alternates: [...], sources}`. `shakti-peethas.json`: the 51 from the Peetha Nirnaya Tantra, the 18 from the Ashtadasha Shakti Peetha Stotram and the 4 Adi Peethas, merged into one list: `{id, nameEn, lists: PeethaList[], bodyPart, devi, bhairava, candidates:[{lat,lng,place,country}], primaryCandidate, sources}`. Every coordinate is checked on a map against the actual temple. Record the total count.
- [ ] **Step 5: USER CHECKPOINT.** Show the user the final Shakti Peetha list (name, place, lists membership, disputed sites) and the total count. Wait for approval before any content task (15–17) starts.
- [ ] **Step 6: Commit** `feat(content): schema, loader, filters, search and master lists`.

---

### Task 7: i18n core, themes, fonts

**Files:**
- Create: `src/i18n/index.ts`, `src/i18n/fonts.ts`, `content/i18n/{en,hi,bn,mr,ta,te,gu}.json`, `src/styles/tokens.css`, `src/styles/base.css`, `src/state.ts`
- Test: `tests/unit/i18n.test.ts`, `tests/unit/contrast.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // state.ts (@preact/signals)
  lang: Signal<Lang>; theme: Signal<'dark' | 'light'>; reducedMotion: Signal<boolean>; is3D: Signal<boolean>
  setLang(l: Lang): void; setTheme(t): void   // persist to localStorage (try/catch), update <html lang> / data-theme
  // i18n
  detectLang(navLangs: readonly string[]): Lang     // first match by primary subtag, else 'en'
  t(key: string, vars?: Record<string, string | number>): string   // falls back to en, then to the key
  tList(key: string): string[]                      // e.g. 'calendar.masas' (12)
  calendarTerms(): CalendarTerms                    // Task 5's CalendarTerms, built from the current lang's 'calendar.*' keys
  loc(v: L10n): { text: string; fallback: boolean } // content text for the current lang, en fallback flagged
  loadFont(l: Lang): void                           // injects the Google Fonts <link> for Noto Sans + script once
  ```
- Calendar terms in every i18n file under `calendar`: `masas`(12), `rashis`(12), `weekdaysPlural`(7), `shukla`, `krishna`, `purnima`, `amavasya`, and the `tpl.*` templates from Task 5 (en values exactly as listed there). Task 5's test switches from its inline terms to `calendarTerms()` for `en`.
- Colour tokens (exact values):

  | token | dark | light |
  |---|---|---|
  | `--bg` | `#12142B` | `#FBF5E9` |
  | `--surface` | `#1C1F3D` | `#FFFFFF` |
  | `--text` | `#F3EBDD` | `#4A1F14` |
  | `--muted` | `#C9BFAE` | `#6E4A3C` |
  | `--accent` | `#FF9933` | `#B05700` |
  | `--gold` | `#E8B44C` | `#9A6A00` |
  | `--kumkum` | `#E04A5A` | `#9E1B32` |
  | `--good` | `#5FD08A` | `#1E7A44` |
  | `--bad` | `#FF7A7A` | `#B3261E` |

- [ ] **Step 1: Write the failing tests:** every i18n file has exactly the key set of `en.json` (deep, including list lengths); `detectLang(['ta-IN','en'])` = 'ta', `(['fr'])` = 'en'; `t('missing.key')` returns the key; `loc` with an empty `hi` string returns the en text with `fallback: true`. `contrast.test.ts` parses `tokens.css` and asserts contrast ≥ 4.5 for `--text`, `--muted`, `--accent`, `--good` and `--bad` on both `--bg` and `--surface`, in both themes.
- [ ] **Step 2: Run** → FAIL. **Implement**, including the UI strings for all 7 languages (machine-assisted; native review is tracked later). `reducedMotion` is initialised from `matchMedia('(prefers-reduced-motion: reduce)')`. In `base.css`, all font sizes are in rem and every interactive element is at least 44×44 px. If a token fails contrast, adjust it and record the new value in this table in the plan.
- [ ] **Step 3: Run** → PASS. **Commit** `feat(i18n): 7-language strings, themes and contrast-checked tokens`.

---

### Task 8: Map base: style, terrain, boundary, 2D/3D

**Files:**
- Create: `src/map/controller.ts`, `src/map/style.ts`, `src/map/terrain.ts`, `src/map/boundary.ts`, `content/boundary/india.geojson`, `content/boundary/neighbours.geojson`, `content/boundary/SOURCE.md`
- Test: `tests/unit/map/style.test.ts`

**Interfaces:**
- Consumes: `Lang`, the theme type.
- Produces:
  ```ts
  interface MapController {
    setTheme(t: 'dark' | 'light'): void; setLang(l: Lang): void; set3D(on: boolean): void; resetView(): void
    setTemples(ts: Temple[]): void; select(id: string | null, opts?: { animate: boolean }): void
    onSelect(cb: (id: string) => void): void; onRiver(cb: (riverId: string) => void): void
    destroy(): void
  }
  createMap(el: HTMLElement, init: { theme; lang; reducedMotion: boolean }): Promise<MapController>  // rejects if WebGL is unavailable
  transformBaseStyle(base: StyleSpecification, theme: 'dark' | 'light'): StyleSpecification
  ```
  (setTemples, select and onSelect are implemented in Task 10, onRiver in Task 9; until then they are no-ops.)

- [ ] **Step 1: Boundary research and decision.** Determine whether the Survey of India's official India outline can be redistributed in a public repo. Primary choice if not: **Natural Earth 1:10m admin-0, India point-of-view edition** (`ne_10m_admin_0_countries_ind`, public domain), which follows the Government of India's claimed boundaries. Extract India → `india.geojson` and PAK, NPL, BGD, LKA, CHN, BTN, MMR, AFG → `neighbours.geojson`, simplified to keep each file under 1.5 MB. Write the provenance, licence and the decision in `SOURCE.md`. **Tell the user which source was used before the first public deploy.**
- [ ] **Step 2: Write the failing tests** for `transformBaseStyle`: given a fixture style containing layers with `source-layer: 'boundary'` and `admin_level` filters ≤ 2, the output has none of them, while admin_level 4 (state) layers remain; the dark output's `background` paint colour is `#12142B`; it adds no layer whose id starts with `boundary-country`.
- [ ] **Step 3: Run** → FAIL. **Implement.** Fetch the OpenFreeMap `positron` style JSON at runtime and pass it through `transformBaseStyle` (dark recolours water, land, roads and labels to the token palette). Add the terrain source (DEM URL from the constraints, `tileSize: 256`, `maxzoom: 15`), `hillshade`, `setTerrain({exaggeration: 1.5})`, sky/fog, the India and neighbour fill + line layers (India outline in `--gold` at 1.5 px), the attribution "Boundary as per Survey of India" (or the SOURCE.md wording), `maxBounds [[55, 0], [105, 40]]`, initial view centred on 23° N 80° E, zoom 4, pitch 45. `set3D(false)` sets pitch 0 and removes terrain.
- [ ] **Step 4: Run** → PASS. **Manual check:** `npm run dev`, take a Playwright screenshot of the map at pitch 45 → the Himalayan relief is visibly raised and no basemap international boundary is drawn. Save the screenshot to the scratchpad for the final report.
- [ ] **Step 5: Commit** `feat(map): themed basemap with terrain and official boundary`.

---

### Task 9: Rivers and Saraswati

**Files:**
- Create: `src/map/rivers.ts`, `content/rivers/{ganga,yamuna,narmada,godavari,kaveri,shipra,brahmaputra,saraswati}.geojson`, `content/rivers/saraswati.json`, `src/ui/RiverCard.tsx`
- Test: `tests/unit/map/rivers.test.ts`

**Interfaces:**
- Produces: `riverLayers(theme): LayerSpecification[]`; `controller.onRiver(cb)` fires with the river id on a tap.
- Sources: Natural Earth 10m river centerlines (public domain) for the major rivers; Shipra from OpenStreetMap (ODbL; add the attribution). Saraswati waypoints (lng, lat): Adi Badri (77.33, 30.45) → Pehowa (76.58, 29.98) → Sirsa (75.03, 29.53) → Hanumangarh (74.32, 29.58) → Anupgarh (73.21, 29.19) → Fort Abbas (72.85, 29.19) → Derawar (71.33, 28.77) → toward the Rann of Kutch (70.5, 24.5), smoothed. Each river file has `properties: { id, kind: 'living' | 'ancient', name: L10n }`. A Triveni Sangam point is at (81.885, 25.4246).

- [ ] **Step 1: Write the failing tests:** all 8 files parse; Saraswati has `kind: 'ancient'`; `riverLayers('dark')` returns a dashed line (`line-dasharray` set) for ancient rivers and a glow (two stacked lines, a blurred one under a sharp one) for living rivers; every river has all 7 name keys (empty allowed until Task 17, but the keys must be present).
- [ ] **Step 2: Run** → FAIL. **Implement** the layers, the labels (`text-field` from the name in the current lang, updated by `setLang`) and `RiverCard`, which shows `saraswati.json` text: Rig Vedic references, the ISRO/CGWB palaeochannel findings, and the "reconstruction, still debated" note, with its sources.
- [ ] **Step 3: Run** → PASS. **Commit** `feat(map): sacred rivers and the ancient Saraswati course`.

---

### Task 10: Temple pins

**Files:**
- Create: `src/map/pins.ts`, `src/map/icons.ts`
- Modify: `src/map/controller.ts`
- Test: `tests/unit/map/pins.test.ts`

**Interfaces:**
- Consumes: `Temple`, `pinCategory`, `loc`.
- Produces: `templesToGeoJSON(ts: Temple[], lang: Lang): FeatureCollection<Point, { id; name; category: PinCategory | 'alternate' }>` (alternates included with category 'alternate', and id `<templeId>~<n>`). `controller.setTemples`, `select`, `onSelect`.

- [ ] **Step 1: Write the failing tests:** feature count = temples + alternates; the category mapping is correct; names follow the lang (with en fallback).
- [ ] **Step 2: Run** → FAIL. **Implement.** SVG icons drawn to canvas → `map.addImage`: a saffron Shivalinga, a golden lotus pin at 1.4× scale with a halo, a kumkum drop pin, a grey small pin. The shapes differ, not just the colours. Use a GeoJSON source with `cluster: true, clusterMaxZoom: 7, clusterRadius: 40`; the cluster circle shows its count. Clicking a cluster zooms in; clicking a pin calls the `onSelect` callbacks. `select(id)` → `flyTo({center, zoom: 11, pitch: 60})`, or `jumpTo` when `reducedMotion`. Alternate pins select their parent temple. Each pin carries an ARIA label via a hidden, keyboard-focusable marker list that mirrors the visible pins.
- [ ] **Step 3: Run** → PASS. **Commit** `feat(map): temple pins with clustering and fly-to`.

---

### Task 11: App shell: header, router, search, filters, fallbacks

**Files:**
- Create: `src/router.ts`, `src/ui/Header.tsx`, `src/ui/SearchBox.tsx`, `src/ui/FilterBar.tsx`, `src/ui/ListView.tsx`, `src/ui/Notice.tsx`
- Modify: `src/app.tsx`, `src/state.ts`
- Test: `tests/unit/router.test.ts`, `tests/unit/ui/app.test.tsx` (with @testing-library/preact + jsdom)

**Interfaces:**
- Produces: `type Route = { kind: 'map' } | { kind: 'temple'; id: string }`; `parseRoute(hash: string): Route`; `routeHash(r: Route): string`; signals `route`, `filters`, `notice: Signal<string | null>`.

- [ ] **Step 1: Write the failing tests:** `parseRoute('#/kedarnath')` → temple; `''` → map. **Review Focus 1:** rendering App with hash `#/xyz` (with `createMap` mocked) shows the `t('notice.templeNotFound')` text and the map container. If `createMap` rejects, `ListView` renders with all temples. The language button lists the 7 endonyms `English, हिन्दी, বাংলা, मराठी, தமிழ், తెలుగు, ગુજરાતી`. The theme toggle flips `data-theme`. **Review Focus 5:** with `navigator.geolocation.getCurrentPosition` mocked to call its error callback, clicking "nearest temples" shows `t('notice.geoDenied')` and the map container stays rendered.
- [ ] **Step 2: Run** → FAIL. **Implement.** Header: title, SearchBox (results as a listbox, Enter selects), language menu, theme toggle, 2D/3D toggle, reset view, locate-me + "nearest temples". Geolocation is requested only on a click; if it's denied → `notice` with `t('notice.geoDenied')`. FilterBar: category chips, list chips (Maha 18 / Adi 4 / 51), region select, festival-month select. Terrain tile errors (`map.on('error')` on the DEM source) → set3D(false) + a notice.
- [ ] **Step 3: Run** → PASS. **Commit** `feat(ui): app shell with routing, search, filters and fallbacks`.

---

### Task 12: Temple sheet

**Files:**
- Create: `src/ui/TempleSheet.tsx`, `src/ui/PhotoGallery.tsx`, `src/ui/Darshan.tsx`
- Test: `tests/unit/ui/temple-sheet.test.tsx`

**Interfaces:**
- Consumes: `Temple`, `loc`, `FestivalDef[]`, `festivalWhenText`, `calendarTerms`, photo credits JSON `{ [file: string]: { thumb: string; full: string; author: string; licence: string; licenceUrl: string; page: string } }`.

- [ ] **Step 1: Write the failing tests** (kedarnath fixture): the section headings render in the spec order; in English the festivals section shows `Maha Shivaratri — Phalguna Krishna 14 (Feb–Mar)` followed by the temple's `localNote`; a darshan of kind `youtube-channel` renders an iframe `src` containing `embed/live_stream?channel=<id>` **and** the official-site link; kind `website` renders only the link; each photo's credits show author + licence; the "Other claimed sites" section appears only when `alternateSites` is non-empty; a `fallback: true` text shows the "machine-assisted / English" marker; Shakti Peetha sheets show the body part, the Devi and the Bhairava, plus the scriptures from `lists`.
- [ ] **Step 2: Run** → FAIL. **Implement.** Below 768px it's a bottom sheet (drag handle; snap points 35% / 90%), above that a 420px side panel. Photos use `loading="lazy"` with `onError` hiding the image. The iframe uses `loading="lazy"`, `allow="autoplay; encrypted-media"` and a title. Esc and the close button route back to `#/`.
- [ ] **Step 3: Run** → PASS. **Commit** `feat(ui): temple sheet with photos, darshan and festivals`.

---

### Task 13: (Removed 2026-10-26 — Panchang menu and Ujjain widget are out of scope)

---

### Task 14: Photo credits script

**Files:**
- Create: `scripts/fetch-photo-credits.ts`, `src/generated/photo-credits.json` (initially `{}`)
- Test: `tests/unit/scripts/photo-credits.test.ts`

**Interfaces:**
- Produces: `parseImageInfo(apiJson): Record<string, Credit>` (pure, tested); the CLI `npm run credits` reads every `photos` entry in `content/temples/*.json` and queries `https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=800&format=json&titles=…` in batches of 50, with a descriptive User-Agent. Author comes from `extmetadata.Artist` (HTML stripped), licence from `LicenseShortName` and `LicenseUrl`.

- [ ] **Step 1: Write the failing test** with a saved API response fixture: author tags stripped, the licence fields mapped, a missing file → it isn't in the output and is reported in the returned `missing` list.
- [ ] **Step 2: Run** → FAIL. **Implement.** The CLI exits non-zero if any file is missing or has a non-free licence (anything not CC0, CC BY, CC BY-SA or public domain).
- [ ] **Step 3: Run** → PASS. **Commit** `feat(scripts): Wikimedia Commons photo credits`.

---

### Task 15: Content: Jyotirlingas (English) with verified darshan

**Files:**
- Create: `content/temples/<id>.json` for the 12 Jyotirlingas (somnath, mallikarjuna, mahakaleshwar, omkareshwar, kedarnath, bhimashankar, kashi-vishwanath, trimbakeshwar, vaidyanath, nageshwar, rameshwaram, grishneshwar)
- Modify: `src/generated/photo-credits.json` (via `npm run credits`)

- [ ] **Step 1: For each temple,** write the English content: deity, history, story, 4–8 facts, visiting (timings, nearest airport and railway, best season), festivals (ids from festivals.json; add new festival defs if needed: `when` and `months` checked against a published panchang, with the source noted in the task report), alternates, 3–6 Commons photos, sources (at least 2 per temple, preferring the temple trust's site, government tourism and scholarly references). No unsourced claims. The other 6 language fields are left as `""` and `translationReviewed` is all false; the content test allows empty non-en strings only while `translationReviewed.<lang> === false` **and** the env var `ALLOW_UNTRANSLATED=1` is set. That variable is set in CI only until Task 17 ends, and is removed in Task 17's last step.
- [ ] **Step 2: Darshan verification.** For each temple, find the trust's official website, and on it a link to its live stream channel. Record `kind`, `channelId`/`videoId`, `url`, `verifiedVia` (the official page that links it) and `lastVerified: 2026-10-25` (the actual date of checking). If no such link exists, use `kind: 'website'`. Write a table of the findings into the task report.
- [ ] **Step 3: Run** `npm run credits && npm test` → PASS. **Commit** `content: Jyotirlingas in English with verified darshan links`.

---

### Task 16: Content: Shakti Peethas (English)

**Files:**
- Create: `content/temples/<id>.json` for every entry of the approved `content/lists/shakti-peethas.json`

- [ ] **Step 1:** Same procedure as Task 15 Steps 1–3, plus `peetha.bodyPart`, `devi`, `bhairava`, `lists`, and the candidate sites as `alternateSites`, with the dispute explained in `history`. Sites outside India carry the correct `country`. Commit in batches of about 10 temples: `content: Shakti Peethas batch N in English`.

---

### Task 17: Translations

**Files:**
- Modify: `content/temples/*.json`, `content/festivals.json`, `content/rivers/*`, `content/lists/*` (display names only)

- [ ] **Step 1:** For each language in order `hi, mr, gu, bn, ta, te`: translate every L10n field. Keep deity and place names in their established local forms (e.g., Tamil "இராமேஸ்வரம்"), and keep Sanskrit terms in the native script rather than transliterating English. `translationReviewed.<lang>` stays false. One commit per language: `content: <lang> translations`.
- [ ] **Step 2:** Remove `ALLOW_UNTRANSLATED` from CI; `npm test` → PASS with zero empty strings. **Commit** `ci: require complete translations`.

---

### Task 18: End-to-end, accessibility, Lighthouse

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/app.spec.ts`, `lighthouserc.json`
- Modify: `.github/workflows/deploy.yml` (remove `--pass-with-no-tests`, add `npx lhci autorun`)

- [ ] **Step 1: Write the e2e tests** against `npm run preview` (projects: Desktop Chrome 1280×800 and Pixel 7):
  - The map canvas appears; clicking the Mahakaleshwar pin (via the accessible marker list) opens the sheet with its name.
  - The language switch to हिन्दी changes the header title; reload keeps it.
  - The theme toggle switches to light; reload keeps it.
  - `#/kedarnath` opens the Kedarnath sheet; **Review Focus 1:** `#/xyz` shows the not-found notice and the map.
  - **Review Focus 2:** at viewport 320×640, with lang `ta` and then `te`, `document.documentElement.scrollWidth <= 320` with the sheet open and the header visible.
  - axe (`@axe-core/playwright`) has no serious or critical violations on the map and the sheet, in both themes.
- [ ] **Step 2: Run** `npm run build && npm run test:e2e` → PASS (fix the app, never the assertions).
- [ ] **Step 3:** `lighthouserc.json`: mobile preset, accessibility ≥ 0.9 → error, performance ≥ 0.8 → warn. Run `npx lhci autorun` locally and record the scores.
- [ ] **Step 4: Commit** `test: e2e, accessibility and Lighthouse checks`.

---

### Task 19: Publish and verify

- [ ] **Step 1:** The repo `dbp-develop/Shiv-Shakti` already exists and is cloned at `~/projects/shiv-shakti`. Confirm that Settings → Pages → Source = "GitHub Actions" (a user step if it isn't set), and that `main` is pushed.
- [ ] **Step 2:** Watch the Actions run until it's green; open the Pages URL; repeat the Task 18 checks by hand on the live URL on a phone-sized viewport; confirm the tiles, terrain and fonts load from production.
- [ ] **Step 3: Final report to the user:** the live URL, the boundary source decision, the darshan verification table, the Lighthouse scores, the list of unreviewed translations, and the known limitations.
