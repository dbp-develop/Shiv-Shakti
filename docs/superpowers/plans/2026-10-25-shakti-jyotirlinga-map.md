# Shakti Peetha & Jyotirlinga Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static, 7-language, dark/light website with a 3D-terrain MapLibre map of the Shakti Peethas and Jyotirlingas, temple pages, an Ujjain panchang widget and a Panchang menu, deployed to GitHub Pages.

**Architecture:** Vite + TypeScript + Preact SPA. A pure `src/panchang/` engine (no DOM) feeds the widget, the Panchang menu and the festival dates. `src/map/` wraps MapLibre behind a `MapController` interface. All temple, river, festival and UI text lives in `content/` as JSON and GeoJSON, validated by tests. GitHub Actions runs the tests, builds and deploys.

**Tech Stack:** Node 22 LTS, Vite 6, TypeScript 5 (strict), Preact 10 + @preact/signals, maplibre-gl 5, astronomy-engine 2, zod 3, Vitest 3, Playwright, @axe-core/playwright, @lhci/cli.

**Spec:** `docs/superpowers/specs/2026-10-25-shakti-jyotirlinga-map-design.md`

## Global Constraints

- Languages, exactly: `en, hi, bn, mr, ta, te, gu`. Every user-visible string exists in all 7.
- Dark theme is the default; light theme via `data-theme="light"` on `<html>`. The choice is saved in `localStorage` key `theme`; the language in key `lang`.
- Text and muted text contrast ≥ 4.5:1 against the background in both themes (WCAG 2.1 AA).
- Panchang location default: Ujjain `{lat: 23.1765, lng: 75.7885, tz: 'Asia/Kolkata'}`. Ayanamsa is Lahiri. The Hindu day runs from sunrise to the next sunrise.
- Panchang end-time tolerance vs the reference: ±2 minutes.
- Map: default pitch 45°, terrain exaggeration 1.5, terrain DEM `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png` (Terrarium encoding), basemap from OpenFreeMap (no API key). The basemap's own country boundary layers are never shown.
- The content extent check: every coordinate within lng 60–98.5, lat 5–37.5.
- Darshan entries: `official: true`, a `lastVerified` ISO date and a `verifiedVia` URL on the temple's official site. Never invent a stream URL.
- Photos only from Wikimedia Commons, always shown with the author and licence.
- No backend, no API keys, no paid services. Exact versions pinned in `package.json` (no `^`).
- Vite `base` is `/shakti-jyotirlinga-map/` (overridable via env `VITE_BASE`).
- Commit after each green step group; messages are imperative, one line, plus the Co-Authored-By trailer.

## Review Focus

1. **Hindu day after midnight:** at 02:00 IST, the widget and panchang must show the day that began at the previous sunrise (its vara, tithi and night Choghadiya), while the clock shows today's calendar date. → test in Task 4.
2. **Visitor outside India:** with the device time zone `Australia/Sydney`, the Ujjain widget must still show IST time and Ujjain's panchang. → test in Task 4 (engine) and Task 13 (widget).
3. **Kshaya / vriddhi tithi days:** a day holding two tithis lists both spans, and a tithi spanning two sunrises appears on both days; the UI renders both without errors. → fixtures in Task 3, render test in Task 13.
4. **Long scripts on small phones:** Tamil and Telugu text at 320px width causes no horizontal scroll in the sheet, header or panchang. → e2e in Task 18.
5. **Unknown deep link `#/xyz`:** shows the map plus a "temple not found" notice, never a blank page. → unit test in Task 11, e2e in Task 18.

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
  festivals.json               festival definitions (rules + 7-lang names)
  i18n/<lang>.json             UI strings + panchang term lists
