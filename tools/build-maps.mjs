// Genererer forenklede SVG-kart (stier) for hver epoke fra Natural Earth / US Census-data.
// Kjør: npm run maps  ->  skriver src/js/mapdata.js
import { readFileSync, writeFileSync } from 'node:fs';
import * as topo from 'topojson-client';
import * as d3 from 'd3-geo';
import polylabel from 'polylabel';
import pc from 'polygon-clipping';

const read = (p) => JSON.parse(readFileSync(new URL('../node_modules/' + p, import.meta.url)));
const counties = read('us-atlas/counties-10m.json');
const states = read('us-atlas/states-10m.json');
const w50 = read('world-atlas/countries-50m.json');
const w110 = read('world-atlas/countries-110m.json');

// ---------- hjelpere for geometri ----------
const geoms = (t, obj) => t.objects[obj].geometries;
function mergeTopo(t, obj, pred) {
  const list = geoms(t, obj).filter(pred);
  if (!list.length) throw new Error('Ingen treff i ' + obj);
  return topo.merge(t, list); // MultiPolygon
}
const feat = (t, obj, pred) => topo.feature(t, { type: 'GeometryCollection', geometries: geoms(t, obj).filter(pred) });
const byIds = (ids) => (g) => ids.includes(String(g.id));
const byNames = (names) => (g) => names.includes(g.properties.name);

// polygon-clipping bruker [[[x,y]...]] (Polygon) / [[[[x,y]]]] (MultiPolygon)
const toPC = (geom) => (geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates);
const fromPC = (mp) => ({ type: 'MultiPolygon', coordinates: mp });
const rect = (x0, y0, x1, y1) => [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]];
const clipTo = (geom, r) => fromPC(pc.intersection(toPC(geom), r));
const cutAway = (geom, r) => fromPC(pc.difference(toPC(geom), r));
const union = (...gs) => fromPC(pc.union(...gs.map(toPC)));
// d3 krever motsatt vindingsretning enn GeoJSON-standard (RFC7946) for sfæriske polygoner.
function rewindForD3(geom) {
  const fix = (ring, outer) => {
    // planar areal i lon/lat: positiv = mot klokka
    let a = 0;
    for (let i = 0, n = ring.length - 1; i < n; i++) a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
    const ccw = a > 0;
    // d3: ytre ring skal gå med klokka
    if (outer ? ccw : !ccw) return ring.slice().reverse();
    return ring;
  };
  return { type: 'MultiPolygon', coordinates: toPC(geom).map((poly) => poly.map((ring, i) => fix(ring, i === 0))) };
}

// ---------- projeksjon -> ringer ----------
function projectRings(geom, projection) {
  const polys = [];
  let poly = null, ring = null;
  const sink = {
    point(x, y) { ring && ring.push([x, y]); },
    lineStart() { ring = []; },
    lineEnd() { if (ring && ring.length > 2) (poly || (poly = [])).push(ring); ring = null; },
    polygonStart() { poly = []; },
    polygonEnd() { if (poly && poly.length) polys.push(poly); poly = null; },
    sphere() {},
  };
  d3.geoStream({ type: 'Feature', geometry: geom, properties: {} }, projection.stream(sink));
  return polys;
}
const ringArea = (r) => { let a = 0; for (let i = 0, n = r.length; i < n; i++) { const p = r[i], q = r[(i + 1) % n]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; };

function simplifyDP(pts, tol) {
  if (pts.length < 4) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  const t2 = tol * tol;
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
    let maxD = -1, idx = -1;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = pts[i];
      let d;
      if (L === 0) d = (px - ax) ** 2 + (py - ay) ** 2;
      else { const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L)); d = (px - ax - t * dx) ** 2 + (py - ay - t * dy) ** 2; }
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > t2) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

function ringsToPath(polys, tol, minArea) {
  let d = '';
  const kept = [];
  for (const poly of polys) {
    const outRings = [];
    for (const r of poly) {
      const closed = r.concat([r[0]]);
      let s = simplifyDP(closed, tol).slice(0, -1);
      // rund av og fjern duplikater
      const q = [];
      for (const [x, y] of s) { const p = [Math.round(x), Math.round(y)]; const l = q[q.length - 1]; if (!l || l[0] !== p[0] || l[1] !== p[1]) q.push(p); }
      if (q.length < 3 || Math.abs(ringArea(q)) < minArea) continue;
      outRings.push(q);
      let px = q[0][0], py = q[0][1];
      d += `M${px} ${py}l`;
      const parts = [];
      for (let i = 1; i < q.length; i++) { parts.push(`${q[i][0] - px} ${q[i][1] - py}`); px = q[i][0]; py = q[i][1]; }
      d += parts.join(' ').replace(/ -/g, '-') + 'z';
    }
    if (outRings.length) kept.push(outRings);
  }
  return { d, polys: kept };
}

