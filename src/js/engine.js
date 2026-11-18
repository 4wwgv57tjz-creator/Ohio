// Spillmotor – ren logikk uten DOM, slik at den kan testes og simuleres i Node.
import { BUILDINGS, UNITS, REGIONS, ERAS, REGION_BY_ID, BUILDING_BY_ID, UNIT_BY_ID, regionsOfEra, TERRAINS, TACTICS, DOCTRINES, DOCTRINE_BY_ID, DOC_MAX, docCost, LANE_TYPES, LANE_POOLS } from './data.js';
import { newPowerups, restorePowerups, puEffect, grantRandom } from './powerups.js';
import { newCosmetics, restoreCosmetics, EMPTY_INV, addCrate, PRESTIGE_SKINS, equippedSkin, GENERAL_BY_ID, DEFAULT_GENERAL, GENERAL_SWITCH_MS } from './cosmetics.js';

export const SAVE_VERSION = 1;
export const B_GROWTH = 1.15; // prisøkning per bygning
export const U_GROWTH = 1.12; // prisøkning per enhet
export const MILESTONES = [10, 25, 50, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 900, 1000];
export const OFFLINE_CAP = 8 * 3600; // sekunder
export const TAP_MAX = 25;
export const TAP_PCT = 0.012; // andel av inntekt per trykk per nivå
export const BOOST_MULT = 3;
export const BOOST_SECS = 30;
export const SAFE_RATIO = 1.8; // hærstyrke/forsvar for 100 % vinnersjanse (uten innsats i kampen)
export const DEF_FLOOR = 0.4; // et område kan ikke svekkes under 40 % av forsvaret
export const DAMAGE_HEAL = 0.02; // svekkelse bygges opp igjen med 2 % av forsvaret per minutt
export const AD_BOOST_MULT = 2; // inntektsboost fra belønningsreklame
export const AD_BOOST_SECS = 600;
export const START_GEMS = 50;
export const gemsForRegion = (r) => 5 + 2 * r.era;
export const gemsForEra = (era) => 50 * (era + 1);

export function newState(name = '') {
  const now = Date.now();
  return {
    v: SAVE_VERSION,
    name,
    money: 20,
    totalEarned: 0,
    era: 0,
    buildings: {},
    units: {},
    conquered: {},
    damage: {},
    stars: {},
    doc: {},
    medals: 0,
    medalsEarned: 0,
    genSwitchAt: 0,
    tapLevel: 0,
    boostUntil: 0,
    lastSeen: now,
    created: now,
    stats: { taps: 0, won: 0, lost: 0, unitsLost: 0, crates: 0, playTime: 0, wins: 0, stars3: 0, blocked: 0, retreats: 0, crits: 0, bestCombo: 0, events: 0 },
    prestige: 0,
    general: DEFAULT_GENERAL,
    settings: { sound: true, vibrate: true, lang: 'nb', buyMode: 1, tactic: 'normal' },
    pu: newPowerups(),
    tut: 0,
    seenIntro: -1,
    finished: false,
    gems: START_GEMS,
    skins: newCosmetics(),
    crates: { opened: 0, pity: 0, inv: { ...EMPTY_INV } },
    social: { code: '', friends: [] },
    flags: {},
    adFree: false,
    adBoostUntil: 0,
    ads: { lastInterstitial: 0, battlesSince: 0, freeCrateAt: 0, gemDay: '', gemCount: 0, watched: 0 },
    purchases: [],
    ev: newEvState(),
    daily: { last: '', streak: 0, total: 0 },
  };
}
// Hendelser i basen (se events.js): neste hendelse, den som venter, de siste vi har vist og midlertidige virkninger
export const newEvState = () => ({ next: 0, cur: null, recent: [], n: 0, buff: {} });
const num = (v, d = 0) => (Number.isFinite(v) ? v : d);
function restoreEv(d) {
  const ev = newEvState();
  if (!d || typeof d !== 'object') return ev;
  ev.next = num(d.next);
  ev.n = Math.max(0, Math.floor(num(d.n)));
  ev.recent = Array.isArray(d.recent) ? d.recent.filter((x) => typeof x === 'string').slice(-30) : [];
  if (d.cur && typeof d.cur.id === 'string' && Array.isArray(d.cur.order)) ev.cur = { id: d.cur.id, order: d.cur.order.filter((x) => Number.isInteger(x)).slice(0, 4), at: num(d.cur.at) };
  for (const k of ['inc', 'tap']) {
    const b = d.buff && d.buff[k];
    if (b && Number.isFinite(b.m) && b.m > 0 && b.m <= 5 && Number.isFinite(b.until)) ev.buff[k] = { m: b.m, until: b.until };
  }
  return ev;
}

