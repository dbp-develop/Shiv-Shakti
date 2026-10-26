# River data provenance

Files: `ganga, yamuna, narmada, godavari, kaveri, shipra, brahmaputra, saraswati` `.geojson`
(each a FeatureCollection; every feature has `properties: { id, kind: 'living' | 'ancient', name: L10n }`)
and `saraswati.json` (info-card text and sources, English now; other languages are translated in Task 17).

## Living rivers (Ganga, Yamuna, Narmada, Godavari, Kaveri, Brahmaputra)
- Source: Natural Earth 1:10m Rivers + Lake Centerlines (`ne_10m_rivers_lake_centerlines`)
  https://naturalearth.s3.amazonaws.com/10m_physical/ne_10m_rivers_lake_centerlines.zip
  (catalogue: https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-rivers-lake-centerlines/)
- Licence: public domain (https://www.naturalearthdata.com/about/terms-of-use/); no attribution required.
- Natural Earth `name` values used: Ganges, Yamuna, Narmada, "Godävari", Cauvery, and for the Brahmaputra the
  three consecutive segments Yarlung, Dihang and Brahmaputra.

Unzip, then from that folder (mapshaper 0.6.102 is a one-off tool, not a project dependency):

```
S=ne_10m_rivers_lake_centerlines.shp
gen() { npx -y mapshaper@0.6.102 $S -filter "featurecla=='River' && ($2)" -clip bbox=55,0,105,40 \
  -simplify 30% keep-shapes -filter-fields name -o content/rivers/$1.geojson format=geojson precision=0.001; }
gen ganga "name=='Ganges'"
gen yamuna "name=='Yamuna'"
gen narmada "name=='Narmada'"
gen godavari "name=='Godävari'"
gen kaveri "name=='Cauvery'"
gen brahmaputra "['Yarlung','Dihang','Brahmaputra'].includes(name)"
```

## Shipra (OpenStreetMap, ODbL)
- Source: OpenStreetMap contributors, via the Overpass API (https://overpass-api.de/api/interpreter), queried 2026-10-27.
- Licence: Open Database Licence 1.0 (https://opendatacommons.org/licenses/odbl/). Attribution
  "© OpenStreetMap contributors" is shown in the map attribution (`RIVERS_ATTRIBUTION` in `src/map/rivers.ts`).
- Query (send as the `data` form field, with a descriptive User-Agent):

```
[out:json][timeout:60];
way["waterway"~"river|stream"]["name"~"hipra|Kshipra"](21.5,74,24.5,77.5);
out geom;
```
  Result: 4 ways (OSM way ids 131173683, 131173710, 131173836, 209367454; "Shipra river"), the reach around Ujjain
  (about 23.1 to 23.45 N). Upstream and downstream reaches are not mapped as named ways in OSM, so only this
  reach is drawn.
- Convert the Overpass JSON to LineStrings (`[lon, lat]` per node, property `osm_way`), then:

```
npx -y mapshaper@0.6.102 shipra_raw.geojson -simplify 25% keep-shapes -filter-fields osm_way \
  -o content/rivers/shipra.geojson format=geojson precision=0.0001
```

## Saraswati (reconstruction)
Hand-drawn from the waypoints below and smoothed by `scripts/rivers-props.mjs` (Chaikin corner cutting, 3 rounds).
It is a reconstruction of the Ghaggar-Hakra palaeochannel, not surveyed data, and the card says so.
Waypoints (lng, lat): Adi Badri (77.33, 30.45), Pehowa (76.58, 29.98), Sirsa (75.03, 29.53), Hanumangarh (74.32, 29.58),
Anupgarh (73.21, 29.19), Fort Abbas (72.85, 29.19), Derawar (71.33, 28.77), toward the Rann of Kutch (70.5, 24.5).

## Properties and names
After the steps above run `node scripts/rivers-props.mjs`, which stamps `{ id, kind, name }` on every feature (names in
all 7 languages are in that script) and writes `saraswati.geojson`.

## Triveni Sangam
A point at (81.885, 25.4246) (Prayagraj), defined in `src/map/rivers.ts` with its 7-language name. Not tappable.

## Saraswati card sources (`saraswati.json`)
Verified 2026-10-27; see the `sources` of each section. Rig Veda hymn numbers (2.41.16, 6.61, 7.95, 10.75) are as cited
on Wikipedia's Saraswati and Sarasvati River pages; the primary text could not be fetched (sacred-texts.com blocks
automated access), so a scholar should confirm the wording against a critical edition before launch.
CGWB: no CGWB publication on palaeochannels was found online; the CGWB drilling is cited from a 2002 Down To Earth report.