function labelFor(polys) {
  let best = null, bestA = 0;
  for (const p of polys) { const a = Math.abs(ringArea(p[0])); if (a > bestA) { bestA = a; best = p; } }
  if (!best) return null;
  const pt = polylabel(best, 1.0);
  return [Math.round(pt[0]), Math.round(pt[1])];
}
function bboxOf(polys) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of polys) for (const r of p) for (const [x, y] of r) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return [x0, y0, x1, y1].map(Math.round);
}

function buildMap(name, { projection, focus, W = 1000, pad = 30, regions, context = [], tol = 0.9, minArea = 3 }) {
  projection.fitWidth(W - pad * 2, focus);
  const [[bx0, by0], [bx1, by1]] = d3.geoPath(projection).bounds(focus);
  const H = Math.round(by1 - by0 + pad * 2);
  const [tx, ty] = projection.translate();
  projection.translate([tx - bx0 + pad, ty - by0 + pad]);
  if (projection.clipExtent) projection.clipExtent([[0, 0], [W, H]]);
  const out = { w: W, h: H, regions: {}, context: '' };
  for (const [id, geom] of Object.entries(regions)) {
    const { d, polys } = ringsToPath(projectRings(geom, projection), tol, minArea);
    if (!d) { console.warn('  tom region', name, id); continue; }
    out.regions[id] = { d, l: labelFor(polys), b: bboxOf(polys) };
  }
  const ctx = context.map((g) => ringsToPath(projectRings(g, projection), tol, minArea).d).join('');
  out.context = ctx;
  const size = JSON.stringify(out).length;
  console.log(`${name}: ${W}x${H}, ${Object.keys(out.regions).length} regioner, ${(size / 1024).toFixed(1)} KB`);
  return out;
}

const MAPS = {};

// ================= OHIO =================
{
  const OH = (g) => String(g.id).startsWith('39');
  const groups = {
    home: ['Auglaize', 'Mercer'],
    lima: ['Allen', 'Van Wert', 'Putnam', 'Hardin', 'Hancock', 'Paulding'],
    toledo: ['Lucas', 'Wood', 'Ottawa', 'Fulton', 'Williams', 'Defiance', 'Henry', 'Sandusky', 'Seneca', 'Wyandot'],
    dayton: ['Montgomery', 'Miami', 'Greene', 'Clark', 'Champaign', 'Preble', 'Darke', 'Shelby', 'Logan'],
    cincinnati: ['Hamilton', 'Butler', 'Warren', 'Clermont', 'Brown', 'Clinton', 'Highland', 'Adams', 'Fayette'],
    columbus: ['Franklin', 'Delaware', 'Licking', 'Fairfield', 'Pickaway', 'Madison', 'Union', 'Marion', 'Morrow', 'Knox'],
    cleveland: ['Cuyahoga', 'Lake', 'Geauga', 'Lorain', 'Medina', 'Ashtabula', 'Erie', 'Huron'],
    akron: ['Summit', 'Portage', 'Stark', 'Trumbull', 'Mahoning', 'Columbiana', 'Wayne', 'Ashland', 'Richland', 'Crawford', 'Carroll', 'Holmes', 'Tuscarawas'],
    athens: ['Athens', 'Washington', 'Meigs', 'Gallia', 'Lawrence', 'Scioto', 'Jackson', 'Vinton', 'Hocking', 'Perry', 'Morgan', 'Noble', 'Monroe', 'Belmont', 'Guernsey', 'Muskingum', 'Coshocton', 'Harrison', 'Jefferson', 'Ross', 'Pike'],
  };
  const all = Object.values(groups).flat();
  const ohioNames = geoms(counties, 'counties').filter(OH).map((g) => g.properties.name);
  const missing = ohioNames.filter((n) => !all.includes(n));
  if (missing.length || all.length !== 88) throw new Error('Ohio-fylker mangler: ' + missing + ' / ' + all.length);
  const regions = {};
  for (const [id, names] of Object.entries(groups)) regions[id] = mergeTopo(counties, 'counties', (g) => OH(g) && names.includes(g.properties.name));
  const focus = feat(counties, 'counties', OH);
  const neighbours = mergeTopo(states, 'states', byIds(['26', '18', '21', '54', '42', '36', '24', '51', '47', '17']));
  const canada = mergeTopo(w50, 'countries', byIds(['124']));
  const projOH = d3.geoConicConformal().parallels([38.5, 41.5]).rotate([82.7, 0]);
  MAPS.ohio = buildMap('ohio', { projection: projOH, focus, pad: 70, regions, context: [neighbours, canada], tol: 0.7 });
  // Ohio-silhuett (logo/ikon), normalisert til en 200x200-boks
  const outline = projectRings(mergeTopo(counties, 'counties', OH), projOH);
  const bb = bboxOf(outline);
  const sc = 190 / Math.max(bb[2] - bb[0], bb[3] - bb[1]);
  const ox = (200 - (bb[2] - bb[0]) * sc) / 2, oy = (200 - (bb[3] - bb[1]) * sc) / 2;
  const norm = outline.map((p) => p.map((r) => r.map(([x, y]) => [(x - bb[0]) * sc + ox, (y - bb[1]) * sc + oy])));
  MAPS.ohioOutline = ringsToPath(norm, 1.2, 20).d;
}