// Slår sammen et lagret spill med standardverdier (tåler eldre lagringer)
export function restore(data) {
  const base = newState();
  if (!data || typeof data !== 'object') return base;
  const s = { ...base, ...data };
  s.stats = { ...base.stats, ...(data.stats || {}) };
  s.settings = { ...base.settings, ...(data.settings || {}) };
  for (const k of ['buildings', 'units', 'conquered', 'damage', 'stars']) s[k] = { ...(data[k] || {}) };
  s.doc = {};
  for (const x of DOCTRINES) { const v = data.doc && data.doc[x.id]; if (Number.isFinite(v) && v > 0) s.doc[x.id] = Math.min(DOC_MAX, Math.floor(v)); }
  for (const k of ['medals', 'medalsEarned', 'genSwitchAt']) if (!Number.isFinite(s[k]) || s[k] < 0) s[k] = 0;
  s.skins = restoreCosmetics(data.skins);
  s.crates = { ...base.crates, ...(data.crates || {}) };
  s.crates.inv = { ...EMPTY_INV, ...((data.crates && data.crates.inv) || {}) };
  s.social = { ...base.social, ...(data.social || {}) };
  s.social.friends = Array.isArray(s.social.friends) ? s.social.friends.slice(0, 200) : [];
  s.flags = { ...(data.flags || {}) };
  s.ads = { ...base.ads, ...(data.ads || {}) };
  s.purchases = Array.isArray(data.purchases) ? data.purchases.slice(-50) : [];
  s.adFree = !!data.adFree;
  s.pu = restorePowerups(data.pu);
  s.ev = restoreEv(data.ev);
  const dl = data.daily && typeof data.daily === 'object' ? data.daily : {};
  s.daily = { last: typeof dl.last === 'string' ? dl.last.slice(0, 10) : '', streak: Math.max(0, Math.floor(num(dl.streak))), total: Math.max(0, Math.floor(num(dl.total))) };
  if (!TACTICS[s.settings.tactic]) s.settings.tactic = 'normal';
  if (!GENERAL_BY_ID[s.general]) s.general = DEFAULT_GENERAL;
  for (const k of ['money', 'totalEarned', 'era', 'tapLevel', 'prestige', 'tut', 'boostUntil', 'lastSeen', 'gems', 'adBoostUntil']) if (!Number.isFinite(s[k])) s[k] = base[k];
  s.era = Math.max(0, Math.min(ERAS.length - 1, Math.floor(s.era)));
  s.v = SAVE_VERSION;
  return s;
}

export const milestoneMult = (n) => { let m = 1; for (const t of MILESTONES) { if (n >= t) m *= 2; else break; } return m; };
export const nextMilestone = (n) => MILESTONES.find((t) => t > n) ?? null;
export const prevMilestone = (n) => { let p = 0; for (const t of MILESTONES) if (n >= t) p = t; return p; };
export const prestigeMult = (s) => 1 + 0.5 * (s.prestige || 0);
export const boostActive = (s, now = Date.now()) => now < (s.boostUntil || 0);
export const adBoostActive = (s, now = Date.now()) => now < (s.adBoostUntil || 0);
export const boostMult = (s, now = Date.now()) => (boostActive(s, now) ? BOOST_MULT : 1) * (adBoostActive(s, now) ? AD_BOOST_MULT : 1);

// ---------- generalens fordeler og Krigsskolen ----------
export const genPerk = (s) => (GENERAL_BY_ID[s.general] && GENERAL_BY_ID[s.general].perk) || {};
export const docLevel = (s, id) => (s.doc && s.doc[id]) || 0;
// Styrkemultiplikator for en enhetsklasse: general + Krigsskolen
export const classMult = (s, cls) => 1 + ((genPerk(s).cls && genPerk(s).cls[cls]) || 0) + 0.1 * docLevel(s, cls);
export const incomeMult = (s) => (genPerk(s).income || 1) * (1 + 0.05 * docLevel(s, 'econ'));
export function upgradeDoc(s, id) {
  const lvl = docLevel(s, id);
  if (!DOCTRINE_BY_ID[id] || lvl >= DOC_MAX) return false;
  const c = docCost(lvl);
  if ((s.medals || 0) < c) return false;
  s.medals -= c;
  s.doc[id] = lvl + 1;
  return true;
}
export const docSpent = (s) => DOCTRINES.reduce((a, x) => { let n = 0; for (let l = 0; l < docLevel(s, x.id); l++) n += docCost(l); return a + n; }, 0);
export const RESPEC_GEMS = 30;
export function respecDoc(s) {
  const spent = docSpent(s);
  if (!spent || (s.gems || 0) < RESPEC_GEMS) return false;
  s.gems -= RESPEC_GEMS;
  s.medals = (s.medals || 0) + spent;
  s.doc = {};
  return true;
}
export const genSwitchLeft = (s, now = Date.now()) => Math.max(0, (s.genSwitchAt || 0) + GENERAL_SWITCH_MS - now);
export function switchGeneral(s, id, now = Date.now()) {
  if (!GENERAL_BY_ID[id] || id === s.general || genSwitchLeft(s, now) > 0) return false;
  s.general = id;
  s.genSwitchAt = now;
  return true;
}

