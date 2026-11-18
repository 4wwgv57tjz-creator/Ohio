// Daglig innloggingsbonus: en ny belønning hver dag i sju dager. Hopper man over en dag, starter rekka på nytt.
// Ren logikk uten DOM, slik at den kan testes i Node.
import { grantRandom } from './powerups.js';
import { addCrate } from './cosmetics.js';
import { steadyIncome } from './events.js';

export const DAILY = [
  { kind: 'cash', mins: 10 },
  { kind: 'gems', n: 20 },
  { kind: 'crate', crate: 'wood' },
  { kind: 'pu' },
  { kind: 'gems', n: 40 },
  { kind: 'cash', mins: 30 },
  { kind: 'big', crate: 'gold', n: 50 },
];

const pad = (n) => String(n).padStart(2, '0');
// Dato i spillerens egen tidssone (YYYY-MM-DD)
export const localDay = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const prevDay = (d = new Date()) => localDay(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));

// Hvor i rekka er spilleren i dag? idx = dagens belønning (0–6)
export function dailyStatus(s, d = new Date()) {
  const dl = s.daily || {};
  const today = localDay(d);
  if (dl.last === today) return { claimed: true, idx: (Math.max(1, dl.streak) - 1) % DAILY.length, streak: dl.streak };
  const streak = dl.last && dl.last === prevDay(d) ? (dl.streak || 0) + 1 : 1;
  return { claimed: false, idx: (streak - 1) % DAILY.length, streak, broken: !!dl.last && streak === 1 };
}
// Hva belønningen er verdt nå (penger regnes ut fra inntekten)
export function dailyValue(s, r, now = Date.now()) {
  return r.kind === 'cash' ? steadyIncome(s, now) * 60 * r.mins : r.n || 0;
}
// Henter dagens belønning. mult = 2 når spilleren så en video for dobbel belønning.
export function claimDaily(s, d = new Date(), mult = 1, rnd = Math.random) {
  const st = dailyStatus(s, d);
  if (st.claimed) return null;
  const r = DAILY[st.idx];
  const got = { idx: st.idx, kind: r.kind, mult, money: 0, gems: 0, crate: '', crates: 0, pu: [] };
  for (let i = 0; i < mult; i++) {
    if (r.kind === 'cash') { const v = dailyValue(s, r, d.getTime()); s.money += v; s.totalEarned += v; got.money += v; }
    if (r.kind === 'gems' || r.kind === 'big') { s.gems = (s.gems || 0) + r.n; got.gems += r.n; }
    if (r.kind === 'crate' || r.kind === 'big') { addCrate(s, r.crate); got.crate = r.crate; got.crates++; }
    if (r.kind === 'pu') got.pu.push(grantRandom(s, rnd));
  }
  s.daily = { last: localDay(d), streak: st.streak, total: ((s.daily && s.daily.total) || 0) + 1 };
  return got;
}