src/
  main.tsx  app.tsx  state.ts  router.ts
  panchang/ types.ts astro.ts elements.ts masa.ts day.ts muhurat.ts choghadiya.ts festivals.ts index.ts
  content/  schema.ts load.ts filters.ts search.ts geo.ts
  i18n/     index.ts fonts.ts
  map/      controller.ts style.ts terrain.ts boundary.ts rivers.ts pins.ts icons.ts
  ui/       Header.tsx FilterBar.tsx SearchBox.tsx TempleSheet.tsx PhotoGallery.tsx Darshan.tsx
            PanchangPanel.tsx MonthCalendar.tsx UjjainWidget.tsx ListView.tsx RiverCard.tsx Notice.tsx
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
- [ ] **Step 4: Implement `App()`**, rendering `<main id="app-root">` with the text "Shakti Peetha & Jyotirlinga". `index.html` holds an inline script that sets `document.documentElement.dataset.theme = localStorage.getItem('theme') ?? 'dark'` (in try/catch) before CSS loads.
- [ ] **Step 5: Verify:** `npm run check && npm run build` both succeed; `dist/index.html` references assets under `/shakti-jyotirlinga-map/`.
- [ ] **Step 6: CI workflow** `.github/workflows/deploy.yml`: on push to `main` and on PRs → checkout, setup-node 22 with npm cache, `npm ci`, `npm run check`, `npm run build`, `npx playwright install --with-deps chromium`, `npm run test:e2e` (skipped until Task 18 adds tests: guard with `--pass-with-no-tests`), then (main only) `actions/upload-pages-artifact` with `dist` + `actions/deploy-pages`. Permissions: `pages: write`, `id-token: write`.
- [ ] **Step 7: Commit** `chore: scaffold Vite + Preact + TS project with CI`.

---

### Task 2: Panchang astronomy core

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

### Task 3: Panchang day (tithi, nakshatra, yoga, karana, masa, samvat)

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

### Task 4: Muhurats, Choghadiya, "now" helpers

**Files:**
- Create: `src/panchang/muhurat.ts`, `src/panchang/choghadiya.ts`
- Modify: `src/panchang/index.ts` (re-export)
- Test: `tests/unit/panchang/muhurat.test.ts`, `tests/unit/panchang/now.test.ts`

**Interfaces:**
- Consumes: `DayPanchang`, `panchangForDay`.
- Produces:
  ```ts
  type DayFrame = Pick<DayPanchang, 'prevSunset' | 'sunrise' | 'sunset' | 'nextSunrise' | 'vara'>
  interface Muhurats { brahma: Period; abhijit: Period | null; godhuli: Period
                       rahuKaal: Period; yamaganda: Period; gulika: Period; durmuhurat: Period[] }
  muhurats(d: DayFrame): Muhurats
  type ChoghadiyaName = 'udveg' | 'chal' | 'labh' | 'amrit' | 'kaal' | 'shubh' | 'rog'
  interface Choghadiya extends Period { name: ChoghadiyaName; quality: 'good' | 'neutral' | 'bad'; part: 'day' | 'night' }
  choghadiya(d: DayFrame): Choghadiya[]                       // 16 entries, 8 day then 8 night
  panchangAt(now: Date, loc?: GeoLocation): DayPanchang        // the Hindu day containing `now`
  currentChoghadiya(now: Date, loc?: GeoLocation): Choghadiya
  ```

