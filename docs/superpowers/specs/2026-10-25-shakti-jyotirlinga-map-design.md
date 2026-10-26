# Shiv-Shakti: Shakti Peetha & Jyotirlinga Interactive Map — Design Spec

Date: 2026-10-25 · Revised 2026-10-26 (panchang removed from scope) · Status: revision awaiting written-spec review

## 1. Goal

A public, free website with an interactive 3D-terrain map of the Shakti Peethas (the 51, the 18 Maha and the 4 Adi Peethas) and the 12 Jyotirlingas. Each temple has photos, an official live darshan stream, history, story, festivals (with when they fall in the Hindu calendar), unique facts and visiting info. The site is dark by default with a light theme, works on any device, and is available in 7 languages. It must be easy to add more deities and the incarnations of Maa Shakti and Lord Shiva later.

**Success criteria**
- Every temple in scope (§2) is on the map at correct coordinates, with complete content in all 7 languages.
- Terrain visibly shows relief: the Himalayas stand clearly above the Rajasthan plains.
- Lighthouse score ≥ 90 for accessibility and ≥ 80 for performance on a mid-range phone.
- Text contrast meets WCAG 2.1 AA in both themes.

## 2. Content scope (v1)

| Set | Count | Notes |
|---|---|---|
| Jyotirlingas | 12 | Main site per tradition; other claimed sites listed (Vaidyanath: Deoghar/Parli; Nageshwar: Dwarka/Aundha/Jageshwar; Bhimashankar: Pune/Guwahati/Kashipur) |
| Shakti Peethas | 51 + extras | The 51 per Peetha Nirnaya Tantra, **plus** any Maha or Adi Peetha below that isn't in the 51 list (added as its own entry). Expected total ≈ 55–60; the exact count is fixed during content research |
| Tag: Maha Shakti Peetha | 18 | Adi Shankaracharya's *Ashtadasha Shakti Peetha Stotram*; visually highlighted. Some (e.g., Jogulamba–Alampur, Manikyamba–Draksharamam, Mahalakshmi–Kolhapur) are not in the 51 list |
| Tag: Adi Shakti Peetha | 4 | Kamakhya, Bimala (Puri), Tara Tarini, Dakshina Kalika (Kalighat) |

Each Shakti Peetha records which lists include it (`lists: ["peetha-nirnaya-51", "ashtadasha-18", "adi-4"]`), and the temple page names those scriptures. Where one shrine is identified with a list entry only by some traditions, the content says so.
| Sacred rivers | 7 living + Saraswati | Ganga, Yamuna, Narmada, Godavari, Kaveri, Shipra, Brahmaputra; Saraswati as a reconstructed ancient course |

Sites outside India: Hinglaj (Pakistan); several in Bangladesh; Guhyeshwari (Nepal); Shankari/Trincomalee (Sri Lanka); Manasarovar (Tibet). Where a Peetha location is disputed, the data records every candidate site, and the content explains the dispute.

Languages: English (`en`), Hindi (`hi`), Bengali (`bn`), Marathi (`mr`), Tamil (`ta`), Telugu (`te`), Gujarati (`gu`). Everything is translated.

**Out of v1 (later):** offline/installable app (after user testing), pilgrimage route planner, festival reminders, additional deities and incarnations.

