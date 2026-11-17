// Spillmotor – ren logikk uten DOM, slik at den kan testes og simuleres i Node.
import { BUILDINGS, UNITS, REGIONS, ERAS, REGION_BY_ID, BUILDING_BY_ID, UNIT_BY_ID, regionsOfEra } from './data.js';
import { newCosmetics, restoreCosmetics } from './cosmetics.js';

export const SAVE_VERSION = 1;
export const B_GROWTH = 1.15; // prisøkning per bygning
export const U_GROWTH = 1.12; // prisøkning per enhet
export const MILESTONES = [10, 25, 50, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 900, 1000];
export const OFFLINE_CAP = 8 * 3600; // sekunder
export const TAP_MAX = 25;
export const TAP_PCT = 0.012; // andel av inntekt per trykk per nivå
export const BOOST_MULT = 3;
export const BOOST_SECS = 30;
export const SAFE_RATIO = 1.5; // hærstyrke/forsvar for 100 % vinnersjanse
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
    tapLevel: 0,
    boostUntil: 0,
    lastSeen: now,
    created: now,
    stats: { taps: 0, won: 0, lost: 0, unitsLost: 0, crates: 0, playTime: 0, wins: 0 },
    prestige: 0,
    settings: { sound: true, vibrate: true, lang: 'nb', buyMode: 1 },
    tut: 0,
    seenIntro: -1,
    finished: false,
    gems: START_GEMS,
    skins: newCosmetics(),
    crates: { opened: 0, pity: 0 },
    adFree: false,
    adBoostUntil: 0,
    ads: { lastInterstitial: 0, battlesSince: 0, freeCrateAt: 0, gemDay: '', gemCount: 0, watched: 0 },
    purchases: [],
  };
}

// Slår sammen et lagret spill med standardverdier (tåler eldre lagringer)
export function restore(data) {
  const base = newState();
  if (!data || typeof data !== 'object') return base;
  const s = { ...base, ...data };
  s.stats = { ...base.stats, ...(data.stats || {}) };
  s.settings = { ...base.settings, ...(data.settings || {}) };
  for (const k of ['buildings', 'units', 'conquered', 'damage']) s[k] = { ...(data[k] || {}) };
  s.skins = restoreCosmetics(data.skins);
  s.crates = { ...base.crates, ...(data.crates || {}) };
  s.ads = { ...base.ads, ...(data.ads || {}) };
  s.purchases = Array.isArray(data.purchases) ? data.purchases.slice(-50) : [];
  s.adFree = !!data.adFree;
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
export const incomePerSec = (s, now = Date.now()) => baseIncome(s) * boostMult(s, now);

export function armyPower(s) {
  let sum = 0;
  for (const u of UNITS) { const n = s.units[u.id]; if (n) sum += unitPower(s, u, n); }
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
  return (1 + 2 * level) * prestigeMult(s) + incomePerSec(s, now) * TAP_PCT * level;
}
export const tapCost = (level) => 25 * Math.pow(5.2, level);
export function doTap(s, now = Date.now()) {
  const v = tapValue(s, now);
  s.money += v; s.totalEarned += v; s.stats.taps++;
  return v;
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
  return Math.max(r.def * 0.25, r.def - (s.damage[r.id] || 0));
}
export const winChance = (P, D) => (P <= 0 ? 0 : Math.max(0, Math.min(1, (P / D - 0.5) / (SAFE_RATIO - 0.5))));
export const chanceFor = (s, r) => winChance(armyPower(s), regionDef(s, r));

function applyCasualties(s, frac, rnd) {
  const lost = {};
  let total = 0;
  if (frac <= 0) return { lost, total };
  for (const u of UNITS) {
    const n = s.units[u.id] || 0;
    if (!n) continue;
    const k = Math.min(n, Math.floor(n * frac + rnd()));
    if (k > 0) { s.units[u.id] = n - k; lost[u.id] = k; total += k; }
  }
  return { lost, total };
}

export function attack(s, regionId, rnd = Math.random) {
  const r = REGION_BY_ID[regionId];
  if (!r || r.era !== s.era || s.conquered[r.id]) return null;
  const P = armyPower(s);
  const D = regionDef(s, r);
  const chance = winChance(P, D);
  const win = chance >= 1 || (chance > 0 && rnd() < chance);
  const frac = win ? Math.min(0.4, 0.2 * Math.pow(D / P, 2)) : 0.3;
  const { lost, total } = applyCasualties(s, frac, rnd);
  let dealt = 0;
  let gems = 0;
  if (win) {
    s.conquered[r.id] = true;
    delete s.damage[r.id];
    s.stats.won++;
    gems = gemsForRegion(r);
  } else {
    dealt = Math.min(D - r.def * 0.25, P * 0.5);
    s.damage[r.id] = (s.damage[r.id] || 0) + Math.max(0, dealt);
    s.stats.lost++;
  }
  s.stats.unitsLost += total;
  const eraDone = win && eraComplete(s);
  if (eraDone) gems += gemsForEra(s.era);
  s.gems = (s.gems || 0) + gems;
  return { win, chance, P, D, lost, lostTotal: total, dealt, eraDone, region: r, powerAfter: armyPower(s), gems };
}

export const eraComplete = (s) => regionsOfEra(s.era).every((r) => s.conquered[r.id]);
export const eraProgress = (s, e = s.era) => { const rs = regionsOfEra(e); return { done: rs.filter((r) => s.conquered[r.id]).length, total: rs.length }; };
export function advanceEra(s) {
  if (!eraComplete(s)) return false;
  if (s.era >= ERAS.length - 1) { s.finished = true; return false; }
  s.era++;
  return true;
}
export function nextTarget(s) {
  let best = null;
  for (const r of regionsOfEra(s.era)) if (!s.conquered[r.id] && (!best || regionDef(s, r) < regionDef(s, best))) best = r;
  return best;
}

// Ny runde med permanent bonus etter at universet er erobret
export function prestigeReset(s) {
  const n = newState(s.name);
  n.prestige = (s.prestige || 0) + 1;
  n.stats = { ...s.stats, wins: (s.stats.wins || 0) + 1 };
  n.settings = { ...s.settings };
  n.tut = 99;
  n.gems = s.gems; n.skins = s.skins; n.crates = s.crates; n.adFree = s.adFree; n.ads = s.ads; n.purchases = s.purchases;
  return n;
}

// Gir tilbake enheter (belønning for å se reklame etter et tap)
export function restoreUnits(s, lost) {
  let n = 0;
  for (const [id, k] of Object.entries(lost || {})) { s.units[id] = (s.units[id] || 0) + k; n += k; }
  s.stats.unitsLost = Math.max(0, s.stats.unitsLost - n);
  return n;
}