- [ ] **Step 1: Write the failing tests** using a synthetic frame: prevSunset `2026-10-31T18:00+05:30`, sunrise `2026-11-01T06:00+05:30`, sunset `18:00`, nextSunrise `2026-11-02T06:00+05:30`, vara 0 (Sunday):
  - `rahuKaal` 16:30–18:00; `yamaganda` 12:00–13:30; `gulika` 15:00–16:30.
  - `abhijit` 11:36–12:24; with vara 3 (Wednesday) → `null`.
  - `brahma` 04:24–05:12 (the 14th of 15 night-muhurtas from prevSunset to sunrise).
  - `godhuli` 17:48–18:12.
  - `choghadiya(frame)[0]` = `{name: 'udveg', quality: 'bad'}` 06:00–07:30; `[8]` = shubh 18:00–19:30; with vara 1 (Monday) `[0].name === 'amrit'`.
  - **Review Focus 1:** `panchangAt(new Date('2026-10-27T02:00:00+05:30'))` has `date === '2026-10-26'` and the vara of 26 Oct; `currentChoghadiya` at that instant has `part === 'night'`.
  - **Review Focus 2:** run the same assertions with `process.env.TZ = 'Australia/Sydney'` set in a separate test file (`now.tz.test.ts`, configured via vitest `poolOptions` / `env`): results are identical.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.** Rahu, Yamaganda and Gulika are the 1-based eighth-of-day segments by weekday [Sun…Sat]: Rahu `[8,2,7,5,6,4,3]`, Yamaganda `[5,4,3,2,1,7,6]`, Gulika `[7,6,5,4,3,2,1]`. Abhijit = the 8th of 15 day-muhurtas (null on Wednesday). Godhuli = sunset ± 12 min. Durmuhurat, as day-muhurta numbers out of 15: Sun [14], Mon [9,12], Tue [4] plus night-muhurta 7, Wed [8], Thu [6,12], Fri [4,9], Sat [1,2]. Choghadiya cycle `C = [udveg, chal, labh, amrit, kaal, shubh, rog]`: day i (0–7) → `C[(3w + i) % 7]`; night i → `C[(5 + 3w + 5i) % 7]`, where w = vara. Quality: amrit, shubh and labh are good; chal is neutral; the rest are bad. `panchangAt`: take the local date of `now` in loc.tz; if `now` < that day's sunrise, use the previous date.
- [ ] **Step 4: Run** → PASS. Also check two real days against the reference's Choghadiya and Rahu Kaal (±2 min) and add them as assertions.
- [ ] **Step 5: Commit** `feat(panchang): muhurats, choghadiya and current-day helpers`.

---

### Task 5: Festival resolver + festival data

**Files:**
- Create: `src/panchang/festivals.ts`, `content/festivals.json`, `tests/fixtures/festivals-ujjain.json`
- Test: `tests/unit/panchang/festivals.test.ts`

**Interfaces:**
- Consumes: `panchangForDay`.
- Produces:
  ```ts
  type FestivalRule =
    | { kind: 'tithi'; masa: number; tithi: number; observe: 'sunrise' | 'nishita' | 'pradosh'; days?: number }  // masa = Amanta index, nija month only
    | { kind: 'sankranti'; rashi: number; offsetDays?: number; days?: number }                                 // rashi 0 = Mesha (sidereal)
    | { kind: 'weekday-in-masa'; masa: number; weekday: number; style: 'purnimanta' | 'amanta' }
  interface FestivalDef { id: string; name: L10n; rule: FestivalRule }
  festivalDates(rule: FestivalRule, from: string, to: string, loc?: GeoLocation): { start: string; end: string }[]
  ```
- `content/festivals.json` holds at least these (masa = Amanta index, tithi 1–30):

  | id | rule |
  |---|---|
  | maha-shivaratri | tithi, masa 10 (Magha), tithi 29, nishita |
  | chaitra-navratri | tithi, masa 0, tithi 1, sunrise, days 9 |
  | sharad-navratri | tithi, masa 6 (Ashvina), tithi 1, sunrise, days 9 |
  | durga-puja | tithi, masa 6, tithi 6, sunrise, days 5 |
  | diwali | tithi, masa 6, tithi 30, pradosh |
  | kartik-purnima | tithi, masa 7, tithi 15, sunrise |
  | guru-purnima | tithi, masa 3 (Ashadha), tithi 15, sunrise |
  | nag-panchami | tithi, masa 4 (Shravana), tithi 5, sunrise |
  | shravan-somvar | weekday-in-masa, masa 4, weekday 1, purnimanta |
  | makar-sankranti | sankranti, rashi 9 |
  | ambubachi | sankranti, rashi 2, offsetDays 6, days 4 (Kamakhya) |

  English names now; the other 6 languages arrive in Task 17.

