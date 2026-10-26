# Master lists: research notes (Task 6, Step 4, draft for owner review)

Drafts only, not committed. Files in this folder:

- `jyotirlingas.json`: 12 entries, using the ids the brief requires.
- `shakti-peethas.json`: **63 entries**:
  - 51 from the Peetha Nirnaya list. Within those 51, 6 also belong to the Ashtadasha (Maha) list and 3 to the Adi list. Kamakhya is in all three lists.
  - 12 more that are outside the 51: 11 Ashtadasha seats and 1 Adi seat.
  - Membership counts: `peetha-nirnaya-51` = 51, `ashtadasha-18` = 18, `adi-4` = 4.

The spec expected about 55–60. The total is higher because six of the Ashtadasha seats stay separate from any 51-list entry, for the reasons given in §2. If the owner prefers to merge one of these into a 51-list entry, the total falls by one for each merge. The candidates are Kamakshi→Kanchi, Biraja→Utkala and Shankari→Lanka.

## 1. Which recension of the 51 I followed

The 51-list follows **D. C. Sircar, *The Śākta Pīṭhas* (JRASB 1948; Motilal Banarsidass reprint)**. It is the standard critical edition of the *Pīṭhanirṇaya* (also called *Mahāpīṭhanirūpaṇa*), the text this project calls the Peetha Nirnaya Tantra. It is part of the Tantrachudamani tradition. The `id`s and the numbering in the table in §6 follow Sircar's tabulated list, nos. 1–51. The `bodyPart`, `devi` and `bhairava` values also come from Sircar's table, and Sircar's main variant readings are given in parentheses. Green Message's "Shakti Peetha Stotram" page uses the same order and gives modern identifications, so it serves as the second source for each entry. For Bengal and Bangladesh I also used Banglapedia and its table of the almanac traditions, plus the Bengali Wikipedia table.

How the lists differ:

- **Slot 45.** In Sircar's text this slot reads "Kalighata (Kalipitha)", which repeats no. 19 (Kalighat). The extra verses that hold it (nos. 44–51) are missing from some manuscripts.
  - Bengali almanacs place this "Kalipitha" (head, Jayadurga, Krodhisha) at **Juranpur, Nadia**, and Green Message agrees. I followed this reading, as entry `kalighata-juranpur`.
  - Other recensions read **Karnata** here (both ears, Jayadurga, Abhiru). Bengali Wikipedia puts Karnata at Kangra.
  - Later editors also added **Magadha** (right thigh, Sarvanandakari, Vyomakesha; Patna/Gaya).
  - Neither variant is counted. Both are recorded in that entry's note. The Mangala Gauri temple at Gaya appears separately as an Ashtadasha seat.
- **Popular "51" lists differ.** Wikipedia's combined table has 69 rows, and magazine lists vary. Some of them include Vaishno Devi, Ambaji, Tarapith, Chintpurni, Danteshwari, Harsiddhi (Rangir), Tulja Bhavani, Pavagadh, Aranya Devi, Dhakeshwari, Rajarajeshwari (Bengaluru), Tripura Sundari (Banswara) and others. None of these is in the Pithanirnaya, so none has its own entry. A few of them appear as *candidate sites* where a source identifies them with a Pithanirnaya pitha:
  - Vaishno Devi under Jwalamukhi
  - Naina Devi under Karavira
  - Danteshwari under Panchasagara
  - Maihar under Ramagiri
- **Ashtadasha list.** The text follows Hindupedia and Hinduwebsite (the *Aṣṭādaśa Śakti Pīṭha Stotram*, attributed to Ādi Śaṅkara; sanskritdocuments lists the author as "traditional"). Places come from Hindupedia's table and Wikipedia's Ashtadasha table. Body parts for the Ashtadasha-only entries come from Wikipedia's table ("per Wikipedia"), because the stotram itself names no body parts.
- **Adi list.** Kamakhya, Vimala (Puri), Tara Tarini and Dakshina Kalika (Kalighat) are the Adi Peethas of the Kalika Purana tradition. Sources: eSamskriti's "Four Adi Shakti Peethas" and IndiaNetzone. Wikipedia's Adi section carries a "citation needed" tag, so I did not rely on it.

## 2. Merging rule, and the entries outside the 51

An Ashtadasha or Adi seat is **merged** into a 51-list entry when a recognised tradition identifies it with that entry and it is that entry's primary candidate. The entry's `identificationNote` then states that only some traditions make the identification. Otherwise the seat gets its own entry.