**Out of scope:** panchang of any kind — no panchang menu, no Ujjain time or Vikram Samvat widget, no muhurats or Choghadiya, and no calculated festival dates. (Removed 2026-10-26: it added load and is off the project's aim. The earlier engine remains in git history.)

## 3. Architecture

Fully static site, built with Vite + TypeScript, UI in Preact. Deployed to GitHub Pages by GitHub Actions on every push to `main`. No backend and no astronomy library.

```
content/                    ← all editable data (no code)
  temples/<id>.json         one file per temple, all 7 languages
  rivers/<id>.geojson       river geometry + label translations
  boundary/india.geojson    official India boundary
  festivals.json            festival definitions (when they fall, in words + approx. months)
  i18n/<lang>.json          UI strings + Hindu month/paksha/tithi names
src/
  content/   loader + schema (zod); validated at build time
  map/       MapLibre setup, terrain, boundary, rivers, pin layers
  i18n/      language detection, string lookup, fonts
  ui/        header, filters, search, temple sheet
  app.tsx    routing (#/<temple-id>) + state
scripts/     build-time helpers (Wikimedia photo attribution fetch, content checks)
tests/       vitest unit tests + Playwright smoke tests
```

**Boundaries:** `map/` only receives a list of temples plus the current filters and emits "temple selected". `content/` is the only module that reads data files. New deity types only add data and a pin style entry, with no code changes elsewhere.

## 4. Map

- **Library:** MapLibre GL JS.
- **Basemap:** OpenFreeMap vector tiles (free, no key), with a custom dark and light style. The basemap's international boundary layers are hidden.
- **Terrain:** AWS Open Data Terrain Tiles (Terrarium encoding) as a `raster-dem` source, 1.5× exaggeration, hillshade layer, sky/fog. Default pitch is 45°. A 2D/3D toggle sets pitch 0 and turns terrain off.
- **Boundary:** India's official boundary from Survey of India data, drawn as our own layer, with the attribution "Boundary as per Survey of India". *Implementation check:* confirm the redistribution licence. If it isn't redistributable, use an openly licensed GeoJSON that follows the official boundary, and tell the user before shipping it.
- **Extent:** India plus Pakistan, Nepal, Bangladesh, Sri Lanka and Tibet, so every Peetha is reachable.
- **Pins:** Jyotirlinga = saffron Shivalinga icon; Maha Shakti Peetha = larger golden pin with a glow; other Peethas = kumkum-red pin; other claimed sites = grey pin. Shapes differ as well as colours. Pins are placed on the terrain surface at each temple's real elevation. They cluster at low zoom. Selecting one flies the camera there (instant when "reduce motion" is on) and opens the temple sheet.
- **Rivers:** sacred rivers are drawn as glowing lines with labels in the current language. **Saraswati:** a dashed golden-white line along the Ghaggar-Hakra palaeochannel (Adi Badri → Haryana → Rajasthan → Rann of Kutch), approximated from published ISRO/CGWB palaeochannel studies, plus a Triveni Sangam marker at Prayagraj. Tapping it opens an info card covering Rig Vedic references, the scientific findings, and a note that the course is a reconstruction still debated by scholars.
- **Controls:** search (any language, matching names and aliases), filters (type, tag, state/country, festival month), locate me, reset view, and "nearest temples" (uses geolocation only on request).

## 5. Temple page

A bottom sheet on phones (drag to expand) and a side panel on desktop; the map stays visible.

Sections, in order: header (names, badges, location, elevation) · photos · live darshan · history · story · festivals · unique facts · visiting · other claimed sites · sources.

- **Photos:** from Wikimedia Commons only. Each temple lists the Commons file names it uses. A build script fetches author, licence and thumbnail URLs into a generated attribution file. Credits are shown under each photo. Photos are lazy-loaded.
- **Live darshan:** only streams verified as the temple trust's own (official YouTube channel or website). Each one stores a `lastVerified` date. If the embed fails, or the temple has no stream, a button opens the official website. Stream links are never guessed.
- **Festivals:** each festival states when it falls, in words, plus the approximate Gregorian months — e.g. "Maha Shivaratri — Phalguna Krishna 14 (Feb–Mar)", "Shravan Somvar — Mondays of Shravana (Jul–Aug)", "Makar Sankranti — Sun enters Makara (Jan)". Nothing is calculated. `content/festivals.json` stores a structured `when` — `{kind: 'tithi', masa, paksha, tithi, days?}` | `{kind: 'sankranti', rashi, offsetDays?, days?}` | `{kind: 'weekday-in-masa', masa, weekday}` — and `months` (1–12). `days` renders a range ("Ashvina Shukla 1–9" for Sharad Navratri); `offsetDays` covers festivals tied to a solar date (Ambubachi: "from the 7th day of Ashadha (solar), 4 days (Jun)"). The text is built from translated month, paksha, tithi, rashi and weekday names, so every language gets it without free text. Month names follow the Purnimanta convention (as used in Ujjain and North India). The "festival month" filter uses `months`.
- **Deep links:** `#/<temple-id>` opens the map at that temple with its sheet open.

### Temple data file (schema sketch)

```jsonc
{
  "id": "kedarnath",
  "type": "jyotirlinga",            // jyotirlinga | shakti-peetha | (future types)
  "lists": [],                       // Shakti Peethas: ["peetha-nirnaya-51", "ashtadasha-18", "adi-4"]
  "location": { "lat": 30.7352, "lng": 79.0669, "elevationM": 3583,
                "country": "IN", "region": "Uttarakhand" },
  "alternateSites": [ { "name": {…}, "lat": 0, "lng": 0, "note": {…} } ],
  "name":   { "en": "Kedarnath", "hi": "केदारनाथ", "bn": "…", "mr": "…", "ta": "…", "te": "…", "gu": "…" },
  "deity":  { … },                   // per language
  "peetha": { "bodyPart": {…}, "devi": {…}, "bhairava": {…} },  // Shakti Peethas only
  "history": { … }, "story": { … }, "facts": { "en": ["…"], … },
  "visiting": { "timings": {…}, "nearestAirport": {…}, "nearestRail": {…}, "bestSeason": {…} },
  "festivals": [ { "festivalId": "maha-shivaratri", "localNote": {…} } ],
  "darshan": { "kind": "youtube-channel" | "youtube-video" | "website", "url": "…",
               "official": true, "lastVerified": "2026-10-25" },
  "photos": [ "File:Kedarnath Temple.jpg" ],
  "sources": [ { "title": "…", "url": "…" } ],
  "translationReviewed": { "en": true, "hi": false, … }
}
```

The build fails if any required field or language is missing, if coordinates fall outside the map extent, or if a darshan entry lacks `official: true` and `lastVerified`.

## 6. (Removed: Panchang — see §2 Out of scope)

## 7. Languages & themes

- **i18n:** the language button lists each language in its own script. The browser language is auto-detected on first visit and the choice is saved to `localStorage`. All UI strings, content, calendar terms (month, paksha, tithi, rashi and weekday names) and map labels are translated. Missing text falls back to English, with a visible marker (and also fails the content check).
- **Fonts:** Noto Sans plus Noto Sans Devanagari, Bengali, Tamil, Telugu and Gujarati, each loaded only when its language is active.
- **Translation review:** a per-language `translationReviewed` flag. Unreviewed content shows a small "machine-assisted translation" note.
- **Themes:** dark by default (night indigo background, ivory text, saffron/gold accents; dark map style) and light (warm cream background, maroon-brown text, saffron/deep red accents; light map style). Colours are CSS custom properties, and the choice is saved. Both themes are checked against WCAG AA.
- **Accessibility:** keyboard navigation, ARIA labels on all controls and pins, a reduce-motion setting (it also follows the OS `prefers-reduced-motion`), font sizes in rem so text follows the phone's font size, tap targets of at least 44px.

## 8. Error handling

| Failure | Behaviour |
|---|---|
| WebGL unavailable / map fails | Show a searchable list view of all temples with the same temple sheets |
| Terrain tiles fail | Fall back to the flat map with a small notice |
| Darshan embed blocked or offline | Show the official website button |
| Photo fails to load | Hide that photo; keep the credits list |
| Geolocation denied | "Locate me" / "nearest temples" stay off; explain briefly |
| Missing translation | English fallback + marker (blocked in CI) |

## 9. Testing

- **Unit (Vitest):** content loader, filters (including festival month), search, i18n lookups, and festival "when" text (e.g., English renders "Maha Shivaratri — Phalguna Krishna 14 (Feb–Mar)").
- **Content checks (CI):** schema validation, presence of all 7 languages, coordinates inside the extent, darshan fields, unique ids, every festival has a valid `when` and at least one month in 1–12, and every temple festival id exists in `festivals.json`.
- **Smoke tests (Playwright):** the map loads, a pin opens the sheet, the language switch changes text, the theme toggle works, a deep link opens the right temple, phone and desktop viewports.
- **Accessibility:** axe checks in Playwright; Lighthouse in CI.

## 10. Delivery

- **Repository:** https://github.com/dbp-develop/Shiv-Shakti (Apache-2.0); local clone at `~/projects/shiv-shakti`; site at https://dbp-develop.github.io/Shiv-Shakti/.
- **CI:** GitHub Actions runs build + tests on each push and deploys to Pages from `main`.
- **Node.js:** installed in the user's home directory for local testing (no sudo).
- **Build order (for the plan):** scaffold + CI → map with terrain, boundary, rivers → temple data schema + festival data + pins → temple sheet → i18n + themes → content for all temples × 7 languages → verification pass → launch.