- [ ] **Step 1: Collect expected dates** for 2026–2027 Ujjain from the same reference as Task 3 for: Maha Shivaratri, Chaitra and Sharad Navratri starts, Diwali, Makar Sankranti and Guru Purnima, into `festivals-ujjain.json` with the source URL.
- [ ] **Step 2: Write the failing table-driven test** against that fixture, plus one kshaya-case test: if the target tithi touches no sunrise, `observe: 'sunrise'` returns the day it begins on.
- [ ] **Step 3: Run** → FAIL.
- [ ] **Step 4: Implement.** `sunrise`: the day whose sunrise falls within the tithi. `nishita`: the day whose midnight point (midway between sunset and the next sunrise) falls within the tithi. `pradosh`: the day whose sunset + 72 min falls within the tithi. Skip adhik months.
- [ ] **Step 5: Run** → PASS. **Commit** `feat(panchang): festival date resolver and core festivals`.

---

### Task 6: Content schema, loader, filters, search, master lists

**Files:**
- Create: `src/content/schema.ts`, `src/content/load.ts`, `src/content/filters.ts`, `src/content/search.ts`, `src/content/geo.ts`, `content/lists/jyotirlingas.json`, `content/lists/shakti-peethas.json`, `tests/fixtures/temples/*.json` (3 complete samples: mahakaleshwar, kedarnath, kamakhya)
- Test: `tests/unit/content/schema.test.ts`, `tests/unit/content/filters.test.ts`, `tests/content/content.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export const LANGS = ['en','hi','bn','mr','ta','te','gu'] as const; export type Lang = typeof LANGS[number]
  export type L10n = Record<Lang, string>
  export type PeethaList = 'peetha-nirnaya-51' | 'ashtadasha-18' | 'adi-4'
  export type PinCategory = 'jyotirlinga' | 'maha-peetha' | 'peetha'
  export const TempleSchema: z.ZodType<Temple>    // fields per spec §5, plus `aliases?: string[]`
  // darshan: { kind: 'youtube-channel'; channelId } | { kind: 'youtube-video'; videoId } | { kind: 'website' }
  //          & { url, official: true, lastVerified: 'YYYY-MM-DD', verifiedVia: url }   (optional field)
  loadTemples(): Temple[]                          // import.meta.glob('/content/temples/*.json', { eager: true }), parsed
  getTemple(id: string): Temple | undefined
  pinCategory(t: Temple): PinCategory              // 'ashtadasha-18' ∈ lists → 'maha-peetha'
  interface Filters { categories: Set<PinCategory>; list?: PeethaList; region?: string; festivalMasa?: number }
  applyFilters(ts: Temple[], f: Filters, festivals: FestivalDef[]): Temple[]
  searchTemples(ts: Temple[], q: string): Temple[] // any language name, deity or alias; case- and diacritic-insensitive (NFD, strip \p{M} only for Latin)
  nearestTemples(ts: Temple[], p: { lat: number; lng: number }, n?: number): { temple: Temple; km: number }[]  // haversine, n = 5
  ```

- [ ] **Step 1: Write the failing tests:** the 3 fixtures parse; a fixture missing `name.ta` fails with a path mentioning `name.ta`; a darshan without `verifiedVia` fails; `pinCategory(kamakhya)` = 'maha-peetha' (Kamarupa is in the Ashtadasha stotram, so its fixture lists all three); `pinCategory(kedarnath)` = 'jyotirlinga'; `searchTemples(…, 'केदार')` and `'kedar'` both find kedarnath; `nearestTemples` from Ujjain puts mahakaleshwar first with `km < 1`; `applyFilters` with categories {jyotirlinga} drops kamakhya.
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
  tList(key: string): string[]                      // e.g. 'panchang.tithis' (30), 'panchang.nakshatras' (27)
  loc(v: L10n): { text: string; fallback: boolean } // content text for the current lang, en fallback flagged
  loadFont(l: Lang): void                           // injects the Google Fonts <link> for Noto Sans + script once
  ```
- Panchang term lists in every i18n file: `varas`(7), `tithis`(30), `nakshatras`(27), `yogas`(27), `karanas`(11 distinct names keyed by KaranaId), `masas`(12), `ritus`(6), `choghadiya`(7, keyed by ChoghadiyaName), `muhurats`(keyed by Muhurats field).
- Colour tokens (exact values):

  | token | dark | light |
  |---|---|---|
  | `--bg` | `#12142B` | `#FBF5E9` |
  | `--surface` | `#1C1F3D` | `#FFFFFF` |
  | `--text` | `#F3EBDD` | `#4A1F14` |
  | `--muted` | `#C9BFAE` | `#6E4A3C` |
  | `--accent` | `#FF9933` | `#B85C00` |
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
- Produces: `type Route = { kind: 'map' } | { kind: 'temple'; id: string } | { kind: 'panchang' }`; `parseRoute(hash: string): Route`; `routeHash(r: Route): string`; signals `route`, `filters`, `notice: Signal<string | null>`.