**Merged (9 entries carry more than one list):**

| Entry | Lists | Why merged |
|---|---|---|
| `kamakhya` | 51, 18, Adi | Kamagiri = Kamarupa = Kamakhya, undisputed. |
| `kalighat` | 51, Adi | Kalipitha = Dakshina Kalika. |
| `utkala-vimala` | 51, Adi | The 51-list's Devi (Vimala) and Bhairava (Jagannatha) point to Puri. Jajpur is the alternate. |
| `varanasi-vishalakshi` | 51, 18 | Undisputed. |
| `jwalamukhi` | 51, 18 | Sircar reads "Jwala – Vaishnavi" as Jwalamukhi. Vaishno Devi is the alternate. |
| `prayaga` | 51, 18 | Bengali Wikipedia and Green Message both give Lalita/Alopi. Alopi Devi is primary. |
| `karavira` | 51, 18 | Karavira is Kolhapur's classical name (Sircar). Naina Devi and Sukkur/Karachi are alternate identifications. |
| `shriparvata-srisailam` | 51, 18 | Shriparvata is the classical name of Srisailam (Sircar). Ladakh is the alternate identification but has no locatable site. |
| `bhairavaparvata-ujjain` | 51, 18 | Avanti and Mahakali are both identified with Gadkalika, Ujjain. Harsiddhi and Mahakaleshwar are alternates. |

**Added outside the 51 (12):**

- **Ashtadasha (11):**
  - Shankari (Trincomalee)
  - Kamakshi (Kanchipuram)
  - Shrinkhala (Pradyumna/Pandua)
  - Chamundeshwari (Mysuru)
  - Jogulamba (Alampur)
  - Ekaveera/Renuka (Mahur)
  - Puruhutika (Pithapuram)
  - Girija/Biraja (Jajpur)
  - Manikyamba (Draksharamam)
  - Sarvamangala/Mangala Gauri (Gaya)
  - Saraswati/Sharada Peeth (Kashmir)
- **Adi (1):** Tara Tarini.

Kept separate on purpose, although some sources link them to a 51-list entry:

- **Kamakshi** vs. 51 Kanchi. Bengal tradition places Kanchi at Kankalitala.
- **Biraja** vs. 51 Utkala. Utkala's primary candidate is Puri.
- **Shankari** vs. 51 Lanka. Sircar links the two names, but the usual sites differ: Trincomalee vs. Nainativu.
- **Puruhutika** and **Manikyamba**. Wikipedia's combined table lists both as 51-list pithas, but neither is in the Pithanirnaya.

## 3. Disputed entries

**27 entries are disputed:** 18 have more than one candidate site, and 9 have a single pin plus a location dispute (pin-less claimants, unidentified sites or variant readings) described in the note. Every entry's `identificationNote` gives the sources on each side. In brief:

| Entry | Candidates (primary first) | Dispute |
|---|---|---|
| karavira | Kolhapur · Naina Devi (HP) | Sircar also mentions Sukkur and the almanacs Karachi; neither has a site, so neither is pinned. |
| jwalamukhi | Jwalamukhi · Vaishno Devi | Applies only to the Ashtadasha "Vaishnavi". |
| jalandhara | Devi Talab, Jalandhar · Vajreshwari, Kangra | |
| nepala-guhyeshwari | Guhyeshwari | The Nepal Mahatmya puts the knees at the Bagmati–Vishnumati confluence; no shrine is identified there, so it is not pinned. |
| utkala-vimala | Vimala, Puri · Biraja, Jajpur | |
| ujjayini-harsiddhi | Harsiddhi, Ujjain · Mangalchandi, Ujani/Kogram (WB) | |
| trisrota-bhramari | Salbari near Jalpesh (WB) | Bodaganj is an alternative village; it is not pinned. |
| prayaga | Alopi Devi · Kalyani Devi | The Lalita Devi temple at Meerapur is a third claimant but could not be located, so it has no pin. |
| jayanti-nartiang | Nartiang (Meghalaya) | Baurbhag/Falijur in Sylhet (BD) is the Bengali tradition; it could not be located, so it has no pin. |
| kanyashrama | Kanyakumari · Kumira/Kumarikunda, Sitakunda (BD) | Sircar and the Bengali almanacs say Kumarikunda. |
| manivedaka-pushkar | Pushkar | Sircar: the name comes from a corrupt text and the place is uncertain. |
| shrishaila-sylhet | Jainpur, Sylhet (BD) · Srisailam | |
| kanchi-kankalitala | Kankalitala (WB) · Adi Kamakshi, Kanchipuram | |
| kalamadhava | Amarkantak (town-level pin) | Unidentified in Sircar and Green Message. |
| ramagiri | Kamadgiri, Chitrakoot (hill-level pin) · Maihar Sharda | Sircar also suggests Ramtek, which is not pinned. |
| panchasagara | Varanasi (Man Mandir Ghat) · Devidhura · Danteshwari | Unidentified in the texts. |
| shriparvata-srisailam | Srisailam | Ladakh is the alternate identification; no site, not pinned. |
| bhairavaparvata-ujjain | Gadkalika · Harsiddhi · Mahakaleshwar complex | |
| janasthana | Saptashrungi · Bhadrakali, Nashik | |
| godavaritira | Kotilingeswara, Rajahmundry · Kotipalli | |
| ratnavali | Khanakul (WB) | Sircar leaves it unidentified. |
| mithila | Janakpur (NP; town anchor) · Uchaith (Madhubani) · Ugratara (Mahishi, Saharsa) | Jaya Mangala (Begusarai) is a further claimant; it could not be located, so it has no pin. |
| kalighata-juranpur | Juranpur (WB) | Variant readings Karnata and Magadha (see §1). |
| attahas | Labhpur (Birbhum) · Dakshindihi (Ketugram) | |
| lanka-indrakshi | Nainativu · Trincomalee | |
| virata | Viratnagar (Rajasthan) · Patiram (WB) | Wikipedia also says Bharatpur; not pinned. |
| shrinkhala | Pandua, Hooghly | Hindupedia says "Pradyumna, Gujarat" with no site; not pinned. |

Sites in neighbouring countries:

- Pakistan: Hinglaj, and Sharada Peeth (see the owner decision in §5).
- Bangladesh: Sugandha, Chattala, Shrishaila (Sylhet), Karatoya (Bhabanipur), Yashora, and the alternate Kumarikunda.
- Nepal: Guhyeshwari, Muktinath, Janakpur.
- Sri Lanka: Nainativu, Trincomalee.
- Tibet (CN): Manasarovar.

## 4. How the coordinates were checked

**Sources, in order of preference:**

1. OpenStreetMap objects tagged as places of worship (found with Nominatim or Photon; Overpass was mostly overloaded).
2. Wikipedia infobox `{{coord}}` values, read from the raw wikitext.
3. Wikidata P625.
4. The median of geotagged Wikimedia Commons photos of the temple, found with Commons geosearch filtered on the temple name.

A coordinate counts as **verified** when two independent sources agree to within about 300 m: OSM against Wikipedia or Wikidata, or Commons against either of them. Every coordinate is rounded to 4 decimal places.

**Wrong source data I corrected.** Wikipedia's Moteshwar Mahadev coordinate (28.9765, 79.3937) falls near Rudrapur, not Kashipur. Wikidata's (29.12, 78.57) is coarse. I used a Kashipur listing instead and checked it against the OSM-mapped Bala Sundari (Chaiti) temple next door.

**Locality check.** A reverse-geocoding script run from my scratchpad (not part of the repo) checked every coordinate in both files (102 points: 18 Jyotirlinga, 84 Shakti Peetha candidates) with Nominatim. Each one falls in the expected town or village; §4a records the exceptions and how they were resolved.

**Extent and structure check.** A Python check ran over both files. Both parse as JSON. Every coordinate lies inside lng 60–98.5, lat 5–37.5: the southernmost point is Kanyakumari at 8.08°N, the northernmost Sharada Peeth at 34.79°N, the westernmost Hinglaj at 65.52°E and the easternmost Nartiang at 92.21°E. There are no duplicate ids across the two files, every `primaryCandidate` index is valid, every entry has at least 2 sources, and the list counts are 51 / 18 / 4.

**Not verified to the building, or not to within ~1 km.** These are flagged in each entry's note:

- **Town, village or landmark pins with no mapped building:**
  - Manasa (a point in the lake)
  - Kalamadhava (Amarkantak town)
  - Ramagiri (Kamadgiri hill)
  - Trisrota (Salbari hamlet)
  - Kalighata/Juranpur (a village hospital point; probably within 1–2 km)
  - Yugadya (Kshirgram village)
  - Virata, both candidates (Viratnagar and Patiram town points)
  - Mithila: Janakpur and Uchaith pins
  - Panchasagara: the Varanasi and Devidhura pins
  - Prabhasa (a point on the Triveni Sangam road)
  - Kumira (alternate)
  - Shrinkhala (median of Pandua monument photos)
  - Ratnavali (pinned on the adjacent Ghanteswar temple)
  - Bhimashankar alternates at Pamohi and Kashipur
- **One source only, not cross-checked:**
  - From Wikipedia or Wikidata: Sugandha, Bahula, Kiriteswari, Manibandh, Shri Shail (Sylhet), Kankalitala, Bargabhima, Jeshoreshwari, Nainativu, Ugratara, Tara Tarini, Mangla Gauri, Sharada Peeth, Amarnath, Saptashrungi, Bhabanipur (an OSM bazaar 0.4 km away supports it).
  - From OSM: Katyayani, Kotilingeswara, Kotipalli, Bhadrakali (Kurukshetra and Nashik).
  - From geotagged Commons photos: Gadkalika (about 350 m from OSM's Gadkalika Road), Harsiddhi (median of 7 photos), Alopi Devi, Nalateshwari (median of 17 photos).
- **Jayanti / Nartiang.** The Wikipedia coordinate (3 decimal places) lies about 1 km from the OSM village point, so it is not verified to within 1 km.

**Verified (two sources within about 300 m):**

- All 12 Jyotirlinga primaries. Nageshwar rests on Wikidata plus the OSM temple road only.
- Jyotirlinga alternates: Mamleshwar, Parli, Aundha and Jageshwar.
- Shakti Peethas: Hinglaj, Kolhapur, Naina Devi, Jwalamukhi, Vaishno Devi, Devi Talab, Vajreshwari, Deoghar, Guhyeshwari, Vimala, Biraja, Muktinath, Chandranath, Tripura Sundari, Kamakhya (Wikipedia and OSM are about 150 m apart), Kalighat, Vishalakshi, Kanyakumari, Thanumalayan, Narmada Udgam, Fullara (Labhpur), Nandikeshwari, Koneswaram, Kamakshi, Adi Kamakshi, Chamundeshwari, Jogulamba (Wikipedia and Wikidata are about 300 m apart), Renuka (Mahur), Pithapuram, Draksharamam and Srisailam.

### 4a. Reverse-geocode exceptions

All 102 reverse-geocoded points fall in the expected town, village or upazila; none landed in the wrong place. Minor observations:
- **Kirita (24.2000, 88.2186)** reverse-geocodes to Nabagram, Murshidabad, not to a named Kiritkona/Lalbagh locality. It is in the right district, but the round-seconds source coordinate is unverified; check it on a map before content is written.
- **Bhimeswar Dham, Pamohi** resolves to Azara, Kamrup Metropolitan (Pamohi adjoins Azara), which is consistent.
- **Sharada Peeth** resolves to Sharda Tehsil, Neelum Valley, Azad Kashmir (Pakistan-administered), which is consistent; see the owner decision in §5.
- Reverse geocoding confirms the locality only, not the building. Building-level status is as listed in §4.

## 5. Owner decisions needed before content is written

1. **Primary sites.** Confirm the primary site for each disputed entry in §3. The ones most likely to be challenged:
   - Ujjayini: Harsiddhi or Ujani
   - Utkala: Puri or Jajpur
   - Jayanti: Nartiang or Sylhet
   - Kanchi: Kankalitala or Kanchipuram
   - Mithila
   - Ramagiri: Chitrakoot or Maihar
   - Panchasagara
2. **Sharada Peeth** (`country: "PK"`) lies in Pakistan-administered Kashmir, which India claims. Decide how to label it, given that the map draws India's official boundary. Hinglaj (PK) is not affected.
3. **Merges.** Accept or reverse the merges in §2. The ones open to challenge are Karavira→Kolhapur, Shriparvata→Srisailam and Bhairavaparvata→Mahakali.
4. **Pin-less claimants.** Some claimants are named in the notes but have no pin because no coordinate could be found: Lalita Devi (Meerapur), Baurbhag (Sylhet), Bodaganj, Jaya Mangala, Ramtek, Sukkur/Karachi, Ladakh, and the Nepal confluence. Decide whether to look for them on the ground or in Google Maps, which I could not use.
5. **Extra Jyotirlinga claimants.** These are not in the spec and so are not included: Baijnath (Himachal Pradesh) for Vaidyanath, and Bhimpur, Odisha (19.1591, 83.9178) for Bhimashankar. Add them if wanted.

## 6. Shakti Peetha table for the owner

Lists: 51 = Peetha Nirnaya (Sircar), 18 = Ashtadasha, Adi = the four Adi Peethas.

| # | Name | Primary place | Country | Lists | Disputed? |
|---|---|---|---|---|---|
| 1 | Hingula (Hinglaj) | Hinglaj Mata cave temple, Hingol National Park, Lasbela district, Balochistan | PK | 51 | No |
| 2 | Karavira (Mahalakshmi, Kolhapur) | Mahalakshmi (Ambabai) temple, Kolhapur, Maharashtra | IN | 51, 18 | Yes - also: Naina Devi temple (IN) |
| 3 | Sugandha | Sugandha Shaktipeeth (Ugratara temple), Shikarpur, Uzirpur, Barishal | BD | 51 | No |
| 4 | Kashmira (Amarnath) | Amarnath cave, Anantnag district, Jammu and Kashmir | IN | 51 | No |
| 5 | Jwalamukhi | Jwalamukhi (Jwala Ji) temple, Kangra district, Himachal Pradesh | IN | 51, 18 | Yes - also: Vaishno Devi Bhawan (IN) |
| 6 | Jalandhara (Tripuramalini) | Devi Talab Mandir, Jalandhar, Punjab | IN | 51 | Yes - also: Vajreshwari (Bajreshwari) Devi temple (IN) |
| 7 | Vaidyanatha (Jayadurga, Deoghar) | Baidyanath Dham temple complex, Deoghar, Jharkhand | IN | 51 | No |
| 8 | Nepala (Guhyeshwari) | Guhyeshwari temple, east of Pashupatinath, Kathmandu | NP | 51 | Yes - see note |
| 9 | Manasa (Manasarovar) | Lake Manasarovar, near Mount Kailash, Ngari, Tibet Autonomous Region | CN | 51 | No |
| 10 | Utkala / Viraja-kshetra (Vimala, Puri) | Vimala temple, inside the Jagannath temple complex, Puri, Odisha | IN | 51, Adi | Yes - also: Biraja (Viraja) temple (IN) |
| 11 | Gandaki (Muktinath) | Muktinath temple, Mustang, Gandaki Province | NP | 51 | No |
| 12 | Bahula (Ketugram) | Bahula temple, Ketugram, Purba Bardhaman, West Bengal | IN | 51 | No |
| 13 | Ujjayini (Harsiddhi, Ujjain) | Harsiddhi temple, Ujjain, Madhya Pradesh | IN | 51 | Yes - also: Mangalchandi temple (IN) |
| 14 | Chattala (Chandranath, Sitakunda) | Chandranath (Bhavani) temple on Chandranath hill, Sitakunda, Chattogram | BD | 51 | No |
| 15 | Tripura (Tripura Sundari, Udaipur) | Tripura Sundari (Matabari) temple, Udaipur, Gomati, Tripura | IN | 51 | No |
| 16 | Trisrota (Bhramari, Jalpaiguri) | Salbari, Maynaguri block (near Jalpesh), Jalpaiguri district, West Bengal | IN | 51 | Yes - see note |
| 17 | Kamagiri / Kamarupa (Kamakhya) | Kamakhya temple, Nilachal hill, Guwahati, Assam | IN | 51, 18, Adi | No |
| 18 | Yugadya (Jogadya, Kshirgram) | Jogadya temple, Kshirgram, Mangalkot, Purba Bardhaman, West Bengal | IN | 51 | No |
| 19 | Kalipitha (Kalighat, Dakshina Kalika) | Kalighat Kali temple, Kolkata, West Bengal | IN | 51, Adi | No |
| 20 | Prayaga (Madhaveshwari / Lalita, Prayagraj) | Alopi Devi (Alopshankari) temple, Alopibagh, Prayagraj, Uttar Pradesh | IN | 51, 18 | Yes - also: Kalyani Devi temple (IN) |
| 21 | Jayanti (Nartiang) | Nartiang Durga (Jayanti) temple, West Jaintia Hills, Meghalaya | IN | 51 | Yes - see note |
| 22 | Kirita (Kiriteswari) | Kiriteswari temple, Kiritkona, Lalbagh, Murshidabad, West Bengal | IN | 51 | No |
| 23 | Varanasi (Vishalakshi) | Vishalakshi temple, near Manikarnika Ghat, Varanasi, Uttar Pradesh | IN | 51, 18 | No |
| 24 | Kanyashrama (Kanyakumari) | Kanyakumari Bhagavathy Amman (Kumari) temple, Kanyakumari, Tamil Nadu | IN | 51 | Yes - also: Kumira / Kumarikunda (BD) |
| 25 | Kurukshetra (Bhadrakali, Thanesar) | Shri Devikoop Bhadrakali temple, Thanesar, Kurukshetra, Haryana | IN | 51 | No |
| 26 | Manivedaka (Manibandh, Pushkar) | Manibandh (Gayatri) Shaktipeeth, Gayatri hill, Pushkar, Rajasthan | IN | 51 | Yes - see note |
| 27 | Shrishaila (Shrihatta, Sylhet) | Shri Shail Mahalakshmi temple, Jainpur, Dakshin Surma, Sylhet | BD | 51 | Yes - also: Bhramaramba-Mallikarjuna temple (IN) |
| 28 | Kanchi (Kankalitala) | Kankalitala temple, on the Kopai river near Bolpur, Birbhum, West Bengal | IN | 51 | Yes - also: Adi Kamakshi temple (IN) |
| 29 | Kalamadhava | Amarkantak, Anuppur district, Madhya Pradesh (site near the source of the Son not located) | IN | 51 | Yes - see note |
| 30 | Shona / Narmada (Amarkantak) | Narmada Udgam (source) temple, Amarkantak, Madhya Pradesh | IN | 51 | No |
| 31 | Ramagiri (Chitrakoot) | Kamadgiri hill, Chitrakoot, Satna district, Madhya Pradesh | IN | 51 | Yes - also: Maa Sharda temple (IN) |
| 32 | Vrindavana (Katyayani / Uma) | Katyayani Peeth, Radhabagh, Vrindavan, Mathura, Uttar Pradesh | IN | 51 | No |
| 33 | Shuchi / Anala (Suchindram) | Thanumalayan (Sthanumalaya) temple, Suchindram, Kanyakumari district, Tamil Nadu | IN | 51 | No |
| 34 | Panchasagara (Varahi) | Varahi temple area, Man Mandir Ghat, Varanasi, Uttar Pradesh | IN | 51 | Yes - also: Varahi Devi temple (IN); Danteshwari temple (IN) |
| 35 | Karatoyatata (Bhabanipur) | Bhabanipur Shaktipeeth, Sherpur upazila, Bogura | BD | 51 | No |
| 36 | Shriparvata (Bhramaramba, Srisailam) | Bhramaramba-Mallikarjuna temple, Srisailam, Nandyal district, Andhra Pradesh | IN | 51, 18 | Yes - see note |
| 37 | Vibhasha (Bargabhima, Tamluk) | Bargabhima temple, Tamluk, Purba Medinipur, West Bengal | IN | 51 | No |
| 38 | Prabhasa (Chandrabhaga) | Triveni Sangam area, Prabhas Patan (Somnath), Gir Somnath district, Gujarat | IN | 51 | No |
| 39 | Bhairavaparvata / Avanti (Gadkalika, Ujjain) | Gadkalika temple, Bhairav hill by the Shipra, Ujjain, Madhya Pradesh | IN | 51, 18 | Yes - also: Harsiddhi temple (IN); Mahakaleshwar temple complex (IN) |
| 40 | Janasthana (Saptashrungi, Nashik) | Saptashrungi temple, Vani, Nashik district, Maharashtra | IN | 51 | Yes - also: Bhadrakali temple (IN) |
| 41 | Godavaritira (Kotilingeswara, Rajahmundry) | Sri Uma Kotilingeswara Swamy temple, Rajamahendravaram, Andhra Pradesh | IN | 51 | Yes - also: Someswara Swamy temple (IN) |
| 42 | Ratnavali (Khanakul) | Ratnavali (Anandamayi) shrine by the Ghanteswar temple, Khanakul, Hooghly, West Bengal | IN | 51 | Yes - see note |
| 43 | Mithila (Uma) | Janakpur, Madhesh Province (no separate Uma shrine identified; pin at Janaki Mandir) | NP | 51 | Yes - also: Uchaith Bhagwati (Vana Durga) temple (IN); Ugratara Sthan (IN) |
| 44 | Nalahati (Nalateshwari) | Nalateshwari temple, Nalhati, Birbhum, West Bengal | IN | 51 | No |
| 45 | Kalighata / Kalipitha (Juranpur) | Jaydurga (Kalipitha) temple, Juranpur, Kaliganj, Nadia, West Bengal | IN | 51 | Yes - see note |
| 46 | Vakreshvara (Bakreshwar) | Bakreshwar (Mahishamardini) temple, Birbhum, West Bengal | IN | 51 | No |
| 47 | Yashora (Jeshoreshwari) | Jeshoreshwari Kali temple, Ishwaripur, Shyamnagar, Satkhira | BD | 51 | No |
| 48 | Attahasa (Phullara) | Phullara (Fullara) temple, Labhpur, Birbhum, West Bengal | IN | 51 | Yes - also: Attahas temple (IN) |
| 49 | Nandipura (Nandikeshwari, Sainthia) | Nandikeshwari temple, Sainthia, Birbhum, West Bengal | IN | 51 | No |
| 50 | Lanka (Indrakshi, Nainativu) | Nagapooshani Amman temple, Nainativu, Jaffna | LK | 51 | Yes - also: Koneswaram temple (LK) |
| 51 | Virata (Ambika) | Viratnagar (Bairat), Jaipur district, Rajasthan - Ambika shrine not located | IN | 51 | Yes - also: Patiram (IN) |
| 52 | Shankari (Trincomalee) | Koneswaram temple, Swami Rock, Trincomalee | LK | 18 | No |
| 53 | Kamakshi (Kanchipuram) | Kamakshi Amman temple, Kanchipuram, Tamil Nadu | IN | 18 | No |
| 54 | Shrinkhala (Pradyumna) | Pandua (Hooghly), West Bengal - former shrine site at the Pandua minar/mosque complex | IN | 18 | Yes - see note |
| 55 | Chamundeshwari (Mysuru) | Chamundeshwari temple, Chamundi hill, Mysuru, Karnataka | IN | 18 | No |
| 56 | Jogulamba (Alampur) | Jogulamba temple, Alampur, Jogulamba Gadwal district, Telangana | IN | 18 | No |
| 57 | Ekaveera / Renuka (Mahur) | Renuka Mata temple, Mahur (Mahurgad), Nanded district, Maharashtra | IN | 18 | No |
| 58 | Puruhutika (Pithapuram) | Puruhutika shrine in the Kukkuteswara temple, Pithapuram, Kakinada district, Andhra Pradesh | IN | 18 | No |
| 59 | Girija / Biraja (Jajpur) | Biraja temple, Jajpur, Odisha | IN | 18 | No |
| 60 | Manikyamba (Draksharamam) | Bhimeswara temple (Manikyamba shrine), Draksharamam, Konaseema district, Andhra Pradesh | IN | 18 | No |
| 61 | Sarvamangala / Mangala Gauri (Gaya) | Mangla Gauri temple, Bhasmakut hill, Gaya, Bihar | IN | 18 | No |
| 62 | Saraswati / Sharada Peeth (Kashmir) | Sharada Peeth ruins, Sharda village, Neelum valley | PK | 18 | No |
| 63 | Tara Tarini (Brahmapur) | Tara Tarini temple, Kumari hill on the Rushikulya, Purushottampur, Ganjam, Odisha | IN | Adi | No |

Total: 63 entries (51 from the Peetha Nirnaya list + 12 outside it); 27 are disputed.

## 7. Owner decisions (2026-10-27)

All §5 recommendations approved:
1. Primary sites stay as drafted (Ujjayini → Harsiddhi, Utkala → Vimala/Puri, Jayanti → Nartiang, Kanchi → Kankalitala, Ramagiri → Chitrakoot, Mithila → Janakpur (approximate), Panchasagara → Varanasi); other candidates appear as "other claimed site" pins.
2. Sharada Peeth is labelled "Jammu and Kashmir (Pakistan-administered)" with country `IN`, consistent with India's official boundary drawn on the map.
3. The identifications Karavira → Kolhapur, Shriparvata → Srisailam and Bhairavaparvata → Gadkalika (Ujjain) are kept.
4. Claimants without coordinates are mentioned in temple text only, with no pin.
5. No extra Jyotirlinga claimants beyond the spec's alternates.

Approximate pins (§4) must be refined to the temple building during the Task 16 content pass where a reliable source allows.
