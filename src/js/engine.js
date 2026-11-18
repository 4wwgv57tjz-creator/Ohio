// Spillmotor – ren logikk uten DOM, slik at den kan testes og simuleres i Node.
import { BUILDINGS, UNITS, REGIONS, ERAS, REGION_BY_ID, BUILDING_BY_ID, UNIT_BY_ID, regionsOfEra, TERRAINS, TACTICS } from './data.js';
import { newPowerups, restorePowerups, puEffect } from './powerups.js';
import { newCosmetics, restoreCosmetics, EMPTY_INV, addCrate, PRESTIGE_SKINS, equippedSkin, GENERAL_BY_ID, DEFAULT_GENERAL } from './cosmetics.js';

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
  s.crates.inv = { ...EMPTY_INV, ...((data.crates && data.crates.inv) || {}) };
  s.social = { ...base.social, ...(data.social || {}) };
  s.social.friends = Array.isArray(s.social.friends) ? s.social.friends.slice(0, 200) : [];
  s.flags = { ...(data.flags || {}) };
  s.ads = { ...base.ads, ...(data.ads || {}) };
  s.purchases = Array.isArray(data.purchases) ? data.purchases.slice(-50) : [];
  s.adFree = !!data.adFree;
  s.pu = restorePowerups(data.pu);
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
export const incomePerSec = (s, now = Date.now()) => baseIncome(s) * boostMult(s, now) * puEffect(s, 'income', now);

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
  return ((1 + 2 * level) * prestigeMult(s) + incomePerSec(s, now) * TAP_PCT * level) * puEffect(s, 'tap', now);
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
// Terreng: enheter av riktig klasse får bonus i området
export const terrainBonus = (r, cls) => (TERRAINS[r.terrain] && TERRAINS[r.terrain].bonus[cls]) || 0;
export function armyPowerVs(s, r) {
  let sum = 0;
  for (const u of UNITS) { const n = s.units[u.id]; if (n) sum += unitPower(s, u, n) * (1 + terrainBonus(r, u.cls)); }
  return sum;
}
export const tacticId = (s, t) => (TACTICS[t] ? t : TACTICS[s.settings && s.settings.tactic] ? s.settings.tactic : 'normal');
// Styrken du angriper med: hær med terrengbonus × taktikk × powerups
export function battlePower(s, r, tactic, now = Date.now()) {
  if (typeof r === 'string') r = REGION_BY_ID[r];
  return armyPowerVs(s, r) * TACTICS[tacticId(s, tactic)].power * puEffect(s, 'power', now);
}
export function battleDef(s, r, now = Date.now()) {
  if (typeof r === 'string') r = REGION_BY_ID[r];
  return regionDef(s, r) * puEffect(s, 'enemy', now);
}
export function chanceFor(s, r, tactic, now = Date.now()) {
  if (typeof r === 'string') r = REGION_BY_ID[r];
  return winChance(battlePower(s, r, tactic, now), battleDef(s, r, now));
}

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

// Interaktive kamper: autospill gir 1,0 i skade i løpet av kampen. need er hvor mye som trengs for å vinne.
// Uten innsats vinner du med samme sannsynlighet som vinnersjansen; trykk og evner gir ekstra skade.
export const BATTLE_K = 2.2;
export function prepareBattle(s, regionId, tactic, rnd = Math.random, now = Date.now()) {
  const r = REGION_BY_ID[regionId];
  if (!r || r.era !== s.era || s.conquered[r.id]) return null;
  const tid = tacticId(s, tactic);
  const P = battlePower(s, r, tid, now), D = battleDef(s, r, now);
  const chance = winChance(P, D);
  const u = rnd();
  const need = chance >= 1 ? 0.55 + 0.4 * u : u < chance ? 0.55 + 0.45 * (u / chance) : 1 + (u - chance) * BATTLE_K;
  return { r, tactic: tid, P, D, chance, need, airstrike: puEffect(s, 'airstrike', now) > 0, artillery: puEffect(s, 'artillery', now) };
}
// perf = { score: skade levert (1,0 = autospill hele kampen), time: andel av kamptiden som ble brukt }
export function resolveBattle(s, prep, perf = {}, rnd = Math.random, now = Date.now()) {
  const r = prep && prep.r;
  if (!r || r.era !== s.era || s.conquered[r.id]) return null;
  const tc = TACTICS[prep.tactic] || TACTICS.normal;
  const score = Number.isFinite(perf.score) ? perf.score : 1;
  const win = prep.chance >= 1 || score >= prep.need - 1e-9;
  const time = Math.max(0, Math.min(1, Number.isFinite(perf.time) ? perf.time : win ? Math.min(1, prep.need) : 1));
  const P = prep.P, D = prep.D;
  let frac = win ? Math.min(0.4, 0.2 * Math.pow(D / Math.max(P, 1e-9), 2)) * (0.45 + 0.55 * time) : 0.3;
  frac = Math.min(0.85, frac * tc.loss * puEffect(s, 'losses', now));
  const { lost, total } = applyCasualties(s, frac, rnd);
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
  let dealt = 0;
  let gems = 0;
  if (win) {
    s.conquered[r.id] = true;
    delete s.damage[r.id];
    s.stats.won++;
    gems = Math.round(gemsForRegion(r) * puEffect(s, 'gems', now));
  } else {
    const rd = regionDef(s, r);
    const part = Math.max(0.2, Math.min(1, score / prep.need)); // jo nærmere seier, jo mer svekkes fienden
    dealt = Math.max(0, Math.min(rd - r.def * 0.25, (P / (TACTICS[prep.tactic] || TACTICS.normal).power) * 0.5 * part * tc.weaken));
    s.damage[r.id] = (s.damage[r.id] || 0) + dealt;
    s.stats.lost++;
  }
  s.stats.unitsLost += lostTotal;
  const eraDone = win && eraComplete(s);
  if (eraDone) gems += gemsForEra(s.era);
  s.gems = (s.gems || 0) + gems;
  return { win, chance: prep.chance, P, D, lost, lostTotal, healed, dealt, eraDone, region: r, powerAfter: armyPower(s), gems, tactic: prep.tactic, score, need: prep.need };
}
// Automatisk kamp (simulatoren og «hopp over»): samme sjanse som før
export function attack(s, regionId, rnd = Math.random, tactic) {
  const prep = prepareBattle(s, regionId, tactic, rnd);
  if (!prep) return null;
  return resolveBattle(s, prep, { score: 1, time: Math.min(1, prep.need) }, rnd);
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
  n.social = s.social; n.flags = s.flags; n.general = s.general; n.pu = s.pu;
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
