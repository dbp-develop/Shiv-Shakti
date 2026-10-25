# Shiv-Shakti: Shakti Peetha & Jyotirlinga Interactive Map — Design Spec

Date: 2026-10-25 · Status: approved in brainstorming, awaiting written-spec review

## 1. Goal

A public, free website with an interactive 3D-terrain map of the Shakti Peethas (the 51, the 18 Maha and the 4 Adi Peethas) and the 12 Jyotirlingas. Each temple has photos, an official live darshan stream, history, story, festivals with their dates, unique facts and visiting info. The map carries an Ujjain time and Vikram Samvat widget, and a Panchang menu gives the full panchang, muhurats and Choghadiya. The site is dark by default with a light theme, works on any device, and is available in 7 languages. It must be easy to add more deities and the incarnations of Maa Shakti and Lord Shiva later.

**Success criteria**
- Every temple in scope (§2) is on the map at correct coordinates, with complete content in all 7 languages.
- Terrain visibly shows relief: the Himalayas stand clearly above the Rajasthan plains.
- Panchang end times are within 2 minutes of a published reference panchang for 25 test dates.
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

## 3. Architecture

Fully static site, built with Vite + TypeScript, UI in Preact. Deployed to GitHub Pages by GitHub Actions on every push to `main`. No backend: everything, panchang included, is computed in the browser.

```
content/                    ← all editable data (no code)
  temples/<id>.json         one file per temple, all 7 languages
  rivers/<id>.geojson       river geometry + label translations
  boundary/india.geojson    official India boundary
  festivals.json            festival definitions (tithi rules)
  i18n/<lang>.json          UI strings + panchang term names
src/
  content/   loader + schema (zod); validated at build time
  map/       MapLibre setup, terrain, boundary, rivers, pin layers
  panchang/  pure astronomy + panchang functions (no DOM)
  i18n/      language detection, string lookup, fonts
  ui/        header, filters, search, temple sheet, panchang menu, Ujjain widget
  app.tsx    routing (#/<temple-id>, #/panchang) + state
scripts/     build-time helpers (Wikimedia photo attribution fetch, content checks)
tests/       vitest unit tests + Playwright smoke tests
```

**Boundaries:** `panchang/` is pure functions (date + location in, results out) with no UI dependency. `map/` only receives a list of temples plus the current filters and emits "temple selected". `content/` is the only module that reads data files. New deity types only add data and a pin style entry, with no code changes elsewhere.

## 4. Map

- **Library:** MapLibre GL JS.
- **Basemap:** OpenFreeMap vector tiles (free, no key), with a custom dark and light style. The basemap's international boundary layers are hidden.
- **Terrain:** AWS Open Data Terrain Tiles (Terrarium encoding) as a `raster-dem` source, 1.5× exaggeration, hillshade layer, sky/fog. Default pitch is 45°. A 2D/3D toggle sets pitch 0 and turns terrain off.
- **Boundary:** India's official boundary from Survey of India data, drawn as our own layer, with the attribution "Boundary as per Survey of India". *Implementation check:* confirm the redistribution licence. If it isn't redistributable, use an openly licensed GeoJSON that follows the official boundary, and tell the user before shipping it.
- **Extent:** India plus Pakistan, Nepal, Bangladesh, Sri Lanka and Tibet, so every Peetha is reachable.
- **Pins:** Jyotirlinga = saffron Shivalinga icon; Maha Shakti Peetha = larger golden pin with a glow; other Peethas = kumkum-red pin; other claimed sites = grey pin. Shapes differ as well as colours. Pins are placed on the terrain surface at each temple's real elevation. They cluster at low zoom. Selecting one flies the camera there (instant when "reduce motion" is on) and opens the temple sheet.
- **Rivers:** sacred rivers are drawn as glowing lines with labels in the current language. **Saraswati:** a dashed golden-white line along the Ghaggar-Hakra palaeochannel (Adi Badri → Haryana → Rajasthan → Rann of Kutch), approximated from published ISRO/CGWB palaeochannel studies, plus a Triveni Sangam marker at Prayagraj. Tapping it opens an info card covering Rig Vedic references, the scientific findings, and a note that the course is a reconstruction still debated by scholars.
- **Ujjain widget:** a floating card showing Ujjain local time (live), the Vikram Samvat date, the current tithi and the current Choghadiya. Tapping it opens the Panchang menu.
- **Controls:** search (any language, matching names and aliases), filters (type, tag, state/country, festival month), locate me, reset view, and "nearest temples" (uses geolocation only on request).

