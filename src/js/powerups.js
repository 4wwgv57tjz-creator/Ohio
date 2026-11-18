// Powerups til hovedkvarteret – ren logikk uten DOM.
// Man kjøper en tilfeldig powerup og setter den inn i en av plassene i hovedkvarteret.
// Der virker den en stund (ekte tid). Like effekter stables ikke: den sterkeste teller.

export const SLOTS = 3;
export const BOX_SECS = 180; // en powerup-boks koster 3 minutter med inntekt
export const GEM_BOX = 40; // superboks for edelstener (minst sjelden)

export const PU_RARITIES = {
  common: { name: { nb: 'Vanlig', en: 'Common' }, color: '#9aa3b5' },
  rare: { name: { nb: 'Sjelden', en: 'Rare' }, color: '#3d8bff' },
  epic: { name: { nb: 'Episk', en: 'Epic' }, color: '#a35cff' },
  legendary: { name: { nb: 'Legendarisk', en: 'Legendary' }, color: '#ffa600' },
};
export const BOX_ODDS = { common: 55, rare: 30, epic: 12, legendary: 3 };
export const GEM_BOX_ODDS = { common: 0, rare: 60, epic: 32, legendary: 8 };

const P = (id, rarity, mins, nb, en, dnb, den, fx) => ({ id, rarity, mins, name: { nb, en }, desc: { nb: dnb, en: den }, ...fx });
export const POWERUPS = [
  P('printer', 'common', 10, 'Pengetrykkeri', 'Money Printer', '+50 % inntekt', '+50% income', { income: 1.5 }),
  P('button', 'common', 10, 'Turboknapp', 'Turbo Button', 'Hvert trykk gir 3 ganger så mye', 'Every tap gives 3× as much', { tap: 3 }),
  P('magnet', 'common', 10, 'Kassemagnet', 'Crate Magnet', 'Forsyningskasser kommer 3 ganger så ofte', 'Supply crates arrive 3× as often', { crates: 3 }),
  P('cannon', 'common', 10, 'Kanontårn', 'Cannon Tower', 'Artilleriet treffer dobbelt så hardt i kamp', 'Artillery hits twice as hard in battle', { artillery: 2 }),
  P('radar', 'rare', 10, 'Radar', 'Radar', '+20 % hærstyrke i kamp', '+20% army power in battle', { power: 1.2 }),
  P('shield', 'rare', 10, 'Skjoldgenerator', 'Shield Generator', 'Halvparten så store tap i kamp', 'Half the losses in battle', { losses: 0.5 }),
  P('hospital', 'rare', 10, 'Feltsykehus', 'Field Hospital', 'Halvparten av de falne kommer tilbake etter kampen', 'Half of the fallen come back after battle', { heal: 0.5 }),
  P('drill', 'rare', 10, 'Diamantbor', 'Diamond Drill', 'Dobbelt så mange edelstener fra seire', 'Double gems from victories', { gems: 2 }),
  P('rocket', 'epic', 10, 'Rakettutskyter', 'Rocket Launcher', 'Gir deg et luftangrep i hver kamp', 'Gives you an air strike in every battle', { airstrike: 1 }),
  P('satellite', 'epic', 10, 'Spionsatellitt', 'Spy Satellite', 'Fiendene er 15 % svakere', 'Enemies are 15% weaker', { enemy: 0.85 }),
  P('statue', 'epic', 10, 'Gullstatue', 'Golden Statue', 'Dobbel inntekt', 'Double income', { income: 2 }),
  P('ufo', 'legendary', 15, 'Fanget UFO', 'Captured UFO', 'Dobbel inntekt og +25 % hærstyrke', 'Double income and +25% army power', { income: 2, power: 1.25 }),
];
export const PU_BY_ID = Object.fromEntries(POWERUPS.map((p) => [p.id, p]));