export const isAvailable = (s, item) => item.era <= s.era;
export const owned = (s, kind, id) => (kind === 'b' ? s.buildings[id] : s.units[id]) || 0;

export function buildingIncome(s, b, n = s.buildings[b.id] || 0) { return b.income * n * milestoneMult(n) * prestigeMult(s); }
export function unitPower(s, u, n = s.units[u.id] || 0) { return u.power * n * milestoneMult(n) * prestigeMult(s); }

export function regionIncome(s) {
  let sum = 0;
  for (const r of REGIONS) if (s.conquered[r.id]) sum += r.income;
  return sum * prestigeMult(s);
}
export function baseIncome(s) {
  let sum = regionIncome(s);
  for (const b of BUILDINGS) { const n = s.buildings[b.id]; if (n) sum += buildingIncome(s, b, n); }
  return sum;
}
// Midlertidig virkning fra en hendelse i basen: key = 'inc' (inntekt) eller 'tap' (per trykk)
export const evMult = (s, key, now = Date.now()) => { const b = s.ev && s.ev.buff && s.ev.buff[key]; return b && now < b.until ? b.m : 1; };
export const incomePerSec = (s, now = Date.now()) => baseIncome(s) * incomeMult(s) * boostMult(s, now) * puEffect(s, 'income', now) * evMult(s, 'inc', now);

export function armyPower(s) {
  let sum = 0;
  for (const u of UNITS) { const n = s.units[u.id]; if (n) sum += unitPower(s, u, n) * classMult(s, u.cls); }
  return sum;
}
export function armySize(s) { let n = 0; for (const k in s.units) n += s.units[k] || 0; return n; }

// ---------- kjøp ----------
const growthOf = (kind) => (kind === 'b' ? B_GROWTH : U_GROWTH);
const itemOf = (kind, id) => (kind === 'b' ? BUILDING_BY_ID[id] : UNIT_BY_ID[id]);
export function costFor(kind, id, have, qty) {
  const g = growthOf(kind), it = itemOf(kind, id);
  return (it.cost * Math.pow(g, have) * (Math.pow(g, qty) - 1)) / (g - 1);
}
export function maxAffordable(kind, id, have, money) {
  const g = growthOf(kind), it = itemOf(kind, id);
  const first = it.cost * Math.pow(g, have);
  if (money < first) return 0;
  return Math.max(0, Math.floor(Math.log((money * (g - 1)) / first + 1) / Math.log(g) + 1e-9));
}
// Hvor mange som kjøpes i valgt modus (1, 10, 100, 'max') og hva det koster
export function purchasePlan(s, kind, id, mode) {
  const have = owned(s, kind, id);
  let qty = mode === 'max' ? Math.max(1, maxAffordable(kind, id, have, s.money)) : mode;
  const cost = costFor(kind, id, have, qty);
  return { qty, cost, ok: s.money >= cost - 1e-9 };
}
export function buy(s, kind, id, mode = 1) {
  const it = itemOf(kind, id);
  if (!it || !isAvailable(s, it)) return 0;
  const p = purchasePlan(s, kind, id, mode);
  if (!p.ok) return 0;
  s.money -= p.cost;
  if (s.money < 0) s.money = 0;
  const bag = kind === 'b' ? s.buildings : s.units;
  bag[id] = (bag[id] || 0) + p.qty;
  return p.qty;
}