- [ ] **Step 1: Write the failing tests:** `parseRoute('#/kedarnath')` → temple; `''` → map; `'#/panchang'` → panchang. **Review Focus 5:** rendering App with hash `#/xyz` (with `createMap` mocked) shows the `t('notice.templeNotFound')` text and the map container. If `createMap` rejects, `ListView` renders with all temples. The language button lists the 7 endonyms `English, हिन्दी, বাংলা, मराठी, தமிழ், తెలుగు, ગુજરાતી`. The theme toggle flips `data-theme`.
- [ ] **Step 2: Run** → FAIL. **Implement.** Header: title, SearchBox (results as a listbox, Enter selects), language menu, theme toggle, Panchang button, 2D/3D toggle, reset view, locate-me + "nearest temples". Geolocation is requested only on a click; if it's denied → `notice` with `t('notice.geoDenied')`. FilterBar: category chips, list chips (Maha 18 / Adi 4 / 51), region select, festival-month select. Terrain tile errors (`map.on('error')` on the DEM source) → set3D(false) + a notice.
- [ ] **Step 3: Run** → PASS. **Commit** `feat(ui): app shell with routing, search, filters and fallbacks`.

---

### Task 12: Temple sheet

**Files:**
- Create: `src/ui/TempleSheet.tsx`, `src/ui/PhotoGallery.tsx`, `src/ui/Darshan.tsx`
- Test: `tests/unit/ui/temple-sheet.test.tsx`

**Interfaces:**
- Consumes: `Temple`, `loc`, `festivalDates`, `FestivalDef[]`, photo credits JSON `{ [file: string]: { thumb: string; full: string; author: string; licence: string; licenceUrl: string; page: string } }`.

- [ ] **Step 1: Write the failing tests** (kedarnath fixture): the section headings render in the spec order; the festivals section shows the next date ≥ today for maha-shivaratri, computed via `festivalDates` (pass a fixed "today" prop); a darshan of kind `youtube-channel` renders an iframe `src` containing `embed/live_stream?channel=<id>` **and** the official-site link; kind `website` renders only the link; each photo's credits show author + licence; the "Other claimed sites" section appears only when `alternateSites` is non-empty; a `fallback: true` text shows the "machine-assisted / English" marker; Shakti Peetha sheets show the body part, the Devi and the Bhairava, plus the scriptures from `lists`.
- [ ] **Step 2: Run** → FAIL. **Implement.** Below 768px it's a bottom sheet (drag handle; snap points 35% / 90%), above that a 420px side panel. Photos use `loading="lazy"` with `onError` hiding the image. The iframe uses `loading="lazy"`, `allow="autoplay; encrypted-media"` and a title. Esc and the close button route back to `#/`.
- [ ] **Step 3: Run** → PASS. **Commit** `feat(ui): temple sheet with photos, darshan and festivals`.

---

### Task 13: Panchang menu and Ujjain widget

**Files:**
- Create: `src/ui/PanchangPanel.tsx`, `src/ui/MonthCalendar.tsx`, `src/ui/UjjainWidget.tsx`
- Test: `tests/unit/ui/panchang-ui.test.tsx`