// ================= USA =================
{
  const groups = {
    ohio: ['39'],
    midwest: ['18', '26', '17', '55', '27', '19', '29'],
    northeast: ['42', '36', '34', '09', '44', '25', '50', '33', '23'],
    capital: ['11', '24', '10', '51', '54'],
    south: ['21', '47', '37', '45', '13', '01', '28', '05', '22'],
    florida: ['12'],
    texas: ['48', '40'],
    plains: ['20', '31', '46', '38', '30', '56', '08'],
    desert: ['35', '04', '32', '49'],
    westcoast: ['06', '41', '53', '16'],
    alaska: ['02', '15'],
  };
  const all = Object.values(groups).flat();
  if (new Set(all).size !== 51) throw new Error('USA-grupper: ' + all.length);
  const regions = {};
  for (const [id, ids] of Object.entries(groups)) regions[id] = mergeTopo(states, 'states', byIds(ids));
  const focus = feat(states, 'states', byIds(all));
  MAPS.usa = buildMap('usa', { projection: d3.geoAlbersUsa(), focus, pad: 16, regions, tol: 0.8 });
}

// ================= NORD-AMERIKA =================
const NA_CENTRAL = ['320', '084', '340', '222', '558', '188', '591'];
const NA_CARIB = ['192', '388', '332', '214', '044', '630', '780', '136', '796', '028', '052', '212', '308', '662', '670', '659', '533', '531', '660', '500', '092', '850', '663', '652', '534'];
{
  const usaFull = mergeTopo(w50, 'countries', byIds(['840']));
  // fjern Hawaii og Aleutene vest for 180° fra USA (de strekker kartet)
  const usa = clipTo(usaFull, rect(-170, 15, -50, 75));
  const usaNoHawaii = cutAway(usa, rect(-162, 15, -150, 25));
  const canada = mergeTopo(w50, 'countries', byIds(['124']));
  const france = mergeTopo(w50, 'countries', byIds(['250']));
  const regions = {
    usa: usaNoHawaii,
    mexico: mergeTopo(w50, 'countries', byIds(['484'])),
    central: mergeTopo(w50, 'countries', byIds(NA_CENTRAL)),
    caribbean: union(mergeTopo(w50, 'countries', byIds(NA_CARIB)), clipTo(france, rect(-62, 14, -60, 17))),
    canada_e: clipTo(canada, rect(-102, 40, -50, 60)),
    canada_w: clipTo(canada, rect(-142, 40, -102, 60)),
    canada_n: clipTo(canada, rect(-142, 60, -50, 85)),
    greenland: mergeTopo(w50, 'countries', byIds(['304'])),
  };
  for (const k of Object.keys(regions)) regions[k] = rewindForD3(regions[k]);
  const focus = { type: 'GeometryCollection', geometries: Object.values(regions) };
  const ctx = mergeTopo(w50, 'countries', (g) => !['840', '124', '484', '304', ...NA_CENTRAL, ...NA_CARIB].includes(String(g.id)));
  MAPS.na = buildMap('na', {
    projection: d3.geoAzimuthalEqualArea().rotate([96, -47]),
    focus, pad: 14, regions, context: [ctx], tol: 0.8, minArea: 2,
  });
}

// ================= SØR-AMERIKA =================
{
  const brazil = mergeTopo(w50, 'countries', byIds(['076']));
  const france = mergeTopo(w50, 'countries', byIds(['250']));
  const amazonRect = rect(-75, -12, -48, 6);
  const naIds = ['840', '484', ...NA_CENTRAL, ...NA_CARIB];
  const regions = {
    na: mergeTopo(w50, 'countries', byIds(naIds)),
    colombia: mergeTopo(w50, 'countries', byIds(['170'])),
    venezuela: union(mergeTopo(w50, 'countries', byIds(['862', '328', '740'])), clipTo(france, rect(-55, 1, -51, 6.5))),
    peru: mergeTopo(w50, 'countries', byIds(['218', '604'])),
    bolivia: mergeTopo(w50, 'countries', byIds(['068', '600'])),
    chile: mergeTopo(w50, 'countries', byIds(['152'])),
    argentina: mergeTopo(w50, 'countries', byIds(['032', '858'])),
    amazonas: clipTo(brazil, amazonRect),
    brasil: cutAway(brazil, amazonRect),
  };
  for (const k of ['venezuela', 'amazonas', 'brasil']) regions[k] = rewindForD3(regions[k]);
  const saIds = ['170', '862', '328', '740', '218', '604', '068', '600', '152', '032', '858', '076'];
  const focus = feat(w50, 'countries', byIds(saIds));
  const ctx = mergeTopo(w50, 'countries', (g) => !naIds.includes(String(g.id)) && !saIds.includes(String(g.id)));
  MAPS.sa = buildMap('sa', {
    projection: d3.geoAzimuthalEqualArea().rotate([60, 22]),
    focus, pad: 40, regions, context: [ctx], tol: 0.8, minArea: 2,
  });
}