// ---------- trykk ----------
export function tapValue(s, now = Date.now(), level = s.tapLevel) {
  return ((1 + 2 * level) * prestigeMult(s) + incomePerSec(s, now) * TAP_PCT * level) * puEffect(s, 'tap', now) * (genPerk(s).tap || 1) * evMult(s, 'tap', now);
}
export const tapCost = (level) => 25 * Math.pow(5.2, level);
// Kombo: raske trykk etter hverandre bygger opp en multiplikator (faller bort når man slutter å trykke).
export const COMBO_TIERS = [{ n: 0, m: 1 }, { n: 10, m: 1.5 }, { n: 30, m: 2 }, { n: 60, m: 2.5 }, { n: 120, m: 3 }];
export const COMBO_GAP = 700; // ms uten trykk før komboen begynner å falle
export const comboTier = (combo) => { let i = 0; for (let k = 0; k < COMBO_TIERS.length; k++) if (combo >= COMBO_TIERS[k].n) i = k; return i; };
export const comboMult = (combo) => COMBO_TIERS[comboTier(combo)].m;
// Kritiske treff: 5 % sjanse for ×5 (+1 prosentpoeng per kombotrinn), og en sjelden megakritt på ×25
export const CRIT = { chance: 0.05, perTier: 0.01, mult: 5, megaChance: 0.003, megaMult: 25 };
export const critChance = (combo = 0) => CRIT.chance + CRIT.perTier * comboTier(combo);
export function doTap(s, now = Date.now(), combo = 0, rnd = Math.random) {
  const tier = comboTier(combo);
  const r = rnd();
  const crit = r < CRIT.megaChance ? 2 : r < CRIT.megaChance + critChance(combo) ? 1 : 0;
  const mult = COMBO_TIERS[tier].m * (crit === 2 ? CRIT.megaMult : crit === 1 ? CRIT.mult : 1);
  const v = tapValue(s, now) * mult;
  s.money += v; s.totalEarned += v; s.stats.taps++;
  if (crit) s.stats.crits = (s.stats.crits || 0) + 1;
  if (combo > (s.stats.bestCombo || 0)) s.stats.bestCombo = Math.floor(combo);
  return { v, crit, tier, mult };
}
export function buyTap(s) {
  if (s.tapLevel >= TAP_MAX) return false;
  const c = tapCost(s.tapLevel);
  if (s.money < c) return false;
  s.money -= c; s.tapLevel++;
  return true;
}

// ---------- tid ----------
export function tick(s, dt, now = Date.now()) {
  const inc = incomePerSec(s, now) * dt;
  s.money += inc; s.totalEarned += inc; s.stats.playTime += dt;
  // svekkede områder bygger seg opp igjen
  for (const id in s.damage) {
    const r = REGION_BY_ID[id];
    if (!r) { delete s.damage[id]; continue; }
    s.damage[id] -= r.def * DAMAGE_HEAL * (dt / 60);
    if (s.damage[id] <= 0) delete s.damage[id];
  }
  return inc;
}
export function offlineGain(s, now = Date.now()) {
  const secs = Math.max(0, Math.min(OFFLINE_CAP, (now - (s.lastSeen || now)) / 1000));
  const earned = baseIncome(s) * secs;
  return { secs, earned };
}