## 5. Temple page

A bottom sheet on phones (drag to expand) and a side panel on desktop; the map stays visible.

Sections, in order: header (names, badges, location, elevation) · photos · live darshan · history · story · festivals · unique facts · visiting · other claimed sites · sources.

- **Photos:** from Wikimedia Commons only. Each temple lists the Commons file names it uses. A build script fetches author, licence and thumbnail URLs into a generated attribution file. Credits are shown under each photo. Photos are lazy-loaded.
- **Live darshan:** only streams verified as the temple trust's own (official YouTube channel or website). Each one stores a `lastVerified` date. If the embed fails, or the temple has no stream, a button opens the official website. Stream links are never guessed.
- **Festivals:** defined by a Hindu calendar rule (masa + paksha + tithi, or a solar event such as Makar Sankranti). The panchang engine calculates the next regular date.
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

## 6. Panchang

- **Location:** Ujjain (23.1765° N, 75.7885° E, IST) by default; an optional "Use my location" recalculates for the user's position and time zone.
- **Engine:** `astronomy-engine` (MIT) for Sun and Moon positions and rise/set times; **Lahiri (Chitrapaksha)** ayanamsa; the day starts at local sunrise.
- **Outputs:** vara, tithi, nakshatra, yoga and karana, each with its end time; paksha, masa, ritu, ayana; sunrise, sunset, moonrise, moonset; Vikram Samvat and Shaka Samvat years; Purnimanta month naming by default, with an Amanta toggle. Adhik and kshaya masa and kshaya/vriddhi tithis are handled.
- **Muhurats:** Brahma muhurat, Abhijit and Godhuli (shown as good), and Rahu Kaal, Yamaganda, Gulika and Durmuhurat (shown as times to avoid).
- **Choghadiya:** 8 day and 8 night periods from sunrise to sunset and sunset to the next sunrise, using the standard weekday sequence. The current period is highlighted, with a countdown.
- **Views:** Today; monthly calendar (tithis and festivals, tap a festival → temples celebrating it); date picker for any date.
- **Festival resolver:** given a festival rule and a date range, returns the matching dates. It's used by the temple pages and the calendar.
- **Disclaimer:** "For rituals, please confirm timings with your temple or priest."

## 7. Languages & themes

- **i18n:** the language button lists each language in its own script. The browser language is auto-detected on first visit and the choice is saved to `localStorage`. All UI strings, content, panchang terms and map labels are translated. Missing text falls back to English, with a visible marker (and also fails the content check).
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
| Geolocation denied | Keep Ujjain; explain briefly |
| Missing translation | English fallback + marker (blocked in CI) |

## 9. Testing

- **Unit (Vitest):** panchang functions against reference fixtures for 25 dates (including adhik masa, a kshaya tithi and a vriddhi tithi), Choghadiya sequences for all 7 weekdays, the festival resolver (e.g., Maha Shivaratri and Navratri for 2026–2027), Vikram Samvat year rollover.
- **Content checks (CI):** schema validation, presence of all 7 languages, coordinates inside the extent, darshan fields, unique ids.
- **Smoke tests (Playwright):** the map loads, a pin opens the sheet, the language switch changes text, the theme toggle works, a deep link opens the right temple, the Panchang menu renders, phone and desktop viewports.
- **Accessibility:** axe checks in Playwright; Lighthouse in CI.

## 10. Delivery

- **Repository:** https://github.com/dbp-develop/Shiv-Shakti (Apache-2.0); local clone at `~/projects/shiv-shakti`; site at https://dbp-develop.github.io/Shiv-Shakti/.
- **CI:** GitHub Actions runs build + tests on each push and deploys to Pages from `main`.
- **Node.js:** installed in the user's home directory for local testing (no sudo).
- **Build order (for the plan):** scaffold + CI → panchang engine + tests → map with terrain, boundary, rivers → temple data schema + pins → temple sheet → Panchang menu + widget → i18n + themes → content for all temples × 7 languages → verification pass → launch.