// ================= VERDEN =================
{
  const W = w110;
  const ids = {
    norden: ['578', '752', '246', '208', '352'],
    westeu: ['826', '372', '724', '620', '056', '528', '442', '276', '756', '040', '380'],
    easteu: ['616', '203', '703', '348', '642', '100', '688', '191', '070', '705', '499', '807', '008', '300', '233', '440', '428', '112', '804', '498', '196'],
    russia: ['643'],
    steppes: ['398', '860', '795', '417', '762', '004', '496'],
    mideast: ['792', '268', '051', '031', '760', '422', '376', '275', '400', '368', '364', '682', '887', '512', '784', '634', '414'],
    nafrica: ['504', '732', '012', '788', '434', '818', '478', '466', '562', '148', '729'],
    southasia: ['356', '586', '050', '144', '524', '064'],
    eastasia: ['156', '158', '392', '410', '408', '704', '418', '116', '764', '104'],
    oceania: ['036', '554', '598', '360', '608', '458', '096', '626', '242', '090', '548', '540'],
    antarctica: ['010'],
  };
  const named = { easteu: ['Kosovo', 'N. Cyprus'] , nafrica: [], savanna: ['Somaliland'] };
  const americasIds = ['840', '124', '484', '304', ...NA_CENTRAL, ...NA_CARIB, '170', '862', '328', '740', '218', '604', '068', '600', '152', '032', '858', '076', '238'];
  const assigned = new Set([...Object.values(ids).flat(), ...americasIds, '250', '260']);
  // resten av Afrika -> savannen
  const africaRest = geoms(W, 'countries').filter((g) => {
    if (assigned.has(String(g.id)) || !g.id) return false;
    const c = d3.geoCentroid(topo.feature(W, g));
    return c[0] > -20 && c[0] < 55 && c[1] > -36 && c[1] < 20;
  }).map((g) => String(g.id));
  ids.savanna = africaRest;
  const france = mergeTopo(W, 'countries', byIds(['250']));
  const regions = { americas: mergeTopo(W, 'countries', byIds(americasIds)) };
  for (const [k, list] of Object.entries(ids)) {
    const extra = named[k] || [];
    regions[k] = mergeTopo(W, 'countries', (g) => list.includes(String(g.id)) || extra.includes(g.properties.name));
  }
  regions.westeu = rewindForD3(union(regions.westeu, clipTo(france, rect(-6, 41, 10, 52))));
  const used = new Set([...Object.values(ids).flat(), ...americasIds, '250']);
  const leftovers = geoms(W, 'countries').filter((g) => !used.has(String(g.id)) && !Object.values(named).flat().includes(g.properties.name));
  console.log('  verden – ikke tildelt (kontekst):', leftovers.map((g) => g.properties.name).join(', '));
  const ctx = leftovers.length ? topo.merge(W, leftovers) : null;
  // fokus: øst for Atlanteren, inkl. Antarktis
  const pts = [];
  for (let lon = -40; lon <= 180; lon += 5) { pts.push([lon, 80]); pts.push([lon, -89.9]); }
  for (let lat = -89; lat <= 80; lat += 5) { pts.push([-40, lat]); pts.push([180, lat]); }
  const focus = { type: 'MultiPoint', coordinates: pts };
  MAPS.world = buildMap('world', {
    projection: d3.geoNaturalEarth1().rotate([-70, 0]),
    focus, pad: 6, regions, context: ctx ? [ctx] : [], tol: 0.8, minArea: 2,
  });
}

const header = '// AUTOGENERERT av tools/build-maps.mjs – ikke rediger for hånd.\n// Kartdata: US Census (us-atlas) og Natural Earth (world-atlas), public domain.\n';
writeFileSync(new URL('../src/js/mapdata.js', import.meta.url), header + 'export const MAPS = ' + JSON.stringify(MAPS) + ';\n');
console.log('Skrev src/js/mapdata.js');