**Interfaces:**
- Consumes: `panchangForDay`, `panchangAt`, `muhurats`, `choghadiya`, `currentChoghadiya`, `festivalDates`, `tList`.
- Produces: signal `panchangLoc: Signal<GeoLocation>` (default UJJAIN), signal `masaStyle: Signal<'purnimanta' | 'amanta'>` (default purnimanta).

- [ ] **Step 1: Write the failing tests** (fake timers at `2026-10-25T10:00:00+05:30`):
  - The widget shows IST time `10:00`, "Vikram Samvat 2083", a tithi name from `tList('panchang.tithis')`, and the current Choghadiya name. **Review Focus 2:** with `TZ=Australia/Sydney` it still shows `10:00`.
  - The panel lists the five limbs with end times; the muhurats with good ones marked `data-quality="good"` and Rahu Kaal etc. marked `"bad"`; 16 Choghadiya rows with exactly one `aria-current="true"`.
  - **Review Focus 3:** rendering the kshaya-tithi fixture date shows 2 tithi rows.
  - The Amanta toggle changes the month name on a Krishna paksha date; the month calendar for Oct 2026 has 31 day cells, with the festival names from `festivals.json` on their dates; a click on a festival lists the temples whose `festivals` include it.
  - The disclaimer text `t('panchang.disclaimer')` is present.
- [ ] **Step 2: Run** → FAIL. **Implement.** The widget updates every 30 s and on visibility change, and is a button that routes to `#/panchang`. "Use my location": geolocation → `panchangLoc` with `tz` from `Intl.DateTimeFormat().resolvedOptions().timeZone`. The date picker is an `<input type="date">`.
- [ ] **Step 3: Run** → PASS. **Commit** `feat(ui): panchang menu and Ujjain widget`.

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

- [ ] **Step 1: For each temple,** write the English content: deity, history, story, 4–8 facts, visiting (timings, nearest airport and railway, best season), festivals (ids from festivals.json; add new festival defs if needed, with fixture-checked rules), alternates, 3–6 Commons photos, sources (at least 2 per temple, preferring the temple trust's site, government tourism and scholarly references). No unsourced claims. The other 6 language fields are left as `""` and `translationReviewed` is all false; the content test allows empty non-en strings only while `translationReviewed.<lang> === false` **and** the env var `ALLOW_UNTRANSLATED=1` is set. That variable is set in CI only until Task 17 ends, and is removed in Task 17's last step.
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
  - `#/kedarnath` opens the Kedarnath sheet; **Review Focus 5:** `#/xyz` shows the not-found notice and the map.
  - `#/panchang` shows 16 Choghadiya rows.
  - **Review Focus 4:** at viewport 320×640, with lang `ta` and then `te`, `document.documentElement.scrollWidth <= 320` with the sheet open, the panchang open and the header visible.
  - axe (`@axe-core/playwright`) has no serious or critical violations on the map, the sheet and the panchang, in both themes.
- [ ] **Step 2: Run** `npm run build && npm run test:e2e` → PASS (fix the app, never the assertions).
- [ ] **Step 3:** `lighthouserc.json`: mobile preset, accessibility ≥ 0.9 → error, performance ≥ 0.8 → warn. Run `npx lhci autorun` locally and record the scores.
- [ ] **Step 4: Commit** `test: e2e, accessibility and Lighthouse checks`.

---

### Task 19: Publish and verify

- [ ] **Step 1: USER STEP.** The user creates an empty public repo `shakti-jyotirlinga-map` on GitHub and sets Settings → Pages → Source = "GitHub Actions". Attach it via `add_repo` (push access); `git remote add origin …`; `git push -u origin main`.
- [ ] **Step 2:** Watch the Actions run until it's green; open the Pages URL; repeat the Task 18 checks by hand on the live URL on a phone-sized viewport; confirm the tiles, terrain and fonts load from production.
- [ ] **Step 3: Final report to the user:** the live URL, the boundary source decision, the darshan verification table, the panchang accuracy results, the Lighthouse scores, the list of unreviewed translations, and the known limitations.
