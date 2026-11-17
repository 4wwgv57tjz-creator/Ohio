// Leaderboard, venner og innlogging (Facebook/Apple).
//   demo     – fungerer uten server: eksempelspillere og lokale «venner» (for testing)
//   firebase – ekte innlogging og felles leaderboard via Firebase (se online.config.json og README)
/* global __SOCIAL_PROVIDER__, __SOCIAL__ */
import { randomCode, normalizeCode } from './social-common.js';

// Begge settes av tools/build.mjs (esbuild «define»), slik at Firebase bare bygges inn når det er valgt.
const CFG = __SOCIAL__;
export const LOGIN_PROVIDERS = (CFG.loginProviders || ['facebook', 'apple']).filter((p) => p === 'facebook' || p === 'apple');

let backend = null;
const listeners = new Set();
export const onSocialChange = (fn) => listeners.add(fn);
const emit = () => listeners.forEach((f) => { try { f(); } catch { /* */ } });

export async function initSocial(getState, scoreOf) {
  if (__SOCIAL_PROVIDER__ === 'firebase') {
    try {
      const mod = await import('./social-firebase.js');
      backend = mod.createFirebaseBackend(CFG, { getState, scoreOf, emit });
    } catch (e) {
      console.warn('Firebase utilgjengelig:', e && e.message);
      backend = createDemoBackend({ getState, emit });
    }
  } else backend = createDemoBackend({ getState, emit });
  try { await backend.init(); } catch (e) { console.warn('Leaderboard:', e && e.message); }
  emit();
  return backend;
}
export const social = () => backend;

// ---------- demo ----------
const EXAMPLES = [
  ['OhioKongen', 142, 6, 2], ['GeneralNøtt', 121, 6, 1], ['Kosmos-Kari', 98, 6, 0], ['RomRolf', 77, 5, 0],
  ['PingvinPer', 61, 4, 0], ['LamaLars', 49, 3, 0], ['TankTrine', 37, 3, 0], ['MaisMester', 26, 2, 0],
  ['Vikingen99', 18, 1, 0], ['Buckeye-Bob', 11, 1, 0], ['Bygdeheltinne', 6, 0, 0], ['NyRekrutt', 2, 0, 0],
];
const hash = (str) => { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const DEMO_FLAGS = ['flag_ohio', 'flag_norway', 'flag_pirate', 'flag_star', 'flag_fire', 'flag_buckeye', 'flag_moon', 'flag_tiger', 'flag_sweden', 'flag_rainbow', 'flag_alien', 'flag_heart', 'flag_galaxy', 'flag_checker'];
const demoFlag = (name, prestige) => (prestige > 0 && hash(name) % 2 ? 'flag_stars' : DEMO_FLAGS[hash(name) % DEMO_FLAGS.length]);

function createDemoBackend({ getState, emit }) {
  const so = () => {
    const s = getState();
    if (!s) return null;
    s.social = s.social || {};
    if (!s.social.code) s.social.code = randomCode();
    s.social.friends = s.social.friends || [];
    return s.social;
  };
  const me = () => {
    const s = getState();
    const e = s ? { score: Math.max(s.stats.won || 0, s.social?.best || 0), era: s.era, prestige: s.prestige || 0, flag: (s.skins && s.skins.equipped.flag) || 'flag_ohio' } : { score: 0, era: 0, prestige: 0, flag: 'flag_ohio' };
    const login = so()?.demoLogin;
    return { id: 'me', name: s?.name || '', ...e, provider: login ? login.provider : 'guest', me: true };
  };
  return {
    demo: true,
    async init() { so(); },
    state() {
      const x = so();
      return { ready: true, demo: true, signedIn: !!(x && x.demoLogin), provider: x?.demoLogin?.provider || 'guest', code: x?.code || '', error: '' };
    },
    async login(provider) { const x = so(); if (!x) return { ok: false }; x.demoLogin = { provider, at: Date.now() }; emit(); return { ok: true }; },
    async logout() { const x = so(); if (x) delete x.demoLogin; emit(); },
    async deleteAccount() { const x = so(); if (x) { delete x.demoLogin; x.friends = []; x.code = randomCode(); } emit(); return { ok: true }; },
    async submit() {},
    async board(kind) {
      const rows = kind === 'friends'
        ? (so()?.friends || []).map((f) => ({ id: f.code, name: f.name, score: f.score, era: f.era, prestige: f.prestige || 0, flag: demoFlag(f.code, f.prestige || 0), provider: 'guest', demo: true }))
        : EXAMPLES.map(([name, score, era, prestige]) => ({ id: name, name, score, era, prestige, flag: demoFlag(name, prestige), provider: hash(name) % 3 === 0 ? 'apple' : hash(name) % 3 === 1 ? 'facebook' : 'guest', demo: true }));
      return sortRows([...rows, me()]);
    },
    async addFriend(input) {
      const code = normalizeCode(input);
      const x = so();
      if (!code) return { ok: false, error: 'bad_code' };
      if (!x) return { ok: false, error: 'offline' };
      if (code === x.code) return { ok: false, error: 'self' };
      if (x.friends.some((f) => f.code === code)) return { ok: false, error: 'already' };
      const h = hash(code);
      const friend = { code, name: 'Venn ' + code.slice(0, 3), score: h % 70, era: Math.min(6, Math.floor((h % 70) / 10)), prestige: h % 5 === 0 ? 1 : 0 };
      x.friends.push(friend);
      emit();
      return { ok: true, friend: { ...friend, demo: true } };
    },
    async removeFriend(id) { const x = so(); if (x) x.friends = x.friends.filter((f) => f.code !== id); emit(); },
  };
}

export function sortRows(rows) {
  return rows.sort((a, b) => b.score - a.score || (b.me ? 1 : 0) - (a.me ? 1 : 0)).map((r, i) => ({ ...r, place: i + 1 }));
}
