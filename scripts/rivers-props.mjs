// One-off helper: stamps { id, kind, name } onto each river file and builds the Saraswati course.
// Usage: node scripts/rivers-props.mjs   (run after the mapshaper steps in content/rivers/SOURCE.md)
import { readFileSync, writeFileSync } from 'node:fs';

const DIR = 'content/rivers';
const n = (en, hi, bn, mr, ta, te, gu) => ({ en, hi, bn, mr, ta, te, gu });
const NAMES = {
  ganga: n('Ganga', 'गंगा', 'গঙ্গা', 'गंगा', 'கங்கை', 'గంగ', 'ગંગા'),
  yamuna: n('Yamuna', 'यमुना', 'যমুনা', 'यमुना', 'யமுனை', 'యమున', 'યમુના'),
  narmada: n('Narmada', 'नर्मदा', 'নর্মদা', 'नर्मदा', 'நர்மதை', 'నర్మద', 'નર્મદા'),
  godavari: n('Godavari', 'गोदावरी', 'গোদাবরী', 'गोदावरी', 'கோதாவரி', 'గోదావరి', 'ગોદાવરી'),
  kaveri: n('Kaveri', 'कावेरी', 'কাবেরী', 'कावेरी', 'காவிரி', 'కావేరి', 'કાવેરી'),
  shipra: n('Shipra', 'शिप्रा', 'শিপ্রা', 'क्षिप्रा', 'சிப்ரா', 'శిప్రా', 'ક્ષિપ્રા'),
  brahmaputra: n('Brahmaputra', 'ब्रह्मपुत्र', 'ব্রহ্মপুত্র', 'ब्रह्मपुत्रा', 'பிரம்மபுத்திரா', 'బ్రహ్మపుత్ర', 'બ્રહ્મપુત્ર'),
  saraswati: n('Saraswati', 'सरस्वती', 'সরস্বতী', 'सरस्वती', 'சரஸ்வதி', 'సరస్వతి', 'સરસ્વતી'),
};

// Saraswati waypoints [lng, lat], from the task brief; smoothed with Chaikin corner cutting.
const WAYPOINTS = [
  [77.33, 30.45], // Adi Badri
  [76.58, 29.98], // Pehowa
  [75.03, 29.53], // Sirsa
  [74.32, 29.58], // Hanumangarh
  [73.21, 29.19], // Anupgarh
  [72.85, 29.19], // Fort Abbas
  [71.33, 28.77], // Derawar
  [70.5, 24.5], // toward the Rann of Kutch
];
function chaikin(pts, rounds) {
  let p = pts;
  for (let r = 0; r < rounds; r++) {
    const q = [p[0]];
    for (let i = 0; i < p.length - 1; i++) {
      const [a, b] = [p[i], p[i + 1]];
      q.push([0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]]);
      q.push([0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]]);
    }
    q.push(p[p.length - 1]);
    p = q;
  }
  return p.map(([x, y]) => [Math.round(x * 1e4) / 1e4, Math.round(y * 1e4) / 1e4]);
}

for (const id of Object.keys(NAMES)) {
  const file = `${DIR}/${id}.geojson`;
  const kind = id === 'saraswati' ? 'ancient' : 'living';
  const fc =
    id === 'saraswati'
      ? { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: chaikin(WAYPOINTS, 3) } }] }
      : JSON.parse(readFileSync(file, 'utf8'));
  for (const f of fc.features) f.properties = { id, kind, name: NAMES[id] };
  writeFileSync(file, JSON.stringify(fc) + '\n');
}
