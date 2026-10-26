# Boundary data provenance

## Decision
The spec (section 4) asks for India's official boundary "as per Survey of India". The Survey of India
Copyright Policy (https://surveyofindia.gov.in/pages/copyright-policy, checked 2026-10-27) states that
material on its site is "prohibited for reproduction in whole or part without written permission of
Survey of India". It is therefore not clearly redistributable in a public repository, and no written
permission is held. So this project does NOT ship Survey of India data.

Instead it uses **Natural Earth 1:10m Admin 0 - Countries, India point-of-view edition**
(`ne_10m_admin_0_countries_ind`), which depicts India's boundary as claimed by the Government of India.

- Source: https://naturalearth.s3.amazonaws.com/10m_cultural/ne_10m_admin_0_countries_ind.zip
  (catalogue page: https://www.naturalearthdata.com/downloads/10m-cultural-vectors/)
- Natural Earth version: 5.1.1 (from the zip's VERSION.txt)
- Licence: public domain (https://www.naturalearthdata.com/about/terms-of-use/); no attribution required.
- Attribution shown on the map: "Boundary: Natural Earth (India point of view)". We never claim Survey of
  India as the source.

**Tell the user before the first public deploy** that Natural Earth, not Survey of India data, is used.
If written permission from Survey of India is obtained later, replace the two GeoJSON files and the
attribution string in `src/map/boundary.ts`.

## Regeneration
One-off tool (not a project dependency): mapshaper 0.6.102. Unzip the download, then from that folder:

```
npx -y mapshaper@0.6.102 ne_10m_admin_0_countries_ind.shp \
  -filter "ADM0_A3=='IND'" -simplify 20% keep-shapes -filter-fields ADM0_A3,NAME \
  -o content/boundary/india.geojson format=geojson precision=0.001

npx -y mapshaper@0.6.102 ne_10m_admin_0_countries_ind.shp \
  -filter "['PAK','NPL','BGD','LKA','CHN','BTN','MMR','AFG'].includes(ADM0_A3)" \
  -simplify 10% keep-shapes -filter-fields ADM0_A3,NAME \
  -o content/boundary/neighbours.geojson format=geojson precision=0.001
```

Outputs: `india.geojson` (about 33 KB) and `neighbours.geojson` (about 56 KB), each well under 1.5 MB.
Properties kept: `ADM0_A3`, `NAME`.
