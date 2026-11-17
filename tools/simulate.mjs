// Balanserer spillet: simulerer en fornuftig spiller og kalibrerer forsvaret til hver region
// slik at hver erobring tar omtrent ønsket tid. Skriver src/js/balance.js.
// Kjør: npm run sim   (TAPS=1.5 trykk per sekund som standard, CHECK=1 for kun rapport)
import { writeFileSync } from 'node:fs';
import * as E from '../src/js/engine.js';
import { BUILDINGS, UNITS, REGIONS, ERAS, regionsOfEra } from '../src/js/data.js';

const TAPS = Number(process.env.TAPS ?? 1.5);
const CHECK = !!process.env.CHECK;
const ATTACK_RATIO = 1.45;
const INCOME_FRAC = 0.25;
// Epoke-skalering av nye bygninger/enheter (relativt til inntekten når epoken starter)
const KB = [30, 380];            // pris = inntekt * K (sekunder med inntekt)
const PB = (e, j) => (j ? 72 : 58) + e * (j ? 11 : 8); // tilbakebetalingstid i sekunder
const KU = { 2: [16, 260], 3: [12, 130, 1500] };
const RATIO = (k) => (1 / 12) * Math.pow(1.17, k); // styrke per $ for enhet nr. k
// Ønsket tid (sekunder) fra forrige erobring, per epoke og region (i rekkefølgen i data.js)
const TARGETS = {
  0: [30, 45, 60, 72, 85, 100, 115, 135],
  1: [60, 70, 78, 85, 92, 100, 110, 120, 130, 150],
  2: [80, 95, 105, 115, 125, 140, 165],
  3: [85, 95, 105, 115, 125, 135, 150, 170],
  4: [90, 95, 100, 105, 110, 118, 125, 132, 140, 148, 158, 190],
  5: [105, 115, 125, 135, 145, 155, 170, 200],
  6: [115, 130, 145, 160, 175, 195, 260],
};
const NOW = 0; // ingen boost i simuleringen

const nice = (x) => { if (x < 10) return Math.round(x * 10) / 10; const p = Math.pow(10, Math.floor(Math.log10(x)) - 1); return Math.round(x / p) * p; };

function bestUnit(s, need) {
  // velg enheten som gir nok styrke billigst (små behov -> billige enheter, store -> effektive)
  let best = null;
  for (const u of UNITS) {
    if (!E.isAvailable(s, u)) continue;
    const n = s.units[u.id] || 0;
    const c = E.costFor('u', u.id, n, 1);
    const dp = E.unitPower(s, u, n + 1) - E.unitPower(s, u, n);
    const k = Math.min(3000, Math.max(1, Math.ceil(need / dp)));
    const total = E.costFor('u', u.id, n, k);
    if (!best || total < best.total) best = { u, c, dp, total };
  }
  return best;
}
function bestInvest(s) {
  let best = null;
  for (const b of BUILDINGS) {
    if (!E.isAvailable(s, b)) continue;
    const n = s.buildings[b.id] || 0;
    const c = E.costFor('b', b.id, n, 1);
    const di = E.buildingIncome(s, b, n + 1) - E.buildingIncome(s, b, n);
    if (!best || di / c > best.r) best = { b, c, di, r: di / c };
  }
  if (s.tapLevel < E.TAP_MAX && TAPS > 0) {
    const c = E.tapCost(s.tapLevel);
    const di = TAPS * (E.tapValue(s, NOW, s.tapLevel + 1) - E.tapValue(s, NOW));
    if (!best || di / c > best.r) best = { tap: true, c, di, r: di / c };
  }
  return best;
}

// Ett sekund med spilling. Returnerer true når hæren er sterk nok til å angripe D.
function step(s, D) {
  E.tick(s, 1, NOW);
  const tv = E.tapValue(s, NOW) * TAPS;
  s.money += tv; s.totalEarned += tv;
  for (let guard = 0; guard < 400; guard++) {
    const P = E.armyPower(s);
    const need = ATTACK_RATIO * D - P;
    if (need <= 0) return true;
    const inc = E.incomePerSec(s, NOW) + TAPS * E.tapValue(s, NOW);
    const bu = bestUnit(s, need);
    const bi = bestInvest(s);
    const tU = Math.max(0, bu.total - s.money) / Math.max(inc, 1e-9);
    const payback = bi ? bi.c / bi.di + Math.max(0, bi.c - s.money) / Math.max(inc, 1e-9) : Infinity;
    if (bi && payback < tU * 0.9 + 20) {
      if (s.money >= bi.c) { if (bi.tap) E.buyTap(s); else E.buy(s, 'b', bi.b.id, 1); continue; }
      return false;
    }
    if (s.money >= bu.c) { E.buy(s, 'u', bu.u.id, 1); continue; }
    return false;
  }
  return false;
}
function timeTo(s0, D, cap) {
  const s = structuredClone(s0);
  for (let t = 0; t <= cap; t++) if (step(s, D)) return { t, s };
  return { t: Infinity, s };
}
function conquer(s, r, D) {
  const P = E.armyPower(s);
  const frac = Math.min(0.4, 0.2 * Math.pow(D / P, 2));
  for (const u of UNITS) { const n = s.units[u.id] || 0; if (n) s.units[u.id] = n - Math.floor(n * frac); }
  s.conquered[r.id] = true;
}