export function newPowerups() {
  return { inv: {}, slots: Array(SLOTS).fill(null), bought: 0 };
}
export function restorePowerups(d) {
  const base = newPowerups();
  if (!d || typeof d !== 'object') return base;
  const inv = {};
  for (const [id, n] of Object.entries(d.inv || {})) if (PU_BY_ID[id] && Number.isFinite(n) && n > 0) inv[id] = Math.min(99, Math.floor(n));
  const slots = base.slots.map((_, i) => {
    const x = Array.isArray(d.slots) ? d.slots[i] : null;
    return x && PU_BY_ID[x.id] && Number.isFinite(x.until) ? { id: x.id, until: x.until, total: x.total || PU_BY_ID[x.id].mins * 60000 } : null;
  });
  return { inv, slots, bought: Number.isFinite(d.bought) ? d.bought : 0 };
}

const pu = (s) => s.pu || (s.pu = newPowerups());
// Aktive powerups (de som står i hovedkvarteret og ikke har gått ut)
export function activePowerups(s, now = Date.now()) {
  return pu(s).slots.filter((x) => x && x.until > now).map((x) => PU_BY_ID[x.id]).filter(Boolean);
}
export const isActive = (s, id, now = Date.now()) => pu(s).slots.some((x) => x && x.id === id && x.until > now);
// Sterkeste aktive verdi for en effekt (max for bonuser, min for reduksjoner)
export function puEffect(s, key, now = Date.now()) {
  let v = key === 'enemy' || key === 'losses' ? 1 : key === 'heal' || key === 'airstrike' ? 0 : 1;
  for (const p of activePowerups(s, now)) {
    if (p[key] == null) continue;
    v = key === 'enemy' || key === 'losses' ? Math.min(v, p[key]) : Math.max(v, p[key]);
  }
  return v;
}
// Fjerner powerups som har gått ut og returnerer dem
export function expirePowerups(s, now = Date.now()) {
  const out = [];
  const st = pu(s);
  st.slots = st.slots.map((x) => { if (x && x.until <= now) { out.push(x.id); return null; } return x; });
  return out;
}

export function boxPrice(baseIncome) { return Math.max(25, Math.round(baseIncome * BOX_SECS)); }
function roll(odds, rnd) {
  let x = rnd() * 100;
  let rarity = 'common';
  for (const [r, w] of Object.entries(odds)) { x -= w; if (x < 0) { rarity = r; break; } }
  const pool = POWERUPS.filter((p) => p.rarity === rarity);
  return pool[Math.floor(rnd() * pool.length)] || POWERUPS[0];
}
// Kjøper en tilfeldig powerup: kind 'money' (pris i penger) eller 'gems'
export function buyBox(s, kind, price, rnd = Math.random) {
  const st = pu(s);
  if (kind === 'gems') {
    if ((s.gems || 0) < GEM_BOX) return null;
    s.gems -= GEM_BOX;
  } else {
    if (s.money < price) return null;
    s.money -= price;
  }
  const p = roll(kind === 'gems' ? GEM_BOX_ODDS : BOX_ODDS, rnd);
  st.inv[p.id] = (st.inv[p.id] || 0) + 1;
  st.bought = (st.bought || 0) + 1;
  return p;
}
export const freeSlot = (s, now = Date.now()) => pu(s).slots.findIndex((x) => !x || x.until <= now);
export const invCount = (s) => Object.values(pu(s).inv).reduce((a, n) => a + n, 0);
// Setter en powerup fra lageret inn i hovedkvarteret
export function install(s, id, now = Date.now(), slot = freeSlot(s, now)) {
  const st = pu(s);
  const p = PU_BY_ID[id];
  if (!p || !(st.inv[id] > 0) || slot < 0 || slot >= SLOTS) return false;
  if (st.slots[slot] && st.slots[slot].until > now) return false;
  if (isActive(s, id, now)) return false; // samme powerup kan ikke stå to steder
  st.inv[id]--;
  if (!st.inv[id]) delete st.inv[id];
  const total = p.mins * 60000;
  st.slots[slot] = { id, until: now + total, total };
  return true;
}