// ---------- kamp ----------
export function regionDef(s, r) {
  if (typeof r === 'string') r = REGION_BY_ID[r];
  return Math.max(r.def * DEF_FLOOR, r.def - (s.damage[r.id] || 0));
}
export const winChance = (P, D) => (P <= 0 ? 0 : Math.max(0, Math.min(1, (P / D - 0.5) / (SAFE_RATIO - 0.5))));
// Terreng: enheter av riktig klasse får bonus i området
export const terrainBonus = (r, cls) => (TERRAINS[r.terrain] && TERRAINS[r.terrain].bonus[cls]) || 0;
export function armyPowerVs(s, r) {
  let sum = 0;
  for (const u of UNITS) { const n = s.units[u.id]; if (n) sum += unitPower(s, u, n) * (classMult(s, u.cls) + terrainBonus(r, u.cls)); }
  return sum;
}
export const tacticId = (s, t) => (TACTICS[t] ? t : TACTICS[s.settings && s.settings.tactic] ? s.settings.tactic : 'normal');
// Styrken du angriper med: hær med klasse- og terrengbonus × taktikk × powerups
export function battlePower(s, r, tactic, now = Date.now()) {
  if (typeof r === 'string') r = REGION_BY_ID[r];
  return armyPowerVs(s, r) * TACTICS[tacticId(s, tactic)].power * puEffect(s, 'power', now);
}
export function battleDef(s, r, now = Date.now()) {
  if (typeof r === 'string') r = REGION_BY_ID[r];
  return regionDef(s, r) * puEffect(s, 'enemy', now) * (1 - 0.03 * docLevel(s, 'intel'));
}
// ---------- utplassering i tre korridorer ----------
export const LANES = 3;
export const COUNTER = 1.5, BAD = 0.5;
export const SQUAD_PARTS = 3; // hver enhetstype deles i opptil tre deler, så den kan spres på flere korridorer
const strHash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const seededRnd = (seed) => () => { seed = (seed + 0x6d2b79f5) >>> 0; let x = seed; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
const laneCache = {};
// Fiendens oppstilling i et område (fast for hvert område, så man kan planlegge)
export function enemyLanes(r) {
  if (typeof r === 'string') r = REGION_BY_ID[r];
  if (laneCache[r.id]) return laneCache[r.id];
  const rnd = seededRnd(strHash(r.id));
  const pool = (LANE_POOLS[r.enemy === 'ufo' ? 'ufo' : r.enemy === 'boss' ? 'boss' : r.terrain] || LANE_POOLS.plains).slice();
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const patterns = [[0.3, 0.4, 0.3], [0.2, 0.5, 0.3], [0.3, 0.5, 0.2], [0.35, 0.3, 0.35], [0.25, 0.3, 0.45], [0.45, 0.3, 0.25]];
  let shares = patterns[Math.floor(rnd() * patterns.length)];
  // de første byene i Ohio har færre korridorer, så opplæringen blir enkel
  const order = regionsOfEra(r.era).slice().sort((a, b) => a.def - b.def);
  const idx = order.indexOf(r);
  if (r.era === 0 && idx === 0) shares = [0, 1, 0];
  else if (r.era === 0 && idx <= 2) shares = rnd() < 0.5 ? [0.45, 0.55, 0] : [0, 0.55, 0.45];
  return (laneCache[r.id] = pool.map((type, i) => ({ type, share: shares[i] })));
}
export const laneMult = (type, cls) => { const T = LANE_TYPES[type]; return !T ? 1 : T.weak === cls ? COUNTER : T.bad === cls ? BAD : 1; };
// Hæren delt i tropper (opptil tre per enhetstype) som kan plasseres hver for seg
export function squadsOf(s, r) {
  if (typeof r === 'string') r = REGION_BY_ID[r];
  const types = [];
  for (const u of UNITS) { const n = s.units[u.id] || 0; if (n > 0) types.push({ u, n, p: unitPower(s, u, n) * (classMult(s, u.cls) + terrainBonus(r, u.cls)) }); }
  types.sort((a, b) => b.p - a.p);
  const out = [];
  for (const { u, n, p } of types) { // alle enhetstypene du har, sterkeste først
    const k = Math.min(SQUAD_PARTS, n);
    for (let i = 0; i < k; i++) {
      const cnt = Math.floor(n / k) + (i < n % k ? 1 : 0);
      out.push({ key: u.id + ':' + i, unit: u.id, cls: u.cls, count: cnt, power: (p * cnt) / n });
    }
  }
  return out;
}
// Hvordan en plan (tropp → korridor) står seg: styrke per korridor og total vinnersjanse.
// Du vinner kampen ved å vinne korridorer som til sammen har over halvparten av fiendens styrke.
export function laneEval(s, r, plan, tactic, now = Date.now()) {
  if (typeof r === 'string') r = REGION_BY_ID[r];
  const lanes = enemyLanes(r);
  const D = battleDef(s, r, now);
  const mult = TACTICS[tacticId(s, tactic)].power * puEffect(s, 'power', now);
  const squads = squadsOf(s, r);
  const P = [0, 0, 0];
  let placed = 0;
  for (const q of squads) {
    const l = plan ? plan[q.key] : undefined;
    if (!Number.isInteger(l) || l < 0 || l >= LANES || !lanes[l].share) continue;
    P[l] += q.power * laneMult(lanes[l].type, q.cls);
    placed++;
  }
  const out = lanes.map((ln, l) => {
    const Dl = D * ln.share, Pl = P[l] * mult;
    return { type: ln.type, share: ln.share, D: Dl, P: Pl, chance: ln.share ? winChance(Pl, Dl) : 0 };
  });
  let chance = 0;
  for (let mask = 0; mask < 8; mask++) {
    let pr = 1, won = 0;
    for (let l = 0; l < LANES; l++) {
      const c = out[l].share ? out[l].chance : 0;
      if (mask & (1 << l)) { pr *= c; won += out[l].share; } else pr *= 1 - c;
    }
    if (won > 0.5 + 1e-9) chance += pr;
  }
  return { lanes: out, chance: Math.min(1, chance), P: out.reduce((a, x) => a + x.P, 0), D, placed, squads };
}
// Enkel automatisk plan: fordeler styrken etter fiendens styrke, men tar ikke hensyn til svakheter
export function autoDeploy(s, r) {
  if (typeof r === 'string') r = REGION_BY_ID[r];
  const lanes = enemyLanes(r);
  const squads = squadsOf(s, r).slice().sort((a, b) => b.power - a.power);
  const total = squads.reduce((a, q) => a + q.power, 0);
  const got = [0, 0, 0];
  const plan = {};
  for (const q of squads) {
    let best = -1, gap = -Infinity;
    for (let l = 0; l < LANES; l++) {
      if (!lanes[l].share) continue;
      const g = lanes[l].share * total - got[l];
      if (g > gap) { gap = g; best = l; }
    }
    if (best < 0) break;
    plan[q.key] = best;
    got[best] += q.power;
  }
  return plan;
}
export function chanceFor(s, r, tactic, now = Date.now()) {
  if (typeof r === 'string') r = REGION_BY_ID[r];
  return laneEval(s, r, autoDeploy(s, r), tactic, now).chance;
}
// Hvilke korridorer som ble vunnet (stemmer med utfallet; brukes til visning og tap)
function laneOutcome(lanes, win, rnd) {
  const won = lanes.map((x) => x.share > 0 && rnd() < x.chance);
  const share = () => lanes.reduce((a, x, i) => a + (won[i] ? x.share : 0), 0);
  const order = lanes.map((x, i) => i).filter((i) => lanes[i].share > 0).sort((a, b) => lanes[b].chance - lanes[a].chance);
  if (win) { for (const i of order) { if (share() > 0.5 + 1e-9) break; won[i] = true; } }
  else { for (const i of order.slice().reverse()) { if (share() <= 0.5 + 1e-9) break; won[i] = false; } }
  return won;
}

// ---------- kamp i sanntid ----------
// Hæren din har liv (hp) som tappes jevnt av fiendens ild og med SP_HP for hvert spesialangrep du ikke stopper.
// Fienden har «need» i liv. Uten innsats gjør hæren 1,0 i skade før livet er tomt, og vinner med samme
// sannsynlighet som vinnersjansen. Trykk, kombo, artilleri, evner og blokkerte angrep gir ekstra skade og liv.
export const AUTO_MS = 8000;
export const SP_HP = 0.12;
export const BATTLE_K = 3;
export const WARN_MS = 1700;
export function prepareBattle(s, regionId, tactic, rnd = Math.random, now = Date.now(), plan = null) {
  const r = REGION_BY_ID[regionId];
  if (!r || r.era !== s.era || s.conquered[r.id]) return null;
  const tid = tacticId(s, tactic);
  const tc = TACTICS[tid];
  const perk = genPerk(s);
  const usePlan = plan && Object.keys(plan).length ? plan : autoDeploy(s, r);
  const ev = laneEval(s, r, usePlan, tid, now);
  if (!ev.placed) return null;
  const P = ev.P, D = ev.D;
  const chance = ev.chance;
  const occupied = ev.lanes.map((x, i) => i).filter((i) => ev.lanes[i].share > 0);
  const u = rnd();
  const need = chance >= 1 ? 0.55 + 0.4 * u : u < chance ? 0.55 + 0.45 * (u / chance) : 1 + (u - chance) * BATTLE_K;
  // fiendens spesialangrep: flere i senere kapitler, ingen i aller første kamp
  const n = s.stats.won === 0 && s.era === 0 ? 0 : r.era === 0 ? 1 : r.era <= 2 ? 2 : 3;
  const specials = [];
  for (let i = 0; i < n; i++) {
    const at = AUTO_MS * ((i + 0.6) / (n + 0.4)) + (rnd() - 0.5) * 600 + (tc.delay || 0) * (1 - i / Math.max(1, n));
    specials.push({ at: Math.min(AUTO_MS - 300, at), type: rnd() < 0.5 ? 'barrage' : 'charge', lane: occupied[Math.floor(rnd() * occupied.length)] });
  }
  const artyMult = puEffect(s, 'artillery', now) * (1 + 0.15 * docLevel(s, 'arty'));
  const artyCd = 2600 * (tc.artyCd || 1) * (perk.artyCd || 1) * (1 - 0.06 * docLevel(s, 'arty'));
  const warnMs = WARN_MS * (perk.warn || 1) * (1 + 0.15 * docLevel(s, 'intel'));
  return {
    r, tactic: tid, P, D, chance, need, specials,
    drain: (1 - SP_HP * n) / AUTO_MS, autoRate: 1 / AUTO_MS,
    airstrike: puEffect(s, 'airstrike', now) > 0, artyMult, artyCd, warnMs,
    early: tc.early || 0, ability: perk.ability || null,
    lanes: ev.lanes, plan: usePlan, squads: ev.squads,
  };
}
// Spiller resten av kampen automatisk fra en gitt stilling (brukes av «hopp over» og autokamp)
export function finishAuto(prep, st = {}) {
  let t = st.t || 0, score = st.score || 0, hp = st.hp ?? 1, k = st.nextSp || 0;
  const skip = st.cancelled || {};
  const dt = 25;
  while (score < prep.need - 1e-9 && hp > 1e-9) {
    t += dt;
    score += prep.autoRate * dt;
    hp -= prep.drain * dt;
    while (k < prep.specials.length && prep.specials[k].at <= t) { if (!skip[k]) hp -= SP_HP; k++; }
  }
  const win = score >= prep.need - 1e-9;
  return { win, score: win ? Math.max(score, prep.need) : score, hp: Math.max(0, hp), t };
}
export const starsFor = (hp) => (hp >= 0.5 ? 3 : hp >= 0.25 ? 2 : 1);
const SPOILS_SECS = [0, 45, 70, 100];
const DROP = [0, 0.05, 0.15, 0.35];
// perf = { score, hp, retreat } – hvordan kampen gikk
export function resolveBattle(s, prep, perf = {}, rnd = Math.random, now = Date.now()) {
  const r = prep && prep.r;
  if (!r || r.era !== s.era || s.conquered[r.id]) return null;
  const tc = TACTICS[prep.tactic] || TACTICS.normal;
  const auto = !Number.isFinite(perf.score) ? finishAuto(prep) : null;
  const score = auto ? auto.score : perf.score;
  const hp = Math.max(0, Math.min(1, auto ? auto.hp : Number.isFinite(perf.hp) ? perf.hp : 0));
  const retreat = !!perf.retreat;
  const win = !retreat && (prep.chance >= 1 || score >= prep.need - 1e-9);
  const P = prep.P, D = prep.D;
  const logi = 1 - 0.08 * docLevel(s, 'log');
  let frac = win ? Math.min(0.4, 0.2 * Math.pow(D / Math.max(P, 1e-9), 2)) * (0.35 + 0.65 * (1 - hp)) : 0.35 * (retreat ? 0.35 : 1);
  frac = Math.min(0.85, frac * tc.loss * puEffect(s, 'losses', now) * logi);
  // bare troppene du sendte kan dø – flest i korridorene du tapte
  const laneWon = laneOutcome(prep.lanes, win, rnd);
  const lost = {};
  let total = 0;
  for (const q of prep.squads) {
    const l = prep.plan[q.key];
    if (!Number.isInteger(l) || l < 0 || !prep.lanes[l] || !prep.lanes[l].share) continue;
    const have = s.units[q.unit] || 0;
    if (!have) continue;
    const f = Math.min(0.9, frac * (laneWon[l] ? 0.7 : 1.4));
    const k = Math.min(have, q.count, Math.floor(q.count * f + rnd()));
    if (k > 0) { s.units[q.unit] = have - k; lost[q.unit] = (lost[q.unit] || 0) + k; total += k; }
  }
  // feltsykehus: noen av de falne kommer tilbake
  const heal = puEffect(s, 'heal', now);
  let healed = 0;
  if (heal > 0) {
    for (const [id, k] of Object.entries(lost)) {
      const h = Math.floor(k * heal);
      if (h > 0) { s.units[id] = (s.units[id] || 0) + h; lost[id] = k - h; healed += h; if (!lost[id]) delete lost[id]; }
    }
  }
  const lostTotal = total - healed;
  let dealt = 0, gems = 0, stars = 0, medals = 0, spoils = 0, drop = null;
  if (win) {
    stars = starsFor(hp);
    s.conquered[r.id] = true;
    delete s.damage[r.id];
    s.stars[r.id] = Math.max(s.stars[r.id] || 0, stars);
    s.stats.won++;
    if (stars === 3) s.stats.stars3 = (s.stats.stars3 || 0) + 1;
    gems = Math.round(gemsForRegion(r) * puEffect(s, 'gems', now) * (stars === 3 ? 1.5 : 1));
    medals = stars;
    // krigsbytte: penger etter hvor godt det gikk
    spoils = baseIncome(s) * incomeMult(s) * SPOILS_SECS[stars] * (genPerk(s).spoils || 1) * (1 + 0.25 * docLevel(s, 'loot'));
    s.money += spoils; s.totalEarned += spoils;
    if (rnd() < DROP[stars] + 0.04 * docLevel(s, 'loot')) drop = grantRandom(s, rnd);
  } else {
    const rd = regionDef(s, r);
    const part = Math.max(0.2, Math.min(1, score / prep.need)); // jo nærmere seier, jo mer svekkes fienden
    dealt = Math.max(0, Math.min(rd - r.def * DEF_FLOOR, (P / tc.power) * 0.5 * part * tc.weaken));
    s.damage[r.id] = (s.damage[r.id] || 0) + dealt;
    s.stats.lost++;
    if (retreat) s.stats.retreats = (s.stats.retreats || 0) + 1;
  }
  s.stats.unitsLost += lostTotal;
  const eraDone = win && eraComplete(s);
  if (eraDone) { gems += gemsForEra(s.era); medals += 5; }
  s.gems = (s.gems || 0) + gems;
  s.medals = (s.medals || 0) + medals;
  s.medalsEarned = (s.medalsEarned || 0) + medals;
  return { win, retreat, chance: prep.chance, P, D, lost, lostTotal, healed, dealt, eraDone, region: r, powerAfter: armyPower(s), gems, tactic: prep.tactic, score, need: prep.need, hp, stars, medals, spoils, drop, laneWon };
}
// Automatisk kamp (simulatoren og tester): samme sjanse som vinnersjansen
export function attack(s, regionId, rnd = Math.random, tactic) {
  const prep = prepareBattle(s, regionId, tactic, rnd);
  if (!prep) return null;
  return resolveBattle(s, prep, {}, rnd);
}

export const eraComplete = (s) => regionsOfEra(s.era).every((r) => s.conquered[r.id]);
export const eraProgress = (s, e = s.era) => { const rs = regionsOfEra(e); return { done: rs.filter((r) => s.conquered[r.id]).length, total: rs.length }; };
export function advanceEra(s) {
  if (!eraComplete(s)) return false;
  if (s.era >= ERAS.length - 1) { s.finished = true; return false; }
  s.era++;
  return true;
}
// Neste mål: området der hæren din står sterkest (terrengbonus teller med)
export function nextTarget(s) {
  let best = null, bestQ = -1;
  for (const r of regionsOfEra(s.era)) {
    if (s.conquered[r.id]) continue;
    const q = (armyPowerVs(s, r) + 1e-9) / regionDef(s, r);
    if (q > bestQ + 1e-12 || (Math.abs(q - bestQ) <= 1e-12 && regionDef(s, r) < regionDef(s, best))) { best = r; bestQ = q; }
  }
  return best;
}

// ---------- prestisje ----------
// Når universet er erobret kan man starte på nytt i Ohio med en prestisjestjerne og bonuser.
export const PRESTIGE_GEMS = 300;
export const PRESTIGE_BONUS = 0.5; // +50 % inntekt og hærstyrke per stjerne (se prestigeMult)
export function prestigeRewards(level) {
  return { level, mult: 1 + PRESTIGE_BONUS * level, gems: PRESTIGE_GEMS, crate: 'cosmic', skins: PRESTIGE_SKINS[level] || [] };
}
export const canPrestige = (s) => !!s.finished;
export function prestigeReset(s) {
  const n = newState(s.name);
  n.prestige = (s.prestige || 0) + 1;
  n.stats = { ...s.stats, wins: (s.stats.wins || 0) + 1 };
  n.settings = { ...s.settings };
  n.tut = 99;
  n.gems = s.gems; n.skins = s.skins; n.crates = s.crates; n.adFree = s.adFree; n.ads = s.ads; n.purchases = s.purchases;
  n.social = s.social; n.flags = s.flags; n.general = s.general; n.pu = s.pu; n.genSwitchAt = s.genSwitchAt || 0;
  n.daily = { ...s.daily }; // den daglige bonusrekka fortsetter
  n.ev = { ...newEvState(), recent: (s.ev && s.ev.recent) || [], n: (s.ev && s.ev.n) || 0 }; // samme hendelse kommer ikke rett igjen
  n.settings.tactic = s.settings.tactic || 'normal';
  n.stats.lifetimeBase = (s.stats.lifetimeBase || 0) + (s.totalEarned || 0);
  const r = prestigeRewards(n.prestige);
  n.gems = (n.gems || 0) + r.gems;
  addCrate(n, r.crate);
  for (const id of r.skins) n.skins.owned[id] = Date.now();
  return n;
}

// Gir tilbake enheter (belønning for å se reklame etter et tap)
export function restoreUnits(s, lost) {
  let n = 0;
  for (const [id, k] of Object.entries(lost || {})) { s.units[id] = (s.units[id] || 0) + k; n += k; }
  s.stats.unitsLost = Math.max(0, s.stats.unitsLost - n);
  return n;
}

// Til leaderboardet: antall erobrede områder totalt (også fra tidligere runder) og alt du har tjent
export function lifetimeEarned(s) { return (s.stats.lifetimeBase || 0) + (s.totalEarned || 0); }
export function scoreEntry(s) {
  const score = Math.max(s.stats.won || 0, (s.social && s.social.best) || 0);
  if (s.social) s.social.best = score;
  const lifetime = lifetimeEarned(s);
  const flag = s.skins ? equippedSkin(s, 'flag').id : 'flag_ohio';
  return { name: String(s.name || '').slice(0, 22), score, lifetime, era: s.era, prestige: s.prestige || 0, flag, rank: score + Math.min(0.999, Math.log10(lifetime + 1) / 100) };
}