if (process.env.DEBUG) {
  const s0 = E.newState('x');
  for (const D of [1, 1.2, 1.5, 2, 3, 5, 10, 20, 50]) { const r = timeTo(s0, D, 3000); console.log(D, r.t, JSON.stringify(r.s.units), JSON.stringify(r.s.buildings), r.s.tapLevel, r.s.money.toFixed(1)); }
  process.exit(0);
}
const s = E.newState('Sim');
const out = { r: {}, i: {} };
const rows = [];
let total = 0;
function scaleEra(e) {
  const I = E.baseIncome(s) + TAPS * E.tapValue(s, NOW);
  const bs = BUILDINGS.filter((b) => b.era === e);
  let prev = Math.max(...BUILDINGS.filter((b) => b.era < e).map((b) => b.cost));
  bs.forEach((b, j) => {
    b.cost = nice(Math.max(I * KB[j], prev * 4));
    b.income = nice(b.cost / PB(e, j));
    prev = b.cost;
  });
  const us = UNITS.filter((u) => u.era === e);
  let prevU = Math.max(...UNITS.filter((u) => u.era < e).map((u) => u.cost));
  us.forEach((u, j) => {
    const k = UNITS.indexOf(u);
    u.cost = nice(Math.max(I * KU[us.length][j], prevU * 4));
    u.power = nice(u.cost * RATIO(k));
    prevU = u.cost;
  });
  rows.push(`--- epoke ${e}: inntekt ${fmt(I)}/s  bygg: ${bs.map((b) => b.id + ' ' + fmt(b.cost) + '/' + fmt(b.income)).join(', ')}  enheter: ${us.map((u) => u.id + ' ' + fmt(u.cost) + '/' + fmt(u.power)).join(', ')}`);
}
for (let e = 0; e < ERAS.length; e++) {
  s.era = e;
  if (e > 0 && !CHECK) scaleEra(e);
  const regs = regionsOfEra(e);
  regs.forEach((r, i) => {
    const target = TARGETS[e][i] ?? 120;
    let D;
    if (CHECK) D = r.def;
    else {
      let lo = Math.max(1, E.armyPower(s) / ATTACK_RATIO), hi = lo * 2;
      while (timeTo(s, hi, target * 4).t < target) hi *= 2;
      for (let k = 0; k < 40; k++) {
        const mid = Math.sqrt(lo * hi);
        if (timeTo(s, mid, target * 4).t < target) lo = mid; else hi = mid;
      }
      D = nice(Math.sqrt(lo * hi));
    }
    const res = timeTo(s, D, 1e6);
    Object.assign(s, res.s);
    total += res.t;
    const income = CHECK ? r.income : nice(Math.max(1, E.baseIncome(s) * INCOME_FRAC));
    out.r[r.id] = { def: D, income };
    r.def = D; r.income = income;
    conquer(s, r, D);
    const topB = BUILDINGS.filter((b) => s.buildings[b.id]).map((b) => `${b.id}:${s.buildings[b.id]}`).slice(-3).join(' ');
    const topU = UNITS.filter((u) => s.units[u.id]).map((u) => `${u.id}:${s.units[u.id]}`).slice(-3).join(' ');
    rows.push(`${String(e)} ${r.id.padEnd(11)} def=${fmt(D).padStart(8)} inc+=${fmt(income).padStart(8)} t=${String(res.t).padStart(4)}s tot=${(total / 60).toFixed(1).padStart(6)}m  $/s=${fmt(E.baseIncome(s)).padStart(8)} tap=${s.tapLevel} | ${topB} | ${topU}`);
  });
}
for (const b of BUILDINGS) out.i[b.id] = { cost: b.cost, income: b.income };
for (const u of UNITS) out.i[u.id] = { cost: u.cost, power: u.power };
function fmt(x) { const u = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc']; let i = 0; while (x >= 1000 && i < u.length - 1) { x /= 1000; i++; } return (x < 10 ? x.toFixed(2) : x < 100 ? x.toFixed(1) : x.toFixed(0)) + u[i]; }
console.log(rows.join('\n'));
console.log(`Total: ${(total / 60).toFixed(1)} min med ${TAPS} trykk/s`);
if (!CHECK) {
  writeFileSync(new URL('../src/js/balance.js', import.meta.url), '// AUTOGENERERT av tools/simulate.mjs – priser, inntekt, styrke og forsvar.\nexport const BALANCE = ' + JSON.stringify(out, null, 0).replace(/},"/g, '},\n  "') + ';\n');
  console.log('Skrev src/js/balance.js');
}
