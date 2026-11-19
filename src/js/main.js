// Take over the world Ohio – brukergrensesnitt, spill-løkke og lagring.
import * as E from './engine.js';
import { ERAS, BUILDINGS, UNITS, REGIONS, REGION_BY_ID, UNIT_BY_ID, regionsOfEra, SPACE_HOMES, TERRAINS, CLASSES, TACTICS, TACTIC_IDS, DOCTRINES, DOC_MAX, docCost, LANE_TYPES } from './data.js';
import * as PU from './powerups.js';
import * as EV from './events.js';
import * as D from './daily.js';
import { voice } from './voice.js';
import * as C from './cosmetics.js';
import * as M from './monetize.js';
import { initSocial, social, onSocialChange, LOGIN_PROVIDERS } from './social.js';
import { formatCode } from './social-common.js';
import { MAPS } from './mapdata.js';
import * as A from './art.js';
import { t, L, fmt, money, duration, setLang, getLang } from './i18n.js';
import { sfx, unlockAudio, setSound, buzz, audioState, audioLevel } from './audio.js';

const SAVE_KEY = 'totw-ohio-save-v1';
const MODES = [1, 10, 100, 'max'];
let S = null;
let tab = 'base';
let selected = null;
let modalCount = 0;
let installEvt = null;
let lastSig = {};
let nextCrate = Date.now() + 35000;
let coachTimer = 0;
let viewBox = null; // kartets synlige utsnitt [x, y, w, h]
let shopView = 'store';
let skinCat = 'army';
let mapView = 'map';
let lastBattle = null;
let topView = 'friends';
let armyView = 'units';
let showAllSkins = false;
let boardCache = { kind: '', rows: null, at: 0 };
let introGeneral = C.DEFAULT_GENERAL;
// trykk: kombo bygges opp av raske trykk og faller når man slutter
let combo = 0, lastTapAt = 0, comboShownTier = 0;
// basen: daglig bonus vises automatisk én gang per økt, generalen sier noe av og til
let dailyAutoShown = false, nextQuip = performance.now() + 18000, sayTimer = 0, sayId = 0;
// #noauto (for tester): ingen automatiske hendelser eller daglig bonus-vindu
const NOAUTO = /[?#&]noauto/.test(location.href);
// Utviklermodus: slås på ved å trykke 7 ganger på versjonen i innstillingene (eller #dev i adressen)
/* global __BUILD__, __DEV_TOOLS__ */
const BUILD = typeof __BUILD__ !== 'undefined' ? __BUILD__ : 'dev';
const DEV_OK = typeof __DEV_TOOLS__ === 'undefined' || __DEV_TOOLS__;
const DEV_KEY = 'totw-ohio-dev';
const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* privat modus */ } };
let devOn = DEV_OK && (lsGet(DEV_KEY) === '1' || /[?#&]dev\b/.test(location.href));
let devHud = devOn && lsGet(DEV_KEY + '-hud') === '1';
let devTaps = 0, devTapAt = 0, devCrit = 0, fpsAvg = 60;
const AD_GEMS = 30;
const AD_GEMS_PER_DAY = 8;
const FREE_CRATE_COOLDOWN = 30 * 60 * 1000;
const TIME_SKIPS = [{ id: 'skip1', hours: 1, gems: 120 }, { id: 'skip4', hours: 4, gems: 400 }];

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const ico = (n, c) => A.icon(n, c);
const pm = () => E.prestigeMult(S);
const fill = (str, vars) => { let out = str; if (vars) for (const k in vars) out = out.split('{' + k + '}').join(vars[k]); return out; };
// Replikk fra generalen hvis den har en egen (General Drip snakker slang), ellers standardteksten
const say = (key, fallbackKey, vars) => { const v = S && voice(S.general, key); return v ? fill(L(v), vars) : t(fallbackKey, vars); };

// ---------------- lagring ----------------
function loadSave() {
  try { const raw = localStorage.getItem(SAVE_KEY); if (raw) return JSON.parse(raw); } catch { /* blokkert lagring */ }
  return null;
}
function persist() {
  if (!S) return;
  S.lastSeen = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch { /* blokkert lagring */ }
}

// ---------------- hjelpere ----------------
function chanceClass(c) { return c >= 1 ? 'c-sure' : c >= 0.7 ? 'c-good' : c >= 0.4 ? 'c-risky' : c > 0 ? 'c-bad' : 'c-none'; }
function chanceLabel(c) { return c >= 1 ? t('chance_sure') : c >= 0.7 ? t('chance_good') : c >= 0.4 ? t('chance_risky') : c > 0 ? t('chance_bad') : t('chance_none'); }
const pct = (c) => Math.round(c * 100) + '%';
const buyMode = () => (MODES.includes(S.settings.buyMode) ? S.settings.buyMode : 1);
function itemArt(it) { return BUILDINGS.includes(it) ? A.buildingArt(it.id) : A.unitArt(it.id, 'me'); }

function enemyArtFor(r, i = 0) {
  const era = r.era;
  const kind = r.enemy;
  if (kind === 'army') {
    const us = UNITS.filter((u) => u.era === era);
    return A.unitArt(us[i % us.length].id, 'foe');
  }
  const alienSkins = ['#7be07b', '#ff9ed2', '#8fd3ff', '#ffd23f', '#b38cff'];
  if (kind === 'alien') return A.enemyArt('alien', alienSkins[(i + r.id.length) % alienSkins.length]);
  if (kind === 'ufo') return i % 3 === 2 ? A.enemyArt('alien', alienSkins[i % 5]) : A.enemyArt('ufo', ['#ff5dd6', '#56e0ff', '#ffd23f'][i % 3]);
  if (kind === 'boss') return i === 0 ? A.enemyArt('boss', '#b38cff') : i % 2 ? A.enemyArt('ufo', '#ff5dd6') : A.enemyArt('alien', alienSkins[i % 5]);
  if (kind === 'penguin') return A.enemyArt('penguin', i === 0 ? 'boss' : '');
  return A.enemyArt(kind) || A.unitArt('soldier', 'foe');
}

// ---------------- skall og tema ----------------
function buildShell() {
  const tabs = [['base', 'base'], ['build', 'build'], ['army', 'army'], ['map', 'map'], ['shop', 'shop'], ['top', 'trophy']];
  $('#app').innerHTML = `
  <header class="hud">
    <div class="hud-card">
      <button class="hud-money" type="button" data-action="tab" data-tab="build">${ico('coin')}<span id="hud-money">$0</span><span id="hud-income">+$0/s</span></button>
      <div class="hud-stats">
        <button class="hud-stat" type="button" data-action="tab" data-tab="army">${ico('swords')}<span id="hud-power">0</span></button>
        <button class="hud-stat" type="button" data-action="tab" data-tab="shop">${ico('gem')}<span id="hud-gems">0</span></button>
      </div>
    </div>
    <button class="icon-btn" id="btn-settings" type="button" data-action="settings">${ico('gear')}</button>
    <div class="boost-bar" id="boost-bar" hidden></div>
  </header>
  <main>
    ${tabs.map(([k]) => `<section class="screen" id="scr-${k}" ${k === 'base' ? '' : 'hidden'}></section>`).join('')}
    <div id="crates"></div>
  </main>
  <nav class="tabbar">
    <div class="coach" id="coach" hidden>${A.mascot('happy', { crop: true })}<div class="coach-bubble" id="coach-text"></div></div>
    ${tabs.map(([k, i]) => `<button class="tab ${k === 'base' ? 'active' : ''}" id="tab-${k}" type="button" data-action="tab" data-tab="${k}">${ico(i)}<span class="tab-label"></span><span class="badge" hidden></span></button>`).join('')}
  </nav>
  <div id="toasts"></div>
  <div id="overlay-root"></div>`;
  if (!$('#fx')) { const fx = document.createElement('div'); fx.id = 'fx'; document.body.appendChild(fx); }
}
function applyTheme() {
  const era = ERAS[S ? S.era : 0];
  const app = $('#app');
  for (const [k, v] of Object.entries(era.theme)) app.style.setProperty('--' + k, v);
  app.classList.toggle('space', !!era.space);
  document.documentElement.style.setProperty('--sky1', era.theme.sky1);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', era.theme.sky1);
}

function applySkins() {
  if (!S) return;
  A.setArmySkin(C.equippedSkin(S, 'army'));
  const flag = C.equippedSkin(S, 'flag');
  A.setFlagDesign(flag.design);
  A.setHat(C.equippedSkin(S, 'hat').hat);
  A.setLook('buckeye', null, C.equippedSkin(S, 'hat').fx);
  for (const g of ['drip', 'zorgon']) { const k = C.equippedSkin(S, g); A.setLook(g, k.look, k.fx); }
  A.setGeneral(S.general);
  const app = $('#app');
  app.style.setProperty('--own', flag.own);
  app.classList.toggle('own-rainbow', flag.fx === 'rainbow');
  const cm = $('#coach svg.mascot');
  if (cm) cm.outerHTML = A.mascot('happy', { crop: true });
  refreshGeneral();
}
// Liten general (overkropp) til små ruter
const miniGeneral = (mood = 'happy') => A.mascot(mood, { crop: true });
const hqFx = () => C.equippedSkin(S, 'hq').fx || '';
const pBadge = (n, cls = '') => (n > 0 ? `<span class="pstar ${cls}" title="${t('prestige_level', { n })}">★${n > 1 ? n : ''}</span>` : '');
const rowFlag = (id) => A.flagSvg('row-flag', (C.SKIN_BY_ID[id] && C.SKIN_BY_ID[id].design) || 'ohio');
const rarityChip = (r) => `<span class="rarity r-${r}">${esc(L(C.RARITY[r].name))}</span>`;
function skinPreview(k) {
  if (k.cat === 'army') return A.unitArt('soldier', 'me', k);
  if (k.cat === 'flag') return A.flagSvg('flag-prev', k.design);
  if (k.cat === 'hat') return A.mascot('happy', { gen: 'buckeye', hat: k.hat, fx: k.fx || '' });
  if (k.cat === 'drip' || k.cat === 'zorgon') return A.mascot('happy', { gen: k.cat, look: k.look, fx: k.fx || '' });
  if (k.cat === 'tap') return A.tapPreview(k.burst);
  return `<span class="hq-prev hq-fx-${k.fx}">${A.hq(ERAS[S.era].hq)}</span>`;
}

function renderShellText() {
  document.documentElement.lang = getLang() === 'nb' ? 'nb' : 'en';
  $$('.tabbar [data-tab]').forEach((b) => { $('.tab-label', b).textContent = t('tab_' + b.dataset.tab); });
  $('#btn-settings').setAttribute('aria-label', t('settings'));
}

function setTab(name) {
  if (name === 'map' && tab !== 'map' && S) mapEra = S.era; // kartet åpner alltid på kapittelet du er i
  tab = name;
  $$('.tabbar [data-tab]').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
  $$('.screen').forEach((s) => { s.hidden = s.id !== 'scr-' + name; });
  if (name === 'build') S.seenBuild = S.era;
  if (name === 'army') S.seenArmy = S.era;
  renderTab();
  $('#scr-' + name).scrollTop = 0;
  updateTutorial();
}

function renderTab() {
  lastSig = {};
  if (tab === 'base') renderBase();
  else if (tab === 'build') renderList('b');
  else if (tab === 'army') { if (armyView === 'school') renderSchool(); else renderList('u'); }
  else if (tab === 'shop') renderShop();
  else if (tab === 'top') renderTop();
  else renderMap();
  updateBadges();
}

// ---------------- HUD ----------------
function updateHUD() {
  $('#hud-money').textContent = money(S.money);
  $('#hud-income').textContent = '+' + money(E.incomePerSec(S)) + '/s';
  $('#hud-power').textContent = fmt(E.armyPower(S));
  $('#hud-gems').textContent = fmt(S.gems || 0);
  const left = Math.ceil(((S.boostUntil || 0) - Date.now()) / 1000);
  const bb = $('#boost-bar');
  if (left > 0) { bb.hidden = false; bb.textContent = '⚡ ' + t('boost_left', { s: left }); } else bb.hidden = true;
}

function updateBadges() {
  $('#tab-base .badge').hidden = !(S.tut >= 5 && (EV.currentEvent(S) || !D.dailyStatus(S).claimed));
  const canWin = !S.finished && regionsOfEra(S.era).some((r) => !S.conquered[r.id] && E.chanceFor(S, r) >= 1);
  $('#tab-map .badge').hidden = !canWin;
  $('#tab-build .badge').hidden = !(S.era > 0 && (S.seenBuild ?? 0) < S.era);
  const canSpend = DOCTRINES.some((d) => E.docLevel(S, d.id) < DOC_MAX && (S.medals || 0) >= docCost(E.docLevel(S, d.id)));
  $('#tab-army .badge').hidden = !((S.era > 0 && (S.seenArmy ?? 0) < S.era) || canSpend);
  const freeCrate = Date.now() >= (S.ads.freeCrateAt || 0) && M.adsEnabled();
  $('#tab-shop .badge').hidden = !(S.tut >= 5 && (freeCrate || C.cratesOwned(S) > 0 || (S.gems || 0) >= C.CRATES[0].price));
}

// ---------------- BASE ----------------
function backdrop(era) {
  if (era.space) {
    return `<div class="stars"></div><div class="stars s2"></div>
    <svg class="ground" viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0 62Q100 40 200 52T400 46V100H0z" fill="var(--ground)" opacity=".55"/><path d="M0 80Q120 60 220 76T400 72V100H0z" fill="var(--ground)"/><ellipse cx="80" cy="86" rx="16" ry="4" fill="#000" opacity=".15"/><ellipse cx="300" cy="90" rx="22" ry="5" fill="#000" opacity=".15"/></svg>`;
  }
  return `<div class="sun"></div><div class="cloud c1"></div><div class="cloud c2"></div><div class="cloud c3"></div>
  <svg class="ground" viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0 58Q70 30 140 52T280 46T400 50V100H0z" fill="var(--ground)" opacity=".6"/><path d="M0 76Q110 54 210 72T400 68V100H0z" fill="var(--ground)"/></svg>`;
}

// ----- livet i basen: generalen inne i hovedkvarteret, innbyggere, hendelser og daglig bonus -----
const QUIPS = {
  all: [
    { nb: 'Jeg har en plan. Den involverer mais.', en: 'I have a plan. It involves corn.' },
    { nb: 'Har noen sett gåsa? Den skylder meg penger.', en: 'Has anyone seen the goose? It owes me money.' },
    { nb: 'Noen dager er jeg general. Andre dager er jeg bare en lyd.', en: 'Some days I am a general. Other days I am just a sound.' },
    { nb: 'Kartet sier at Ohio er overalt.', en: 'The map says Ohio is everywhere.' },
    { nb: 'I natt drømte jeg at jeg var en låve.', en: 'Last night I dreamt I was a barn.' },
    { nb: 'Trykker du fort nok, kan du høre fargen grønn.', en: 'If you tap fast enough, you can hear the colour green.' },
    { nb: 'Strategi er bare planlegging med hatt.', en: 'Strategy is just planning with a hat.' },
    { nb: 'Jeg har aldri tapt en kamp jeg vant.', en: 'I have never lost a battle I won.' },
    { nb: 'Fienden er redd. Jeg er også litt redd. Det er greit.', en: 'The enemy is scared. I am a little scared too. That is fine.' },
    { nb: 'I dag føles som en erobringsdag.', en: 'Today feels like a conquering day.' },
    { nb: 'Pulten min er laget av gamle fredsavtaler.', en: 'My desk is made of old peace treaties.' },
    { nb: 'Hvis veggene kunne snakke, hadde de krevd lønn.', en: 'If these walls could talk, they would demand wages.' },
    { nb: 'Jeg teller soldatene hver morgen. I dag var det én for mye.', en: 'I count the soldiers every morning. Today there was one too many.' },
    { nb: 'Noen har spist kartet over Indiana. Igjen.', en: 'Someone has eaten the map of Indiana. Again.' },
  ],
  buckeye: [
    { nb: 'Jeg er en hard nøtt å knekke. Bokstavelig talt.', en: 'I am a tough nut to crack. Literally.' },
    { nb: 'Ingen ekorn kommer forbi denne generalen.', en: 'No squirrel gets past this general.' },
    { nb: 'Ohio er ikke en stat. Det er en følelse.', en: 'Ohio is not a state. It is a feeling.' },
    { nb: 'Hatten min har sett ting.', en: 'My hat has seen things.' },
  ],
  zorgon: [
    { nb: 'På min planet kalles dette en mandag.', en: 'On my planet, this is called a Monday.' },
    { nb: 'Jeg savner galaksen min av og til. Den hadde bedre wifi.', en: 'I miss my galaxy sometimes. It had better wifi.' },
    { nb: 'Monokkelen min ser fire dimensjoner. Den femte er Ohio.', en: 'My monocle sees four dimensions. The fifth is Ohio.' },
    { nb: 'Jordboere er så … myke.', en: 'Earthlings are so … squishy.' },
  ],
};
const TOWN = [['farmer', 'granny', 'kid', 'chef', 'goose', 'mayor'], ['soldier', 'farmer', 'mayor', 'kid', 'granny', 'chef', 'goose'], ['soldier', 'scientist', 'mayor', 'kid', 'granny', 'chef'], ['robot', 'alien', 'scientist', 'soldier', 'kid']];
const EMOTES = ['♪', '♥', '?', '!', 'z', '…', '☆', '♪♪'];
// det innbyggerne sier når man trykker på dem
const CIT_SAY = {
  goose: { nb: 'HONK!', en: 'HONK!' },
  robot: { nb: 'BIP BOOP', en: 'BEEP BOOP' },
  alien: { nb: 'Blørk!', en: 'Blörk!' },
  kid: { nb: 'Hihi!', en: 'Hehe!' },
  granny: { nb: 'Å, så søtt!', en: 'Oh, how sweet!' },
  farmer: { nb: 'Hei, sjef!', en: 'Howdy, boss!' },
  chef: { nb: 'Mmm, suppe!', en: 'Mmm, soup!' },
  soldier: { nb: 'Javel, sjef!', en: 'Yes, sir!' },
  mayor: { nb: 'Ahem.', en: 'Ahem.' },
  scientist: { nb: 'Eureka!', en: 'Eureka!' },
};
function pokeCitizen(btn) {
  const k = btn.dataset.kind;
  unlockAudio();
  sfx.citizen(k);
  if (S.settings.vibrate) buzz(10);
  const w = btn.closest('.walker');
  if (w && !w.querySelector('.say-pop')) {
    const b = document.createElement('span');
    b.className = 'say-pop';
    b.textContent = L(CIT_SAY[k] || CIT_SAY.farmer);
    w.appendChild(b);
    setTimeout(() => b.remove(), 1500);
  }
  if (btn.animate && !reducedMotion()) btn.animate([{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-14px) scale(1.12)' }, { transform: 'translateY(0) scale(1)' }], { duration: 380, easing: 'ease-out' });
}
const pickN = (arr, n) => arr.slice().sort(() => Math.random() - 0.5).slice(0, n);
const multTxt = (m) => '×' + String(m).replace('.', getLang() === 'nb' ? ',' : '.');
const genMood = () => (EV.currentEvent(S) ? 'sad' : 'happy');
function hqInsideHTML(era) {
  const w = A.hqWindow(era.hq);
  const pos = `left:${w.x / 2}%;top:${(w.y / 172) * 100}%;width:${w.w / 2}%;height:${(w.h / 172) * 100}%`;
  const ry = ((w.w / 2 / w.h) * 100).toFixed(2);
  const rad = w.shape === 'circle' ? ';border-radius:50%' : w.shape === 'arch' ? `;border-radius:50% 50% 0 0/${ry}% ${ry}% 0 0` : '';
  return `<span class="hq-win k-${w.kind} s-${w.shape}" style="${pos}${rad}"><span class="hq-gen g-${A.getGeneral()}" id="hq-gen"><span class="hq-gen-in">${A.mascotWindow(genMood())}</span></span><span class="hq-desk"></span></span>
    <span class="gen-say" id="gen-say" style="left:${(w.x + w.w / 2) / 2}%;bottom:${(1 - w.y / 172) * 100 + 3}%" hidden></span>`;
}
function refreshGeneral() {
  const g = $('#hq-gen');
  if (!g || !S) return;
  g.className = 'hq-gen g-' + A.getGeneral();
  $('.hq-gen-in', g).innerHTML = A.mascotWindow(genMood());
}
function genSay(text, ms = 3800, talk = false) {
  const b = $('#gen-say');
  if (!b || !text) return;
  if (talk) sfx.talk(S.general);
  const id = ++sayId;
  b.textContent = text;
  b.hidden = false;
  b.classList.remove('out');
  clearTimeout(sayTimer);
  sayTimer = setTimeout(() => { b.classList.add('out'); setTimeout(() => { if (id === sayId) b.hidden = true; }, 300); }, ms);
}
function genReact(kind) {
  const g = $('#hq-gen');
  if (!g || !g.animate || reducedMotion()) return;
  const K = {
    bob: [{ transform: 'translateY(0)' }, { transform: 'translateY(-5%)' }, { transform: 'translateY(0)' }],
    jump: [{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-16%) scale(1.08)' }, { transform: 'translateY(0) scale(1)' }],
    spin: [{ transform: 'rotate(0) scale(1)' }, { transform: 'translateY(-14%) rotate(-14deg) scale(1.14)' }, { transform: 'translateY(-8%) rotate(12deg) scale(1.1)' }, { transform: 'rotate(0) scale(1)' }],
  };
  g.animate(K[kind] || K.bob, { duration: kind === 'bob' ? 170 : kind === 'jump' ? 380 : 620, easing: 'ease-out' });
}
function maybeQuip(now) {
  if (!S || S.tut < 5 || tab !== 'base' || modalCount > 0 || document.hidden || now < nextQuip) return;
  nextQuip = now + 22000 + Math.random() * 22000;
  if (EV.currentEvent(S)) { genSay(say('evSpawn', 'ev_spawn_say'), 3800, true); return; }
  const own = voice(S.general, 'quip'); // Drip snakker slang hele tiden
  if (own) { genSay(L(own), 3800, true); return; }
  const pool = [...QUIPS.all, ...(QUIPS[S.general] || [])];
  genSay(L(pool[Math.floor(Math.random() * pool.length)]), 3800, true);
}
function townsfolkHTML() {
  const pool = TOWN[S.era <= 0 ? 0 : S.era <= 3 ? 1 : S.era === 4 ? 2 : 3];
  const evOn = !!EV.currentEvent(S);
  return pickN(pool, 2).map((k, i) => {
    const d = (18 + Math.random() * 16) * (i ? -1 : 1);
    const dur = 9 + Math.random() * 6;
    return `<div class="walker w${i}${i === 0 && evOn ? ' away' : ''}" style="--d:${d.toFixed(0)}px;--dur:${dur.toFixed(1)}s;animation-delay:-${(Math.random() * dur).toFixed(1)}s">
      <button type="button" class="w-in" data-action="citizen" data-kind="${k}" aria-label="${t('citizen')}">${A.citizenArt(k)}</button><span class="emote" style="animation-delay:${(2 + Math.random() * 9).toFixed(1)}s">${EMOTES[Math.floor(Math.random() * EMOTES.length)]}</span></div>`;
  }).join('');
}
function eventSpotHTML() {
  const x = EV.currentEvent(S);
  if (!x) return '';
  return `<button type="button" class="ev-citizen" data-action="event-open" aria-label="${t('ev_open')}"><span class="ev-who">${A.citizenArt(x.who)}</span><span class="ev-bang">!</span></button>`;
}
function refreshEventSpot() {
  const spot = $('#ev-spot');
  if (spot) spot.innerHTML = eventSpotHTML();
  $('#townsfolk .w0')?.classList.toggle('away', !!EV.currentEvent(S));
  refreshGeneral();
}
function dailyBtnHTML() {
  if (S.tut < 5) return '';
  const st = D.dailyStatus(S);
  return `<button type="button" class="stage-btn daily-btn ${st.claimed ? '' : 'ready'}" data-action="daily-open" aria-label="${t('daily_title')}">${ico('gift')}<span class="dot"></span></button>`;
}
function refreshDailyBtn() {
  const b = $('#daily-slot');
  if (b) b.innerHTML = dailyBtnHTML();
}
function evBuffsHTML() {
  const now = Date.now();
  const out = [];
  for (const [k, lbl] of [['inc', 'ev_buff_inc'], ['tap', 'ev_buff_tap']]) {
    const b = S.ev.buff && S.ev.buff[k];
    if (!b || b.until <= now) continue;
    out.push(`<span class="ev-chip ${b.m >= 1 ? 'good' : 'bad'}">${t(lbl, { m: multTxt(b.m) })} <b>${clock(b.until - now)}</b></span>`);
  }
  return out.join('');
}
function updateEvBuffs() {
  const el = $('#ev-buffs');
  if (!el) return;
  const h = evBuffsHTML();
  if (el.innerHTML !== h) el.innerHTML = h;
}
function updateCombo() {
  const el = $('#combo');
  if (!el) return;
  const c = Math.floor(combo);
  const tier = E.comboTier(c);
  comboShownTier = Math.min(comboShownTier, tier);
  if (c < 5) { el.hidden = true; return; }
  const T = E.COMBO_TIERS, next = T[tier + 1];
  el.hidden = false;
  el.className = 'tap-combo t' + tier;
  $('#combo-x', el).textContent = multTxt(T[tier].m);
  $('#combo-n', el).textContent = c;
  $('#combo-fill', el).style.width = (next ? Math.min(100, ((c - T[tier].n) / (next.n - T[tier].n)) * 100) : 100) + '%';
}
function shakeStage(big) {
  const st = $('#stage');
  if (!st || !st.animate || reducedMotion()) return;
  const a = big ? 6 : 3;
  st.animate([{ transform: 'translate(0,0)' }, { transform: `translate(${-a}px,${a / 2}px)` }, { transform: `translate(${a}px,${-a / 2}px)` }, { transform: `translate(${-a / 2}px,${a / 3}px)` }, { transform: 'translate(0,0)' }], { duration: big ? 420 : 240 });
  if (big) { const f = document.createElement('div'); f.className = 'stage-flash'; st.appendChild(f); setTimeout(() => f.remove(), 500); }
}

function paradeHTML() {
  const owned = UNITS.filter((u) => S.units[u.id] > 0);
  if (!owned.length) return '';
  const total = owned.reduce((a, u) => a + S.units[u.id], 0);
  const slots = Math.min(9, Math.max(1, total));
  const list = [];
  const ranked = owned.slice().sort((a, b) => E.unitPower(S, b) - E.unitPower(S, a));
  for (let i = 0; i < slots; i++) list.push(ranked[i % Math.min(ranked.length, 4)].id);
  const dur = 16;
  return list.map((id, i) => `<div class="marcher" style="animation-delay:${(-i * dur) / slots}s;animation-duration:${dur}s"><div class="m-in" style="animation-delay:${i * 0.13}s">${A.unitArt(id, 'me')}</div></div>`).join('');
}

// ---------------- STRATEGI ----------------
function terrainHTML(r) {
  const T = TERRAINS[r.terrain];
  if (!T) return '';
  return `<div class="terrain-row"><span class="terrain-chip" style="--tc:${T.color}">${esc(L(T.name))}</span><span class="terrain-best">${t('strong_here')}</span>${Object.entries(T.bonus).map(([c, b]) => `<span class="cls-chip">${ico('cls_' + c)}${esc(L(CLASSES[c].name))} +${Math.round(b * 100)} %</span>`).join('')}</div>`;
}
const LANE_KEYS = ['lane_0', 'lane_1', 'lane_2'];
function lanesPreviewHTML(r) {
  const lanes = E.enemyLanes(r);
  return `<div class="lanes-preview"><span class="lp-title">${t('enemy_lineup')}</span>${lanes.map((ln, l) => (ln.share
    ? `<span class="lp-lane">${ico(LANE_TYPES[ln.type].icon)}<b>${esc(L(LANE_TYPES[ln.type].name))}</b><small>${Math.round(ln.share * 100)} %</small></span>`
    : `<span class="lp-lane empty">${t(LANE_KEYS[l])}: –</span>`)).join('')}</div>`;
}
function tacticHTML(r) {
  const cur = E.tacticId(S);
  return `<div class="tactic-pick" role="radiogroup" aria-label="${t('tactic')}">${TACTIC_IDS.map((id) => {
    const ch = E.chanceFor(S, r, id);
    return `<button type="button" class="tactic ${cur === id ? 'on' : ''}" role="radio" aria-checked="${cur === id}" data-action="tactic" data-t="${id}"><b>${esc(L(TACTICS[id].name))}</b><span class="tactic-ch ${chanceClass(ch)}">${pct(ch)}</span></button>`;
  }).join('')}</div><p class="tactic-desc">${esc(L(TACTICS[cur].desc))}</p>`;
}

function targetCardHTML() {
  if (S.finished) {
    return `<div class="tc-head"><div class="tc-art">${A.logo()}</div><div class="tc-info"><div class="eyebrow">${t('final_title')}</div><h3>${t('universe_yours')}</h3><p class="flavor">${t('final_text')}</p></div></div>
    ${prestigeRewardsHTML(S.prestige + 1)}
    <div class="tc-actions one"><button class="btn btn-gold" data-action="prestige-ask">${ico('star')} ${t('take_prestige', { n: S.prestige + 1 })}</button></div>`;
  }
  const r = E.chosenTarget(S);
  if (!r) return `<div class="tc-head"><div class="tc-art">${miniGeneral()}</div><div class="tc-info"><h3>${esc(L(ERAS[S.era].won))}</h3></div></div>
    <div class="tc-actions"><button class="btn btn-gold" data-action="era-done">${ico('star')} ${t('continue')}</button></div>`;
  const P = E.battlePower(S, r), D = E.battleDef(S, r), ch = E.winChance(P, D);
  const fill = Math.min(100, (P / (D * E.SAFE_RATIO)) * 100);
  return `<div class="tc-head"><div class="tc-art">${enemyArtFor(r)}</div>
    <div class="tc-info"><div class="eyebrow">${S.target === r.id ? t('chosen_enemy') : t('next_target')}</div><h3>${esc(L(r.name))}</h3><p class="flavor">${esc(L(r.flavor))}</p>
    ${S.tut >= 5 && E.eraProgress(S).total - E.eraProgress(S).done > 1 ? `<button type="button" class="link-btn pick-enemy" data-action="pick-target">${ico('swords')} ${t('switch_enemy')}</button>` : ''}</div></div>
    <div class="vs-row"><span class="vs-me">${ico('swords')}<b>${fmt(P)}</b></span><span class="vs-mid">${t('vs')}</span><span class="vs-foe"><b>${fmt(D)}</b>${ico('skull')}</span></div>
    <div class="meter"><div class="meter-fill ${chanceClass(ch)}" style="width:${fill}%"></div><span>${pct(ch)} ${t('win_chance')}</span></div>
    ${terrainHTML(r)}
    ${tacticHTML(r)}
    <div class="tc-actions">
      <button class="btn btn-attack" data-action="attack" data-id="${r.id}" ${ch <= 0 ? 'disabled' : ''}>${ico('swords')} ${t('attack')}</button>
      <button class="btn btn-soft" data-action="tab" data-tab="${ch >= 1 ? 'map' : 'army'}">${ch >= 1 ? t('to_map') : t('to_army')}</button>
    </div>`;
}

function tapCardHTML() {
  const max = S.tapLevel >= E.TAP_MAX;
  const cost = E.tapCost(S.tapLevel);
  return `<div class="item-card tap-card">
    <div class="item-art tap-art">${ico('tap')}<span class="count">${S.tapLevel}</span></div>
    <div class="item-body"><div class="item-name">${t('tap_power')}</div><div class="item-desc">${t('tap_desc')}</div>
    <div class="item-stat">${t('tap_value', { v: money(E.tapValue(S)) })}</div>
    <div class="item-desc crit-info">${t('tap_crit_info', { c: Math.round(E.CRIT.chance * 100), m: E.CRIT.mult, x: multTxt(E.COMBO_TIERS[E.COMBO_TIERS.length - 1].m) })}</div></div>
    <button class="buy-btn ${!max && S.money >= cost ? '' : 'cant'}" data-action="buytap" ${max ? 'disabled' : ''}><span class="lbl">${max ? t('max') : t('upgrade')}</span><span class="price">${max ? '★' : money(cost)}</span></button>
  </div>`;
}

function renderBase() {
  const era = ERAS[S.era];
  const pr = E.eraProgress(S);
  $('#scr-base').innerHTML = `<div class="pad">
    <div class="era-banner">
      <div class="eyebrow">${t('chapter', { n: S.era + 1 })}${S.prestige ? ` · ${ico('star')} ${t('prestige_info', { p: S.prestige * 50 })}` : ''}</div>
      <h1 class="era-title">${esc(L(era.title))}</h1>
      <p class="era-goal">${esc(L(era.goal))}</p>
      <div class="progress"><div class="progress-fill" style="width:${(pr.done / pr.total) * 100}%"></div><span>${t('conquered_of', { a: pr.done, b: pr.total })}</span></div>
      <button type="button" class="link-btn tree-link" data-action="open-tree">${ico('tree')} ${t('open_tree')}</button>
    </div>
  </div>
  <div class="stage ${era.space ? 'space' : ''}" id="stage">
    ${backdrop(era)}
    <div class="village-sign">${A.flagSvg('sign-flag')}<span>${esc(S.name)}</span>${pBadge(S.prestige, 'small')}</div>
    <div class="stage-row"><span id="daily-slot">${dailyBtnHTML()}</span><span class="ev-buffs" id="ev-buffs">${evBuffsHTML()}</span></div>
    <div class="townsfolk" id="townsfolk">${townsfolkHTML()}</div>
    <button class="hq hq-fx-${hqFx()}" id="hq" type="button" aria-label="${t('tap_hint')}">${A.hq(era.hq)}${hqInsideHTML(era)}</button>
    <div id="stage-extras">${stageExtrasHTML()}</div>
    <div id="ev-spot">${eventSpotHTML()}</div>
    <div class="tap-hint" id="tap-hint">${t('tap_hint')} <b id="tap-val">+${money(E.tapValue(S))}</b></div>
    <div class="tap-combo" id="combo" hidden><b id="combo-x">×1</b><span class="combo-lbl">${t('tap_combo')} <i id="combo-n">0</i></span><span class="combo-bar"><i id="combo-fill"></i></span></div>
    <div class="parade" id="parade">${paradeHTML()}</div>
  </div>
  <div class="pad stack">
    <div class="card target-card" id="target-card">${targetCardHTML()}</div>
    ${S.tut >= 5 ? `<div class="card pu-card" id="pu-card">${puCardHTML()}</div>` : ''}
    ${S.tut >= 5 ? `<div id="boost-wrap">${boostCardHTML()}</div>` : ''}
    <div id="tap-card-wrap">${tapCardHTML()}</div>
  </div>`;
  const hq = $('#hq');
  hq.addEventListener('pointerdown', onTap);
  hq.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap(e); } });
}

// ---------------- POWERUPS I HOVEDKVARTERET ----------------
const clock = (ms) => { const sec = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; };
// Gullstatuen er en statue av generalen din
const puArt = (id) => (id === 'statue' ? `<span class="pu-statue-wrap">${A.powerupArt('pedestal')}<span class="pu-statue">${A.mascot()}</span></span>` : A.powerupArt(id));
function stageExtrasHTML() {
  const now = Date.now();
  const items = PU.SLOTS && S.pu ? S.pu.slots.map((x, i) => (x && x.until > now ? `<div class="pu-on slot-${i}" data-id="${x.id}">${puArt(x.id)}</div>` : '')).join('') : '';
  return `${PU.isActive(S, 'shield', now) ? '<div class="shield-dome"></div>' : ''}${items}`;
}
const puSig = () => S.pu.slots.map((x) => (x && x.until > Date.now() ? x.id : '-')).join(',') + '|' + JSON.stringify(S.pu.inv);
function puCardHTML() {
  const now = Date.now();
  const price = PU.boxPrice(E.baseIncome(S));
  const inv = Object.entries(S.pu.inv).filter(([, n]) => n > 0);
  return `<div class="pu-head"><div><div class="eyebrow">${t('pu_title')}</div><h3>${t('pu_sub')}</h3></div><button type="button" class="link-btn" data-action="pu-odds">${ico('info')} ${t('see_odds')}</button></div>
  <div class="pu-slots">${S.pu.slots.map((x, i) => {
    if (x && x.until > now) {
      const q = PU.PU_BY_ID[x.id];
      const left = x.until - now;
      return `<button type="button" class="pu-slot on r-${q.rarity}" data-action="pu-slot" data-i="${i}"><span class="pu-slot-art">${puArt(q.id)}</span><b>${esc(L(q.name))}</b><span class="pu-time" data-i="${i}">${clock(left)}</span><span class="pu-bar"><span data-i="${i}" style="width:${(left / x.total) * 100}%"></span></span></button>`;
    }
    return `<button type="button" class="pu-slot empty" data-action="pu-slot" data-i="${i}"><span class="pu-plus">${ico('plus')}</span><span>${t('pu_empty')}</span></button>`;
  }).join('')}</div>
  ${inv.length ? `<div class="pu-inv-title">${t('pu_stock')}</div><div class="pu-inv">${inv.map(([id, n]) => {
    const q = PU.PU_BY_ID[id];
    return `<button type="button" class="pu-chip r-${q.rarity}${PU.isActive(S, id, now) ? ' active' : ''}" data-action="pu-install" data-id="${id}"><span class="pu-chip-art">${puArt(id)}</span><b>${esc(L(q.name))}</b><span class="pu-n">×${n}</span></button>`;
  }).join('')}</div>` : ''}
  <div class="pu-buy">
    <button type="button" class="btn btn-gold pu-buy-money ${S.money >= price ? '' : 'cant'}" data-action="pu-buy" data-kind="money"><span>${ico('crate')} ${t('pu_buy')}</span><small id="pu-price">${money(price)}</small></button>
    <button type="button" class="btn btn-gem ${(S.gems || 0) >= PU.GEM_BOX ? '' : 'cant'}" data-action="pu-buy" data-kind="gems"><span>${t('pu_super')}</span><small>${ico('gem')} ${PU.GEM_BOX}</small></button>
  </div>`;
}
function refreshPu() {
  if (!S || tab !== 'base') return;
  const c = $('#pu-card');
  if (c) c.innerHTML = puCardHTML();
  const x = $('#stage-extras');
  if (x) x.innerHTML = stageExtrasHTML();
  lastSig.pu = puSig();
}
function updatePuLive() {
  const now = Date.now();
  S.pu.slots.forEach((x, i) => {
    if (!x) return;
    const el = $(`.pu-time[data-i="${i}"]`);
    if (el) el.textContent = clock(x.until - now);
    const bar = $(`.pu-bar span[data-i="${i}"]`);
    if (bar) bar.style.width = Math.max(0, (x.until - now) / x.total) * 100 + '%';
  });
  const price = PU.boxPrice(E.baseIncome(S));
  const pe = $('#pu-price');
  if (pe) { const txt = money(price); if (pe.textContent !== txt) pe.textContent = txt; }
  $('.pu-buy-money')?.classList.toggle('cant', S.money < price);
  $('.pu-card .btn-gem')?.classList.toggle('cant', (S.gems || 0) < PU.GEM_BOX);
}
function buyPowerupFlow(kind) {
  unlockAudio();
  const price = PU.boxPrice(E.baseIncome(S));
  const q = PU.buyBox(S, kind, price);
  if (!q) { sfx.nope(); toast(kind === 'gems' ? t('not_enough_gems') : t('pu_need_money')); return; }
  persist(); updateHUD(); refreshPu(); sfx.crate();
  const reel = [];
  for (let i = 0; i < 16; i++) reel.push(PU.POWERUPS[Math.floor(Math.random() * PU.POWERUPS.length)]);
  reel.push(q);
  const m = openModal(`<div class="pu-roll-head"><div class="eyebrow">${kind === 'gems' ? t('pu_super') : t('pu_box')}</div><h2 class="h2">${t('pu_rolling')}</h2></div>
    <div class="pu-reel-wrap"><div class="pu-reel">${reel.map((x) => `<div class="pu-reel-item r-${x.rarity}">${puArt(x.id)}</div>`).join('')}</div><div class="pu-reel-mark"></div></div>
    <div class="pu-result"></div>`, 'pu-modal');
  const el = $('.pu-reel', m);
  const fast = reducedMotion();
  if (!fast) {
    requestAnimationFrame(() => requestAnimationFrame(() => { el.style.transform = `translateX(calc(var(--pu-item) * -${reel.length - 1}))`; }));
    let k = 0;
    const tick = () => { if (k++ < 9 && m.isConnected) { sfx.click(); setTimeout(tick, 60 + k * 22); } };
    tick();
  } else el.style.transform = `translateX(calc(var(--pu-item) * -${reel.length - 1}))`;
  setTimeout(() => showPuResult(m, q), fast ? 50 : 1650);
}
function showPuResult(m, q) {
  if (!m.isConnected) return;
  const now = Date.now();
  const canNow = PU.freeSlot(S, now) >= 0 && !PU.isActive(S, q.id, now);
  sfx.milestone();
  m.querySelector('.modal').classList.add('pu-done');
  $('.pu-roll-head h2', m).textContent = t('pu_got', { p: L(q.name) });
  $('.pu-result', m).innerHTML = `${rarityChip(q.rarity)}<p class="pu-desc"><b>${esc(L(q.desc))}</b><br>${t('pu_lasts', { m: q.mins })}</p>
    ${canNow ? `<button type="button" class="btn btn-gold big" data-action="pu-install" data-id="${q.id}">${t('pu_install_now')}</button><button type="button" class="btn btn-soft" data-action="close">${t('pu_keep')}</button>`
    : `<p class="small">${PU.isActive(S, q.id, now) ? t('pu_already_toast') : t('pu_full_kept')}</p><button type="button" class="btn btn-gold big" data-action="close">OK</button>`}`;
}
function puSlotFlow(i) {
  const now = Date.now();
  const x = S.pu.slots[i];
  if (x && x.until > now) {
    const q = PU.PU_BY_ID[x.id];
    openModal(`<div class="modal-head"><h2 class="h2">${esc(L(q.name))}</h2><button type="button" class="icon-btn" data-action="close" aria-label="${t('close')}">${ico('close')}</button></div>
      <div class="pu-big">${puArt(q.id)}</div>${rarityChip(q.rarity)}
      <p class="pu-desc"><b>${esc(L(q.desc))}</b><br>${t('pu_left', { t: clock(x.until - now) })}</p>
      <button type="button" class="btn btn-gold big" data-action="close">OK</button>`, 'pu-modal');
    return;
  }
  const inv = Object.entries(S.pu.inv).filter(([, n]) => n > 0);
  const price = PU.boxPrice(E.baseIncome(S));
  openModal(`<div class="modal-head"><h2 class="h2">${t('pu_choose')}</h2><button type="button" class="icon-btn" data-action="close" aria-label="${t('close')}">${ico('close')}</button></div>
    ${inv.length ? `<div class="pu-choose">${inv.map(([id, n]) => {
      const q = PU.PU_BY_ID[id];
      const on = PU.isActive(S, id, now);
      return `<button type="button" class="pu-choice r-${q.rarity}" data-action="pu-install" data-id="${id}" data-slot="${i}" ${on ? 'disabled' : ''}><span class="pu-choice-art">${puArt(id)}</span><span class="pu-choice-txt"><b>${esc(L(q.name))}</b><span>${esc(L(q.desc))} · ${q.mins} min</span><span class="pu-n">×${n}${on ? ' · ' + t('pu_already') : ''}</span></span></button>`;
    }).join('')}</div>` : `<p class="speech">${t('pu_none')}</p>`}
    <div class="pu-buy">
      <button type="button" class="btn btn-gold ${S.money >= price ? '' : 'cant'}" data-action="pu-buy" data-kind="money"><span>${ico('crate')} ${t('pu_buy')}</span><small>${money(price)}</small></button>
      <button type="button" class="btn btn-gem ${(S.gems || 0) >= PU.GEM_BOX ? '' : 'cant'}" data-action="pu-buy" data-kind="gems"><span>${t('pu_super')}</span><small>${ico('gem')} ${PU.GEM_BOX}</small></button>
    </div>`, 'pu-modal');
}
function installPowerup(id, slot) {
  const now = Date.now();
  const q = PU.PU_BY_ID[id];
  if (!q) return false;
  if (PU.isActive(S, id, now)) { sfx.nope(); toast(t('pu_already_toast')); return false; }
  const at = Number.isInteger(slot) && slot >= 0 && (!S.pu.slots[slot] || S.pu.slots[slot].until <= now) ? slot : PU.freeSlot(S, now);
  if (at < 0) { sfx.nope(); toast(t('pu_full')); return false; }
  if (!PU.install(S, id, now, at)) { sfx.nope(); return false; }
  persist();
  sfx.powerup();
  toast(t('pu_installed', { p: L(q.name) }), 'boost');
  refreshPu();
  updateHUD();
  const el = $(`#stage-extras .pu-on.slot-${at}`);
  if (el) el.classList.add('pop');
  return true;
}
function showPuOdds() {
  openModal(`<div class="modal-head"><h2 class="h2">${t('pu_odds_title')}</h2><button type="button" class="icon-btn" data-action="close" aria-label="${t('close')}">${ico('close')}</button></div>
    <table class="odds-table pu-odds"><thead><tr><th></th><th>${t('pu_box')}</th><th>${t('pu_super')}</th></tr></thead><tbody>
    ${Object.keys(PU.PU_RARITIES).map((r) => `<tr><td>${rarityChip(r)}</td><td>${PU.BOX_ODDS[r]} %</td><td>${PU.GEM_BOX_ODDS[r]} %</td></tr>`).join('')}</tbody></table>
    <div class="pu-list">${PU.POWERUPS.map((q) => `<div class="pu-li r-${q.rarity}"><span class="pu-li-art">${puArt(q.id)}</span><span><b>${esc(L(q.name))}</b><span>${esc(L(q.desc))} · ${q.mins} min</span></span></div>`).join('')}</div>
    <p class="small">${t('pu_stack_note')}</p>`, 'pu-modal');
}

function onTap(e) {
  if (e.cancelable) e.preventDefault();
  unlockAudio();
  const now = performance.now();
  if (now - lastTapAt > E.COMBO_GAP * 3) combo = 0;
  combo = Math.floor(combo) + 1;
  lastTapAt = now;
  const r = E.doTap(S, Date.now(), combo, devCrit ? (devCrit === 2 ? () => 0 : () => 0.004) : Math.random);
  devCrit = 0;
  const skin = C.equippedSkin(S, 'tap');
  const hq = $('#hq');
  if (hq && hq.animate) hq.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06,.9)' }, { transform: 'scale(.97,1.05)' }, { transform: 'scale(1)' }], { duration: 240, easing: 'ease-out' });
  let x, y;
  if (e.clientX) { x = e.clientX; y = e.clientY; } else { const b = hq.getBoundingClientRect(); x = b.left + b.width / 2; y = b.top + b.height / 3; }
  if (r.crit) {
    sfx.crit(r.crit === 2);
    if (S.settings.vibrate) buzz(r.crit === 2 ? 60 : 25);
    floatText(x, y - 30, `${r.crit === 2 ? t('mega_crit') : t('crit')} +${money(r.v)}`, r.crit === 2 ? 'ft-mega' : 'ft-crit');
    tapBurst(x, y, r.crit === 2 ? 14 : 8, skin.burst);
    shakeStage(r.crit === 2);
    genReact(r.crit === 2 ? 'spin' : 'jump');
    if (r.crit === 2) { const v = voice(S.general, 'mega'); if (v) genSay(L(v), 1500); }
  } else {
    sfx.tap(r.tier);
    if (S.settings.vibrate) buzz(8);
    floatText(x + (Math.random() * 30 - 15), y - 10, '+' + money(r.v), 'ft-money ' + (skin.ft || ''));
    if (Math.random() < 0.3 + r.tier * 0.12) tapBurst(x, y, 3, skin.burst);
    genReact('bob');
  }
  if (r.tier > comboShownTier) {
    comboShownTier = r.tier;
    const b = hq.getBoundingClientRect();
    floatText(b.left + b.width / 2, b.top + 10, t('combo_up', { m: multTxt(r.mult / (r.crit === 2 ? E.CRIT.megaMult : r.crit ? E.CRIT.mult : 1)) }), 'ft-combo');
    sfx.comboUp(r.tier);
    if (r.tier >= 3) genSay(say('combo' + Math.min(4, r.tier), 'combo_say_' + Math.min(4, r.tier)), 1600);
  }
  updateCombo();
  updateHUD();
  if (S.tut === 0) updateTutorial();
}

// ---------------- LISTER (bygg / hær) ----------------
function itemCardHTML(kind, it) {
  const n = E.owned(S, kind, it.id);
  const mult = E.milestoneMult(n) * pm();
  const each = (kind === 'b' ? it.income : it.power) * mult;
  const total = kind === 'b' ? E.buildingIncome(S, it) : E.unitPower(S, it);
  const nxt = E.nextMilestone(n), prev = E.prevMilestone(n);
  const msW = nxt ? ((n - prev) / (nxt - prev)) * 100 : 100;
  const isNew = it.era === S.era && S.era > 0 && n === 0;
  return `<div class="item-card" data-card="${kind}:${it.id}">
    <div class="item-art">${itemArt(it)}<span class="count">${fmt(n)}</span>${isNew ? `<span class="new-tag">${t('new_badge')}</span>` : ''}</div>
    <div class="item-body">
      <div class="item-name">${esc(L(it.name))}${kind === 'u' && it.cls ? `<span class="cls-tag">${ico('cls_' + it.cls)}${esc(L(CLASSES[it.cls].name))}</span>` : ''}</div>
      <div class="item-desc">${esc(L(it.desc))}</div>
      <div class="item-stat">${kind === 'b' ? t('each_income', { v: money(each) }) : t('each_power', { v: fmt(each) })}${n ? ` · <b>${kind === 'b' ? t('total_income', { v: money(total) }) : t('total_power', { v: fmt(total) })}</b>` : ''}</div>
      <div class="ms"><div class="ms-fill" style="width:${msW}%"></div><span>${nxt ? t('milestone', { n, m: nxt }) : t('milestone_done')}</span></div>
    </div>
    <button class="buy-btn" data-action="buy" data-kind="${kind}" data-id="${it.id}"><span class="lbl"></span><span class="price"></span></button>
  </div>`;
}

function renderList(kind) {
  const items = kind === 'b' ? BUILDINGS : UNITS;
  const avail = items.filter((it) => it.era <= S.era).sort((a, b) => b.era - a.era || a.cost - b.cost);
  const teaser = items.find((it) => it.era === S.era + 1);
  const head = kind === 'b'
    ? `<div class="screen-head"><div><div class="eyebrow">${t('build_title')}</div><div class="big-num">${ico('coin')}+${money(E.incomePerSec(S))}/s</div></div>${modeSwitch()}</div>`
    : `${armyToggle()}<div class="screen-head"><div><div class="eyebrow">${t('army_title')} · ${t('units_count', { n: fmt(E.armySize(S)) })}</div><div class="big-num">${ico('swords')}${fmt(E.armyPower(S))}</div></div>${modeSwitch()}</div>`;
  const el = $(kind === 'b' ? '#scr-build' : '#scr-army');
  el.innerHTML = `<div class="pad stack">${head}
    ${kind === 'u' && E.armySize(S) ? `<div class="mini-parade">${paradeHTML()}</div>` : ''}
    ${avail.map((it) => itemCardHTML(kind, it)).join('')}
    ${teaser ? `<div class="item-card locked"><div class="item-art">${itemArt(teaser)}</div><div class="item-body"><div class="item-name">???</div><div class="item-desc">${ico('lock')} ${t('locked_until', { era: esc(L(ERAS[teaser.era].title)) })}</div></div></div>` : ''}
    ${kind === 'b' ? tapCardHTML() : ''}
  </div>`;
  updateBuyButtons();
}

function armyToggle() {
  const canSpend = DOCTRINES.some((d) => E.docLevel(S, d.id) < DOC_MAX && (S.medals || 0) >= docCost(E.docLevel(S, d.id)));
  return `<div class="mode-switch wide army-toggle" role="group">
    <button type="button" class="${armyView === 'units' ? 'on' : ''}" data-action="armyview" data-view="units">${ico('army')} ${t('army_units')}</button>
    <button type="button" class="${armyView === 'school' ? 'on' : ''}" data-action="armyview" data-view="school">${ico('medal')} ${t('army_school')}${canSpend ? ' <span class="count-dot">!</span>' : ''}</button>
  </div>`;
}
// ---------------- KRIGSSKOLEN ----------------
function renderSchool() {
  const g = C.GENERAL_BY_ID[S.general];
  const ab = g.perk && g.perk.ability ? C.ABILITIES[g.perk.ability] : null;
  $('#scr-army').innerHTML = `<div class="pad stack">${armyToggle()}
    <div class="screen-head"><div><div class="eyebrow">${t('school_title')}</div><div class="big-num">${ico('medal')}${fmt(S.medals || 0)}</div></div></div>
    <p class="school-intro">${t('school_intro')}</p>
    <div class="card gen-perk-card"><div class="gp-art">${miniGeneral()}</div><div class="gp-txt"><b>${esc(L(g.name))}</b><span>${esc(L(g.style))}</span>${ab ? `<span class="gp-ab">${t('ability')}: <b>${esc(L(ab.name))}</b> – ${esc(L(ab.desc))}</span>` : ''}</div></div>
    <div class="doc-grid">${DOCTRINES.map((d) => docCardHTML(d)).join('')}</div>
    <div class="school-foot"><span>${t('medals_earned', { n: fmt(S.medalsEarned || 0) })}</span>
      <button type="button" class="btn btn-soft" data-action="doc-respec" ${E.docSpent(S) ? '' : 'disabled'}>${t('respec')} · ${ico('gem')} ${E.RESPEC_GEMS}</button></div>
  </div>`;
}
function docCardHTML(d) {
  const lvl = E.docLevel(S, d.id);
  const max = lvl >= DOC_MAX;
  const cost = docCost(lvl);
  return `<div class="doc-card ${max ? 'max' : ''}"><div class="doc-ico">${ico(d.icon)}</div>
    <div class="doc-body"><b>${esc(L(d.name))}</b><span>${esc(L(d.desc))}</span>
      <div class="doc-pips" aria-label="${lvl}/${DOC_MAX}">${Array.from({ length: DOC_MAX }, (_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('')}</div></div>
    <button type="button" class="buy-btn doc-btn ${!max && (S.medals || 0) >= cost ? '' : 'cant'}" data-action="doc-up" data-id="${d.id}" ${max ? 'disabled' : ''}><span class="lbl">${max ? t('max') : t('upgrade')}</span>${max ? '' : `<span class="price">${ico('medal')}${cost}</span>`}</button>
  </div>`;
}

function modeSwitch() {
  const m = buyMode();
  return `<div class="mode-switch" role="group">${MODES.map((x) => `<button type="button" class="${x === m ? 'on' : ''}" data-action="mode" data-mode="${x}">${x === 'max' ? t('max') : '×' + x}</button>`).join('')}</div>`;
}

function updateBuyButtons() {
  const mode = buyMode();
  $$('.buy-btn[data-action="buy"]').forEach((b) => {
    const kind = b.dataset.kind, id = b.dataset.id;
    const p = E.purchasePlan(S, kind, id, mode);
    b.classList.toggle('cant', !p.ok);
    const lbl = (kind === 'b' ? t('buy') : t('recruit')) + (p.qty > 1 || mode !== 1 ? ' ×' + fmt(p.qty) : '');
    const price = money(p.cost);
    const l = $('.lbl', b), pr = $('.price', b);
    if (l.textContent !== lbl) l.textContent = lbl;
    if (pr.textContent !== price) pr.textContent = price;
  });
  const tb = $('[data-action="buytap"]');
  if (tb && S.tapLevel < E.TAP_MAX) tb.classList.toggle('cant', S.money < E.tapCost(S.tapLevel));
}

function refreshCard(kind, id) {
  const card = $(`[data-card="${kind}:${id}"]`);
  const it = kind === 'b' ? BUILDINGS.find((x) => x.id === id) : UNITS.find((x) => x.id === id);
  if (card && it) {
    const tmp = document.createElement('div');
    tmp.innerHTML = itemCardHTML(kind, it);
    card.replaceWith(tmp.firstElementChild);
  }
  const head = $('.screen:not([hidden]) .big-num');
  if (head) head.innerHTML = kind === 'b' ? `${ico('coin')}+${money(E.incomePerSec(S))}/s` : `${ico('swords')}${fmt(E.armyPower(S))}`;
  const eb = $('.screen:not([hidden]) .screen-head .eyebrow');
  if (eb && kind === 'u') eb.textContent = `${t('army_title')} · ${t('units_count', { n: fmt(E.armySize(S)) })}`;
  if (kind === 'u') { const mp = $('.mini-parade'); if (mp) mp.innerHTML = paradeHTML(); }
  updateBuyButtons();
}

function doBuy(kind, id, btn) {
  unlockAudio();
  const before = E.owned(S, kind, id);
  const got = E.buy(S, kind, id, buyMode());
  if (!got) { sfx.nope(); if (btn && btn.animate) btn.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }], { duration: 220 }); return; }
  kind === 'b' ? sfx.buy() : sfx.recruit();
  if (S.settings.vibrate) buzz(12);
  const after = E.owned(S, kind, id);
  if (E.milestoneMult(after) > E.milestoneMult(before)) {
    const it = (kind === 'b' ? BUILDINGS : UNITS).find((x) => x.id === id);
    setTimeout(() => sfx.milestone(), 150);
    toast(t('milestone_toast', { name: L(it.name) }), 'gold');
  }
  if (btn) { const r = btn.getBoundingClientRect(); floatText(r.left + r.width / 2, r.top, kind === 'b' ? '+' + fmt(got) : '+' + fmt(got), 'ft-buy'); }
  refreshCard(kind, id);
  updateHUD();
  updateBadges();
  updateTutorial();
  persist();
}

function doBuyTap() {
  unlockAudio();
  if (!E.buyTap(S)) { sfx.nope(); return; }
  sfx.buy();
  const w = $('#tap-card-wrap');
  if (w) w.innerHTML = tapCardHTML();
  else { const c = $('.screen:not([hidden]) .tap-card'); if (c) c.outerHTML = tapCardHTML(); }
  updateHUD();
  persist();
}

// ---------------- KART ----------------
// Kartet kan zoomes ut og inn mellom kapitlene: inn = tidligere kapitler (erobret), ut = kommende (ikke låst opp).
let mapEra = 0; // kapittelet kartet viser nå
let mapEraBase = -1; // S.era da mapEra sist ble nullstilt (et nytt kapittel viser det nye kartet)
let levelBusy = false; // en zoom-overgang mellom kapitler spilles
let vbAnim = 0; // avbryter gamle kart-animasjoner
const levelKind = (i) => (i < S.era ? 'past' : i > S.era ? 'future' : 'now');
// Hvordan et kapittel henger sammen med det forrige: 'nest' = forrige kart ligger inni hjemområdet,
// 'slide' = nabokart (Sør-Amerika ligger sør for Nord-Amerika), 'scale' = vanlig zoom uten fast punkt.
const LEVEL_LINK = { usa: 'nest', na: 'nest', sa: 'slide', world: 'scale', solar: 'nest', galaxy: 'nest' };
const SPACE_W = 1000, SPACE_H = 1300;
const reducedMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mapSize = (i) => (ERAS[i].space ? [SPACE_W, SPACE_H] : [MAPS[ERAS[i].map].w, MAPS[ERAS[i].map].h]);
const mapSVG = (i) => (ERAS[i].space ? spaceMapSVG(i) : geoMapSVG(i));

function mapToggle() {
  return `<div class="mode-switch" role="group">
    <button type="button" class="${mapView === 'map' ? 'on' : ''}" data-action="mapview" data-view="map">${ico('map')} ${t('map_view_map')}</button>
    <button type="button" class="${mapView === 'tree' ? 'on' : ''}" data-action="mapview" data-view="tree">${ico('tree')} ${t('map_view_tree')}</button>
  </div>`;
}
function renderMap() {
  if (mapView === 'tree') { renderTree(); return; }
  if (mapEraBase !== S.era || !ERAS[mapEra]) { mapEra = S.era; mapEraBase = S.era; }
  $('#scr-map').innerHTML = `<div class="pad"><div class="screen-head" id="map-head">${mapHeadHTML()}</div></div>
  <div class="${mapWrapClass()}" id="map-wrap"><div class="map-layer">${mapSVG(mapEra)}</div><div id="map-ui">${mapUiHTML()}</div></div>
  <div class="pad stack" id="map-below">${mapBelowHTML()}</div>`;
  setupMapGestures();
}
function mapWrapClass() { return `map-wrap lvl-${levelKind(mapEra)}${ERAS[mapEra].space ? ' space' : ''}`; }
function mapHeadHTML() {
  const kind = levelKind(mapEra);
  let status;
  if (kind === 'now') { const pr = E.eraProgress(S); status = t('conquered_of', { a: pr.done, b: pr.total }); }
  else status = kind === 'past' ? t('lvl_conquered') : mapEra === S.era + 1 ? t('lvl_next') : t('lvl_locked');
  return `<div><div class="eyebrow">${t('chapter', { n: mapEra + 1 })} · ${status}</div><h2 class="h2">${esc(L(ERAS[mapEra].title))}</h2></div>${mapToggle()}`;
}
function mapUiHTML() {
  const kind = levelKind(mapEra);
  const tag = kind === 'past' ? `<span class="map-tag past">${ico('check')} ${t('lvl_conquered')}</span>`
    : kind === 'future' ? `<span class="map-tag future">${ico('lock')} ${mapEra === S.era + 1 ? t('lvl_next') : t('lvl_locked')}</span>` : '';
  const zoomed = !ERAS[mapEra].space && viewBox && viewBox.v[2] < mapSize(mapEra)[0] * 0.98;
  const dots = ERAS.map((e, i) => `<button type="button" class="zb-dot ${levelKind(i)}${i === mapEra ? ' on' : ''}" data-action="lvl" data-i="${i}" aria-label="${esc(t('chapter', { n: i + 1 }) + ': ' + L(e.title))}"${i === mapEra ? ' aria-current="true"' : ''}></button>`).join('');
  return `${tag}<div class="zoom-bar" role="group" aria-label="${esc(t('zoom_levels'))}">
    <button type="button" class="zb-btn" data-action="lvl-in" aria-label="${esc(t('zoom_in_lvl'))}" ${mapEra === 0 ? 'disabled' : ''}>${ico('plus')}</button>
    <div class="zb-dots">${dots}</div>
    <button type="button" class="zb-btn" data-action="lvl-out" aria-label="${esc(t('zoom_out_lvl'))}" ${mapEra === ERAS.length - 1 && !zoomed ? 'disabled' : ''}>${ico('minus')}</button>
  </div>`;
}
function mapBelowHTML() {
  const kind = levelKind(mapEra);
  const tip = kind === 'now' && S.tut >= 5 && !S.flags.mapZoom ? `<p class="map-tip">${ico('info')} <span>${t('map_zoom_tip')}</span></p>` : '';
  return `${kind === 'now' ? tip : levelCardHTML(kind)}
    <div class="card region-sheet" id="region-sheet">${sheetHTML()}</div>
    <div class="region-list" id="region-list">${regionListHTML()}</div>`;
}
function levelCardHTML(kind) {
  const text = kind === 'past' ? t('lvl_past_text', { n: regionsOfEra(mapEra).length })
    : mapEra === S.era + 1 ? t('lvl_next_text', { c: L(ERAS[S.era].title) }) : t('lvl_future_text', { c: L(ERAS[mapEra - 1].title) });
  return `<div class="level-card ${kind}"><span class="level-ico">${ico(kind === 'past' ? 'check' : 'lock')}</span><p>${esc(text)}</p>
    <button type="button" class="btn btn-soft" data-action="lvl-now">${ico('map')} ${t('lvl_back', { n: S.era + 1 })}</button></div>`;
}
function updateMapChrome() {
  const wrap = $('#map-wrap');
  if (wrap) {
    wrap.classList.toggle('space', !!ERAS[mapEra].space);
    ['past', 'now', 'future'].forEach((k) => wrap.classList.toggle('lvl-' + k, levelKind(mapEra) === k));
  }
  const head = $('#map-head'); if (head) head.innerHTML = mapHeadHTML();
  const ui = $('#map-ui'); if (ui) ui.innerHTML = mapUiHTML();
  const below = $('#map-below'); if (below) below.innerHTML = mapBelowHTML();
}

function geoMapSVG(i) {
  const era = ERAS[i];
  const m = MAPS[era.map];
  const kind = levelKind(i);
  // hjemområdet er hele det forrige kapittelet – ditt når du har kommet så langt
  const homeOwn = i === 0 || levelKind(i - 1) !== 'future';
  const own = (id) => (id === era.home ? homeOwn : kind === 'past' || !!S.conquered[id]);
  if (!viewBox || viewBox.map !== era.map) viewBox = { map: era.map, v: [0, 0, m.w, m.h] };
  const v = viewBox.v;
  let paths = '', labels = '';
  for (const [id, g] of Object.entries(m.regions)) {
    const r = REGION_BY_ID[id];
    const o = own(id);
    const fill = o ? 'var(--own)' : r ? r.color : '#ddd5c2';
    paths += `<path class="reg${o ? ' own' : ''}${selected === id ? ' sel' : ''}" data-id="${id}" d="${g.d}" style="fill:${fill}"/>`;
  }
  for (const [id, g] of Object.entries(m.regions)) {
    const isHome = id === era.home;
    const r = REGION_BY_ID[id];
    if (!g.l || (!isHome && !r)) continue;
    const o = own(id);
    const big = g.b[2] - g.b[0] > m.w * 0.13 && g.b[3] - g.b[1] > m.w * 0.06;
    const [x, y] = g.l;
    const name = isHome ? (i === 0 ? S.name : '') : L(r.name);
    if (o) labels += `<g class="pin" transform="translate(${x} ${y - (big && name ? 26 : 0)})">${A.burgee(-6, -20, 1.25)}<path d="M-6 -20v26" stroke="#2b2350" stroke-width="3"/></g>`;
    else if (!isHome) labels += `<g class="pin" transform="translate(${x} ${y - (big ? 30 : 0)})">${pinInner(kind === 'future' ? 0 : E.chanceFor(S, r), 17)}</g>`;
    if (big && name) labels += `<text x="${x}" y="${y + 12}" text-anchor="middle" class="map-label">${esc(name)}</text>`;
  }
  return `<svg class="map" id="map-svg" viewBox="${v.join(' ')}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(L(era.title))}">
    <rect x="-3000" y="-3000" width="${m.w + 6000}" height="${m.h + 6000}" class="sea"/>
    <g class="land-shadow" transform="translate(0 7)"><path d="${m.context}" /> ${Object.values(m.regions).map((g) => `<path d="${g.d}"/>`).join('')}</g>
    <path d="${m.context}" class="land-ctx"/>
    ${paths}${labels}
  </svg>`;
}

function pinInner(ch, r) {
  const inner = ch >= 1 ? `<path d="M-7 0l5 5 9-10" fill="none" stroke="#2b2350" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`
    : ch > 0 ? `<text y="6.5" text-anchor="middle" class="pin-txt">${Math.round(ch * 100)}</text>`
    : `<rect x="-6.5" y="-2" width="13" height="10" rx="2" fill="#2b2350"/><path d="M-4 -2v-3a4 4 0 0 1 8 0v3" fill="none" stroke="#2b2350" stroke-width="2.6"/>`;
  return `<circle r="${r}" class="${chanceClass(ch)}"/>${inner}`;
}
function seeded(n) { let x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); }
function spaceMapSVG(i) {
  const W = SPACE_W, H = SPACE_H;
  const era = ERAS[i];
  const kind = levelKind(i);
  const regs = regionsOfEra(i);
  const home = SPACE_HOMES[era.map];
  const homeOwn = levelKind(i - 1) !== 'future';
  let stars = '';
  for (let k = 0; k < 90; k++) stars += `<circle cx="${(seeded(k) * W).toFixed(0)}" cy="${(seeded(k + 500) * H).toFixed(0)}" r="${(1 + seeded(k + 900) * 2.6).toFixed(1)}" fill="#fff" opacity="${(0.35 + seeded(k + 77) * 0.6).toFixed(2)}"/>`;
  const pts = [home.pos, ...regs.map((r) => r.pos)];
  const route = 'M' + pts.map((p) => p.join(' ')).join('L');
  const flag = (size) => `<g transform="translate(${size * 0.4} ${-size * 0.5})">${A.burgee(0, -10, 1.3)}<path d="M0 -10v30" stroke="#2b2350" stroke-width="3"/></g>`;
  const node = (pos, size, kindName, cls, id, label, sub) => `<g class="node ${cls}" ${id ? `data-id="${id}"` : ''} transform="translate(${pos[0]} ${pos[1]})">
    <circle r="${size * 0.62}" class="node-hit"/>
    ${cls.includes('sel') ? `<circle r="${size * 0.62 + 10}" class="node-ring"/>` : ''}
    <g transform="scale(${(size / 60).toFixed(3)})">${A.planet(kindName, { raw: true })}</g>
    <text y="${size * 0.62 + 34}" text-anchor="middle" class="map-label space-label">${esc(label)}</text>
    ${sub}
  </g>`;
  let nodes = node(home.pos, home.size, home.planet, `${homeOwn ? 'own' : ''}${selected === era.home ? ' sel' : ''}`, era.home, L(home.name), homeOwn ? flag(home.size) : '');
  for (const r of regs) {
    const own = kind === 'past' || S.conquered[r.id];
    const sub = own ? flag(r.size) : `<g class="pin" transform="translate(${r.size * 0.5} ${-r.size * 0.45})">${pinInner(kind === 'future' ? 0 : E.chanceFor(S, r), 19)}</g>`;
    nodes += node(r.pos, r.size, r.planet, (own ? 'own ' : '') + (selected === r.id ? 'sel' : ''), r.id, L(r.name), sub);
  }
  return `<svg class="map space-map" id="map-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(L(era.title))}">
    <defs><radialGradient id="spacebg" gradientUnits="userSpaceOnUse" cx="300" cy="260" r="1150"><stop offset="0" stop-color="#4a2f9a"/><stop offset=".7" stop-color="#120c35"/></radialGradient>
    <radialGradient id="neb1"><stop offset="0" stop-color="#ff5dd6" stop-opacity=".35"/><stop offset="1" stop-color="#ff5dd6" stop-opacity="0"/></radialGradient>
    <radialGradient id="neb2"><stop offset="0" stop-color="#56e0ff" stop-opacity=".3"/><stop offset="1" stop-color="#56e0ff" stop-opacity="0"/></radialGradient></defs>
    <rect x="-1500" y="-1500" width="${W + 3000}" height="${H + 3000}" fill="url(#spacebg)"/>
    <circle cx="820" cy="300" r="320" fill="url(#neb1)"/><circle cx="160" cy="900" r="360" fill="url(#neb2)"/>
    ${stars}
    <path d="${route}" class="route"/>
    ${nodes}
  </svg>`;
}

function sheetHTML() {
  const era = ERAS[mapEra];
  const kind = levelKind(mapEra);
  let id = selected;
  if (id && id !== era.home && REGION_BY_ID[id]?.era !== mapEra) id = null;
  if (!id && kind === 'now') id = E.chosenTarget(S)?.id;
  if (!id) return `<p class="muted">${kind !== 'now' ? t('lvl_pick') : S.finished ? t('universe_yours') : t('pick_region')}</p>`;
  if (id === era.home) return homeSheetHTML();
  const r = REGION_BY_ID[id];
  const inc = money(r.income * pm());
  if (kind === 'past' || S.conquered[id]) {
    return `<div class="sheet-top"><div class="sheet-art">${enemyArtFor(r)}</div><div class="sheet-info"><div class="eyebrow">${ico('check')} ${t('conquered')}${S.stars[r.id] ? ' ' + starRow(S.stars[r.id], 'sheet-stars') : ''}</div><h3>${esc(L(r.name))}</h3><p class="flavor">${esc(L(r.flavor))}</p></div></div>
    <div class="reward-row">${ico('coin')} +${inc}/s</div>`;
  }
  if (kind === 'future') {
    return `<div class="sheet-top"><div class="sheet-art">${enemyArtFor(r)}</div><div class="sheet-info"><div class="eyebrow">${ico('lock')} ${t('region_locked', { n: mapEra + 1 })}</div><h3>${esc(L(r.name))}</h3><p class="flavor">${esc(L(r.flavor))}</p></div></div>
    <div class="locked-stats"><span class="vs-foe">${ico('skull')}<b>${fmt(E.regionDef(S, r))}</b></span><span class="reward-row">${t('reward')}: ${ico('coin')} +${inc}/s</span></div>
    ${terrainHTML(r)}
    ${lanesPreviewHTML(r)}`;
  }
  const P = E.battlePower(S, r), D = E.battleDef(S, r), ch = E.winChance(P, D);
  const left = E.eraProgress(S).total - E.eraProgress(S).done;
  return `<div class="sheet-top"><div class="sheet-art">${enemyArtFor(r)}</div><div class="sheet-info"><h3>${esc(L(r.name))}</h3><p class="flavor">${esc(L(r.flavor))}</p>
    ${left > 1 ? `<button type="button" class="link-btn pick-enemy" data-action="pick-target">${ico('swords')} ${t('switch_enemy')}</button>` : ''}</div></div>
    <div class="vs-row"><span class="vs-me">${ico('swords')}<b>${fmt(P)}</b></span><span class="vs-mid">${t('vs')}</span><span class="vs-foe"><b>${fmt(D)}</b>${ico('skull')}${S.damage[id] ? `<em>${t('weakened')}</em>` : ''}</span></div>
    <div class="meter"><div class="meter-fill ${chanceClass(ch)}" style="width:${ch * 100}%"></div><span>${pct(ch)} ${t('win_chance')} · ${chanceLabel(ch)}</span></div>
    ${terrainHTML(r)}
    ${lanesPreviewHTML(r)}
    ${tacticHTML(r)}
    <div class="sheet-foot"><div class="reward-row">${t('reward')}: ${ico('coin')} +${inc}/s</div>
    <button class="btn btn-attack" data-action="attack" data-id="${id}" ${ch <= 0 ? 'disabled' : ''}>${ico('swords')} ${t('attack')}</button></div>`;
}
// Hjemområdet på et kart er hele det forrige kapittelet – herfra kan man zoome inn til det
function homeSheetHTML() {
  if (mapEra === 0) return `<div class="sheet-top"><div class="sheet-art">${miniGeneral()}</div><div class="sheet-info"><div class="eyebrow">${t('home')}</div><h3>${esc(S.name)}</h3></div></div>`;
  const prev = mapEra - 1, pk = levelKind(prev);
  const status = pk === 'past' ? t('home_done', { n: prev + 1 }) : pk === 'now' ? t('home_now', { n: prev + 1 }) : t('home_locked', { n: prev + 1 });
  const title = esc(L(ERAS[prev].title));
  return `<div class="sheet-top"><div class="sheet-art">${miniGeneral()}</div><div class="sheet-info"><div class="eyebrow">${ico(pk === 'past' ? 'check' : pk === 'now' ? 'flag' : 'lock')} ${status}</div><h3>${title}</h3></div></div>
    <button type="button" class="btn btn-soft zoom-into" data-action="lvl-in">${ico('plus')} ${t('zoom_into', { c: title })}</button>`;
}

function regionListHTML() {
  const kind = levelKind(mapEra);
  const regs = regionsOfEra(mapEra).slice().sort((a, b) => a.def - b.def);
  return regs.map((r) => {
    const done = kind === 'past' || !!S.conquered[r.id];
    const locked = !done && kind === 'future';
    const ch = done || locked ? 0 : E.chanceFor(S, r);
    const tail = done ? `${S.stars[r.id] ? starRow(S.stars[r.id], 'rstars') : ''}<span class="rinc">+${money(r.income * pm())}/s</span>${ico('check')}`
      : `<span class="rdef">${ico('skull')}${fmt(E.regionDef(S, r))}</span>${locked ? `<span class="rlock">${ico('lock')}</span>` : `<span class="rchance ${chanceClass(ch)}">${pct(ch)}</span>`}`;
    return `<button type="button" class="region-row${done ? ' done' : ''}${locked ? ' locked' : ''}${selected === r.id ? ' sel' : ''}" data-action="select" data-id="${r.id}">
      <span class="swatch" style="background:${done ? 'var(--own)' : r.color}"></span>
      <span class="rname">${esc(L(r.name))}</span>${tail}
    </button>`;
  }).join('');
}

function selectRegion(id) {
  selected = id;
  // et område i kapittelet du er i, som ikke er erobret ennå, blir fienden du har valgt
  const sr = REGION_BY_ID[id];
  if (sr && sr.era === S.era && !S.conquered[id] && S.target !== id) { S.target = id; lastSig.target = null; persist(); }
  const era = ERAS[mapEra];
  $$('#map-svg .reg, #map-svg .node').forEach((p) => p.classList.toggle('sel', p.dataset.id === id));
  if (era.space && !levelBusy) { const l = $('#map-wrap .map-layer'); if (l) { l.innerHTML = spaceMapSVG(mapEra); setupMapGestures(); } }
  const sh = $('#region-sheet');
  if (sh) sh.innerHTML = sheetHTML();
  $$('#region-list .region-row').forEach((b) => b.classList.toggle('sel', b.dataset.id === id));
  if (!era.space) zoomToRegion(id);
  sfx.click();
  updateTutorial();
}

// ----- zoom og panorering innenfor ett kart -----
function setViewBox(v) {
  if (!viewBox || ERAS[mapEra].space) return;
  const [mw, mh] = mapSize(mapEra);
  let [x, y, w] = v;
  w = Math.max(mw * 0.22, Math.min(mw, w));
  const h = w * (mh / mw);
  if (w >= mw * 0.999) { x = 0; y = 0; }
  x = Math.max(-w * 0.15, Math.min(mw - w * 0.85, x));
  y = Math.max(-h * 0.15, Math.min(mh - h * 0.85, y));
  viewBox.v = [x, y, w, h];
  const svg = $('#map-svg');
  if (svg) svg.setAttribute('viewBox', viewBox.v.map((n) => n.toFixed(1)).join(' '));
  const zb = $('#map-ui [data-action="lvl-out"]');
  if (zb) zb.disabled = mapEra >= ERAS.length - 1 && w >= mw * 0.98;
}
function animateViewBox(target, ms = 380) {
  if (!viewBox) return;
  const from = viewBox.v.slice(), map = viewBox.map, id = ++vbAnim;
  const t0 = performance.now();
  const step = (now) => {
    if (id !== vbAnim || levelBusy || !viewBox || viewBox.map !== map) return;
    const k = Math.min(1, (now - t0) / ms);
    const e = 1 - Math.pow(1 - k, 3);
    setViewBox(from.map((f, i) => f + (target[i] - f) * e));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function zoomToRegion(id) {
  const era = ERAS[mapEra];
  if (era.space) return;
  const m = MAPS[era.map];
  const g = m.regions[id];
  if (!g) return;
  const [x0, y0, x1, y1] = g.b;
  let w = Math.max((x1 - x0) * 2.4, (y1 - y0) * 2.4 * (m.w / m.h), m.w * 0.5); // nabolandene skal fortsatt synes
  w = Math.min(w, m.w);
  const h = w * (m.h / m.w);
  animateViewBox([(x0 + x1) / 2 - w / 2, (y0 + y1) / 2 - h / 2, w, h]);
}

// ----- zoom mellom kapitler -----
// Rammen rundt det største stykket av et område (så Alaska og småøyer ikke drar rammen ut)
const mainBoxCache = {};
function mainBox(key, d) {
  if (mainBoxCache[key]) return mainBoxCache[key];
  const rings = [];
  let ring = null, x = 0, y = 0;
  for (const [, c, args] of d.matchAll(/([MmLlZz])([^MmLlZz]*)/g)) {
    if (c === 'Z' || c === 'z') { if (ring && ring.length) [x, y] = ring[0]; continue; }
    const n = (args.match(/-?\d*\.?\d+(?:e-?\d+)?/g) || []).map(Number);
    for (let i = 0; i + 1 < n.length; i += 2) {
      const abs = c === 'M' || c === 'L';
      x = abs ? n[i] : x + n[i]; y = abs ? n[i + 1] : y + n[i + 1];
      if (i === 0 && (c === 'M' || c === 'm')) { ring = []; rings.push(ring); }
      ring.push([x, y]);
    }
  }
  let best = null, bestA = -1;
  for (const p of rings) {
    let a = 0;
    for (let i = 0; i < p.length; i++) { const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length]; a += x1 * y2 - x2 * y1; }
    if (Math.abs(a) > bestA) { bestA = Math.abs(a); best = p; }
  }
  const xs = best.map((q) => q[0]), ys = best.map((q) => q[1]);
  return (mainBoxCache[key] = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]);
}
// Hvor det forrige kapittelets kart ligger på kart nr. i
function homeBox(i) {
  const era = ERAS[i];
  if (era.space) { const h = SPACE_HOMES[era.map], r = h.size * 0.7; return [h.pos[0] - r, h.pos[1] - r, h.pos[0] + r, h.pos[1] + r]; }
  return mainBox(era.id, MAPS[era.map].regions[era.home].d);
}
// Et utsnitt med kartets egne proporsjoner som rommer boksen b
function fitBox(b, i, pad = 1.12) {
  const [w, h] = mapSize(i);
  const ratio = h / w;
  let bw = (b[2] - b[0]) * pad, bh = (b[3] - b[1]) * pad;
  if (bh > bw * ratio) bw = bh / ratio; else bh = bw * ratio;
  return [(b[0] + b[2]) / 2 - bw / 2, (b[1] + b[3]) / 2 - bh / 2, bw, bh];
}
const readViewBox = (svg) => (svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
// Glidende zoom: bredden endres jevnt (logaritmisk) og midtpunktet følger med, så målet blir stående i ro
function tweenViewBox(svg, from, to, ms) {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const ratio = to[3] / to[2];
    const c0 = [from[0] + from[2] / 2, from[1] + from[3] / 2], c1 = [to[0] + to[2] / 2, to[1] + to[3] / 2];
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      const w = from[2] * Math.pow(to[2] / from[2], e);
      const f = Math.abs(to[2] - from[2]) < 1e-6 ? e : (w - from[2]) / (to[2] - from[2]);
      const cx = c0[0] + (c1[0] - c0[0]) * f, cy = c0[1] + (c1[1] - c0[1]) * f, h = w * ratio;
      svg.setAttribute('viewBox', `${(cx - w / 2).toFixed(2)} ${(cy - h / 2).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}`);
      if (k < 1) requestAnimationFrame(step); else resolve();
    };
    requestAnimationFrame(step);
  });
}
async function goLevel(to) {
  if (!S || levelBusy) return;
  to = Math.max(0, Math.min(ERAS.length - 1, to));
  if (to === mapEra) return;
  const from = mapEra;
  const wrap = $('#map-wrap');
  const oldLayer = wrap && $('.map-layer', wrap);
  const oldSvg = oldLayer && $('svg', oldLayer);
  if (!S.flags.mapZoom) { S.flags.mapZoom = 1; persist(); }
  vbAnim++;
  sfx.whoosh();
  if (!oldSvg || reducedMotion() || tab !== 'map' || mapView !== 'map') { mapEra = to; selected = null; viewBox = null; renderMap(); return; }
  levelBusy = true;
  const out = to > from;
  const big = Math.max(from, to);
  const link = Math.abs(to - from) === 1 ? LEVEL_LINK[ERAS[big].id] || 'scale' : 'scale';
  try {
    oldLayer.classList.add('zooming');
    // zoom inn: kameraet flyr inn i hjemområdet før kartet byttes ut med det mindre kartet
    if (link === 'nest' && !out) await tweenViewBox(oldSvg, readViewBox(oldSvg), fitBox(homeBox(big), big), 520);
    const bord = wrap.offsetHeight - wrap.clientHeight;
    const h0 = wrap.offsetHeight;
    mapEra = to; selected = null; viewBox = null;
    oldSvg.removeAttribute('id');
    const layer = document.createElement('div');
    layer.className = 'map-layer zooming';
    layer.innerHTML = mapSVG(to);
    if (out) oldLayer.before(layer); else oldLayer.after(layer);
    wrap.classList.add('lvl-anim');
    wrap.style.height = h0 + 'px';
    const h1 = layer.offsetHeight + bord;
    const svg = $('svg', layer);
    const full = [0, 0, ...mapSize(to)];
    // zoom ut: det større kartet starter inni hjemområdet (der vi nettopp var) og trekker seg tilbake
    const start = link === 'nest' && out ? fitBox(homeBox(to), to) : null;
    if (start) svg.setAttribute('viewBox', start.join(' '));
    updateMapChrome();
    const D = link === 'nest' ? (out ? 760 : 320) : 540;
    const set = (el, tr, op) => { el.style.transform = tr; el.style.opacity = op; };
    if (link === 'slide') { set(oldLayer, 'translateY(0)', 1); set(layer, `translateY(${out ? h0 : -h1}px)`, 1); }
    else if (link === 'scale') { set(oldLayer, 'scale(1)', 1); set(layer, out ? 'scale(1.5)' : 'scale(.65)', 0); }
    else if (!out) set(layer, 'scale(.97)', 0);
    void wrap.offsetHeight;
    const ease = `${D}ms cubic-bezier(.45,0,.2,1)`;
    wrap.style.transition = `height ${ease}`;
    wrap.style.height = h1 + 'px';
    oldLayer.style.transition = layer.style.transition = `transform ${ease}, opacity ${ease}`;
    if (link === 'slide') { set(oldLayer, `translateY(${out ? -h0 : h1}px)`, 1); set(layer, 'translateY(0)', 1); }
    else if (link === 'scale') { set(oldLayer, out ? 'scale(.65)' : 'scale(1.5)', 0); set(layer, 'scale(1)', 1); }
    else if (out) { oldLayer.style.transition = 'opacity 260ms ease'; oldLayer.style.opacity = 0; }
    else set(layer, 'scale(1)', 1);
    if (start) await tweenViewBox(svg, start, full, D); else await sleep(D + 30);
    oldLayer.remove();
    layer.removeAttribute('style');
    wrap.classList.remove('lvl-anim');
    wrap.style.height = ''; wrap.style.transition = '';
    if (!ERAS[to].space) { svg.setAttribute('viewBox', full.join(' ')); viewBox = { map: ERAS[to].map, v: full }; }
    requestAnimationFrame(() => layer.classList.remove('zooming'));
    setupMapGestures();
  } catch (err) {
    console.warn('zoom', err);
    renderMap();
  } finally {
    levelBusy = false;
  }
}

function setupMapGestures() {
  const svg = $('#map-svg');
  if (!svg) return;
  const space = !!ERAS[mapEra].space;
  const [mw] = mapSize(mapEra);
  const minW = mw * 0.22;
  const pts = new Map();
  let start = null, moved = false, fired = false;
  // skjermpunkt → kartkoordinater for et gitt utsnitt (kartet kan være sentrert med marg på sidene)
  const mapPt = (v, cx, cy) => {
    const r = svg.getBoundingClientRect();
    const k = Math.max(v[2] / r.width, v[3] / r.height);
    return [(cx - r.left - (r.width - v[2] / k) / 2) * k + v[0], (cy - r.top - (r.height - v[3] / k) / 2) * k + v[1], k];
  };
  const onHome = (cx, cy) => {
    const el = document.elementFromPoint(cx, cy);
    const reg = el && el.closest && el.closest('[data-id]');
    return !!reg && svg.contains(reg) && reg.dataset.id === ERAS[mapEra].home;
  };
  const jump = (d) => { if (fired) return; fired = true; goLevel(mapEra + d); };
  const snapshot = () => ({ v: viewBox && !space ? viewBox.v.slice() : null, pts: new Map([...pts].map(([k, p]) => [k, { ...p }])) });
  svg.addEventListener('pointerdown', (e) => {
    if (levelBusy) return;
    if (e.isPrimary) pts.clear();
    if (!space) { try { svg.setPointerCapture(e.pointerId); } catch { /* pekeren er allerede borte */ } }
    if (pts.size === 0) { fired = false; moved = false; }
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    start = snapshot();
  });
  svg.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId) || !start || fired || levelBusy) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 1) {
      if (space) return;
      const p0 = start.pts.get(e.pointerId);
      if (!p0) return;
      const dx = e.clientX - p0.x, dy = e.clientY - p0.y;
      if (Math.hypot(dx, dy) > 8) moved = true;
      const k = mapPt(start.v, 0, 0)[2];
      if (moved && start.v[2] < mw * 0.98) setViewBox([start.v[0] - dx * k, start.v[1] - dy * k, start.v[2], start.v[3]]);
    } else if (pts.size === 2) {
      moved = true;
      const [a, b] = [...pts.values()];
      const [a0, b0] = [...start.pts.values()];
      if (!a0 || !b0) return;
      const d0 = Math.hypot(a0.x - b0.x, a0.y - b0.y), d1 = Math.hypot(a.x - b.x, a.y - b.y);
      if (d0 < 10 || d1 < 1) return;
      const scale = d0 / d1; // over 1 = fingrene nærmer seg hverandre = zoom ut
      const cx = (a0.x + b0.x) / 2, cy = (a0.y + b0.y) / 2;
      if (space) { if (scale > 1.35) jump(1); else if (scale < 0.72) jump(-1); return; }
      const wantW = start.v[2] * scale;
      // knip forbi hele kartet → neste kapittel; knip helt inn på hjemområdet → forrige kapittel
      if (wantW > mw * 1.3 && mapEra < ERAS.length - 1) { jump(1); return; }
      if (wantW < minW * 0.68 && mapEra > 0 && onHome(cx, cy)) { jump(-1); return; }
      const [mx, my] = mapPt(start.v, cx, cy);
      setViewBox([mx - (mx - start.v[0]) * scale, my - (my - start.v[1]) * scale, start.v[2] * scale, start.v[3] * scale]);
    }
  });
  const end = (e) => {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    if (!space && !moved && !fired && !levelBusy && pts.size === 0 && start) {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const reg = el && el.closest && el.closest('[data-id]');
      if (reg && svg.contains(reg)) selectRegion(reg.dataset.id);
    }
    if (pts.size === 0) start = null;
    else start = snapshot();
  };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);
  if (space) svg.addEventListener('pointerleave', end);
  let wheelAcc = 0, wheelT = 0;
  svg.addEventListener('wheel', (e) => {
    if (space && !e.ctrlKey) return; // romkartet: vanlig musehjul ruller siden
    e.preventDefault();
    if (levelBusy) return;
    const now = performance.now();
    if (now - wheelT > 400) wheelAcc = 0;
    wheelT = now;
    // knip på styreplate (ctrl + hjul) forbi grensen bytter kapittel; vanlig musehjul gjør det ikke
    const over = (d) => { wheelAcc += e.deltaY; if (Math.abs(wheelAcc) > 120) { wheelAcc = 0; goLevel(mapEra + d); } };
    if (space) { over(e.deltaY > 0 ? 1 : -1); return; }
    const v = viewBox.v;
    const zoomOut = e.deltaY > 0;
    if (e.ctrlKey && zoomOut && v[2] >= mw * 0.98 && mapEra < ERAS.length - 1) { over(1); return; }
    if (e.ctrlKey && !zoomOut && v[2] <= minW * 1.02 && mapEra > 0 && onHome(e.clientX, e.clientY)) { over(-1); return; }
    const [mx, my] = mapPt(v, e.clientX, e.clientY);
    const s = zoomOut ? 1.15 : 1 / 1.15;
    setViewBox([mx - (mx - v[0]) * s, my - (my - v[1]) * s, v[2] * s, v[3] * s]);
  }, { passive: false });
  if (!space) setViewBox(viewBox.v);
}
// Romkart: trykk på planetene
document.addEventListener('click', (e) => {
  const node = !levelBusy && e.target.closest && e.target.closest('.space-map .node[data-id]');
  if (node) selectRegion(node.dataset.id);
});

// ---------------- KAMP ----------------

// ---------------- UTPLASSERING ----------------
// Før hver kamp plasserer du troppene i tre korridorer. Fienden har en type i hver korridor (med en svakhet),
// og du vinner ved å vinne korridorer med over halvparten av fiendens styrke.
let dep = null; // { r, plan, sel: valgt enhetstype, take: hvor mange deler som skal flyttes }
let lastPlan = null; // forrige plan (i minnet), så neste angrep går raskere
function openDeploy(id) {
  const r = REGION_BY_ID[id];
  if (!r || S.conquered[id]) return;
  unlockAudio();
  if (!E.squadsOf(S, r).length) { sfx.nope(); toast(t('no_troops')); return; }
  dep = { r, plan: {}, sel: null, take: 0 };
  const m = openModal('<div class="deploy" id="deploy"></div>', 'deploy-modal', () => { dep = null; });
  renderDeploy();
  wireDeploy(m);
}
const laneAt = (x, y) => { const el = document.elementFromPoint(x, y); return el && el.closest ? el.closest('#deploy .dlane:not(.empty)') : null; };
// Troppene vises samlet: ett kort per enhetstype i «Dine tropper» og ett per enhetstype i hver korridor.
// Hver type består av opptil tre deler, så den kan spres på flere korridorer.
function groupSquads(list) {
  const map = new Map();
  for (const q of list) {
    let g = map.get(q.unit);
    if (!g) { g = { unit: q.unit, cls: q.cls, keys: [], counts: [], count: 0, power: 0 }; map.set(q.unit, g); }
    g.keys.push(q.key); g.counts.push(q.count); g.count += q.count; g.power += q.power;
  }
  return [...map.values()];
}
const unitOfKey = (key) => key.slice(0, key.lastIndexOf(':'));
function squadChip(g, lane = null) {
  const placed = lane !== null;
  const sel = !placed && dep && dep.sel === g.unit;
  return `<button type="button" class="squad${placed ? ' placed' : ''}${sel ? ' sel' : ''}" data-unit="${g.unit}"${placed ? ` data-lane="${lane}"` : ''} aria-label="${esc(L(UNIT_BY_ID[g.unit].name))} ×${g.count}">
    <span class="sq-art">${A.unitArt(g.unit, 'me')}</span><span class="sq-n">×${fmt(g.count)}</span>${placed ? '' : `<span class="sq-p">${ico('cls_' + g.cls)}${fmt(g.power)}</span>`}</button>`;
}
// Velg hvor mange som skal sendes når en enhetstype har flere deler: alle, to tredjedeler eller en tredjedel
function takeRowHTML(g) {
  if (!g || g.keys.length < 2) return '';
  const opts = [];
  for (let j = g.keys.length; j >= 1; j--) {
    const n = g.counts.slice(0, j).reduce((a, x) => a + x, 0);
    opts.push(`<button type="button" class="take${dep.take === j ? ' on' : ''}" data-take="${j}">${j === g.keys.length ? t('take_all', { n: fmt(n) }) : '×' + fmt(n)}</button>`);
  }
  return `<div class="take-row"><span>${t('take_how_many', { u: esc(L(UNIT_BY_ID[g.unit].name)) })}</span>${opts.join('')}</div>`;
}
function renderDeploy() {
  const el = $('#deploy');
  if (!el || !dep) return;
  const { r, plan } = dep;
  const ev = E.laneEval(S, r, plan);
  const T = TERRAINS[r.terrain];
  const free = groupSquads(ev.squads.filter((q) => !Number.isInteger(plan[q.key])));
  const selG = dep.sel ? free.find((g) => g.unit === dep.sel) : null;
  if (dep.sel && !selG) dep.sel = null;
  const tid = E.tacticId(S);
  const sc = el.closest('.modal')?.scrollTop || 0;
  el.innerHTML = `<div class="modal-head"><h2 class="h2">${t('deploy_title')}</h2><button type="button" class="icon-btn" data-action="close" aria-label="${t('close')}">${ico('close')}</button></div>
    <div class="deploy-sub"><b>${esc(L(r.name))}</b>${T ? `<span class="terrain-chip" style="--tc:${T.color}">${esc(L(T.name))}</span>` : ''}<span class="deploy-rule">${t('deploy_rule')}</span></div>
    <div class="deploy-field">${ev.lanes.map((ln, l) => {
      if (!ln.share) return `<div class="dlane empty" data-lane="${l}"><div class="dlane-name">${t(LANE_KEYS[l])}</div><div class="dlane-emptytxt">${t('lane_empty')}</div></div>`;
      const LT = LANE_TYPES[ln.type];
      const mine = groupSquads(ev.squads.filter((q) => plan[q.key] === l));
      return `<div class="dlane${dep.sel ? ' armed' : ''}" data-lane="${l}">
        <div class="dlane-name">${t(LANE_KEYS[l])} <small>${Math.round(ln.share * 100)} %</small></div>
        <div class="dlane-foe"><span class="ltype">${ico(LT.icon)}${esc(L(LT.name))}</span><span class="lstr">${ico('skull')}${fmt(ln.D)}</span>
          <span class="lweak">${t('weak_vs')} ${ico('cls_' + LT.weak)}</span>${LT.bad ? `<span class="lbad">${ico('cls_' + LT.bad)}−50 %</span>` : ''}</div>
        <div class="dlane-vs"><span class="lch ${chanceClass(ln.chance)}">${pct(ln.chance)}</span></div>
        <div class="dlane-me">${mine.map((g) => squadChip(g, l)).join('') || `<span class="dlane-drop">${t('lane_drop')}</span>`}</div>
        <div class="lstr me">${ico('swords')}${fmt(ln.P)}</div>
      </div>`;
    }).join('')}</div>
    <div class="meter deploy-meter"><div class="meter-fill ${chanceClass(ev.chance)}" style="width:${ev.chance * 100}%"></div><span>${pct(ev.chance)} ${t('win_chance')}</span></div>
    <div class="tactic-pick">${TACTIC_IDS.map((id) => {
      const ch = ev.placed ? E.laneEval(S, r, plan, id).chance : 0;
      return `<button type="button" class="tactic ${tid === id ? 'on' : ''}" data-dt="${id}"><b>${esc(L(TACTICS[id].name))}</b><span class="tactic-ch ${chanceClass(ch)}">${pct(ch)}</span></button>`;
    }).join('')}</div>
    <div class="deploy-tray-head"><b>${t('your_troops')}</b><span>${free.length ? t('tray_hint') : t('all_placed')}</span></div>
    ${takeRowHTML(selG)}
    <div class="deploy-tray">${free.map((g) => squadChip(g)).join('')}</div>
    <div class="deploy-actions">
      <button type="button" class="btn btn-soft" data-dep="auto">${ico('star')} ${t('auto_deploy')}</button>
      ${lastPlan ? `<button type="button" class="btn btn-soft" data-dep="last">${t('last_plan')}</button>` : ''}
      <button type="button" class="btn btn-soft" data-dep="clear">${t('clear')}</button>
    </div>
    <button type="button" class="btn btn-attack big" data-dep="go" ${ev.placed ? '' : 'disabled'}>${ico('swords')} ${t('to_battle')}</button>
    <p class="small deploy-note">${t('home_note')}</p>`;
  const md = el.closest('.modal');
  if (md) md.scrollTop = sc;
}
// Sender take deler av en enhetstype fra «Dine tropper» til korridoren l (alle hvis take mangler)
function placeGroup(unit, l, take = Infinity) {
  if (!dep) return;
  const lanes = E.enemyLanes(dep.r);
  if (!lanes[l] || !lanes[l].share) return;
  const free = E.squadsOf(S, dep.r).filter((q) => q.unit === unit && !Number.isInteger(dep.plan[q.key]));
  free.slice(0, take || Infinity).forEach((q) => { dep.plan[q.key] = l; });
  dep.sel = null;
  dep.take = 0;
  sfx.recruit();
  renderDeploy();
}
// Flytter hele gruppen av en enhetstype fra én korridor til en annen (to = null: tilbake til «Dine tropper»)
function moveLaneGroup(unit, from, to) {
  if (!dep || from === to) return;
  if (to !== null) { const lanes = E.enemyLanes(dep.r); if (!lanes[to] || !lanes[to].share) return; }
  for (const [k, l] of Object.entries(dep.plan)) {
    if (l !== from || unitOfKey(k) !== unit) continue;
    if (to === null) delete dep.plan[k]; else dep.plan[k] = to;
  }
  to === null ? sfx.click() : sfx.recruit();
  renderDeploy();
}
function wireDeploy(m) {
  let drag = null;
  m.addEventListener('pointerdown', (e) => {
    const sq = e.target.closest('.squad');
    if (!sq || !dep) return;
    drag = { unit: sq.dataset.unit, from: sq.dataset.lane != null ? Number(sq.dataset.lane) : null, x: e.clientX, y: e.clientY, moved: false, ghost: null, src: sq };
    try { sq.setPointerCapture(e.pointerId); } catch { /* pekeren er allerede borte */ }
  });
  m.addEventListener('pointermove', (e) => {
    if (!drag) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 8) return;
    if (!drag.moved) {
      drag.moved = true;
      drag.ghost = drag.src.cloneNode(true);
      drag.ghost.classList.add('ghost');
      document.body.appendChild(drag.ghost);
    }
    drag.ghost.style.left = e.clientX + 'px';
    drag.ghost.style.top = e.clientY + 'px';
    const lane = laneAt(e.clientX, e.clientY);
    $$('#deploy .dlane').forEach((x) => x.classList.toggle('over', x === lane));
  });
  const up = (e) => {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (d.ghost) d.ghost.remove();
    $$('#deploy .dlane').forEach((x) => x.classList.remove('over'));
    if (!dep) return;
    if (d.moved) {
      const lane = laneAt(e.clientX, e.clientY);
      const to = lane ? Number(lane.dataset.lane) : null;
      if (d.from !== null) moveLaneGroup(d.unit, d.from, to);
      else if (to !== null) placeGroup(d.unit, to, dep.sel === d.unit ? dep.take : Infinity);
      return;
    }
    if (d.from !== null) { moveLaneGroup(d.unit, d.from, null); return; }
    const occ = E.enemyLanes(dep.r).map((x, i) => (x.share ? i : -1)).filter((i) => i >= 0);
    if (occ.length === 1) { placeGroup(d.unit, occ[0]); return; }
    if (dep.sel === d.unit) { dep.sel = null; dep.take = 0; } else {
      dep.sel = d.unit;
      dep.take = E.squadsOf(S, dep.r).filter((q) => q.unit === d.unit && !Number.isInteger(dep.plan[q.key])).length; // alle
    }
    sfx.click();
    renderDeploy();
  };
  m.addEventListener('pointerup', up);
  m.addEventListener('pointercancel', () => { if (drag && drag.ghost) drag.ghost.remove(); drag = null; });
  m.addEventListener('click', (e) => {
    if (!dep) return;
    const lane = e.target.closest('.dlane:not(.empty)');
    if (lane && dep.sel && !e.target.closest('.squad')) { placeGroup(dep.sel, Number(lane.dataset.lane), dep.take); return; }
    const b = e.target.closest('[data-dep],[data-dt],[data-take]');
    if (!b) return;
    if (b.dataset.take) { dep.take = Number(b.dataset.take); sfx.click(); renderDeploy(); return; }
    if (b.dataset.dt) {
      if (TACTICS[b.dataset.dt]) { S.settings.tactic = b.dataset.dt; persist(); sfx.click(); renderDeploy(); }
      return;
    }
    const a = b.dataset.dep;
    if (a === 'auto') { dep.plan = E.autoDeploy(S, dep.r); dep.sel = null; sfx.buy(); renderDeploy(); }
    else if (a === 'last' && lastPlan) {
      const keys = new Set(E.squadsOf(S, dep.r).map((q) => q.key));
      const lanes = E.enemyLanes(dep.r);
      dep.plan = {};
      for (const [k, l] of Object.entries(lastPlan)) if (keys.has(k) && lanes[l] && lanes[l].share) dep.plan[k] = l;
      sfx.click();
      renderDeploy();
    } else if (a === 'clear') { dep.plan = {}; dep.sel = null; sfx.click(); renderDeploy(); }
    else if (a === 'go') {
      const plan = { ...dep.plan };
      const id = dep.r.id;
      if (!Object.keys(plan).length) return;
      lastPlan = plan;
      dep = null;
      closeModal(b);
      startBattle(id, plan);
    }
  });
}

// Interaktiv kamp: hæren din har liv som tappes av fiendens ild. Fienden varsler spesialangrep –
// kanonsalve (stopp den med Skjold) og stormangrep (trykk på kapteinen tre ganger). Treff på rad gir kombo.
// Uten innsats blir utfallet som vinnersjansen; god innsats gir seier oftere, færre tap og flere stjerner.
const PRE_MS = 750;
const TAP_DMG = 0.022;
const ARTY_DMG = 0.05;
const AIR_DMG = 0.25;
const SHIELD_MS = 1300;
const SHIELD_CD = 4200;
const COUNTER_DMG = 0.04;
const COMBO_MAX = 1.75;
const ABILITY_DMG = { bribe: 0.2, nuts: 0.1, laser: 0.22 };
const starRow = (n, cls = '') => `<span class="stars-row ${cls}">${[1, 2, 3].map((i) => `<span class="st ${i <= n ? 'on' : ''}">${ico('star')}</span>`).join('')}</span>`;
function startBattle(id, plan = null) {
  const r = REGION_BY_ID[id];
  if (!r || S.conquered[id]) return;
  unlockAudio();
  const prep = E.prepareBattle(S, id, undefined, Math.random, Date.now(), plan);
  if (!prep) { sfx.nope(); toast(t('no_troops')); return; }
  showBattle(r, prep);
}

// Hva slags skudd hver troppetype sender over slagmarken (lyden kommer fra sfx.gun)
const SHOT = { militia: 'bullet', hunter: 'bullet', truck: 'bullet', soldier: 'bullet', heli: 'bullet', tank: 'shell', ship: 'shell', mech: 'shell', megamech: 'shell', jet: 'missile', rocket: 'missile', carrier: 'missile', drone: 'laser', spacemarine: 'laser', spacefighter: 'laser', laser: 'laser', ohiostar: 'laser' };
function showBattle(r, prep) {
  modalCount++;
  updateTutorial();
  const ov = document.createElement('div');
  ov.className = 'battle live' + (ERAS[S.era].space ? ' space' : '');
  const T = TERRAINS[r.terrain];
  const ab = prep.ability ? C.ABILITIES[prep.ability] : null;
  // troppene som vises (og skyter) i hver korridor: de to sterkeste typene du sendte dit
  const laneUnits = prep.lanes.map((ln, l) => [...new Set(prep.squads.filter((q) => prep.plan[q.key] === l).map((q) => q.unit))].slice(0, 2));
  const laneRows = prep.lanes.map((ln, l) => {
    const mineHere = laneUnits[l];
    const foe = ln.share ? (ln.share >= 0.4 ? [enemyArtFor(r, l), enemyArtFor(r, l + 1)] : [enemyArtFor(r, l)]) : [];
    return `<div class="lane-row${ln.share ? '' : ' empty'}" data-lane="${l}"><span class="lane-tag">${t(LANE_KEYS[l])}${ln.share ? ` ${ico(LANE_TYPES[ln.type].icon)}` : ''}</span>
      <div class="lane-me">${mineHere.map((id, i) => `<div class="fighter" style="--i:${i + l}">${A.unitArt(id, 'me')}</div>`).join('')}</div>
      <div class="lane-foe">${foe.map((svg, i) => `<div class="fighter" style="--i:${i + l}">${svg}</div>`).join('')}</div></div>`;
  }).join('');
  ov.innerHTML = `<div class="battle-inner">
    <div class="battle-head"><div class="eyebrow">${esc(L(TACTICS[prep.tactic].name))}${T ? ' · ' + esc(L(T.name)) : ''}</div><h2>${esc(L(r.name))}</h2></div>
    <div class="battle-bars">
      <div class="bbar me"><div class="bbar-label">${t('you')} · ${fmt(prep.P)}</div><div class="bbar-track"><div class="bbar-fill"></div></div></div>
      <div class="bvs">${t('vs')}</div>
      <div class="bbar foe"><div class="bbar-label">${fmt(prep.D)}</div><div class="bbar-track"><div class="bbar-fill"></div></div></div>
    </div>
    <div class="battle-status"><span class="combo" hidden></span>${starRow(3, 'live-stars')}</div>
    <div class="battlefield lanes">
      ${laneRows}
      <div class="shield-wall"></div>
      <div class="targets"></div>
      <div class="booms"></div>
      <div class="warn" hidden><span class="warn-txt"></span><span class="warn-bar"><span></span></span></div>
      ${(() => { const call = say('call', 'battle_go'); return `<div class="battle-call${call.length > 8 ? ' long' : ''}">${esc(call)}</div>`; })()}
    </div>
    <p class="battle-hint">${prep.specials.length ? t('battle_hint2') : t('battle_hint')}</p>
    <div class="ability-bar">
      <button type="button" class="ability arty" data-ab="arty"><span class="ab-ico">${ico('boom')}</span><b>${t('ab_arty')}</b><span class="ab-cd"></span></button>
      <button type="button" class="ability shield" data-ab="shield"><span class="ab-ico">${ico('shield')}</span><b>${t('ab_shield')}</b><span class="ab-cd"></span></button>
      ${ab ? `<button type="button" class="ability gen" data-ab="gen"><span class="ab-ico gen-face">${miniGeneral()}</span><b>${esc(L(ab.name))}</b></button>` : ''}
      ${prep.airstrike ? `<button type="button" class="ability air" data-ab="air"><span class="ab-ico">${ico('rocket')}</span><b>${t('ab_air')}</b></button>` : ''}
    </div>
    <div class="battle-sub"><button type="button" class="link-btn" data-ab="retreat">${ico('flag')} ${t('ab_retreat')}</button><button type="button" class="link-btn" data-ab="skip">${ico('ffwd')} ${t('ab_skip')}</button></div>
  </div>`;
  $('#overlay-root').appendChild(ov);
  const meFill = $('.bbar.me .bbar-fill', ov), foeFill = $('.bbar.foe .bbar-fill', ov);
  const field = $('.battlefield', ov), targets = $('.targets', ov), booms = $('.booms', ov);
  const warnEl = $('.warn', ov), warnTxt = $('.warn-txt', ov), warnBar = $('.warn-bar span', ov);
  const comboEl = $('.combo', ov), liveStars = $$('.live-stars .st', ov);
  const artyBtn = $('[data-ab="arty"]', ov), artyCd = $('.ab-cd', artyBtn);
  const shieldBtn = $('[data-ab="shield"]', ov), shieldCd = $('.ab-cd', shieldBtn);
  const st = {
    t: -PRE_MS, last: 0, score: 0, hp: 1, done: false, combo: 1, bestCombo: 1, lastHit: -1e9, hits: 0, arty: 0,
    artyReady: 400, shieldUntil: -1, shieldReady: 0, nextSp: 0, warn: null, blocked: 0, missed: 0,
    genUsed: false, air: false, stunUntil: -1, cancelled: {}, nextSpawn: 150, nextVolley: 60, nextFoe: 700,
  };
  const words = getLang() === 'en' ? ['POW!', 'BOOM!', 'BANG!', 'ZAP!', 'CRASH!', 'WHAM!'] : ['POW!', 'BOOM!', 'BANG!', 'ZAP!', 'KRASJ!', 'PANG!'];
  const colors = ['#ffd23f', '#ff8a3d', '#ff5d8f', '#7ffcff'];
  const early = () => (prep.early && st.t < prep.early ? 2 : 1);
  // salve: en tropp i en korridor skyter – egen lyd per troppetype, munningsflamme og et skudd over til fienden
  const rows = $$('.lane-row', ov);
  const myLanes = prep.lanes.map((ln, l) => l).filter((l) => prep.lanes[l].share && laneUnits[l].length);
  const foeLanes = prep.lanes.map((ln, l) => l).filter((l) => prep.lanes[l].share);
  const shot = (l, cls, foe = false) => {
    if (reducedMotion() || !rows[l]) return;
    const tr = document.createElement('span');
    tr.className = 'tracer ' + cls + (foe ? ' foe' : '');
    tr.style.top = 30 + Math.random() * 34 + '%';
    rows[l].appendChild(tr);
    setTimeout(() => tr.remove(), 520);
  };
  const flash = (el) => { if (!el || reducedMotion()) return; el.classList.remove('fire'); void el.offsetWidth; el.classList.add('fire'); };
  const volley = () => {
    if (!myLanes.length) return;
    const l = myLanes[Math.floor(Math.random() * myLanes.length)];
    const k = Math.floor(Math.random() * laneUnits[l].length);
    const unit = laneUnits[l][k];
    sfx.gun(unit);
    flash(rows[l] && $$('.lane-me .fighter', rows[l])[k]);
    shot(l, SHOT[unit] || 'bullet');
    if (Math.random() < 0.45) setTimeout(() => { if (!st.done) boom(70 + Math.random() * 14, l * 33.3 + 6 + Math.random() * 18, ''); }, 260);
  };
  const foeVolley = () => {
    if (!foeLanes.length) return;
    const l = foeLanes[Math.floor(Math.random() * foeLanes.length)];
    sfx.gun('foe');
    const f = rows[l] && $$('.lane-foe .fighter', rows[l]);
    flash(f && f[Math.floor(Math.random() * f.length)]);
    shot(l, 'bullet', true);
  };
  // troppene i korridoren der et mål blir truffet, skyter med sin egen lyd
  const laneGun = (l) => { const u = laneUnits[l] && laneUnits[l][0]; return u || 'soldier'; };
  let raf = 0;
  requestAnimationFrame(() => ov.classList.add('go'));
  const boom = (x, y, word, big = false) => {
    const b = document.createElement('div');
    b.className = 'boom' + (big ? ' big' : '') + (word ? '' : ' hit');
    b.style.left = x + '%';
    b.style.top = y + '%';
    b.innerHTML = `<svg viewBox="0 0 100 100"><path d="M50 4l9 24 25-12-10 25 24 9-24 10 12 25-25-10-11 23-9-23-25 11 11-25-24-11 24-9-12-25 25 12z" fill="${colors[Math.floor(Math.random() * colors.length)]}" stroke="#2b2350" stroke-width="4" stroke-linejoin="round"/></svg><span>${word}</span>`;
    booms.appendChild(b);
    setTimeout(() => b.remove(), 700);
  };
  const floatTxt = (x, y, txt, cls = '') => {
    const d = document.createElement('div');
    d.className = 'dmg-float ' + cls;
    d.style.left = x + '%';
    d.style.top = y + '%';
    d.textContent = txt;
    booms.appendChild(d);
    setTimeout(() => d.remove(), 900);
  };
  const dmg = (v, x, y) => { st.score += v; floatTxt(x, y, '-' + Math.max(1, Math.round((v / prep.need) * 100)) + '%'); };
  const showCombo = () => {
    comboEl.hidden = st.combo < 1.1;
    comboEl.textContent = t('combo', { n: fmt(Math.round(st.combo * 100) / 100) });
    comboEl.classList.remove('bump'); void comboEl.offsetWidth; comboEl.classList.add('bump');
  };
  const bump = (inc) => { st.combo = Math.min(COMBO_MAX, st.combo + inc); st.bestCombo = Math.max(st.bestCombo, st.combo); showCombo(); };
  const breakCombo = () => { if (st.combo > 1) { st.combo = 1; showCombo(); } };
  const hitTarget = (b, x, y) => {
    if (b.dataset.hit || st.done || st.t < 0) return false;
    b.dataset.hit = '1';
    b.classList.add('hit');
    st.hits++;
    if (st.t - st.lastHit <= 1400) bump(0.15); else { st.combo = 1; bump(0); }
    st.lastHit = st.t;
    dmg(TAP_DMG * st.combo * early(), x + 2, y);
    boom(x + 4, y + 6, words[st.hits % words.length]);
    sfx.hit();
    sfx.gun(laneGun(b._lane));
    if (S.settings.vibrate) buzz(12);
    setTimeout(() => b.remove(), 260);
    return true;
  };
  const spawnTarget = () => {
    if (targets.querySelectorAll('.target:not(.captain)').length >= 3) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'target';
    b.setAttribute('aria-label', t('target_label'));
    const occ = prep.lanes.map((ln, i) => (ln.share ? i : -1)).filter((i) => i >= 0);
    const lane = occ[Math.floor(Math.random() * occ.length)];
    const x = 54 + Math.random() * 33, y = lane * 33.3 + 2 + Math.random() * 16;
    b.style.left = x + '%';
    b.style.top = y + '%';
    b.innerHTML = `${enemyArtFor(r, Math.floor(Math.random() * 3))}<span class="target-ring"></span>`;
    b._xy = [x, y];
    b._lane = lane;
    const kill = (e) => { e.preventDefault(); e.stopPropagation(); hitTarget(b, x, y); };
    b.addEventListener('pointerdown', kill);
    b.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') kill(e); });
    targets.appendChild(b);
    setTimeout(() => { if (!b.dataset.hit && b.isConnected) { b.classList.add('gone'); breakCombo(); setTimeout(() => b.remove(), 250); } }, 1400);
  };
  // stormangrep: kapteinen må treffes tre ganger før angrepet slår inn
  const spawnCaptain = (w) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'target captain';
    b.setAttribute('aria-label', t('captain_label'));
    b.style.left = '60%';
    b.style.top = (w.lane ?? 1) * 33.3 + 1 + '%';
    b.innerHTML = `${enemyArtFor(r, 0)}<span class="target-ring"></span><span class="cap-n">3</span>`;
    let left = 3;
    const hit = (e) => {
      e.preventDefault(); e.stopPropagation();
      if (!st.warn || st.warn !== w || st.done) return;
      left--;
      b.querySelector('.cap-n').textContent = Math.max(0, left);
      b.classList.remove('hurt'); void b.offsetWidth; b.classList.add('hurt');
      sfx.pew();
      if (S.settings.vibrate) buzz(15);
      if (left <= 0) { w.capDown = true; b.classList.add('hit'); setTimeout(() => b.remove(), 260); resolveWarn(); }
    };
    b.addEventListener('pointerdown', hit);
    b.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') hit(e); });
    targets.appendChild(b);
    w.cap = b;
  };
  const startWarn = (k) => {
    const sp = prep.specials[k];
    const w = { k, type: sp.type, impact: sp.at, from: st.t, lane: sp.lane };
    st.warn = w;
    warnEl.hidden = false;
    warnEl.className = 'warn ' + sp.type;
    const laneName = t('lane_full_' + (sp.lane ?? 1));
    warnTxt.textContent = sp.type === 'barrage' ? t('warn_barrage_lane', { lane: laneName }) : t('warn_charge_lane', { lane: laneName });
    $$('.lane-row', ov).forEach((x) => x.classList.toggle('alarm', Number(x.dataset.lane) === sp.lane));
    if (sp.type === 'charge') spawnCaptain(w);
    shieldBtn.classList.toggle('alert', sp.type === 'barrage');
    sfx.alarm();
    if (S.settings.vibrate) buzz(20);
  };
  const resolveWarn = () => {
    const w = st.warn;
    if (!w) return;
    st.warn = null;
    st.nextSp = w.k + 1;
    warnEl.hidden = true;
    shieldBtn.classList.remove('alert');
    $$('.lane-row.alarm', ov).forEach((x) => x.classList.remove('alarm'));
    if (w.cap && w.cap.isConnected && !w.capDown) { w.cap.classList.add('gone'); setTimeout(() => w.cap && w.cap.remove(), 250); }
    if (st.cancelled[w.k]) return;
    const ok = w.type === 'barrage' ? st.t <= st.shieldUntil : !!w.capDown;
    if (ok) {
      st.blocked++;
      st.score += COUNTER_DMG;
      bump(0.3);
      floatTxt(44, 30, t('blocked'), 'good');
      sfx.shield();
    } else {
      st.missed++;
      st.hp -= E.SP_HP;
      st.combo = 1;
      showCombo();
      floatTxt(18, 34, '-' + Math.round(E.SP_HP * 100) + ' %', 'bad');
      ov.classList.remove('hurt'); void ov.offsetWidth; ov.classList.add('hurt');
      for (let i = 0; i < 3; i++) setTimeout(() => boom(10 + Math.random() * 34, 20 + Math.random() * 45, 'BOOM!', i === 1), i * 90);
      sfx.boom();
      if (S.settings.vibrate) buzz(90);
    }
  };
  const finish = (kind) => {
    if (st.done) return;
    st.done = true;
    cancelAnimationFrame(raf);
    let perf;
    if (kind === 'skip') {
      const a = E.finishAuto(prep, { t: Math.max(0, st.t), score: st.score, hp: st.hp, nextSp: st.warn ? st.warn.k : st.nextSp, cancelled: st.cancelled });
      perf = { score: a.score, hp: a.hp };
    } else perf = { score: st.score, hp: st.hp, retreat: kind === 'retreat' };
    targets.innerHTML = '';
    warnEl.hidden = true;
    ov.classList.add('ending');
    const res = E.resolveBattle(S, prep, perf);
    if (!res) { ov.remove(); modalCount = Math.max(0, modalCount - 1); renderTab(); return; }
    Object.assign(res, { hits: st.hits, arty: st.arty, bestCombo: st.bestCombo, blocked: st.blocked, specials: prep.specials.length });
    S.stats.blocked = (S.stats.blocked || 0) + st.blocked;
    lastBattle = res;
    persist();
    foeFill.style.width = res.win ? '0%' : Math.max(6, (1 - Math.min(1, res.score / prep.need)) * 100) + '%';
    meFill.style.width = Math.max(4, res.hp * 100) + '%';
    if (res.win) for (let i = 0; i < 4; i++) setTimeout(() => boom(58 + Math.random() * 30, 10 + Math.random() * 50, words[i], true), i * 90);
    setTimeout(() => showBattleResult(ov, r, res), kind === 'skip' || kind === 'retreat' ? 150 : 650);
  };
  const step = (now) => {
    if (st.done || !ov.isConnected) return;
    const dt = st.last ? Math.min(100, now - st.last) : 16;
    st.last = now;
    const prev = st.t;
    st.t += dt;
    if (prev < 0 && st.t >= 0) ov.classList.add('fighting');
    if (st.t >= 0) {
      const d = st.t - Math.max(0, prev);
      st.score += prep.autoRate * d;
      if (st.t > st.stunUntil) st.hp -= prep.drain * d;
      if (st.t >= st.nextSpawn) { spawnTarget(); st.nextSpawn = st.t + 520 + Math.random() * 260; }
      if (st.t >= st.nextVolley) { volley(); st.nextVolley = st.t + 420 + Math.random() * 380; }
      if (st.t >= st.nextFoe && st.t > st.stunUntil) { foeVolley(); st.nextFoe = st.t + 900 + Math.random() * 600; }
      if (Math.random() < 0.02) boom(20 + Math.random() * 60, 15 + Math.random() * 55, words[Math.floor(Math.random() * words.length)]);
      // fiendens spesialangrep
      while (!st.warn && st.nextSp < prep.specials.length && st.cancelled[st.nextSp]) st.nextSp++;
      if (!st.warn && st.nextSp < prep.specials.length && st.t >= prep.specials[st.nextSp].at - prep.warnMs) startWarn(st.nextSp);
      if (st.warn) {
        const w = st.warn;
        warnBar.style.width = Math.max(0, Math.min(1, (w.impact - st.t) / Math.max(1, w.impact - w.from))) * 100 + '%';
        if (st.t >= w.impact) resolveWarn();
      }
    }
    ov.classList.toggle('shielded', st.t <= st.shieldUntil && st.t >= 0);
    foeFill.style.width = Math.max(0, 1 - st.score / prep.need) * 100 + '%';
    meFill.style.width = Math.max(0, st.hp) * 100 + '%';
    const stars = E.starsFor(st.hp);
    liveStars.forEach((x, i) => x.classList.toggle('on', i < stars));
    const cd = st.artyReady - st.t;
    artyBtn.disabled = cd > 0 || st.t < 0;
    artyBtn.classList.toggle('ready', cd <= 0 && st.t >= 0);
    artyCd.textContent = cd > 0 && st.t >= 0 ? Math.ceil(cd / 1000) : '';
    const sc = st.shieldReady - st.t;
    shieldBtn.disabled = sc > 0 || st.t < 0;
    shieldCd.textContent = sc > 0 && st.t >= 0 ? Math.ceil(sc / 1000) : '';
    if (st.score >= prep.need) { finish('win'); return; }
    if (st.hp <= 0) { finish('lose'); return; }
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  ov.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ab]');
    if (!b || st.done) return;
    const id = b.dataset.ab;
    if (id === 'skip') { sfx.click(); finish('skip'); return; }
    if (id === 'retreat') { sfx.click(); finish('retreat'); return; }
    if (st.t < 0) return;
    if (id === 'arty' && st.t >= st.artyReady) {
      st.artyReady = st.t + prep.artyCd;
      st.arty++;
      for (let i = 0; i < 3; i++) setTimeout(() => boom(60 + Math.random() * 28, 12 + Math.random() * 50, 'BOOM!'), i * 110);
      dmg(ARTY_DMG * prep.artyMult * early(), 70, 20);
      sfx.boom();
      if (S.settings.vibrate) buzz(30);
    } else if (id === 'shield' && st.t >= st.shieldReady) {
      st.shieldUntil = st.t + SHIELD_MS;
      st.shieldReady = st.t + SHIELD_CD;
      sfx.shieldUp();
    } else if (id === 'air' && !st.air) {
      st.air = true;
      b.disabled = true;
      b.classList.add('used');
      const rk = document.createElement('div');
      rk.className = 'air-strike';
      rk.innerHTML = [0, 1, 2].map((i) => `<span style="--d:${i * 0.12}s;--y:${14 + i * 17}%">${A.missileArt()}</span>`).join('');
      field.appendChild(rk);
      setTimeout(() => rk.remove(), 1100);
      setTimeout(() => {
        if (st.done) return;
        for (let i = 0; i < 5; i++) setTimeout(() => boom(56 + Math.random() * 34, 8 + Math.random() * 56, 'KABOOM!', true), i * 80);
        dmg(AIR_DMG, 72, 30);
        sfx.boom();
        if (S.settings.vibrate) buzz(60);
      }, 420);
    } else if (id === 'gen' && !st.genUsed) {
      st.genUsed = true;
      b.disabled = true;
      b.classList.add('used');
      const kind = prep.ability;
      if (kind === 'bribe') {
        const cost = Math.floor(S.money * 0.05);
        S.money -= cost;
        updateHUD();
        // fienden hopper over neste spesialangrep
        if (st.warn) { st.cancelled[st.warn.k] = true; resolveWarn(); } else if (st.nextSp < prep.specials.length) st.cancelled[st.nextSp] = true;
        floatTxt(40, 18, '-' + money(cost), 'gold');
        floatTxt(62, 40, t('bribed'), 'good');
        dmg(ABILITY_DMG.bribe, 70, 26);
        sfx.bribe();
      } else if (kind === 'nuts') {
        $$('.target:not(.captain)', targets).forEach((x) => hitTarget(x, x._xy[0], x._xy[1]));
        for (let i = 0; i < 6; i++) setTimeout(() => boom(52 + Math.random() * 38, 6 + Math.random() * 60, getLang() === 'en' ? 'NUTS!' : 'NØTT!', false), i * 70);
        dmg(ABILITY_DMG.nuts, 70, 24);
        sfx.nuts();
      } else if (kind === 'laser') {
        ov.classList.add('lasering');
        sfx.laser();
        setTimeout(() => {
          ov.classList.remove('lasering');
          if (st.done) return;
          st.stunUntil = st.t + 2000;
          for (let i = 0; i < 4; i++) setTimeout(() => boom(60 + Math.random() * 28, 14 + Math.random() * 48, 'ZAAP!', true), i * 80);
          dmg(ABILITY_DMG.laser, 70, 28);
          floatTxt(62, 52, t('stunned'), 'good');
          sfx.boom();
        }, 800);
      }
    }
  });
}

function showBattleResult(ov, r, res) {
  if (res.win && res.stars === 3) sfx.fanfare(); else res.win ? sfx.victory() : sfx.defeat();
  if (res.win) for (let i = 1; i <= res.stars; i++) setTimeout(() => sfx.star(i), 380 + i * 220); // en «pling» per stjerne
  ov.classList.add('done');
  const card = document.createElement('div');
  card.className = 'result-card ' + (res.win ? 'win s' + res.stars : 'lose');
  const weak = !res.win && res.dealt > 0 ? Math.max(1, Math.round((res.dealt / r.def) * 100)) : 0;
  const line = voice(S.general, res.win ? 'win' : 'lose');
  card.innerHTML = `<div class="result-mascot">${miniGeneral(res.win ? 'happy' : 'sad')}</div>
    ${line ? `<div class="result-say">${esc(L(line))}</div>` : ''}
    <h2 class="result-title">${res.win ? t('victory') : res.retreat ? t('retreated') : t('defeat')}</h2>
    ${res.win ? `<div class="result-stars">${[1, 2, 3].map((i) => `<span class="rs ${i <= res.stars ? 'on' : ''}" style="--i:${i}">${ico('star')}</span>`).join('')}</div>` : ''}
    <p>${res.win ? t('victory_text', { r: esc(L(r.name)) }) : res.retreat ? t('retreat_text', { r: esc(L(r.name)) }) : t('defeat_text', { r: esc(L(r.name)) })}</p>
    ${res.win ? `<div class="loot-list">
      <div class="loot-row">${ico('coin')}<span>${t('new_income', { v: money(r.income * pm()) })}</span></div>
      ${res.spoils > 0 ? `<div class="loot-row">${ico('crate')}<span>${t('spoils', { v: money(res.spoils) })}</span></div>` : ''}
      <div class="loot-row">${ico('medal')}<span>${t('medals_won', { n: res.medals })}</span></div>
      <div class="loot-row">${ico('gem')}<span>${t('gems_won', { n: res.gems })}</span></div>
      ${res.drop ? `<div class="loot-row drop"><span class="loot-pu">${puArt(res.drop.id)}</span><span>${t('drop_won', { p: esc(L(res.drop.name)) })}</span></div>` : ''}
    </div>` : weak ? `<p class="result-weak">${t('enemy_weakened', { p: weak })}</p>` : ''}
    ${res.laneWon ? `<div class="lane-result">${E.enemyLanes(r).map((ln, l) => (ln.share ? `<span class="${res.laneWon[l] ? 'won' : 'lost'}">${ico(res.laneWon[l] ? 'check' : 'close')}${t(LANE_KEYS[l])}</span>` : '')).join('')}</div>` : ''}
    <p class="result-loss">${res.lostTotal ? t('lost_units', { n: fmt(res.lostTotal) }) : t('lost_none')}</p>
    ${res.healed ? `<p class="result-heal">${t('healed', { n: fmt(res.healed) })}</p>` : ''}
    ${res.hits != null ? `<p class="result-stats">${t('battle_stats2', { h: res.hits, c: fmt(Math.round((res.bestCombo || 1) * 100) / 100), b: res.blocked || 0, n: res.specials || 0 })}</p>` : ''}
    ${res.win && res.stars < 3 ? `<p class="tip">${t('star_tip')}</p>` : ''}
    ${!res.win ? `<p class="tip">${t('defeat_tip')}</p>` : ''}
    ${!res.win && res.lostTotal && M.adsEnabled() ? `<button class="btn btn-ad big" type="button" data-action="ad-revive">${ico('ad')} ${t('revive', { n: fmt(res.lostTotal) })}</button>` : ''}
    <button class="btn btn-gold big" type="button" data-action="battle-done">${t('continue')}</button>`;
  $('.battle-inner', ov).appendChild(card);
  if (res.win) confetti(ov, res.stars === 3 ? 90 : 40);
  ov.dataset.era = res.eraDone ? '1' : '';
  setTimeout(() => $('button.btn-gold', card)?.focus({ preventScroll: true }), 50);
}

function battleDone(btn) {
  social()?.submit(true).catch?.(() => {});
  const ov = btn.closest('.battle');
  const eraDone = ov && ov.dataset.era === '1';
  ov?.remove();
  modalCount = Math.max(0, modalCount - 1);
  selected = null;
  if (eraDone) { showEraComplete(); return; }
  renderTab();
  updateHUD();
  updateTutorial();
  maybeInterstitial();
}

// ---------------- MODALER ----------------
function openModal(html, cls = '', onClose) {
  modalCount++;
  sfx.pop();
  const m = document.createElement('div');
  m.className = 'modal-back';
  m.innerHTML = `<div class="modal ${cls}" role="dialog" aria-modal="true">${html}</div>`;
  m._onClose = onClose;
  $('#overlay-root').appendChild(m);
  updateTutorial();
  setTimeout(() => { const f = $('input, button.btn', m); f?.focus({ preventScroll: true }); }, 60);
  return m;
}
function closeModal(el) {
  const m = el ? el.closest('.modal-back') : $$('.modal-back').pop();
  if (!m) return;
  m.remove();
  modalCount = Math.max(0, modalCount - 1);
  m._onClose && m._onClose();
  updateTutorial();
}

function confetti(root, n = 60) {
  const box = document.createElement('div');
  box.className = 'confetti';
  const cols = ['#ffd23f', '#ff5d8f', '#56e0ff', '#7be07b', '#b38cff', '#ff8a3d'];
  box.innerHTML = Array.from({ length: n }, (_, i) => `<i style="left:${Math.random() * 100}%;background:${cols[i % cols.length]};animation-delay:${Math.random() * 0.8}s;animation-duration:${1.6 + Math.random() * 1.6}s;transform:rotate(${Math.random() * 360}deg)"></i>`).join('');
  root.appendChild(box);
  setTimeout(() => box.remove(), 4000);
}

function showIntro() {
  const name = t('intro_placeholder');
  const m = openModal(`<div class="intro">
    <div class="intro-logo">${A.logo()}</div>
    <h1 class="game-title"><span>Take over the world</span><b>OHIO</b></h1>
    <p class="intro-tag">${t('intro_tag')}</p>
    <div class="lang-row" role="group" aria-label="${t('language')}">
      <button type="button" class="chip ${getLang() === 'nb' ? 'on' : ''}" data-action="intro-lang" data-lang="nb">Norsk</button>
      <button type="button" class="chip ${getLang() === 'en' ? 'on' : ''}" data-action="intro-lang" data-lang="en">English</button>
    </div>
    <div class="field-label">${t('pick_general')}</div>
    <div class="gen-pick" role="radiogroup" aria-label="${t('pick_general')}">${C.GENERALS.map((g) => `<button type="button" class="gen-card ${g.id === introGeneral ? 'on' : ''}" role="radio" aria-checked="${g.id === introGeneral}" data-action="intro-general" data-id="${g.id}">
      <span class="gen-art">${A.mascot('happy', { gen: g.id })}</span><b>${esc(L(g.name))}</b><span class="gen-style">${esc(L(g.style))}</span></button>`).join('')}</div>
    <label class="field-label" for="village-name">${t('intro_q')}</label>
    <input id="village-name" class="text-input" maxlength="22" autocomplete="off" placeholder="${esc(name)}">
    <button type="button" class="btn btn-gold big" data-action="intro-start">${t('intro_start')}</button>
  </div>`, 'intro-modal');
  $('#village-name', m).addEventListener('keydown', (e) => { if (e.key === 'Enter') startGame(); });
}
function startGame() {
  setTimeout(devChrome, 0);
  unlockAudio();
  const input = $('#village-name');
  const name = (input && input.value.trim()) || t('intro_placeholder');
  S = E.newState(name.slice(0, 22));
  S.general = introGeneral;
  S.settings.lang = getLang();
  S.seenIntro = 0;
  persist();
  closeModal($('.intro-modal'));
  applySkins();
  applyTheme();
  renderShellText();
  setTab('base');
  updateHUD();
  sfx.fanfare();
  showEraIntro(0);
}
function showEraIntro(e) {
  const era = ERAS[e];
  if (S && S.seenIntro < e) { S.seenIntro = e; persist(); }
  openModal(`<div class="modal-mascot">${A.mascot()}</div>
    <div class="eyebrow center">${t('chapter', { n: e + 1 })}</div>
    <h2 class="big-title">${esc(L(era.title))}</h2>
    <p class="speech">${esc(L(era.intro))}</p>
    <button type="button" class="btn btn-gold big" data-action="close">${t('lets_go')}</button>`, 'era-intro', () => updateTutorial());
}

function showEraComplete() {
  const cur = ERAS[S.era];
  const next = ERAS[S.era + 1];
  sfx.fanfare();
  M.happytime();
  if (!next) { S.finished = true; persist(); showFinal(); return; }
  if (!S.flags['eraCrate' + S.era]) { S.flags['eraCrate' + S.era] = true; C.addCrate(S, 'gold'); persist(); }
  const unlocks = [...BUILDINGS, ...UNITS].filter((it) => it.era === S.era + 1);
  const m = openModal(`<div class="modal-mascot">${A.mascot()}</div>
    <h2 class="big-title">${esc(L(cur.won))}</h2>
    <p class="result-reward gems center-row">${ico('gem')} ${t('gems_won', { n: E.gemsForEra(S.era) })} · ${ico('medal')} ${t('medals_won', { n: 5 })} · ${ico('crate')} 1 × ${esc(L(C.CRATE_BY_ID.gold.name))}</p>
    <p class="speech">${esc(L(next.intro))}</p>
    <div class="unlock-title">${t('era_unlocked')}</div>
    <div class="unlock-grid">${unlocks.map((it) => `<div class="unlock"><div class="unlock-art">${itemArt(it)}</div><span>${esc(L(it.name))}</span></div>`).join('')}</div>
    <button type="button" class="btn btn-gold big" data-action="era-next">${t('era_next', { era: esc(L(next.name)) })}</button>`, 'celebrate');
  confetti(m, 70);
}
function eraNext(btn) {
  closeModal(btn);
  E.advanceEra(S);
  S.seenIntro = S.era;
  selected = null;
  viewBox = null;
  applyTheme();
  persist();
  setTab('map');
  updateHUD();
  if (interstitialAllowed(M.CONFIG.ads.interstitialMinGap)) showInterstitial('new_chapter');
}

function prestigeRewardsHTML(level) {
  const r = E.prestigeRewards(level);
  const skins = r.skins.map((id) => C.SKIN_BY_ID[id]).filter(Boolean);
  return `<div class="prestige-box">
    <div class="prestige-head">${pBadge(level, 'big')}<b>${t('prestige_level', { n: level })}</b></div>
    <ul class="prestige-list">
      <li>${ico('boost')} ${t('pr_mult', { p: Math.round(E.PRESTIGE_BONUS * level * 100) })}</li>
      <li>${ico('gem')} ${t('pr_gems', { n: r.gems })}</li>
      <li>${ico('crate')} ${t('pr_crate', { c: esc(L(C.CRATE_BY_ID[r.crate].name)) })}</li>
      <li>${ico('star')} ${t('pr_star')}</li>
      ${skins.map((skin) => `<li class="pr-skin"><span class="pr-skin-art">${skinPreview(skin)}</span><span>${t('pr_skin', { s: esc(L(skin.name)) })}</span></li>`).join('')}
    </ul>
  </div>`;
}
function showFinal() {
  const st = S.stats;
  const m = openModal(`<div class="final-logo">${A.logo()}</div>
    <h2 class="big-title">${t('final_title')}</h2>
    <p class="speech">${t('final_text')}</p>
    <div class="stat-grid">
      <div><b>${duration(st.playTime)}</b><span>${t('stat_time')}</span></div>
      <div><b>${fmt(st.won)}</b><span>${t('stat_won')}</span></div>
      <div><b>${fmt(st.taps)}</b><span>${t('stat_taps')}</span></div>
    </div>
    ${prestigeRewardsHTML(S.prestige + 1)}
    <button type="button" class="btn btn-gold big" data-action="prestige-ask">${ico('star')} ${t('take_prestige', { n: S.prestige + 1 })}</button>
    <button type="button" class="btn btn-soft" data-action="close">${t('final_stay')}</button>`, 'celebrate');
  confetti(m, 90);
}
function askPrestige(btn) {
  if (!E.canPrestige(S)) return;
  if (btn && btn.closest('.modal')) closeModal(btn);
  const n = S.prestige + 1;
  openModal(`<div class="modal-head"><h2 class="h2">${t('take_prestige', { n })}</h2><button type="button" class="icon-btn" data-action="close" aria-label="${t('close')}">${ico('close')}</button></div>
    <p class="speech">${t('prestige_confirm')}</p>
    <div class="keep-box"><b>${t('prestige_keep_title')}</b><p>${t('prestige_keep')}</p></div>
    ${prestigeRewardsHTML(n)}
    <button type="button" class="btn btn-gold big" data-action="prestige">${ico('star')} ${t('prestige_go', { n })}</button>
    <button type="button" class="btn btn-soft" data-action="close">${t('cancel')}</button>`, 'prestige-modal');
}
function doPrestige(btn) {
  if (!E.canPrestige(S)) return;
  if (btn) closeModal(btn);
  S = E.prestigeReset(S);
  selected = null; viewBox = null; mapView = 'map';
  persist();
  applySkins();
  applyTheme();
  setTab('base');
  updateHUD();
  updateBadges();
  sfx.fanfare();
  M.happytime();
  social()?.submit(true).catch?.(() => {});
  const r = E.prestigeRewards(S.prestige);
  const skins = r.skins.map((id) => C.SKIN_BY_ID[id]).filter(Boolean);
  const m = openModal(`<div class="prestige-star-big">★${S.prestige > 1 ? `<small>${S.prestige}</small>` : ''}</div>
    <h2 class="big-title">${t('prestige_done', { n: S.prestige })}</h2>
    <p class="speech">${t('prestige_done_text', { p: Math.round(E.PRESTIGE_BONUS * S.prestige * 100) })}</p>
    ${skins.length ? `<div class="prestige-skins">${skins.map((skin) => `<div class="loot-card r-prestige small-card"><span class="loot-new">${t('new_skin')}</span><div class="loot-art">${skinPreview(skin)}</div>${rarityChip('prestige')}<h3>${esc(L(skin.name))}</h3></div>`).join('')}</div>` : ''}
    <p class="result-reward gems center-row">${ico('gem')} +${r.gems} · ${ico('crate')} 1 × ${esc(L(C.CRATE_BY_ID[r.crate].name))}</p>
    <button type="button" class="btn btn-gold big" data-action="close">${t('lets_go')}</button>`, 'celebrate', () => showEraIntro(0));
  confetti(m, 80);
}

function checkOffline() {
  const { secs, earned } = E.offlineGain(S);
  S.lastSeen = Date.now();
  if (secs < 60 || earned < 1) return;
  openModal(`<div class="modal-mascot">${A.mascot()}</div>
    <h2 class="big-title">${esc(say('welcome', 'welcome_back'))}</h2>
    <p class="speech">${esc(say('away', 'away_text', { t: duration(secs) }))}</p>
    <div class="big-money">${ico('coin')} ${money(earned)}</div>
    <button type="button" class="btn btn-gold big" data-action="collect" data-amount="${earned}">${t('collect')}</button>
    ${M.adsEnabled() && S.tut >= 5 ? `<button type="button" class="btn btn-ad big" data-action="ad-double" data-amount="${earned}">${ico('ad')} ${t('double_reward')} · ${money(earned * 2)}</button>` : ''}`, 'welcome');
}

function showSettings() {
  const st = S.stats;
  const standalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const canInstall = !standalone && !window.claude && window.top === window.self;
  openModal(`<div class="modal-head"><h2 class="h2">${t('settings')}</h2><button type="button" class="icon-btn" data-action="close" aria-label="${t('close')}">${ico('close')}</button></div>
    <div class="set-row"><span>${ico(S.settings.sound ? 'sound' : 'mute')} ${t('sound')}</span><button type="button" class="toggle ${S.settings.sound ? 'on' : ''}" data-action="toggle" data-key="sound" aria-pressed="${S.settings.sound}">${S.settings.sound ? t('on') : t('off')}</button></div>
    <div class="set-row"><span>${ico('vibrate')} ${t('vibration')}</span><button type="button" class="toggle ${S.settings.vibrate ? 'on' : ''}" data-action="toggle" data-key="vibrate" aria-pressed="${S.settings.vibrate}">${S.settings.vibrate ? t('on') : t('off')}</button></div>
    <div class="set-row"><span>${ico('globe')} ${t('language')}</span><div class="lang-row"><button type="button" class="chip ${getLang() === 'nb' ? 'on' : ''}" data-action="lang" data-lang="nb">Norsk</button><button type="button" class="chip ${getLang() === 'en' ? 'on' : ''}" data-action="lang" data-lang="en">English</button></div></div>
    <label class="field-label" for="rename">${t('village_name')}</label>
    <div class="rename-row"><input id="rename" class="text-input" maxlength="22" value="${esc(S.name)}"><button type="button" class="btn btn-soft" data-action="rename">${t('save_name')}</button></div>
    ${canInstall ? `<div class="install-box"><b>${ico('download')} ${t('install')}</b><p>${installEvt ? '' : ios ? t('install_ios') : t('install_other')}</p>${installEvt ? `<button type="button" class="btn btn-gold" data-action="install">${t('install_btn')}</button>` : ''}</div>` : ''}
    ${socialSettingsHTML()}
    <div class="stats-box"><b>${ico('shop')} ${t('store_section')}</b>
      <p class="small">${S.adFree ? '✓ ' + t('adfree_active') : M.isDemoAds() ? t('ads_demo_mode') : t('ads_live_mode', { p: M.CONFIG.ads.provider })}</p>
      ${M.paymentsEnabled() ? `<button type="button" class="link-btn" data-action="restore">${t('restore_purchases')}</button>` : ''}
      ${M.privacyOptionsAvailable() ? `<button type="button" class="link-btn" data-action="ad-choices">${t('ad_choices')}</button>` : ''}
      ${M.CONFIG.privacyUrl ? `<button type="button" class="link-btn" data-action="privacy">${t('privacy_policy')}</button>` : ''}
    </div>
    <div class="stats-box"><b>${t('stats')}</b>
      <div class="stat-list">
        <span>${t('stat_time')}</span><b>${duration(st.playTime)}</b>
        <span>${t('stat_taps')}</span><b>${fmt(st.taps)}</b>
        <span>${t('stat_won')}</span><b>${fmt(st.won)}</b>
        <span>${t('stat_lost')}</span><b>${fmt(st.lost)}</b>
        <span>${t('stat_units_lost')}</span><b>${fmt(st.unitsLost)}</b>
        <span>${t('stat_crates')}</span><b>${fmt(st.crates)}</b>
        ${st.wins ? `<span>${t('stat_wins')}</span><b>${fmt(st.wins)}</b>` : ''}
        <span>${t('stat_prestige')}</span><b>${S.prestige ? pBadge(S.prestige) : '–'}</b>
      </div></div>
    <div class="danger-zone" id="danger"><button type="button" class="btn btn-danger" data-action="reset">${t('reset')}</button></div>
    ${devOn ? `<div class="stats-box dev-box"><b>${ico('wrench')} ${t('dev_title')}</b><p class="small">${t('dev_note')}</p><div class="row2"><button type="button" class="btn btn-gold" data-action="dev-open">${t('dev_open')}</button><button type="button" class="btn btn-soft" data-action="dev" data-dev="off">${t('dev_turn_off')}</button></div></div>` : ''}
    <p class="credits">${t('credits')}</p>
    <button type="button" class="version-line" data-action="dev-tap">${t('version')} ${esc(BUILD)}${devOn ? ' · ' + t('dev_title') : ''}</button>`, 'settings');
}


// ---------------- BUTIKK, SKINS OG LOOTKASSER ----------------
const today = () => new Date().toISOString().slice(0, 10);
function gemAdsLeft() {
  if (S.ads.gemDay !== today()) { S.ads.gemDay = today(); S.ads.gemCount = 0; }
  return Math.max(0, AD_GEMS_PER_DAY - (S.ads.gemCount || 0));
}
const productPrice = (id) => esc(L(M.PRODUCT_BY_ID[id].price));
const adBtn = (action, disabled) => `<button type="button" class="btn btn-ad" data-action="${action}" ${disabled ? 'disabled' : ''}>${ico('ad')} ${t('watch')}</button>`;

function renderShop() {
  $('#scr-shop').innerHTML = `<div class="pad stack">
    <div class="screen-head"><div><div class="eyebrow">${t('shop_title')}</div><div class="big-num">${ico('gem')}${fmt(S.gems || 0)}</div></div>
      <div class="mode-switch" role="group">
        <button type="button" class="${shopView === 'store' ? 'on' : ''}" data-action="shopview" data-view="store">${t('shop_store')}</button>
        <button type="button" class="${shopView === 'mine' ? 'on' : ''}" data-action="shopview" data-view="mine">${t('shop_mine')}${C.cratesOwned(S) ? ` <span class="count-dot">${C.cratesOwned(S)}</span>` : ''}</button>
      </div></div>
    ${shopView === 'store' ? storeHTML() : mineHTML()}
  </div>`;
}

function storeHTML() {
  const now = Date.now();
  const freeLeft = (S.ads.freeCrateAt || 0) - now;
  const gemLeft = gemAdsLeft();
  return `
  ${M.adsEnabled() ? `<div class="section-title">${t('free_rewards')}</div>
  <div class="offer-list">
    <div class="offer"><div class="offer-art">${A.crateArt('wood')}</div><div class="offer-body"><b>${t('free_crate')}</b><span>${freeLeft > 0 ? t('ready_in', { t: duration(freeLeft / 1000) }) : t('free_crate_desc')}</span></div>${adBtn('ad-crate', freeLeft > 0)}</div>
    <div class="offer"><div class="offer-art gem-art">${ico('gem')}</div><div class="offer-body"><b>+${AD_GEMS} ${t('gems')}</b><span>${t('left_today', { n: gemLeft })}</span></div>${adBtn('ad-gems', gemLeft <= 0)}</div>
  </div>` : ''}
  <div class="section-title">${t('loot_crates')}</div>
  <div class="crate-list">${C.CRATES.map((c) => `<div class="crate-card crate-${c.id}">
    <div class="crate-card-art">${A.crateArt(c.id)}</div>
    <div class="crate-card-body"><b>${esc(L(c.name))}</b>
      <span>${c.items === 1 ? t('crate_items_1') : t('crate_items_n', { n: c.items })}${c.guarantee ? ' · ' + t('crate_guarantee', { r: esc(L(C.RARITY[c.guarantee].name)) }) : ''}</span>
      <button type="button" class="link-btn" data-action="odds" data-id="${c.id}">${ico('info')} ${t('see_odds')}</button></div>
    <button type="button" class="buy-btn gem-btn ${S.gems >= c.price ? '' : 'cant'}" data-action="crate" data-id="${c.id}"><span class="lbl">${t('buy')}</span><span class="price">${ico('gem')}${c.price}</span></button>
  </div>`).join('')}</div>
  ${C.cratesOwned(S) ? `<button type="button" class="btn btn-soft" data-action="shopview" data-view="mine">${ico('crate')} ${t('you_have_crates', { n: C.cratesOwned(S) })}</button>` : ''}
  <p class="pity-note">${ico('star')} ${t('pity', { n: Math.max(1, C.PITY - (S.crates.pity || 0)) })}</p>
  ${E.baseIncome(S) > 0 ? `<div class="section-title">${t('time_skips')}</div>
  <div class="offer-list">${TIME_SKIPS.map((k) => `<div class="offer"><div class="offer-art ffwd-art">${ico('ffwd')}</div>
    <div class="offer-body"><b>${t('skip_title', { h: k.hours })}</b><span>+${money(E.baseIncome(S) * k.hours * 3600)}</span></div>
    <button type="button" class="buy-btn gem-btn ${S.gems >= k.gems ? '' : 'cant'}" data-action="skip" data-id="${k.id}"><span class="lbl">${t('buy')}</span><span class="price">${ico('gem')}${k.gems}</span></button></div>`).join('')}</div>` : ''}
  ${M.paymentsEnabled() ? paidHTML() : ''}`;
}

function paidHTML() {
  const packs = M.PRODUCTS.filter((p) => p.id.startsWith('gems_'));
  return `
  <div class="section-title">${t('adfree_title')}</div>
  ${S.adFree ? `<div class="adfree-card owned">${ico('check')}<b>${t('adfree_owned')}</b></div>` : `<div class="adfree-card">
    <div class="adfree-ico">${ico('adfree')}</div>
    <div class="adfree-body"><b>${t('adfree_name')}</b><ul><li>${t('adfree_b1')}</li><li>${t('adfree_b2')}</li><li>${t('adfree_b3', { n: M.PRODUCT_BY_ID.adfree.gems })}</li></ul></div>
    <button type="button" class="btn btn-gold" data-action="iap" data-id="adfree">${productPrice('adfree')}</button>
  </div>`}
  ${S.purchases.includes('starter') ? '' : `<div class="starter-card"><span class="tag">${t('one_time')}</span>
    <div class="starter-art">${A.crateArt('cosmic')}</div>
    <div class="starter-body"><b>${t('starter_name')}</b><span>${t('starter_desc2')}</span></div>
    <button type="button" class="btn btn-gold" data-action="iap" data-id="starter">${productPrice('starter')}</button></div>`}
  <div class="section-title">${t('buy_gems')}</div>
  <div class="gem-grid">${packs.map((p) => `<button type="button" class="gem-pack" data-action="iap" data-id="${p.id}">
    ${p.tag ? `<span class="tag">${t('tag_' + p.tag)}</span>` : ''}<span class="gem-ico">${ico('gem')}</span><b>${fmt(p.gems)}</b><span class="gem-price">${productPrice(p.id)}</span></button>`).join('')}</div>
  <p class="demo-note">${ico('info')} ${t('demo_store_note')}</p>`;
}

function mineHTML() {
  const total = C.SKINS.length, own = C.ownedCount(S);
  const list = C.SKINS.filter((k) => k.cat === skinCat && (showAllSkins || S.skins.owned[k.id])).sort((a, b) => C.RARITY[a.rarity].rank - C.RARITY[b.rarity].rank);
  const crates = C.CRATES.filter((c) => C.crateCount(S, c.id) > 0);
  return `
  <div class="section-title">${t('my_crates')}</div>
  ${crates.length ? `<div class="crate-list">${crates.map((c) => `<div class="crate-card crate-${c.id} owned">
    <div class="crate-card-art">${A.crateArt(c.id)}<span class="count">×${C.crateCount(S, c.id)}</span></div>
    <div class="crate-card-body"><b>${esc(L(c.name))}</b><span>${c.items === 1 ? t('crate_items_1') : t('crate_items_n', { n: c.items })}${c.guarantee ? ' · ' + t('crate_guarantee', { r: esc(L(C.RARITY[c.guarantee].name)) }) : ''}</span>
      <button type="button" class="link-btn" data-action="odds" data-id="${c.id}">${ico('info')} ${t('see_odds')}</button></div>
    <button type="button" class="buy-btn" data-action="open-crate" data-id="${c.id}"><span class="lbl">${t('open')}</span><span class="price">×${C.crateCount(S, c.id)}</span></button>
  </div>`).join('')}</div>` : `<div class="empty-card">${A.crateArt('wood')}<p>${t('no_crates')}</p><button type="button" class="btn btn-gold" data-action="shopview" data-view="store">${t('to_store')}</button></div>`}
  <div class="section-title">${t('your_general')}</div>
  <div class="gen-pick mine" role="radiogroup" aria-label="${t('your_general')}">${C.GENERALS.map((g) => `<button type="button" class="gen-card ${g.id === S.general ? 'on' : ''}" role="radio" aria-checked="${g.id === S.general}" data-action="pick-general" data-id="${g.id}">
    <span class="gen-art">${A.mascotOf(g.id)}</span><b>${esc(L(g.name))}</b><span class="gen-style">${esc(L(g.style))}</span>${g.perk.ability ? `<span class="gen-desc">${t('ability')}: ${esc(L(C.ABILITIES[g.perk.ability].name))}</span>` : ''}${g.id === S.general ? `<span class="gen-on">${ico('check')} ${t('chosen')}</span>` : ''}</button>`).join('')}</div>
  <p class="gen-note">${E.genSwitchLeft(S) > 0 ? t('general_wait', { t: clock(E.genSwitchLeft(S)) }) : t('general_switch_note')}</p>
  <div class="section-title">${t('my_skins')}</div>
  <div class="progress"><div class="progress-fill" style="width:${(own / total) * 100}%"></div><span>${t('collection', { a: own, b: total })}</span></div>
  ${(() => { const d = C.dupeTotals(S); return d.n ? `<div class="dupe-card"><span>${ico('swap')} ${t('dupes_summary', { n: d.n })}</span><button type="button" class="btn btn-soft" data-action="sell-dupes">${ico('gem')} ${t('sell_all_dupes', { g: fmt(d.gems) })}</button></div>` : ''; })()}
  <div class="trade-card"><div class="trade-ico">${ico('swap')}</div><div class="trade-body"><b>${t('trade_title')}</b><span>${t('trade_sub', { n: C.TRADE_COST })}</span></div><button type="button" class="btn btn-gold" data-action="trade-open">${t('trade_open')}</button></div>
  <div class="chip-row" role="group">${C.CATEGORIES.map((c) => `<button type="button" class="chip ${c.id === skinCat ? 'on' : ''}" data-action="skincat" data-cat="${c.id}">${esc(L(c.name))} <small>${C.SKINS.filter((k) => k.cat === c.id && S.skins.owned[k.id]).length}</small></button>`).join('')}</div>
  <div class="skin-grid">${list.map((k) => {
    const owned = !!S.skins.owned[k.id];
    const on = S.skins.equipped[k.cat] === k.id;
    const n = C.copiesOf(S, k.id);
    return `<button type="button" class="skin-card r-${k.rarity} ${owned ? '' : 'locked'} ${on ? 'on' : ''}" data-action="${owned ? 'skin-open' : 'skin-locked'}" data-id="${k.id}">
      ${n > 1 ? `<span class="skin-copies">×${n}</span>` : ''}
      <span class="skin-art">${skinPreview(k)}</span>
      <span class="skin-name">${esc(L(k.name))}</span>
      ${rarityChip(k.rarity)}
      <span class="skin-state">${on ? ico('check') + t('equipped') : owned ? t('equip') : k.prestige ? ico('lock') + t('prestige_unlock', { n: k.prestige }) : ico('lock') + t('locked')}</span>
    </button>`;
  }).join('')}</div>
  <button type="button" class="btn btn-soft" data-action="toggle-allskins">${showAllSkins ? t('show_owned') : t('show_all_skins', { n: total - own })}</button>
  <p class="demo-note">${t('skins_cosmetic')}</p>`;
}

function showOdds(id) {
  const c = C.CRATE_BY_ID[id];
  openModal(`<div class="modal-head"><h2 class="h2">${t('odds_title', { c: esc(L(c.name)) })}</h2><button type="button" class="icon-btn" data-action="close" aria-label="${t('close')}">${ico('close')}</button></div>
    <div class="odds-art">${A.crateArt(c.id)}</div>
    <div class="odds-list">${C.RARITIES.filter((r) => (c.odds[r.id] || 0) > 0).map((r) => `<div class="odds-row r-${r.id}">${rarityChip(r.id)}<div class="odds-bar"><i style="width:${Math.max(1.5, c.odds[r.id])}%"></i></div><b>${String(c.odds[r.id]).replace('.', getLang() === 'nb' ? ',' : '.')} %</b></div>`).join('')}</div>
    ${c.guarantee ? `<p class="small center">${t('odds_guarantee', { r: esc(L(C.RARITY[c.guarantee].name)) })}</p>` : ''}
    <p class="small center">${t('odds_note')}</p>
    <p class="small center">${t('odds_pity', { n: C.PITY })}</p>`, 'odds-modal');
}

function buyTimeSkip(id) {
  const k = TIME_SKIPS.find((x) => x.id === id);
  if (!k) return;
  if (S.gems < k.gems) { sfx.nope(); toast(t('not_enough_gems')); return; }
  const amount = E.baseIncome(S) * k.hours * 3600;
  S.gems -= k.gems; S.money += amount; S.totalEarned += amount;
  sfx.coin();
  toast('+' + money(amount), 'gold');
  updateHUD(); persist(); renderShop();
}

// ----- kjøpe kasse til «Mine ting» -----
function gotCrateModal(crateId, n = 1) {
  const c = C.CRATE_BY_ID[crateId];
  sfx.crate();
  const m = openModal(`<div class="got-crate">${A.crateArt(c.id)}</div>
    <h2 class="big-title">${t('got_crate', { c: esc(L(c.name)) })}</h2>
    <p class="speech">${t('got_crate_text', { n: C.cratesOwned(S) })}</p>
    <div class="row2"><button type="button" class="btn btn-gold" data-got="open">${t('open_now')}</button><button type="button" class="btn btn-soft" data-got="later">${t('save_later')}</button></div>`, 'got-modal');
  m.querySelector('[data-got="open"]').addEventListener('click', (e) => { closeModal(e.target); openCrateFlow(crateId); });
  m.querySelector('[data-got="later"]').addEventListener('click', (e) => { closeModal(e.target); if (tab === 'shop') renderShop(); updateBadges(); });
}
function buyCrateFlow(crateId) {
  if (!C.buyCrate(S, crateId)) { sfx.nope(); toast(t('not_enough_gems')); return; }
  persist(); updateHUD(); updateBadges();
  if (tab === 'shop') renderShop();
  gotCrateModal(crateId);
}

// ----- åpne kasse -----
// Trykk for å åpne. Skinsene avsløres ett og ett (eller «Vis alle»). Etterpå kan man trykke på hvert skin,
// bla gjennom dem med pilene, ved å sveipe eller med piltastene, og ta dem i bruk med en gang.
function openCrateFlow(crateId, { free = false } = {}) {
  const c = C.CRATE_BY_ID[crateId];
  const items = C.openCrate(S, crateId, { free });
  if (!items) { sfx.nope(); toast(t('not_enough_gems')); return; }
  persist();
  updateHUD();
  lootFlow(items, { art: A.crateArt(c.id) });
}
// Viser skins man har fått: lukket kasse først (art), eller rett til avsløringen (closed: false, fra byttebua)
function lootFlow(items, { art = '', closed = true } = {}) {
  modalCount++;
  const ov = document.createElement('div');
  ov.className = 'crate-open';
  ov.innerHTML = `<div class="crate-stage"><div class="crate-rays"></div>${closed ? `<div class="crate-big">${art}</div><p class="crate-hint">${t('tap_to_open')}</p>` : ''}</div>`;
  $('#overlay-root').appendChild(ov);
  if (closed) sfx.crateShake();
  updateTutorial();
  const stage = ov.querySelector('.crate-stage');
  let idx = -1; // siste avslørte skin
  let cur = 0; // skinnet som vises når man blar
  let browsing = false;
  let busy = false;
  const catOf = (k) => C.CATEGORIES.find((x) => x.id === k.cat);
  const isOn = (k) => S.skins.equipped[k.cat] === k.id;
  const genOf = (k) => { const g = catOf(k).gen; return g && g !== S.general ? C.GENERAL_BY_ID[g] : null; };
  const cardHTML = (it) => `<div class="loot-card r-${it.rarity}">
      ${it.dup ? '' : `<span class="loot-new">${t('new_skin')}</span>`}
      ${isOn(it.skin) ? `<span class="loot-on">${ico('check')} ${t('equipped')}</span>` : ''}
      <div class="loot-art">${skinPreview(it.skin)}</div>
      ${rarityChip(it.rarity)}
      <h3>${esc(L(it.skin.name))}</h3>
      <p class="loot-cat">${esc(L(catOf(it.skin).name))}</p>
      ${it.dup ? `<p class="loot-dup">${it.sold ? `${ico('gem')} ${t('sold_label', { g: C.sellValue(it.skin) })}` : `${ico('swap')} ${t('dupe_stored', { n: C.copiesOf(S, it.skin.id) })}`}</p>` : ''}
    </div>`;
  const keys = (e) => {
    if (e.key === 'Escape') { close(); return; }
    if (browsing && e.key === 'ArrowRight') { e.preventDefault(); show(cur + 1); }
    if (browsing && e.key === 'ArrowLeft') { e.preventDefault(); show(cur - 1); }
  };
  const close = () => { document.removeEventListener('keydown', keys); ov.remove(); modalCount = Math.max(0, modalCount - 1); updateHUD(); updateBadges(); if (tab === 'shop') renderShop(); updateTutorial(); };
  document.addEventListener('keydown', keys);
  // bla-visning: stort kort med piler, alle skinsene som små knapper under, og «Bruk»
  const show = (i, quiet = false) => {
    browsing = true;
    const n = items.length;
    cur = ((i % n) + n) % n;
    const it = items[cur];
    if (!quiet) sfx.swish();
    const g = genOf(it.skin);
    stage.innerHTML = `<div class="crate-rays r-${it.rarity}"></div>
      <div class="loot-browse">
        ${n > 1 ? `<button type="button" class="lb-nav prev" data-nav="-1" aria-label="${t('loot_prev')}">‹</button>` : ''}
        ${cardHTML(it)}
        ${n > 1 ? `<button type="button" class="lb-nav next" data-nav="1" aria-label="${t('loot_next')}">›</button>` : ''}
      </div>
      ${n > 1 ? `<div class="loot-summary">${items.map((x, k) => `<button type="button" class="loot-mini r-${x.rarity}${k === cur ? ' on' : ''}" data-pick="${k}" aria-label="${esc(L(x.skin.name))}" aria-pressed="${k === cur}">${skinPreview(x.skin)}${isOn(x.skin) ? `<span class="lm-on">${ico('check')}</span>` : ''}</button>`).join('')}</div>
      <p class="lb-hint">${cur + 1} / ${n} · ${t('loot_browse_hint')}</p>` : ''}
      <div class="loot-actions">
        <div class="row2">${isOn(it.skin) ? `<span class="lb-on">${ico('check')} ${t('equipped')}</span>` : `<button type="button" class="btn btn-gold" data-crate="equip">${t('equip')}</button>`}<button type="button" class="btn btn-soft" data-crate="done">${t('done')}</button></div>
        ${it.dup && !it.sold && C.dupesOf(S, it.skin.id) > 0 ? `<button type="button" class="link-btn lb-sell" data-crate="sell">${ico('gem')} ${t('sell_dupe_crate', { g: C.sellValue(it.skin) })}</button>` : ''}
        ${g ? `<p class="lb-note">${t('skin_for_gen', { g: esc(L(g.name)) })}</p>` : ''}
      </div>`;
  };
  const sellCur = () => {
    const it = items[cur];
    const g = it.dup && !it.sold && C.dupesOf(S, it.skin.id) > 0 ? C.sellSkin(S, it.skin.id, 1) : 0;
    if (!g) { sfx.nope(); return; }
    it.sold = true;
    persist(); sfx.coin(); updateHUD();
    toast(t('sold_toast', { n: 1, name: L(it.skin.name), g }), 'boost');
    show(cur, true);
  };
  const equipCur = () => {
    const it = items[cur];
    if (!C.equip(S, it.skin.id)) { sfx.nope(); return; }
    applySkins(); persist(); sfx.equip();
    if (S.settings.vibrate) buzz(15);
    const g = genOf(it.skin);
    toast(g ? t('skin_equipped_gen_toast', { name: L(it.skin.name), g: L(g.name) }) : t('skin_equipped_toast', { name: L(it.skin.name) }), 'boost');
    show(cur, true);
  };
  const reveal = (it) => {
    const rank = C.RARITY[it.rarity].rank;
    sfx.reveal(rank);
    if (S.settings.vibrate) buzz(rank >= 3 ? 60 : 20);
    if (idx === items.length - 1) show(idx, true); // det siste skinnet vises rett i bla-visningen
    else {
      stage.innerHTML = `<div class="crate-rays r-${it.rarity}"></div>${cardHTML(it)}
        <p class="crate-hint">${t('tap_next')} · ${idx + 1}/${items.length}</p>
        <button type="button" class="link-btn loot-skip" data-crate="all">${t('show_all')}</button>`;
    }
    if (rank >= 3) confetti(ov, 70);
  };
  // sveip til siden for å bla
  let sx = null, sy = 0;
  ov.addEventListener('pointerdown', (e) => { if (browsing && !e.target.closest('button')) { sx = e.clientX; sy = e.clientY; } });
  ov.addEventListener('pointerup', (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    sx = null;
    if (items.length > 1 && Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) show(cur + (dx < 0 ? 1 : -1));
  });
  ov.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b && b.dataset.nav) { show(cur + Number(b.dataset.nav)); return; }
    if (b && b.dataset.pick) { show(Number(b.dataset.pick)); return; }
    if (b && b.dataset.crate === 'equip') { equipCur(); return; }
    if (b && b.dataset.crate === 'sell') { sellCur(); return; }
    if (b && b.dataset.crate === 'done') { close(); return; }
    if (b && b.dataset.crate === 'all') { idx = items.length - 1; show(0); return; }
    if (browsing || busy || b) return;
    if (idx === -1) {
      busy = true;
      ov.classList.add('opening');
      sfx.crateOpen();
      setTimeout(() => { busy = false; idx = 0; reveal(items[0]); }, 650);
      return;
    }
    idx++;
    reveal(items[idx]);
  });
  if (!closed) { idx = 0; reveal(items[0]); }
}

// ----- et skin på lageret: ta i bruk, eller selg for edelstener (velg hvor mange) -----
let skinSheet = null; // { id, n }
function skinSheetHTML() {
  const k = C.SKIN_BY_ID[skinSheet.id];
  const own = !!S.skins.owned[k.id];
  const on = S.skins.equipped[k.cat] === k.id;
  const total = C.copiesOf(S, k.id), d = C.dupesOf(S, k.id), spare = C.spareCopies(S, k);
  const cat = C.CATEGORIES.find((x) => x.id === k.cat);
  const g = cat.gen && cat.gen !== S.general ? C.GENERAL_BY_ID[cat.gen] : null;
  const n = Math.max(1, Math.min(spare, skinSheet.n || 1));
  const val = C.sellValue(k);
  return `<div class="modal-head"><h2 class="h2">${esc(L(k.name))}</h2><button type="button" class="icon-btn" data-action="close" aria-label="${t('close')}">${ico('close')}</button></div>
    <div class="ss-top r-${k.rarity}"><div class="ss-art">${skinPreview(k)}</div>
      <div class="ss-info">${rarityChip(k.rarity)}<span class="ss-cat">${esc(L(cat.name))}</span>
        <b class="ss-have">${d === 1 ? t('skin_have_d1', { n: total }) : d ? t('skin_have_d', { n: total, d }) : t('skin_have', { n: total })}</b>
        ${val ? `<span class="ss-val">${ico('gem')} ${t('sell_each', { g: val })}</span>` : ''}</div></div>
    <div class="ss-equip">${!own ? '' : on ? `<span class="lb-on">${ico('check')} ${t('equipped')}</span>` : `<button type="button" class="btn btn-gold big" data-action="equip" data-id="${k.id}">${t('equip')}</button>`}
      ${g ? `<p class="small">${t('skin_for_gen', { g: esc(L(g.name)) })}</p>` : ''}</div>
    ${spare && val ? `<div class="ss-sell"><b>${t('sell_title')}</b>
      ${spare > 1 ? `<div class="ss-qty"><button type="button" class="qty-btn" data-action="sell-qty" data-d="-1" aria-label="−" ${n <= 1 ? 'disabled' : ''}>−</button><span class="qty-n">${n}</span><button type="button" class="qty-btn" data-action="sell-qty" data-d="1" aria-label="+" ${n >= spare ? 'disabled' : ''}>+</button>
        ${d && d < spare ? `<button type="button" class="chip ${n === d ? 'on' : ''}" data-action="sell-qty" data-set="${d}">${t('sell_dupes_only', { n: d })}</button>` : ''}<button type="button" class="chip ${n === spare ? 'on' : ''}" data-action="sell-qty" data-set="${spare}">${t('sell_all', { n: spare })}</button></div>` : ''}
      <button type="button" class="btn btn-gem big" data-action="sell-go">${t('sell_btn', { n, g: fmt(n * val) })} ${ico('gem')}</button>
      <p class="small">${spare < total ? t('sell_keep_note') : t('sell_last_note')}</p></div>` : `<p class="small ss-nosell">${k.prestige ? t('sell_prestige') : k.def ? t('sell_default') : on ? t('sell_equipped') : ''}</p>`}
    ${C.NEXT_RARITY[k.rarity] && spare ? `<button type="button" class="link-btn" data-action="trade-open" data-r="${k.rarity}">${ico('swap')} ${t('to_trade')}</button>` : ''}`;
}
function openSkinSheet(id) {
  if (!C.SKIN_BY_ID[id] || !S.skins.owned[id]) return;
  skinSheet = { id, n: 1 };
  sfx.click();
  openModal(skinSheetHTML(), 'skin-sheet', () => { skinSheet = null; });
}
function renderSkinSheet() {
  const md = $('.skin-sheet');
  if (!md || !skinSheet) return;
  if (!S.skins.owned[skinSheet.id]) { closeModal(md); return; }
  md.innerHTML = skinSheetHTML();
}
function sellQty(btn) {
  if (!skinSheet) return;
  const k = C.SKIN_BY_ID[skinSheet.id];
  const spare = C.spareCopies(S, k);
  skinSheet.n = btn.dataset.set ? Number(btn.dataset.set) : Math.max(1, Math.min(spare, (skinSheet.n || 1) + Number(btn.dataset.d)));
  sfx.click();
  renderSkinSheet();
}
function sellGo() {
  if (!skinSheet) return;
  const k = C.SKIN_BY_ID[skinSheet.id];
  const n = Math.max(1, Math.min(C.spareCopies(S, k), skinSheet.n || 1));
  const g = C.sellSkin(S, k.id, n);
  if (!g) { sfx.nope(); return; }
  persist(); sfx.coin(); if (S.settings.vibrate) buzz(15);
  updateHUD();
  toast(t('sold_toast', { n, name: L(k.name), g }), 'boost');
  skinSheet.n = 1;
  renderSkinSheet();
  if (tab === 'shop') { const sc = $('#scr-shop').scrollTop; renderShop(); $('#scr-shop').scrollTop = sc; }
}
function sellAllDupesFlow() {
  const d = C.dupeTotals(S);
  if (!d.n) return;
  openModal(`<div class="modal-head"><h2 class="h2">${ico('gem')} ${t('sell_all_dupes', { g: fmt(d.gems) })}</h2><button type="button" class="icon-btn" data-action="close" aria-label="${t('close')}">${ico('close')}</button></div>
    <p class="speech">${t('sell_all_confirm', { n: d.n, g: fmt(d.gems) })}</p>
    <div class="row2"><button type="button" class="btn btn-soft" data-action="close">${t('cancel')}</button><button type="button" class="btn btn-gem" data-action="sell-dupes-go">${t('confirm_sell')}</button></div>`, 'sell-confirm');
}

// ----- byttebua: bytt inn 5 skins av samme sjeldenhet mot ett sjeldnere -----
let trade = null; // { r: sjeldenheten du bytter inn, sel: Map(skin → antall eksemplarer), cat: ønsket kategori (null = alt) }
const tradeSelCount = () => (trade ? [...trade.sel.values()].reduce((a, n) => a + n, 0) : 0);
function tradeTiersHTML() {
  return `<div class="modal-head"><h2 class="h2">${ico('swap')} ${t('trade_title')}</h2><button type="button" class="icon-btn" data-action="close" aria-label="${t('close')}">${ico('close')}</button></div>
    <p class="small">${t('trade_sub', { n: C.TRADE_COST })}</p>
    <div class="trade-tiers">${Object.keys(C.NEXT_RARITY).map((r) => {
      const n = C.tradableCopies(S, r);
      return `<button type="button" class="trade-tier" data-action="trade-tier" data-r="${r}" ${n < C.TRADE_COST ? 'disabled' : ''}>
        <span class="tt-row">${C.TRADE_COST} × ${rarityChip(r)} ${ico('swap')} 1 × ${rarityChip(C.NEXT_RARITY[r])}</span>
        <small>${t('trade_have', { n })}${n < C.TRADE_COST ? ' · ' + t('trade_need', { n: C.TRADE_COST - n }) : ''}</small></button>`;
    }).join('')}</div>
    <p class="small trade-note">${t('trade_note')}</p>`;
}
function tradePickHTML() {
  const { r, sel, cat } = trade;
  const next = C.NEXT_RARITY[r];
  const list = C.tradable(S, r);
  const cats = C.CATEGORIES.filter((x) => C.SKINS.some((k) => k.cat === x.id && k.rarity === next && !k.prestige));
  const count = tradeSelCount();
  const full = count === C.TRADE_COST;
  return `<div class="modal-head"><h2 class="h2">${ico('swap')} ${t('trade_title')}</h2><button type="button" class="icon-btn" data-action="close" aria-label="${t('close')}">${ico('close')}</button></div>
    <div class="trade-head">${C.TRADE_COST} × ${rarityChip(r)} ${ico('swap')} 1 × ${rarityChip(next)}</div>
    <div class="trade-pick-head"><b>${t('trade_pick', { n: C.TRADE_COST })}</b><span class="trade-count ${full ? 'full' : ''}">${count}/${C.TRADE_COST}</span><button type="button" class="link-btn" data-action="trade-auto">${t('trade_auto')}</button>${count ? `<button type="button" class="link-btn" data-action="trade-clear">${t('trade_clear')}</button>` : ''}</div>
    <p class="small trade-tap-note">${t('trade_tap_note')}</p>
    <div class="trade-grid">${list.map((k) => {
      const have = C.spareCopies(S, k), pick = sel.get(k.id) || 0;
      return `<button type="button" class="trade-skin r-${k.rarity}${pick ? ' on' : ''}" data-action="trade-toggle" data-id="${k.id}" aria-pressed="${!!pick}">
      ${have > 1 ? `<span class="skin-copies">×${have}</span>` : ''}
      <span class="skin-art">${skinPreview(k)}</span><span class="skin-name">${esc(L(k.name))}</span><span class="ts-cat">${esc(L(C.CATEGORIES.find((x) => x.id === k.cat).name))}</span><span class="ts-tick${pick > 1 ? ' num' : ''}">${pick > 1 ? pick : ico('check')}</span></button>`;
    }).join('')}</div>
    <div class="trade-want"><b>${t('trade_want')}</b><div class="chip-row">
      <button type="button" class="chip ${!cat ? 'on' : ''}" data-action="trade-cat" data-cat="">${t('trade_any')} <small>${C.missingOf(S, next).length}</small></button>
      ${cats.map((x) => `<button type="button" class="chip ${cat === x.id ? 'on' : ''}" data-action="trade-cat" data-cat="${x.id}">${esc(L(x.name))} <small>${C.missingOf(S, next, x.id).length}</small></button>`).join('')}</div>
      <p class="small">${t('trade_missing_note')}</p></div>
    <div class="row2"><button type="button" class="btn btn-soft" data-action="trade-back">${t('trade_back')}</button><button type="button" class="btn btn-gold" data-action="trade-go" ${full ? '' : 'disabled'}>${t('trade_go')}</button></div>`;
}
function openTrade() {
  trade = null;
  openModal(tradeTiersHTML(), 'trade-modal', () => { trade = null; });
}
function renderTrade() {
  const md = $('.trade-modal');
  if (!md) return;
  const sc = md.scrollTop;
  md.innerHTML = trade ? tradePickHTML() : tradeTiersHTML();
  md.scrollTop = trade ? sc : 0;
}
function tradeAction(a, btn) {
  if (a === 'open') {
    $$('.skin-sheet').forEach((x) => closeModal(x));
    openTrade();
    if (btn.dataset.r && C.tradableCopies(S, btn.dataset.r) >= C.TRADE_COST) { trade = { r: btn.dataset.r, sel: new Map(), cat: null }; renderTrade(); }
    return;
  }
  if (a === 'tier') { trade = { r: btn.dataset.r, sel: new Map(), cat: null }; sfx.click(); renderTrade(); return; }
  if (!trade) return;
  if (a === 'back') { trade = null; sfx.click(); renderTrade(); return; }
  if (a === 'toggle') {
    // hvert trykk legger til ett eksemplar (duplikater først); når alle er valgt, nullstilles skinnet
    const id = btn.dataset.id;
    const have = C.spareCopies(S, C.SKIN_BY_ID[id]);
    const cur = trade.sel.get(id) || 0;
    if (cur < have && tradeSelCount() < C.TRADE_COST) trade.sel.set(id, cur + 1);
    else if (cur) trade.sel.delete(id);
    else { sfx.nope(); return; }
    sfx.click();
    renderTrade();
    return;
  }
  if (a === 'clear') { trade.sel = new Map(); sfx.click(); renderTrade(); return; }
  if (a === 'auto') {
    trade.sel = new Map();
    for (const id of C.autoPick(S, trade.r)) trade.sel.set(id, (trade.sel.get(id) || 0) + 1);
    sfx.swish();
    renderTrade();
    return;
  }
  if (a === 'cat') { trade.cat = btn.dataset.cat || null; sfx.click(); renderTrade(); return; }
  if (a === 'go') {
    const ids = [];
    for (const [id, n] of trade.sel) for (let i = 0; i < n; i++) ids.push(id);
    const res = C.tradeUp(S, ids, trade.cat);
    if (!res) { sfx.nope(); toast(t('trade_failed')); return; }
    persist();
    sfx.crateOpen();
    closeModal(btn);
    trade = null;
    lootFlow([res], { closed: false });
    updateHUD();
    if (tab === 'shop') renderShop();
  }
}

// ----- kjøp (demo eller ekte butikk) -----
function confirmPurchase(p) {
  return new Promise((resolve) => {
    let ok = false;
    const lines = [];
    if (p.adFree) lines.push(`<li>${ico('adfree')} ${t('adfree_name')}</li>`);
    if (p.gems) lines.push(`<li>${ico('gem')} ${fmt(p.gems)} ${t('gems')}</li>`);
    if (p.crate) lines.push(`<li>${ico('crate')} 1 × ${esc(L(C.CRATE_BY_ID[p.crate].name))}</li>`);
    const m = openModal(`<div class="modal-head"><h2 class="h2">${t('confirm_purchase')}</h2></div>
      <ul class="iap-lines">${lines.join('')}</ul>
      <p class="demo-warning">${ico('info')} ${t('demo_purchase_text')}</p>
      <div class="row2"><button type="button" class="btn btn-gold" data-iap="yes">${t('demo_buy', { p: esc(L(p.price)) })}</button><button type="button" class="btn btn-soft" data-iap="no">${t('cancel')}</button></div>`, 'iap-modal', () => resolve(ok));
    m.querySelector('[data-iap="yes"]').addEventListener('click', (e) => { ok = true; closeModal(e.target); });
    m.querySelector('[data-iap="no"]').addEventListener('click', (e) => closeModal(e.target));
  });
}
async function buyProduct(id) {
  const p = M.PRODUCT_BY_ID[id];
  if (!p) return;
  if (p.once && S.purchases.includes(id)) return;
  const ok = await M.purchase(id);
  if (!ok) return;
  if (p.gems) S.gems += p.gems;
  if (p.adFree) S.adFree = true;
  if (p.crate) { C.addCrate(S, p.crate); S.flags.starterCrate = true; }
  S.purchases.push(id);
  persist();
  sfx.fanfare();
  toast(t('purchase_done'), 'gold');
  updateHUD(); updateBadges();
  renderTab();
  if (p.crate) gotCrateModal(p.crate);
}

// ----- reklame -----
let adSoundWas = null;
function onAdStart() { adSoundWas = S ? S.settings.sound : null; setSound(false); M.gameplayStop(); }
function onAdEnd() { if (adSoundWas !== null) setSound(adSoundWas); adSoundWas = null; M.gameplayStart(); }
// Belønningsvideoer krever alltid en reklame, også for dem som har kjøpt reklamefri
// (reklamefri fjerner bare mellomreklamen).
async function watchAd(placement, reward) {
  unlockAudio();
  const res = await M.rewardedAd(placement);
  if (res === 'ok') {
    S.ads.watched = (S.ads.watched || 0) + 1;
    reward();
    persist();
    return true;
  }
  toast(res === 'skipped' ? t('ad_skipped') : t('ad_none'));
  return false;
}
// Mellomreklame – bare for dem som ikke har kjøpt reklamefri. Den kommer i naturlige pauser: etter kamper,
// når et kapittel er ferdig, og ved fanebytte når det har gått en stund siden forrige reklame.
// Aldri i opplæringen, de første minuttene eller mens et vindu er åpent.
function interstitialAllowed(minGapSec) {
  if (!S || S.adFree || !M.adsEnabled()) return false;
  if (S.tut < 5 || S.stats.playTime < 240 || modalCount > 0) return false;
  return Date.now() - (S.ads.lastInterstitial || 0) >= minGapSec * 1000;
}
async function showInterstitial(placement) {
  S.ads.lastInterstitial = Date.now();
  S.ads.battlesSince = 0;
  S.ads.interstitials = (S.ads.interstitials || 0) + 1;
  persist();
  await M.interstitialAd(placement);
}
async function maybeInterstitial() {
  if (!S || S.adFree || !M.adsEnabled()) return;
  S.ads.battlesSince = (S.ads.battlesSince || 0) + 1;
  if (S.ads.battlesSince < M.CONFIG.ads.interstitialEvery) return;
  if (!interstitialAllowed(M.CONFIG.ads.interstitialMinGap)) return;
  await showInterstitial('after_battle');
}
// Tidsstyrt: ved fanebytte etter interstitialTimer sekunder uten reklame (0 slår det av)
function maybeTimedInterstitial(placement) {
  const sec = Number(M.CONFIG.ads.interstitialTimer) || 0;
  if (sec <= 0 || !interstitialAllowed(Math.max(sec, M.CONFIG.ads.interstitialMinGap))) return;
  showInterstitial(placement);
}
const FAKE_ADS = [
  { art: () => A.buildingArt('burger'), title: 'Ohio Burger', text: { nb: 'Nå med ekstra mais! Prøv Columbus-menyen i dag.', en: 'Now with extra corn! Try the Columbus meal today.' }, color: '#ff8a3d' },
  { art: () => A.colaArt(), title: 'Buckeye Cola', text: { nb: 'Brusen generaler drikker. 100 % nøttefri!', en: 'The soda generals drink. 100% nut-free!' }, color: '#e5484d' },
  { art: () => A.buildingArt('tech'), title: 'OhioPhone 99', text: { nb: 'Tre kameraer. Null dekning i Ohio.', en: 'Three cameras. Zero signal in Ohio.' }, color: '#3559d6' },
  { art: () => A.buildingArt('mooncheese'), title: 'Måneost™', text: { nb: 'Hentet fersk fra månen. Pass deg for romvesener!', en: 'Fresh from the Moon. Watch out for aliens!' }, color: '#f0a91c' },
];
function demoAd(type) {
  return new Promise((resolve) => {
    modalCount++;
    onAdStart();
    const ad = FAKE_ADS[Math.floor(Math.random() * FAKE_ADS.length)];
    const secs = type === 'rewarded' ? 5 : 3;
    const ov = document.createElement('div');
    ov.className = 'ad-overlay';
    ov.innerHTML = `<div class="ad-top"><span class="ad-label">${t('ad_label')}</span><button type="button" class="ad-close" disabled>${secs}</button></div>
      <div class="ad-card" style="--ad:${ad.color}"><div class="ad-art">${ad.art()}</div><h3>${esc(ad.title)}</h3><p>${esc(L(ad.text))}</p></div>
      <p class="ad-foot">${t('ad_demo_note')}</p>
      <div class="ad-actions">${type === 'rewarded' ? `<button type="button" class="link-btn ad-skip">${t('ad_skip')}</button>` : ''}
      ${type === 'interstitial' && M.paymentsEnabled() ? `<button type="button" class="btn btn-soft ad-remove">${ico('adfree')} ${t('remove_ads')}</button>` : ''}</div>`;
    $('#overlay-root').appendChild(ov);
    const btn = $('.ad-close', ov);
    let left = secs;
    const iv = setInterval(() => {
      left--;
      if (left > 0) btn.textContent = left;
      else { clearInterval(iv); btn.disabled = false; btn.classList.add('ready'); btn.innerHTML = type === 'rewarded' ? t('ad_claim') : ico('close'); }
    }, 1000);
    const end = (v) => { clearInterval(iv); ov.remove(); modalCount = Math.max(0, modalCount - 1); onAdEnd(); resolve(v); };
    btn.addEventListener('click', () => end('ok'));
    $('.ad-skip', ov)?.addEventListener('click', () => end('skipped'));
    $('.ad-remove', ov)?.addEventListener('click', () => { end('ok'); shopView = 'store'; setTab('shop'); });
  });
}
function boostCardHTML() {
  if (!M.adsEnabled()) return '';
  const left = Math.ceil(((S.adBoostUntil || 0) - Date.now()) / 1000);
  if (left > 0) {
    return `<div class="item-card boost-card active"><div class="item-art boost-art">${ico('boost')}</div>
      <div class="item-body"><div class="item-name">${t('boost_active')}</div><div class="item-desc">${t('boost_left2', { t: duration(left) })}</div></div></div>`;
  }
  return `<div class="item-card boost-card"><div class="item-art boost-art">${ico('boost')}</div>
    <div class="item-body"><div class="item-name">${t('boost_title')}</div><div class="item-desc">${t('boost_desc')}</div></div>
    ${adBtn('ad-boost', false)}</div>`;
}

// ---------------- REISEN (hele spillet som et tre) ----------------
function wrapLabel(name, max = 15) {
  if (name.length <= max) return [name];
  const words = name.split(' ');
  let a = '';
  while (words.length && (a + ' ' + words[0]).trim().length <= max) a = (a + ' ' + words.shift()).trim();
  if (!a) a = words.shift();
  return [a, words.join(' ')];
}
function treeHTML() {
  const total = REGIONS.length;
  const done = REGIONS.filter((r) => S.conquered[r.id]).length;
  const W = 360, X = 180, FR = 40, CH = 96;
  const rows = [];
  rows.push({ kind: 'top', h: 96 });
  for (let e = ERAS.length - 1; e >= 0; e--) {
    const rs = regionsOfEra(e).slice().reverse();
    rs.forEach((r, i) => rows.push({ kind: 'fruit', r, e, side: (rs.length - i) % 2 ? -1 : 1, h: FR }));
    rows.push({ kind: 'chapter', e, h: CH + 54 });
  }
  rows.push({ kind: 'root', h: 120 });
  let y = 0;
  for (const row of rows) { row.y = y + row.h / 2; y += row.h; }
  const H = y;
  const next = E.chosenTarget(S);
  const here = rows.find((r) => r.kind === 'fruit' && next && r.r.id === next.id) || rows.find((r) => r.kind === 'chapter' && r.e === S.era);
  const hereY = S.finished ? rows[0].y : here ? here.y : H - 60;
  let svg = '';
  // stamme: lys bakgrunn, mørkere der du har vært
  const trunk = (y0, y1, w, color) => `<path d="M${X} ${y1}C${X - 10} ${(y0 * 2 + y1) / 3} ${X + 10} ${(y0 + y1 * 2) / 3} ${X} ${y0}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
  svg += trunk(rows[0].y, H - 70, 22, '#2b2350') + trunk(rows[0].y, H - 70, 15, '#d9cbb8');
  svg += trunk(hereY, H - 70, 15, '#9b6334');
  for (const row of rows) {
    if (row.kind === 'fruit') {
      const { r, e, side } = row;
      const fx = X + side * 46, fy = row.y;
      const own = S.conquered[r.id];
      const isNext = next && r.id === next.id;
      const future = e > S.era;
      const fill = own ? 'var(--own)' : future ? '#d8d2e6' : r.color;
      svg += `<path d="M${X} ${fy + 12}Q${X + side * 22} ${fy + 10} ${fx - side * 12} ${fy}" fill="none" stroke="#2b2350" stroke-width="7" stroke-linecap="round"/><path d="M${X} ${fy + 12}Q${X + side * 22} ${fy + 10} ${fx - side * 12} ${fy}" fill="none" stroke="${own || e <= S.era ? '#9b6334' : '#d9cbb8'}" stroke-width="3.6" stroke-linecap="round"/>`;
      svg += `<path d="M${fx - side * 2} ${fy - 13}q${side * 8} -8 ${side * 14} -2q${-side * 6} 6 ${-side * 14} 2z" fill="${future ? '#c9d6c0' : '#5fc94a'}" stroke="#2b2350" stroke-width="1.8"/>`;
      const go = e === S.era && !own ? `data-action="tree-go" data-id="${r.id}" class="tree-tap"` : '';
      svg += `<g ${go}>${isNext ? `<circle cx="${fx}" cy="${fy}" r="20" class="tree-ring"/>` : ''}<circle cx="${fx}" cy="${fy}" r="14" fill="${fill}" stroke="#2b2350" stroke-width="3"/>`;
      if (own) svg += `<path d="M${fx - 6} ${fy}l4 4 8-9" fill="none" stroke="#2b2350" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
      else if (future) svg += `<rect x="${fx - 5}" y="${fy - 1}" width="10" height="7" rx="1.5" fill="#8a82a6"/><path d="M${fx - 3} ${fy - 1}v-2.5a3 3 0 0 1 6 0v2.5" fill="none" stroke="#8a82a6" stroke-width="2"/>`;
      else if (isNext) svg += `<path d="M${fx - 5} ${fy - 5}l10 10M${fx + 5} ${fy - 5}l-10 10" stroke="#2b2350" stroke-width="2.6" stroke-linecap="round"/>`;
      const lines = wrapLabel(L(r.name));
      const lx = fx + side * 22, anchor = side < 0 ? 'end' : 'start';
      svg += `<text x="${lx}" y="${fy + (lines.length > 1 ? -2 : 4)}" text-anchor="${anchor}" class="tree-label ${future ? 'dim' : ''} ${isNext ? 'next' : ''}">${lines.map((l, i) => `<tspan x="${lx}" dy="${i ? 13 : 0}">${esc(l)}</tspan>`).join('')}</text></g>`;
      if (isNext) svg += `<g id="tree-here" transform="translate(${fx + side * -2} ${fy - 30})"><rect x="-34" y="-11" width="68" height="20" rx="10" fill="#ef4f5a" stroke="#2b2350" stroke-width="2.4"/><text y="4" text-anchor="middle" class="tree-here">${t('tree_here')}</text></g>`;
    } else if (row.kind === 'chapter') {
      const e = row.e, era = ERAS[e], cy = row.y;
      const pr = E.eraProgress(S, e);
      const state = pr.done === pr.total ? 'done' : e === S.era ? 'now' : e < S.era ? 'done' : 'locked';
      const art = e <= 4 ? A.hq(era.hq) : A.planet(e === 5 ? 'saturn' : 'mothership');
      const ny = cy - 26;
      svg += `<circle cx="${X}" cy="${ny}" r="34" fill="${state === 'locked' ? '#ece8f4' : '#fff'}" stroke="#2b2350" stroke-width="3.4"/>`;
      svg += art.replace('<svg ', `<svg x="${X - 27}" y="${ny - 27}" width="54" height="54" ${state === 'locked' ? 'opacity=".35" ' : ''}`);
      const title = L(era.title);
      const meta = state === 'done' ? '✓ ' + t('ch_done') : state === 'now' ? t('ch_now') + ` · ${pr.done}/${pr.total}` : `${t('ch_locked')} · ${pr.total} ${t('areas')}`;
      const pw = Math.min(330, Math.max(150, title.length * 10.8 + 34, meta.length * 6.6 + 30));
      const py = ny + 42;
      svg += `<rect x="${X - pw / 2}" y="${py}" width="${pw}" height="58" rx="14" fill="${state === 'locked' ? '#f4f1fa' : state === 'now' ? '#fff6cf' : '#fff'}" stroke="#2b2350" stroke-width="3"/>`;
      svg += `<text x="${X}" y="${py + 16}" text-anchor="middle" class="tree-ch-eyebrow">${esc(t('chapter', { n: e + 1 }))}</text>`;
      svg += `<text x="${X}" y="${py + 35}" text-anchor="middle" class="tree-ch-title ${state === 'locked' ? 'dim' : ''}">${esc(title)}</text>`;
      svg += `<text x="${X}" y="${py + 50}" text-anchor="middle" class="tree-ch-meta">${esc(meta)}</text>`;
    } else if (row.kind === 'top') {
      const cy = row.y;
      svg += `<circle cx="${X}" cy="${cy}" r="30" fill="${S.finished ? 'var(--own)' : '#fff6cf'}" stroke="#2b2350" stroke-width="3.4"/>`;
      svg += `<path d="M${X - 18} ${cy + 8}l4-20 9 9 5-14 5 14 9-9 4 20z" fill="#ffd23f" stroke="#2b2350" stroke-width="2.6" stroke-linejoin="round"/>`;
      svg += `<text x="${X}" y="${cy + 50}" text-anchor="middle" class="tree-ch-title">${esc(t('tree_end'))}</text>`;
    } else if (row.kind === 'root') {
      const cy = row.y - 20;
      svg += `<path d="M${X} ${cy - 10}q-30 20-62 26M${X} ${cy - 10}q30 20 62 26M${X} ${cy - 10}q-8 26-24 40M${X} ${cy - 10}q10 26 26 40" fill="none" stroke="#2b2350" stroke-width="7" stroke-linecap="round"/><path d="M${X} ${cy - 10}q-30 20-62 26M${X} ${cy - 10}q30 20 62 26M${X} ${cy - 10}q-8 26-24 40M${X} ${cy - 10}q10 26 26 40" fill="none" stroke="#9b6334" stroke-width="3.4" stroke-linecap="round"/>`;
      svg += `<ellipse cx="${X}" cy="${cy + 10}" rx="120" ry="20" fill="var(--ground, #6cc551)" opacity=".55"/>`;
      svg += A.hq(0).replace('<svg ', `<svg x="${X - 32}" y="${cy - 64}" width="64" height="56" `);
      svg += `<text x="${X}" y="${cy + 46}" text-anchor="middle" class="tree-ch-meta">${esc(t('tree_start', { name: S.name }))}</text>`;
    }
  }
  return `<div class="card tree-summary">
      <div class="eyebrow">${t('tree_title')}</div>
      <div class="tree-big">${t('tree_counts', { c: ERAS.length, r: total })}</div>
      <div class="progress"><div class="progress-fill" style="width:${(done / total) * 100}%"></div><span>${t('tree_progress', { p: Math.round((done / total) * 100) })} · ${done}/${total}</span></div>
      <p class="small">${t('tree_where', { ch: S.era + 1, n: ERAS.length })}</p>
    </div>
    <div class="tree-wrap"><svg class="tree" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t('tree_title'))}">${svg}</svg></div>`;
}
function renderTree() {
  const pr = E.eraProgress(S);
  $('#scr-map').innerHTML = `<div class="pad stack"><div class="screen-head"><div><div class="eyebrow">${t('chapter', { n: S.era + 1 })} · ${t('conquered_of', { a: pr.done, b: pr.total })}</div><h2 class="h2">${t('map_view_tree')}</h2></div>${mapToggle()}</div>
    ${treeHTML()}</div>`;
}
function scrollTreeToHere() {
  requestAnimationFrame(() => {
    const scr = $('#scr-map'), here = $('#tree-here') || $('.tree-ring');
    if (!scr || !here) return;
    const a = here.getBoundingClientRect(), b = scr.getBoundingClientRect();
    scr.scrollTop += a.top - b.top - scr.clientHeight / 2;
  });
}


// ---------------- TOPPLISTE OG VENNER ----------------
const fbLogo = '<svg viewBox="0 0 24 24" class="brand" aria-hidden="true"><path fill="#fff" d="M13.5 22v-8.2h2.8l.4-3.3h-3.2V8.4c0-.9.3-1.6 1.6-1.6h1.7V3.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.3v3.3h2.8V22z"/></svg>';
const appleLogo = '<svg viewBox="0 0 24 24" class="brand" aria-hidden="true"><path fill="#fff" d="M16.4 12.7c0-2.5 2.1-3.7 2.2-3.8-1.2-1.7-3-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4.2zM13.9 5.3c.7-.9 1.2-2 1.1-3.2-1 0-2.3.7-3 1.6-.7.8-1.3 2-1.1 3.1 1.1.1 2.3-.6 3-1.5z"/></svg>';
const providerBadge = (p) => (p === 'facebook' ? `<span class="pbadge fb">${fbLogo}</span>` : p === 'apple' ? `<span class="pbadge apple">${appleLogo}</span>` : '');
const providerName = (p) => (p === 'facebook' ? 'Facebook' : p === 'apple' ? 'Apple' : t('guest'));

function renderTop() {
  const so = social();
  const st = so ? so.state() : { ready: false, demo: true, signedIn: false, provider: 'guest', code: '' };
  $('#scr-top').innerHTML = `<div class="pad stack">
    <div class="screen-head"><div><div class="eyebrow">${t('top_eyebrow')}</div><h2 class="h2">${t('top_title')}</h2></div>
      <div class="mode-switch" role="group">
        <button type="button" class="${topView === 'friends' ? 'on' : ''}" data-action="topview" data-view="friends">${t('top_friends')}</button>
        <button type="button" class="${topView === 'global' ? 'on' : ''}" data-action="topview" data-view="global">${t('top_global')}</button>
      </div></div>
    <div class="card profile-card">
      <div class="profile-row"><div class="avatar">${miniGeneral()}</div>
        <div class="profile-info"><b>${A.flagSvg('row-flag')}${esc(S.name)}${pBadge(S.prestige)}</b><span>${st.signedIn ? t('signed_in_with', { p: providerName(st.provider) }) : t('playing_as_guest')}</span></div>
        ${providerBadge(st.provider)}</div>
      ${st.signedIn ? '' : `<div class="login-buttons">${LOGIN_PROVIDERS.map((p) => `<button type="button" class="btn-login ${p === 'facebook' ? 'fb' : 'apple'}" data-action="login" data-p="${p}">${p === 'facebook' ? fbLogo : appleLogo}<span>${p === 'facebook' ? t('login_facebook') : t('login_apple')}</span></button>`).join('')}
        <p class="small muted">${t('login_why')}</p></div>`}
      <div class="friend-code"><span>${t('your_code')}</span><b id="my-code">${st.code ? formatCode(st.code) : '…'}</b>
        <button type="button" class="btn btn-soft" data-action="copy-code" ${st.code ? '' : 'disabled'}>${t('copy')}</button></div>
    </div>
    ${topView === 'friends' ? `<div class="add-friend"><label class="field-label" for="friend-code">${t('add_friend_label')}</label>
      <div class="rename-row"><input id="friend-code" class="text-input" maxlength="12" placeholder="OHIO-ABC123" autocomplete="off" autocapitalize="characters">
      <button type="button" class="btn btn-gold" data-action="add-friend">${t('add_friend')}</button></div></div>` : ''}
    <div class="board" id="board"><p class="muted center">${t('loading')}</p></div>
    ${st.demo ? `<p class="demo-note">${ico('info')} ${t('social_demo_note')}</p>` : ''}
    ${st.error && !st.demo ? `<p class="demo-note">${ico('info')} ${t('social_error')}</p>` : ''}
  </div>`;
  loadBoard();
}
async function loadBoard() {
  const so = social();
  const el = $('#board');
  if (!so || !el) return;
  const kind = topView;
  let rows = boardCache.kind === kind && Date.now() - boardCache.at < 20000 ? boardCache.rows : null;
  if (!rows) {
    try { rows = await so.board(kind); boardCache = { kind, rows, at: Date.now() }; } catch (e) { rows = []; console.warn(e); }
  }
  if (tab !== 'top' || topView !== kind || !$('#board')) return;
  const onlyMe = rows.length <= 1;
  $('#board').innerHTML = `${rows.map((r) => `<div class="board-row ${r.me ? 'me' : ''} ${r.place && r.place <= 3 ? 'p' + r.place : ''}">
      <span class="place">${r.place ?? '–'}</span>
      <span class="row-flag-wrap">${rowFlag(r.flag)}</span>
      <span class="who"><b><span class="nm">${esc(r.name || '?')}</span>${pBadge(r.prestige)}${r.me ? ` <em>(${t('you_lower')})</em>` : ''}</b>
        <small>${t('chapter', { n: (r.era || 0) + 1 })}${r.demo ? ` · ${t('example')}` : ''}</small></span>
      ${providerBadge(r.provider)}
      <span class="score">${ico('flag')}${fmt(r.score)}</span>
      ${kind === 'friends' && !r.me ? `<button type="button" class="icon-btn small-x" data-action="remove-friend" data-id="${esc(r.id)}" aria-label="${t('remove_friend')}">${ico('close')}</button>` : ''}
    </div>`).join('')}
    ${kind === 'friends' && onlyMe ? `<div class="empty-card">${miniGeneral()}<p>${t('no_friends')}</p></div>` : ''}
    <p class="small muted center">${t('score_explain')}</p>`;
}
async function doLogin(p) {
  const so = social();
  if (!so) return;
  unlockAudio();
  if (so.demo) {
    const m = openModal(`<div class="modal-head"><h2 class="h2">${p === 'facebook' ? t('login_facebook') : t('login_apple')}</h2></div>
      <p class="speech">${t('demo_login_text', { p: providerName(p) })}</p>
      <div class="row2"><button type="button" class="btn btn-gold" data-dl="yes">${t('demo_login_try')}</button><button type="button" class="btn btn-soft" data-dl="no">${t('cancel')}</button></div>`, 'login-modal');
    m.querySelector('[data-dl="yes"]').addEventListener('click', async (e) => { closeModal(e.target); await so.login(p); persist(); toast(t('login_done', { p: providerName(p) }), 'gold'); renderTop(); });
    m.querySelector('[data-dl="no"]').addEventListener('click', (e) => closeModal(e.target));
    return;
  }
  const res = await so.login(p);
  if (res.ok) { if (!res.redirect) { toast(t('login_done', { p: providerName(p) }), 'gold'); sfx.fanfare(); } }
  else if (res.error !== 'auth/popup-closed-by-user' && res.error !== 'auth/cancelled-popup-request') toast(t('login_failed'));
  boardCache = { kind: '', rows: null, at: 0 };
  persist();
  renderTop();
}
async function doLogout(btn) {
  if (btn && btn.closest('.modal')) closeModal(btn);
  await social()?.logout();
  persist();
  toast(t('logged_out'));
  if (tab === 'top') renderTop();
}
async function doDeleteOnline(btn) {
  if (btn && btn.closest('.modal')) closeModal(btn);
  const res = await social()?.deleteAccount();
  persist();
  toast(res && res.ok ? t('online_deleted') : t('login_failed'));
  if (tab === 'top') renderTop();
}
function copyCode() {
  const code = $('#my-code')?.textContent || '';
  if (!code || code === '…') return;
  const done = () => toast(t('copied', { c: code }), 'gold');
  try {
    navigator.clipboard.writeText(code).then(done, () => { selectText($('#my-code')); toast(code); });
  } catch { selectText($('#my-code')); toast(code); }
}
function selectText(el) {
  if (!el) return;
  try { const r = document.createRange(); r.selectNodeContents(el); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); } catch { /* */ }
}
async function addFriendFlow() {
  const input = $('#friend-code');
  const res = await social()?.addFriend(input ? input.value : '');
  if (!res) return;
  if (res.ok) {
    sfx.recruit();
    toast(t('friend_added', { n: res.friend ? res.friend.name : '' }), 'gold');
    persist();
    boardCache = { kind: '', rows: null, at: 0 };
    renderTop();
  } else {
    sfx.nope();
    toast(t('friend_err_' + (['bad_code', 'self', 'already', 'not_found'].includes(res.error) ? res.error : 'other')));
  }
}
async function removeFriendFlow(id) {
  await social()?.removeFriend(id);
  persist();
  boardCache = { kind: '', rows: null, at: 0 };
  renderTop();
}
function socialSettingsHTML() {
  const so = social();
  if (!so) return '';
  const st = so.state();
  return `<div class="stats-box"><b>${ico('trophy')} ${t('online_section')}</b>
    <p class="small">${st.signedIn ? t('signed_in_with', { p: providerName(st.provider) }) : t('playing_as_guest')}${st.code ? ` · ${t('your_code')} ${formatCode(st.code)}` : ''}</p>
    ${st.signedIn ? `<div class="row2"><button type="button" class="btn btn-soft" data-action="logout">${t('logout')}</button><button type="button" class="btn btn-danger" data-action="delete-online">${t('delete_online')}</button></div>` : `<button type="button" class="link-btn" data-action="tab" data-tab="top">${t('login_from_top')}</button>`}
  </div>`;
}

// ---------------- utviklermodus ----------------
// Snarveier for å gå rundt i spillet og lete etter feil. Lagringen merkes (flags.dev), så den holdes unna det
// globale leaderboardet.
const DEV_SOUNDS = [
  ['Skudd', [...UNITS.map((u) => 'gun:' + u.id), 'gun:foe']],
  ['Kamp', ['hit', 'pew', 'boom', 'alarm', 'shield', 'shieldUp', 'laser', 'nuts', 'bribe', 'star:1', 'star:3', 'march', 'victory', 'defeat', 'fanfare']],
  ['Kasser', ['crateShake', 'crateOpen', 'reveal:0', 'reveal:1', 'reveal:2', 'reveal:3', 'reveal:4', 'equip', 'swish', 'crate']],
  ['Basen', ['tap', 'crit', 'crit:mega', 'comboUp:2', 'talk:drip', 'talk:buckeye', 'talk:zorgon', 'citizen:goose', 'citizen:robot', 'citizen:alien', 'citizen:kid', 'citizen:granny', 'citizen:farmer', 'citizen:chef', 'citizen:soldier', 'citizen:mayor', 'citizen:scientist', 'event', 'good', 'bad', 'daily', 'drop', 'powerup', 'expire']],
  ['Grensesnitt', ['click', 'tab', 'pop', 'whoosh', 'buy', 'recruit', 'coin', 'nope', 'milestone', 'warn']],
];
const soundLabel = (k) => { const [a, b] = k.split(':'); return a === 'gun' ? (b === 'foe' ? 'Fiende' : L(UNIT_BY_ID[b].name)) : b ? `${a} ${b}` : a; };
function playSound(k) {
  const [a, b] = k.split(':');
  if (!sfx[a]) return;
  unlockAudio();
  sfx[a](b === undefined ? undefined : b === 'mega' ? true : /^\d+$/.test(b) ? Number(b) : b);
}
function devInfoHTML() {
  const ev = S.ev && S.ev.cur ? 'venter' : S.ev && S.ev.next ? Math.max(0, Math.round((S.ev.next - Date.now()) / 1000)) + ' s' : '–';
  const dl = D.dailyStatus(S);
  return `<span>Kapittel <b>${S.era + 1}</b></span><span>Opplæring <b>${S.tut}</b></span><span>Spilt <b>${duration(S.stats.playTime)}</b></span>
    <span>Penger <b>${money(S.money)}</b></span><span>Inntekt <b>${money(E.incomePerSec(S))}/s</b></span><span>Styrke <b>${fmt(E.armyPower(S))}</b></span>
    <span>Edelstener <b>${fmt(S.gems)}</b></span><span>Medaljer <b>${S.medals || 0}</b></span><span>Prestisje <b>${S.prestige || 0}</b></span>
    <span>Hendelse <b>${ev}</b></span><span>Daglig <b>${dl.claimed ? 'hentet' : 'dag ' + (dl.idx + 1)}</b></span><span>Lyd <b>${audioState()}</b></span>
    <span>FPS <b>${Math.round(fpsAvg)}</b></span><span>Valgt fiende <b>${esc(E.chosenTarget(S) ? L(E.chosenTarget(S).name) : '–')}</b></span>`;
}
function devPanelHTML() {
  const sec = (title, body) => `<div class="dev-sec"><b>${title}</b><div class="dev-grid">${body}</div></div>`;
  const btn = (id, label, extra = '') => `<button type="button" class="dev-btn" data-action="dev" data-dev="${id}"${extra}>${label}</button>`;
  return `<div class="modal-head"><h2 class="h2">${ico('wrench')} ${t('dev_title')}</h2><button type="button" class="icon-btn" data-action="close" aria-label="${t('close')}">${ico('close')}</button></div>
    <div class="dev-info" id="dev-info">${devInfoHTML()}</div>
    ${sec('Ressurser', btn('money1h', '+1 time inntekt') + btn('money1d', '+1 døgn inntekt') + btn('gems', '+1000 edelstener') + btn('medals', '+10 medaljer') + btn('crates', '+3 av hver kasse') + btn('pus', 'Alle powerups ×3') + btn('skins', 'Alle skins') + btn('tapmax', 'Maks trykk-kraft'))}
    ${sec('Hær og kamp', btn('army10', '+10 beste enhet') + btn('army100', '+100 beste enhet') + btn('armywin', 'Nok hær til 100 %') + btn('armyweak', 'Nesten ingen hær') + btn('conquer', 'Ta valgt fiende nå'))}
    ${sec('Kapittel', ERAS.map((e, i) => btn('era', `${i + 1}. ${esc(L(e.name))}`, ` data-n="${i}"`)).join('') + btn('winall1', 'Ta alle unntatt én') + btn('finishera', 'Fullfør kapittelet') + btn('prestige', 'Klar for prestisje') + btn('prestigeplus', 'Prestisje +1'))}
    ${sec('Basen', `<select id="dev-ev" class="dev-select" aria-label="Hendelse">${EV.EVENTS.map((x) => `<option value="${x.id}">${esc(L(x.title))}</option>`).join('')}</select>` + btn('event', 'Start hendelsen') + btn('eventrnd', 'Tilfeldig hendelse') + btn('daily', 'Daglig bonus igjen') + btn('daily7', 'Dag 7 i dag') + btn('crate', 'Forsyningskasse') + btn('quip', 'Generalen sier noe') + btn('combo', 'Kombo ×3') + btn('crit', 'Neste trykk: kritisk') + btn('mega', 'Neste trykk: mega') + btn('away1', 'Borte i 1 time') + btn('away8', 'Borte i 8 timer'))}
    ${sec('Generaler', C.GENERALS.map((g) => btn('gen', esc(L(g.name)), ` data-g="${g.id}"`)).join(''))}
    ${sec('Reklame', btn('adinter', 'Vis mellomreklame') + btn('adreward', 'Vis belønningsreklame') + btn('adfree', S.adFree ? 'Reklamefri: på' : 'Reklamefri: av') + btn('adreset', 'Nullstill reklametidtakere'))}
    <div class="dev-sec"><b>Lyd</b><div class="dev-audio"><span>Status: <b id="dev-astate">${audioState()}</b></span><span class="dev-meter"><i id="dev-level"></i></span>${btn('unlock', 'Lås opp lyd')}</div>
      ${DEV_SOUNDS.map(([g, list]) => `<div class="dev-sub">${g}</div><div class="dev-grid snd">${list.map((k) => `<button type="button" class="dev-btn" data-action="dev" data-dev="snd" data-snd="${k}">${esc(soundLabel(k))}</button>`).join('')}</div>`).join('')}</div>
    ${sec('Visning', btn('lang', getLang() === 'nb' ? 'English' : 'Norsk') + btn('allskins', showAllSkins ? 'Alle skins i butikken: på' : 'Alle skins i butikken: av') + btn('hud', devHud ? 'Info-overlay: på' : 'Info-overlay: av'))}
    ${sec('Lagring', btn('export', 'Kopier lagringen') + btn('import', 'Lim inn en lagring') + btn('tut', 'Opplæringen på nytt') + btn('reset', 'Nytt spill'))}
    <div class="dev-save-box" id="dev-save-box" hidden><textarea id="dev-save" class="dev-save" spellcheck="false"></textarea>${btn('importgo', 'Last inn lagringen')}</div>
    <p class="small dev-foot">${t('dev_note')} ${t('version')} ${esc(BUILD)}</p>`;
}
function openDevPanel() {
  if (!devOn) return;
  $$('.dev-modal').forEach((x) => closeModal(x));
  openModal(devPanelHTML(), 'dev-modal');
}
function refreshDevPanel() {
  const md = $('.dev-modal');
  if (!md) return;
  const sc = md.scrollTop;
  const ev = $('#dev-ev', md)?.value;
  md.innerHTML = devPanelHTML();
  if (ev && $('#dev-ev', md)) $('#dev-ev', md).value = ev;
  md.scrollTop = sc;
}
function updateDevLive() {
  const info = $('#dev-info');
  if (info) info.innerHTML = devInfoHTML();
  const lv = $('#dev-level');
  if (lv) lv.style.width = Math.min(100, audioLevel() * 300) + '%';
  const as = $('#dev-astate');
  if (as) as.textContent = audioState();
  const hud = $('#dev-hud');
  if (hud) hud.textContent = `FPS ${Math.round(fpsAvg)} · ${money(S.money)} · +${money(E.incomePerSec(S))}/s · ⚔ ${fmt(E.armyPower(S))} · kap ${S.era + 1} · tut ${S.tut} · ${tab}`;
}
function devChrome() {
  $('#dev-fab')?.remove();
  $('#dev-hud')?.remove();
  if (!devOn || !S) return;
  const fab = document.createElement('button');
  fab.type = 'button';
  fab.id = 'dev-fab';
  fab.className = 'dev-fab';
  fab.dataset.action = 'dev-open';
  fab.setAttribute('aria-label', t('dev_title'));
  fab.innerHTML = ico('wrench');
  $('#app').appendChild(fab);
  if (devHud) { const h = document.createElement('div'); h.id = 'dev-hud'; h.className = 'dev-hud'; $('#app').appendChild(h); }
}
function devTap() {
  if (!DEV_OK) return;
  const now = Date.now();
  devTaps = now - devTapAt < 1500 ? devTaps + 1 : 1;
  devTapAt = now;
  if (devOn) return;
  if (devTaps >= 7) {
    devOn = true;
    devTaps = 0;
    lsSet(DEV_KEY, '1');
    sfx.milestone();
    toast(t('dev_on'), 'gold');
    devChrome();
    closeModal($('.modal.settings'));
    showSettings();
  } else if (devTaps >= 3) toast(t('dev_taps', { n: 7 - devTaps }));
}
const bestUnitNow = () => UNITS.filter((u) => u.era <= S.era).pop();
function devEra(e) {
  for (const r of REGIONS) {
    if (r.era < e) S.conquered[r.id] = true;
    else delete S.conquered[r.id];
  }
  S.era = e;
  S.finished = false;
  S.target = '';
  if (S.tut < 5) S.tut = 9;
  S.seenIntro = e;
  mapEra = e;
  viewBox = null;
  selected = null;
  applyTheme();
}
function devAction(id, btn) {
  if (!devOn || !S) return;
  const cheat = !['snd', 'unlock', 'hud', 'lang', 'allskins', 'export', 'import', 'importgo', 'off', 'reset'].includes(id);
  if (cheat) S.flags.dev = true;
  let close = false;
  switch (id) {
    case 'money1h': case 'money1d': { const v = Math.max(1000, E.incomePerSec(S) * (id === 'money1h' ? 3600 : 86400)); S.money += v; S.totalEarned += v; toast('+' + money(v)); break; }
    case 'gems': S.gems += 1000; break;
    case 'medals': S.medals = (S.medals || 0) + 10; S.medalsEarned = (S.medalsEarned || 0) + 10; break;
    case 'crates': for (const c of C.CRATES) C.addCrate(S, c.id, 3); break;
    case 'pus': for (const q of PU.POWERUPS) S.pu.inv[q.id] = (S.pu.inv[q.id] || 0) + 3; refreshPu(); break;
    case 'skins': for (const k of C.SKINS) S.skins.owned[k.id] = S.skins.owned[k.id] || Date.now(); toast(C.SKINS.length + ' skins'); break;
    case 'tapmax': S.tapLevel = E.TAP_MAX; break;
    case 'army10': case 'army100': { const u = bestUnitNow(); S.units[u.id] = (S.units[u.id] || 0) + (id === 'army10' ? 10 : 100); toast(`+${id === 'army10' ? 10 : 100} ${L(u.name)}`); break; }
    case 'armywin': {
      const r = E.chosenTarget(S);
      if (!r) break;
      const u = bestUnitNow();
      for (let n = 1, i = 0; i < 40 && E.chanceFor(S, r) < 1; i++, n *= 2) S.units[u.id] = (S.units[u.id] || 0) + n;
      toast(`${pct(E.chanceFor(S, r))} mot ${L(r.name)}`);
      break;
    }
    case 'armyweak': S.units = { militia: 1 }; break;
    case 'conquer': {
      const r = E.chosenTarget(S);
      if (!r) break;
      S.conquered[r.id] = true;
      S.stars[r.id] = 3;
      delete S.damage[r.id];
      S.target = '';
      toast('✓ ' + L(r.name));
      if (E.eraComplete(S) && !S.finished) { close = true; setTimeout(showEraComplete, 120); }
      break;
    }
    case 'era': devEra(Number(btn.dataset.n)); break;
    case 'winall1': { const rs = regionsOfEra(S.era); rs.slice(0, rs.length - 1).forEach((r) => { S.conquered[r.id] = true; }); break; }
    case 'finishera': regionsOfEra(S.era).forEach((r) => { S.conquered[r.id] = true; }); close = true; setTimeout(showEraComplete, 120); break;
    case 'prestige': devEra(ERAS.length - 1); regionsOfEra(S.era).forEach((r) => { S.conquered[r.id] = true; }); S.finished = true; close = true; setTab('base'); break;
    case 'prestigeplus': S.prestige = (S.prestige || 0) + 1; break;
    case 'event': case 'eventrnd': {
      if (S.tut < 5) S.tut = 9;
      EV.startEvent(S, Date.now(), Math.random, id === 'event' ? $('#dev-ev')?.value : null);
      close = true;
      setTab('base');
      setTimeout(() => { onEventSpawn(); openEvent(); }, 150);
      break;
    }
    case 'daily': S.daily = { ...S.daily, last: D.prevDay(new Date()) }; refreshDailyBtn(); break;
    case 'daily7': S.daily = { last: D.prevDay(new Date()), streak: 6, total: S.daily.total || 0 }; refreshDailyBtn(); close = true; setTimeout(openDaily, 150); break;
    case 'crate': nextCrate = 0; close = true; break;
    case 'quip': nextQuip = 0; close = true; setTab('base'); setTimeout(() => maybeQuip(performance.now()), 200); break;
    case 'combo': close = true; setTab('base'); setTimeout(() => { combo = 120; lastTapAt = performance.now() + 2500; updateCombo(); }, 150); break;
    case 'crit': devCrit = 1; close = true; setTab('base'); toast('Trykk på hovedkvarteret'); break;
    case 'mega': devCrit = 2; close = true; setTab('base'); toast('Trykk på hovedkvarteret'); break;
    case 'away1': case 'away8': S.lastSeen = Date.now() - (id === 'away1' ? 3600 : 8 * 3600) * 1000; close = true; setTimeout(checkOffline, 150); break;
    case 'gen': S.general = btn.dataset.g; S.genSwitchAt = 0; applySkins(); break;
    case 'adinter': close = true; setTimeout(() => M.interstitialAd('dev'), 150); break;
    case 'adreward': close = true; setTimeout(() => watchAd('dev', () => toast('Belønning gitt!', 'boost')), 150); break;
    case 'adfree': S.adFree = !S.adFree; break;
    case 'adreset': S.ads.freeCrateAt = 0; S.ads.gemCount = 0; S.ads.lastInterstitial = 0; S.ads.battlesSince = 0; break;
    case 'unlock': unlockAudio(); setTimeout(() => sfx.coin(), 60); break;
    case 'snd': playSound(btn.dataset.snd); return;
    case 'lang': { const l = getLang() === 'nb' ? 'en' : 'nb'; S.settings.lang = l; setLang(l); renderShellText(); break; }
    case 'allskins': showAllSkins = !showAllSkins; break;
    case 'hud': devHud = !devHud; lsSet(DEV_KEY + '-hud', devHud ? '1' : null); devChrome(); break;
    case 'export': {
      const box = $('#dev-save-box'), ta = $('#dev-save');
      if (!box || !ta) break;
      box.hidden = false;
      ta.value = JSON.stringify(S);
      ta.focus(); ta.select();
      try { navigator.clipboard.writeText(ta.value).then(() => toast('Kopiert!'), () => toast('Merk teksten og kopier den')); } catch { toast('Merk teksten og kopier den'); }
      return;
    }
    case 'import': { const box = $('#dev-save-box'), ta = $('#dev-save'); if (box && ta) { box.hidden = false; ta.value = ''; ta.focus(); } return; }
    case 'importgo': {
      try {
        const data = JSON.parse($('#dev-save').value);
        S = E.restore(data);
        S.flags.dev = true;
        persist();
        location.reload();
      } catch { sfx.nope(); toast('Det var ikke en gyldig lagring'); }
      return;
    }
    case 'tut': S.tut = 0; S.stats.taps = 0; setTab('base'); close = true; break;
    case 'reset': if (window.confirm(t('reset_confirm'))) { lsSet(SAVE_KEY, null); window.onpagehide = null; location.reload(); } return;
    case 'off': devOn = false; devHud = false; lsSet(DEV_KEY, null); lsSet(DEV_KEY + '-hud', null); devChrome(); $$('.dev-modal').forEach((x) => closeModal(x)); toast(t('dev_off')); if ($('.modal.settings')) { closeModal($('.modal.settings')); showSettings(); } return;
    default: return;
  }
  sfx.click();
  persist();
  updateHUD();
  updateBadges();
  lastSig = {};
  renderTab();
  updateTutorial();
  if (close) $$('.dev-modal').forEach((x) => closeModal(x));
  else refreshDevPanel();
}

// ---------------- velg fiende ----------------
// Alle fiendene i kapittelet du er i (samme nivå). Ta dem i den rekkefølgen du vil.
function openEnemyPicker() {
  const cur = E.chosenTarget(S);
  const list = regionsOfEra(S.era).filter((r) => !S.conquered[r.id]).sort((a, b) => E.regionDef(S, a) - E.regionDef(S, b));
  openModal(`<div class="modal-head"><h2 class="h2">${t('pick_enemy')}</h2><button type="button" class="icon-btn" data-action="close" aria-label="${t('close')}">${ico('close')}</button></div>
    <p class="small">${t('pick_enemy_sub', { n: list.length, c: S.era + 1 })}</p>
    <div class="enemy-list">${list.map((r) => {
      const ch = E.chanceFor(S, r);
      const T = TERRAINS[r.terrain];
      return `<button type="button" class="enemy-pick${cur && cur.id === r.id ? ' on' : ''}" data-action="set-target" data-id="${r.id}" aria-pressed="${!!(cur && cur.id === r.id)}">
        <span class="ep-art">${enemyArtFor(r)}</span>
        <span class="ep-info"><b>${esc(L(r.name))}</b><span class="ep-flavor">${esc(L(r.flavor))}</span>
          <span class="ep-row"><span class="ep-def">${ico('skull')}${fmt(E.battleDef(S, r))}</span>${T ? `<span class="terrain-chip" style="--tc:${T.color}">${esc(L(T.name))}</span>` : ''}<span class="ep-rew">${ico('coin')}+${money(r.income * pm())}/s</span></span></span>
        <span class="ep-ch ${chanceClass(ch)}">${pct(ch)}</span>
      </button>`;
    }).join('')}</div>`, 'enemy-modal');
}
function setTarget(btn) {
  const r = REGION_BY_ID[btn.dataset.id];
  if (!r || r.era !== S.era || S.conquered[r.id]) return;
  S.target = r.id;
  selected = r.id;
  persist();
  sfx.click();
  closeModal(btn);
  lastSig.target = null;
  if (tab === 'map') { mapEra = S.era; selectRegion(r.id); }
  const c = $('#target-card');
  if (c) { c.innerHTML = targetCardHTML(); c.classList.remove('picked'); void c.offsetWidth; c.classList.add('picked'); }
  toast(t('enemy_set', { r: L(r.name) }));
}

// ---------------- hendelser i basen ----------------
function onEventSpawn() {
  sfx.event();
  if (tab === 'base') { refreshEventSpot(); genSay(say('evSpawn', 'ev_spawn_say'), 3800, true); }
  updateBadges();
}
function openEvent() {
  const x = EV.currentEvent(S);
  if (!x) { refreshEventSpot(); return; }
  unlockAudio();
  sfx.click();
  openModal(`<div class="ev-head"><div class="ev-art">${A.citizenArt(x.who)}</div><div class="ev-ttl"><div class="eyebrow">${t('ev_eyebrow', { v: esc(S.name) })}</div><h2 class="h2">${esc(L(x.title))}</h2></div></div>
    <p class="ev-q">${esc(L(x.q))}</p>
    <div class="ev-answers">${S.ev.cur.order.map((idx, pos) => `<button type="button" class="ev-ans" data-action="ev-answer" data-pos="${pos}"><span class="ev-n">${'ABC'[pos]}</span><span>${esc(L(x.a[idx].t))}</span></button>`).join('')}</div>
    <button type="button" class="link-btn ev-later" data-action="close">${t('ev_later')}</button>`, 'ev-modal');
}
function fxLabel(res) {
  const n = res.amount;
  switch (res.kind) {
    case 'cash': return `${ico('coin')} +${money(n)}`;
    case 'loss': return `${ico('coin')} −${money(n)}`;
    case 'gems': return `${ico('gem')} ${t('fx_gems', { n })}`;
    case 'buff': case 'slump': return `${ico('boost')} ${t('fx_buff', { m: multTxt(n), n: res.val })}`;
    case 'tap': case 'tapdown': return `${ico('tap')} ${t('fx_tap', { m: multTxt(n), n: res.val })}`;
    case 'pu': return `${ico('star')} ${t('fx_pu', { p: L(res.pu.name) })}`;
    case 'crate': return `${ico('crate')} ${t('fx_crate', { n })}`;
    case 'medal': return `${ico('medal')} ${t('fx_medal', { n })}`;
    case 'troops': return `${ico('army')} +${fmt(n)} ${esc(L(res.unit.name))}`;
    case 'desert': return `${ico('army')} −${fmt(n)} ${esc(L(res.unit.name))}`;
    default: return '';
  }
}
function answerEvent(btn) {
  const out = EV.answerEvent(S, Number(btn.dataset.pos));
  const modal = btn.closest('.modal');
  if (!out) { closeModal(btn); refreshEventSpot(); return; }
  const { event: x, answer: a, res } = out;
  persist();
  if (res.good) { sfx.good(); if (S.settings.vibrate) buzz(20); } else { sfx.bad(); if (S.settings.vibrate) buzz(40); }
  modal.classList.add('ev-done', res.good ? 'good' : 'bad');
  modal.innerHTML = `<div class="ev-head"><div class="ev-art">${A.citizenArt(x.who)}</div><div class="ev-ttl"><div class="eyebrow">${esc(L(x.title))}</div><h2 class="h2">${esc(res.good ? say('evGood', 'ev_good') : say('evBad', 'ev_bad'))}</h2></div></div>
    <p class="ev-chosen">«${esc(L(a.t))}»</p>
    <p class="ev-r">${esc(L(a.r))}</p>
    <div class="ev-fx ${res.good ? 'good' : 'bad'}">${fxLabel(res)}</div>
    <button type="button" class="btn ${res.good ? 'btn-gold' : 'btn-soft'} big" data-action="close">OK</button>`;
  if (res.good) confetti(modal, 36);
  updateHUD(); updateBadges(); updateEvBuffs(); refreshEventSpot();
  if (res.kind === 'pu') refreshPu();
  if (tab === 'base') { const c = $('#target-card'); if (c) c.innerHTML = targetCardHTML(); }
}

// ---------------- daglig bonus ----------------
const dailyArt = (r) => (r.kind === 'cash' ? ico('coin') : r.kind === 'gems' ? ico('gem') : r.kind === 'pu' ? ico('star') : A.crateArt(r.crate));
function dailyLabel(r) {
  if (r.kind === 'cash') return t('daily_cash', { v: money(D.dailyValue(S, r)) });
  if (r.kind === 'gems') return '+' + r.n;
  if (r.kind === 'pu') return t('daily_pu');
  if (r.kind === 'crate') return L(C.CRATE_BY_ID[r.crate].name);
  return `${L(C.CRATE_BY_ID[r.crate].name)} + ${r.n}`;
}
function dailyHTML(got = null) {
  const st = D.dailyStatus(S);
  const tiles = D.DAILY.map((r, i) => {
    const state = i < st.idx || (st.claimed && i === st.idx) ? 'done' : i === st.idx ? 'today' : 'next';
    return `<div class="dl-tile ${state}${i === 6 ? ' big' : ''}"><span class="dl-day">${t('day_n', { n: i + 1 })}</span><span class="dl-art">${dailyArt(r)}</span><b>${esc(dailyLabel(r))}</b>${state === 'done' ? `<span class="dl-check">${ico('check')}</span>` : ''}</div>`;
  }).join('');
  let gotHTML = '';
  if (got) {
    const parts = [];
    if (got.money) parts.push(`${ico('coin')} +${money(got.money)}`);
    if (got.gems) parts.push(`${ico('gem')} +${got.gems}`);
    if (got.crates) parts.push(`${ico('crate')} ${got.crates} × ${esc(L(C.CRATE_BY_ID[got.crate].name))}`);
    got.pu.forEach((p) => parts.push(`${ico('star')} ${esc(L(p.name))}`));
    gotHTML = `<div class="dl-got"><b>${t('daily_got', { n: got.idx + 1 })}</b>${parts.map((x) => `<span>${x}</span>`).join('')}${got.crates ? `<small>${t('daily_crate_where')}</small>` : ''}</div>`;
  }
  return `<div class="modal-head"><h2 class="h2">${ico('gift')} ${t('daily_title')}</h2><button type="button" class="icon-btn" data-action="close" aria-label="${t('close')}">${ico('close')}</button></div>
    <p class="dl-sub">${st.claimed ? t('daily_come_back') : st.broken ? t('daily_broken') : t('daily_sub', { n: st.idx + 1 })}</p>
    <div class="dl-grid">${tiles}</div>
    ${gotHTML}
    ${st.claimed ? `<button type="button" class="btn btn-gold big" data-action="close">OK</button>`
    : `<div class="dl-actions"><button type="button" class="btn btn-gold big" data-action="daily-claim">${t('claim')}</button>${M.adsEnabled() ? `<button type="button" class="btn btn-ad" data-action="daily-claim2">${ico('ad')} ${t('daily_double')}</button>` : ''}</div>`}`;
}
function openDaily() {
  unlockAudio();
  openModal(dailyHTML(), 'daily-modal');
}
function claimDaily(btn, mult = 1) {
  const got = D.claimDaily(S, new Date(), mult);
  const modal = btn && btn.isConnected ? btn.closest('.modal') : $('.daily-modal');
  if (!got) { if (modal) modal.innerHTML = dailyHTML(); return; }
  persist();
  sfx.daily();
  if (S.settings.vibrate) buzz(30);
  if (modal) { modal.innerHTML = dailyHTML(got); confetti(modal, 50); }
  updateHUD(); updateBadges(); refreshDailyBtn();
  if (got.pu.length) refreshPu();
}
function maybeAutoDaily() {
  if (NOAUTO || dailyAutoShown || !S || S.tut < 5 || tab !== 'base' || modalCount > 0 || document.hidden) return;
  dailyAutoShown = true;
  if (!D.dailyStatus(S).claimed) openDaily();
}

// ---------------- små effekter ----------------
function floatText(x, y, text, cls = '') {
  const fx = $('#fx');
  if (!fx || fx.childElementCount > 24) return;
  const el = document.createElement('div');
  el.className = 'float-text ' + cls;
  el.textContent = text;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  fx.appendChild(el);
  setTimeout(() => el.remove(), 900);
}
const coinBurst = (x, y) => tapBurst(x, y, 3, 'coin');
function tapBurst(x, y, n = 3, kind = 'coin') {
  const fx = $('#fx');
  if (!fx || fx.childElementCount > 48) return;
  const spread = n > 3 ? 230 : 140;
  for (let i = 0; i < n; i++) {
    const c = document.createElement('div');
    c.className = 'coin-fly';
    c.innerHTML = A.particleArt(kind || 'coin');
    c.style.left = x + 'px'; c.style.top = y + 'px';
    fx.appendChild(c);
    const dx = (Math.random() - 0.5) * spread, dy = -60 - Math.random() * (n > 3 ? 110 : 60);
    if (c.animate) c.animate([{ transform: 'translate(-50%,-50%) scale(.6)', opacity: 1 }, { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1)`, opacity: 1, offset: 0.5 }, { transform: `translate(calc(-50% + ${dx * 1.3}px), calc(-50% + ${dy + 80}px)) scale(.8)`, opacity: 0 }], { duration: 700, easing: 'ease-out' });
    setTimeout(() => c.remove(), 700);
  }
}
function toast(text, kind = '') {
  const root = $('#toasts');
  const el = document.createElement('div');
  el.className = 'toast ' + kind;
  el.textContent = text;
  root.appendChild(el);
  while (root.childElementCount > 3) root.firstElementChild.remove();
  setTimeout(() => el.classList.add('out'), 2300);
  setTimeout(() => el.remove(), 2700);
}

// ---------------- forsyningskasser ----------------
function maybeCrate(now) {
  if (now < nextCrate) return;
  nextCrate = now + (45000 + Math.random() * 50000) / PU.puEffect(S, 'crates');
  if (modalCount > 0 || document.hidden || !S || S.tut < 4) return;
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'crate';
  el.setAttribute('aria-label', 'Supply crate');
  el.innerHTML = ico('crate', 'crate-ico');
  el.style.left = 8 + Math.random() * 68 + '%';
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (el.dataset.got) return;
    el.dataset.got = '1';
    unlockAudio();
    collectCrate(e.clientX, e.clientY);
    el.classList.add('got');
    setTimeout(() => el.remove(), 300);
  });
  el.addEventListener('animationend', () => el.remove());
  $('#crates').appendChild(el);
  sfx.drop();
}
function collectCrate(x, y) {
  S.stats.crates++;
  sfx.crate();
  if (S.settings.vibrate) buzz(30);
  if (Math.random() < 0.14) {
    const g = 10 + Math.floor(Math.random() * 16);
    S.gems += g;
    floatText(x, y, '+' + g + ' 💎', 'ft-money big');
    toast(t('crate_gems', { n: g }), 'boost');
  } else if (Math.random() < 0.62 || E.boostActive(S)) {
    const amount = Math.max(25, E.baseIncome(S) * 40 + E.tapValue(S) * 15);
    S.money += amount; S.totalEarned += amount;
    floatText(x, y, '+' + money(amount), 'ft-money big');
    toast(t('crate_money', { v: money(amount) }), 'gold');
  } else {
    S.boostUntil = Date.now() + E.BOOST_SECS * 1000;
    toast(t('crate_boost'), 'boost');
  }
  updateHUD();
  persist();
}

// ---------------- opplæring ----------------
function updateTutorial() {
  if (!S) return;
  const prev = S.tut;
  if (S.tut === 0 && S.stats.taps >= 5) S.tut = 1;
  if (S.tut === 1 && (S.buildings.corn || 0) >= 1) S.tut = 2;
  if (S.tut === 2 && E.chanceFor(S, 'lima') >= 1) S.tut = 3;
  if (S.tut <= 3 && S.conquered.lima) S.tut = 4;
  if (S.tut !== prev) persist();
  $$('.hint').forEach((el) => el.classList.remove('hint'));
  const coach = $('#coach');
  if (modalCount > 0 || S.tut >= 5) { coach.hidden = true; $('#app').classList.remove('coach-on'); return; }
  let text = '', target = null;
  if (S.tut === 0) { text = say('tut0', 'tut0'); target = tab === 'base' ? $('#hq') : $('#tab-base'); }
  else if (S.tut === 1) { text = say('tut1', 'tut1'); target = tab === 'build' ? $('[data-action="buy"][data-id="corn"]') : $('#tab-build'); }
  else if (S.tut === 2) { text = say('tut2', 'tut2'); target = tab === 'army' ? $('[data-action="buy"][data-id="militia"]') : $('#tab-army'); }
  else if (S.tut === 3) { text = say('tut3', 'tut3'); target = tab === 'map' ? $('#region-sheet [data-action="attack"]') : $('#tab-map'); }
  else if (S.tut === 4) {
    text = say('tut4', 'tut4');
    if (!coachTimer) coachTimer = setTimeout(() => { S.tut = 5; coachTimer = 0; persist(); updateTutorial(); }, 7000);
  }
  if (target) target.classList.add('hint');
  const bubble = $('#coach-text');
  if (bubble.textContent !== text) bubble.textContent = text;
  coach.hidden = !text;
  $('#app').classList.toggle('coach-on', !!text);
}

// ---------------- løkke ----------------
let lastFrame = performance.now();
let liveAcc = 0, saveAcc = 0, badgeAcc = 0;
function updateLive() {
  updateHUD();
  if (tab === 'base') {
    const tv = $('#tap-val');
    if (tv) tv.textContent = '+' + money(E.tapValue(S));
    const r = E.chosenTarget(S);
    const sig = r ? r.id + ':' + Math.floor(Math.log10(E.armyPower(S) + 1) * 40) + ':' + E.chanceFor(S, r).toFixed(2) : 'none';
    if (sig !== lastSig.target) { lastSig.target = sig; const c = $('#target-card'); if (c) c.innerHTML = targetCardHTML(); }
    const tb = $('[data-action="buytap"]');
    if (tb && S.tapLevel < E.TAP_MAX) tb.classList.toggle('cant', S.money < E.tapCost(S.tapLevel));
    updatePuLive();
    const bw = $('#boost-wrap');
    if (bw) { const bs = E.adBoostActive(S) ? Math.ceil((S.adBoostUntil - Date.now()) / 1000) : -1; if (bs !== lastSig.boost) { lastSig.boost = bs; bw.innerHTML = boostCardHTML(); } }
  } else if (tab === 'build' || tab === 'army') {
    updateBuyButtons();
  } else if (tab === 'shop') {
    const g = S.gems + ':' + Math.floor(Date.now() / 30000);
    if (g !== lastSig.shop) { lastSig.shop = g; const sc = $('#scr-shop').scrollTop; renderShop(); $('#scr-shop').scrollTop = sc; }
  }
}
function frame(now) {
  const dt = Math.min(1, Math.max(0, (now - lastFrame) / 1000));
  lastFrame = now;
  if (dt > 0) fpsAvg = fpsAvg * 0.95 + (1 / dt) * 0.05;
  if (S) {
    E.tick(S, dt);
    liveAcc += dt; saveAcc += dt; badgeAcc += dt;
    if (liveAcc >= 0.12) { liveAcc = 0; updateLive(); }
    if (combo > 0 && now - lastTapAt > E.COMBO_GAP) {
      combo = Math.max(0, combo - dt * Math.max(14, combo * 1.6));
      if (combo < 1) combo = 0;
      updateCombo();
    }
    if (badgeAcc >= 1) {
      badgeAcc = 0;
      if (!NOAUTO && EV.eventDue(S)) { EV.startEvent(S); persist(); onEventSpawn(); }
      if (tab === 'base') { updateEvBuffs(); maybeQuip(now); maybeAutoDaily(); }
      if (devOn) updateDevLive();
      updateBadges();
      if (S.tut === 2) updateTutorial();
      const gone = PU.expirePowerups(S);
      if (gone.length) { gone.forEach((id) => toast(t('pu_expired', { p: L(PU.PU_BY_ID[id].name) }))); if (!document.hidden) sfx.expire(); refreshPu(); persist(); }
    }
    if (saveAcc >= 5) { saveAcc = 0; persist(); social()?.submit().catch?.(() => {}); }
    maybeCrate(Date.now());
  }
  requestAnimationFrame(frame);
}

// ---------------- hendelser ----------------
function onAction(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn || btn.disabled) return;
  const a = btn.dataset.action;
  if (a !== 'buy' && a !== 'buytap') unlockAudio();
  switch (a) {
    case 'tab': { const from = tab; sfx.tab(); setTab(btn.dataset.tab); if (from !== tab) maybeTimedInterstitial('tab_change'); break; }
    case 'buy': doBuy(btn.dataset.kind, btn.dataset.id, btn); break;
    case 'buytap': doBuyTap(); break;
    case 'mode': {
      const v = btn.dataset.mode;
      S.settings.buyMode = v === 'max' ? 'max' : Number(v);
      $$('.mode-switch button').forEach((b) => b.classList.toggle('on', b.dataset.mode === v));
      sfx.click();
      updateBuyButtons();
      persist();
      break;
    }
    case 'attack': openDeploy(btn.dataset.id); break;
    case 'select': selectRegion(btn.dataset.id); break;
    case 'lvl-in': goLevel(mapEra - 1); break;
    case 'lvl-out': {
      // først helt ut på dette kartet, så videre til neste kapittel
      const [mw, mh] = mapSize(mapEra);
      if (!levelBusy && !ERAS[mapEra].space && viewBox && viewBox.v[2] < mw * 0.98) { sfx.click(); animateViewBox([0, 0, mw, mh]); break; }
      goLevel(mapEra + 1);
      break;
    }
    case 'lvl': goLevel(Number(btn.dataset.i)); break;
    case 'lvl-now': goLevel(S.era); break;
    case 'battle-done': battleDone(btn); break;
    case 'era-next': eraNext(btn); break;
    case 'era-done': if (E.eraComplete(S) && modalCount === 0) showEraComplete(); break;
    case 'settings': sfx.click(); showSettings(); break;
    case 'close': sfx.click(); closeModal(btn); break;
    case 'collect': {
      const amt = Number(btn.dataset.amount) || 0;
      S.money += amt; S.totalEarned += amt;
      sfx.coin();
      const r = btn.getBoundingClientRect();
      coinBurst(r.left + r.width / 2, r.top); coinBurst(r.left + r.width / 3, r.top);
      closeModal(btn);
      updateHUD(); persist();
      break;
    }
    case 'toggle': {
      const k = btn.dataset.key;
      S.settings[k] = !S.settings[k];
      if (k === 'sound') setSound(S.settings.sound);
      btn.classList.toggle('on', S.settings[k]);
      btn.textContent = S.settings[k] ? t('on') : t('off');
      btn.setAttribute('aria-pressed', S.settings[k]);
      if (k === 'sound' && S.settings.sound) sfx.coin();
      if (k === 'vibrate' && S.settings.vibrate) buzz(40);
      persist();
      break;
    }
    case 'lang':
      setLang(btn.dataset.lang); S.settings.lang = getLang(); persist();
      closeModal(btn); renderShellText(); renderTab(); updateHUD(); updateTutorial(); showSettings();
      break;
    case 'intro-lang': {
      setLang(btn.dataset.lang);
      const v = $('#village-name')?.value || '';
      closeModal(btn);
      showIntro();
      $('#village-name').value = v;
      renderShellText();
      break;
    }
    case 'intro-start': startGame(); break;
    case 'armyview': armyView = btn.dataset.view === 'school' ? 'school' : 'units'; sfx.click(); renderTab(); $('#scr-army').scrollTop = 0; break;
    case 'doc-up': {
      const d = DOCTRINES.find((x) => x.id === btn.dataset.id);
      if (d && E.upgradeDoc(S, d.id)) {
        persist(); sfx.buy(); updateHUD(); updateBadges();
        toast(t('doc_up', { d: L(d.name), n: E.docLevel(S, d.id) }), 'boost');
        const sc = $('#scr-army').scrollTop; renderSchool(); $('#scr-army').scrollTop = sc;
      } else { sfx.nope(); toast(t('need_medals')); }
      break;
    }
    case 'doc-respec': {
      if (E.respecDoc(S)) { persist(); sfx.coin(); updateHUD(); updateBadges(); toast(t('respec_done'), 'boost'); renderSchool(); }
      else { sfx.nope(); toast((S.gems || 0) < E.RESPEC_GEMS ? t('not_enough_gems') : t('need_medals')); }
      break;
    }
    case 'tactic': {
      if (!TACTICS[btn.dataset.t]) break;
      S.settings.tactic = btn.dataset.t;
      persist();
      sfx.click();
      if (tab === 'map') { const sc = $('#scr-map').scrollTop; renderMap(); $('#scr-map').scrollTop = sc; }
      else { const c = $('#target-card'); if (c) c.innerHTML = targetCardHTML(); lastSig.target = null; }
      break;
    }
    case 'pu-buy': buyPowerupFlow(btn.dataset.kind === 'gems' ? 'gems' : 'money'); break;
    case 'pu-slot': puSlotFlow(Number(btn.dataset.i)); break;
    case 'pu-odds': showPuOdds(); break;
    case 'pu-install': {
      const ok = installPowerup(btn.dataset.id, btn.dataset.slot != null ? Number(btn.dataset.slot) : undefined);
      if (ok && btn.closest('.modal')) closeModal(btn);
      break;
    }
    case 'intro-general': {
      introGeneral = btn.dataset.id;
      $$('.gen-pick .gen-card').forEach((b) => { const on = b.dataset.id === introGeneral; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
      sfx.click();
      break;
    }
    case 'pick-general': {
      if (!C.GENERAL_BY_ID[btn.dataset.id] || btn.dataset.id === S.general) break;
      if (!E.switchGeneral(S, btn.dataset.id)) { sfx.nope(); toast(t('general_wait', { t: clock(E.genSwitchLeft(S)) })); break; }
      skinCat = C.GENERAL_BY_ID[S.general].cat;
      applySkins(); persist(); sfx.buy();
      toast(t('general_picked', { g: L(C.GENERAL_BY_ID[S.general].name) }));
      const sc = $('#scr-shop').scrollTop; renderShop(); $('#scr-shop').scrollTop = sc;
      break;
    }
    case 'rename': {
      const v = ($('#rename')?.value || '').trim();
      if (v) { S.name = v.slice(0, 22); persist(); toast('✓ ' + S.name); renderTab(); }
      break;
    }
    case 'reset': {
      $('#danger').innerHTML = `<p>${t('reset_confirm')}</p><div class="row2"><button type="button" class="btn btn-danger" data-action="reset-yes">${t('reset_yes')}</button><button type="button" class="btn btn-soft" data-action="reset-no">${t('cancel')}</button></div>`;
      break;
    }
    case 'reset-no': $('#danger').innerHTML = `<button type="button" class="btn btn-danger" data-action="reset">${t('reset')}</button>`; break;
    case 'reset-yes': {
      const lang = getLang();
      try { localStorage.removeItem(SAVE_KEY); } catch { /* */ }
      closeModal(btn);
      S = null; selected = null; viewBox = null; tab = 'base';
      $$('.screen').forEach((s) => { s.innerHTML = ''; });
      setLang(lang);
      applyTheme();
      showIntro();
      break;
    }
    case 'prestige': doPrestige(btn.closest('.modal') ? btn : null); break;
    case 'prestige-ask': askPrestige(btn); break;
    case 'shopview': shopView = btn.dataset.view; sfx.click(); renderShop(); $('#scr-shop').scrollTop = 0; break;
    case 'skincat': skinCat = btn.dataset.cat; sfx.click(); renderShop(); break;
    case 'equip': {
      if (C.equip(S, btn.dataset.id)) {
        applySkins(); persist(); sfx.equip();
        toast(t('skin_equipped_toast', { name: L(C.SKIN_BY_ID[btn.dataset.id].name) }));
        const sc = $('#scr-shop').scrollTop; renderShop(); $('#scr-shop').scrollTop = sc;
        renderSkinSheet();
      }
      break;
    }
    case 'skin-locked': { const k = C.SKIN_BY_ID[btn.dataset.id]; sfx.nope(); toast(k && k.prestige ? t('skin_locked_prestige', { n: k.prestige }) : t('skin_locked_toast')); break; }
    case 'crate': buyCrateFlow(btn.dataset.id); break;
    case 'open-crate': openCrateFlow(btn.dataset.id); break;
    case 'toggle-allskins': showAllSkins = !showAllSkins; sfx.click(); renderShop(); break;
    case 'topview': topView = btn.dataset.view; sfx.click(); renderTop(); break;
    case 'login': doLogin(btn.dataset.p); break;
    case 'logout': doLogout(btn); break;
    case 'delete-online': doDeleteOnline(btn); break;
    case 'copy-code': copyCode(); break;
    case 'add-friend': addFriendFlow(); break;
    case 'remove-friend': removeFriendFlow(btn.dataset.id); break;
    case 'refresh-board': boardCache = { kind: '', rows: null, at: 0 }; renderTop(); break;
    case 'odds': showOdds(btn.dataset.id); break;
    case 'skip': buyTimeSkip(btn.dataset.id); break;
    case 'iap': buyProduct(btn.dataset.id); break;
    case 'restore': toast(t('restore_done')); break;
    case 'ad-choices': M.showPrivacyOptions(); break;
    case 'privacy':
      openModal(`<div class="modal-head"><h2 class="h2">${t('privacy_policy')}</h2><button type="button" class="icon-btn" data-action="close" aria-label="${t('close')}">${ico('close')}</button></div>
        <iframe class="privacy-frame" src="${esc(M.CONFIG.privacyUrl)}" title="${t('privacy_policy')}"></iframe>`, 'privacy-modal');
      break;
    case 'ad-crate':
      if (Date.now() < (S.ads.freeCrateAt || 0)) break;
      watchAd('free_crate', () => { S.ads.freeCrateAt = Date.now() + FREE_CRATE_COOLDOWN; C.addCrate(S, 'wood'); persist(); updateBadges(); if (tab === 'shop') renderShop(); gotCrateModal('wood'); });
      break;
    case 'ad-gems':
      if (gemAdsLeft() <= 0) break;
      watchAd('gems', () => { gemAdsLeft(); S.ads.gemCount++; S.gems += AD_GEMS; toast(t('gems_toast', { n: AD_GEMS }), 'boost'); sfx.coin(); updateHUD(); renderShop(); });
      break;
    case 'ad-boost':
      watchAd('boost', () => { S.adBoostUntil = Date.now() + E.AD_BOOST_SECS * 1000; toast(t('boost_toast'), 'boost'); sfx.milestone(); lastSig.boost = null; updateHUD(); });
      break;
    case 'ad-double': {
      const amt = Number(btn.dataset.amount) || 0;
      watchAd('offline_double', () => {
        S.money += amt * 2; S.totalEarned += amt * 2;
        sfx.coin();
        closeModal(btn); updateHUD(); persist();
      });
      break;
    }
    case 'event-open': openEvent(); break;
    case 'pick-target': openEnemyPicker(); break;
    case 'trade-open': case 'trade-tier': case 'trade-back': case 'trade-toggle': case 'trade-auto': case 'trade-clear': case 'trade-cat': case 'trade-go': tradeAction(a.slice(6), btn); break;
    case 'skin-open': openSkinSheet(btn.dataset.id); break;
    case 'sell-qty': sellQty(btn); break;
    case 'sell-go': sellGo(); break;
    case 'sell-dupes': sellAllDupesFlow(); break;
    case 'sell-dupes-go': {
      const d = C.sellAllDupes(S);
      persist(); sfx.coin(); updateHUD();
      closeModal(btn);
      toast(t('sold_all_toast', { n: d.n, g: fmt(d.gems) }), 'boost');
      if (tab === 'shop') { const sc = $('#scr-shop').scrollTop; renderShop(); $('#scr-shop').scrollTop = sc; }
      break;
    }
    case 'dev-tap': devTap(); break;
    case 'dev-open': openDevPanel(); break;
    case 'dev': devAction(btn.dataset.dev, btn); break;
    case 'set-target': setTarget(btn); break;
    case 'citizen': pokeCitizen(btn); break;
    case 'ev-answer': answerEvent(btn); break;
    case 'daily-open': openDaily(); break;
    case 'daily-claim': claimDaily(btn, 1); break;
    case 'daily-claim2': watchAd('daily_double', () => claimDaily(btn, 2)); break;
    case 'ad-revive': {
      const res = lastBattle;
      if (!res || !res.lostTotal) break;
      watchAd('revive', () => {
        const n = E.restoreUnits(S, res.lost);
        res.lostTotal = 0;
        btn.remove();
        toast(t('revived', { n: fmt(n) }), 'boost');
        sfx.recruit(); updateHUD(); persist();
      });
      break;
    }
    case 'mapview': mapView = btn.dataset.view; sfx.click(); renderMap(); if (mapView === 'tree') scrollTreeToHere(); else $('#scr-map').scrollTop = 0; break;
    case 'open-tree': mapView = 'tree'; setTab('map'); scrollTreeToHere(); break;
    case 'tree-go': mapView = 'map'; mapEra = S.era; selected = btn.dataset.id; renderMap(); $('#scr-map').scrollTop = 0; zoomToRegion(selected); break;
    case 'install':
      if (installEvt) { installEvt.prompt(); installEvt.userChoice?.finally(() => { installEvt = null; }); closeModal(btn); }
      break;
    default: break;
  }
}

function onVisibility() {
  if (!S) return;
  if (document.hidden) { persist(); social()?.submit(true).catch?.(() => {}); return; }
  const away = (Date.now() - (S.lastSeen || Date.now())) / 1000;
  lastFrame = performance.now();
  if (away > 60 && modalCount === 0) checkOffline();
  else {
    if (away > 1) { const g = E.offlineGain(S).earned; S.money += g; S.totalEarned += g; }
    S.lastSeen = Date.now();
  }
}

// ---------------- oppstart ----------------
function boot(hotData) {
  let data = loadSave();
  const hs = hotData && hotData.save;
  if (hs && (!data || (hs.lastSeen || 0) >= (data.lastSeen || 0))) data = hs;
  S = data ? E.restore(data) : null;
  setLang(S ? S.settings.lang : 'nb');
  buildShell();
  document.addEventListener('click', onAction);
  document.addEventListener('touchend', unlockAudio, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', persist);
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; });
  applyTheme();
  renderShellText();
  M.initMonetization({ demoAd, confirmPurchase, onAdStart, onAdEnd }).then(() => M.gameplayStart());
  onSocialChange(() => { boardCache = { kind: '', rows: null, at: 0 }; if (tab === 'top') renderTop(); });
  initSocial(() => S, E.scoreEntry);
  if (!S) showIntro();
  else {
    if (S.purchases.includes('starter') && !S.flags.starterCrate) {
      // startpakken ga tidligere ikke kassen den lovet – gi den nå
      C.addCrate(S, 'cosmic');
      S.flags.starterCrate = true;
      persist();
      setTimeout(() => toast(t('starter_fix'), 'gold'), 1200);
    }
    for (const [lvl, ids] of Object.entries(C.PRESTIGE_SKINS)) for (const id of ids) if ((S.prestige || 0) >= Number(lvl) && !S.skins.owned[id]) S.skins.owned[id] = Date.now();
    applySkins();
    setSound(S.settings.sound);
    setTab('base');
    updateHUD();
    checkOffline();
    if (S.seenIntro < 0) showEraIntro(S.era);
    if (E.eraComplete(S) && !S.finished) showEraComplete();
    devChrome();
  }
  requestAnimationFrame(frame);
  if (/[?#&]debug/.test(location.href)) {
    window.__ohio = {
      state: () => S,
      give: (m) => { S.money += m; updateHUD(); },
      render: renderTab,
      win: (keep = 1) => { const rs = regionsOfEra(S.era); rs.slice(0, rs.length - keep).forEach((r) => { S.conquered[r.id] = true; }); renderTab(); },
      power: (n) => { const u = UNITS.filter((x) => x.era <= S.era).pop(); S.units[u.id] = (S.units[u.id] || 0) + n; renderTab(); updateHUD(); },
      era: (e) => { for (let i = 0; i < e; i++) regionsOfEra(i).forEach((r) => { S.conquered[r.id] = true; }); S.era = e; S.tut = 9; applyTheme(); viewBox = null; selected = null; renderTab(); updateTutorial(); },
      offline: (secs) => { S.lastSeen = Date.now() - secs * 1000; checkOffline(); },
      crate: () => { nextCrate = 0; },
      gems: (n) => { S.gems += n; updateHUD(); },
      social: () => social(),
      playtime: (secs) => { S.stats.playTime = secs; },
      event: (id) => { EV.startEvent(S, Date.now(), Math.random, id || null); persist(); onEventSpawn(); return S.ev.cur; },
      daily: (last = '', streak = 0) => { S.daily = { last, streak, total: S.daily.total || 0 }; refreshDailyBtn(); updateBadges(); },
      combo: (n) => { combo = n; lastTapAt = performance.now(); updateCombo(); },
      gen: (g) => { S.general = g; applySkins(); renderTab(); },
      quip: () => { nextQuip = 0; maybeQuip(performance.now()); return $('#gen-say')?.textContent; },
      sounds: () => ({ ...played }),
      ownAll: () => { for (const k of C.SKINS) if (!k.prestige) S.skins.owned[k.id] = S.skins.owned[k.id] || 1; },
    };
    // teller hvilke lyder som spilles (for automatiske tester)
    const played = {};
    for (const k of Object.keys(sfx)) { const f = sfx[k]; sfx[k] = (...a) => { played[k] = (played[k] || 0) + 1; return f(...a); }; }
  }
  try {
    const hot = window.claude && window.claude.hot;
    if (hot && typeof hot.snapshot === 'function') hot.snapshot(() => ({ save: S }));
  } catch { /* ikke i en viewer */ }
  if ('serviceWorker' in navigator && !window.claude && window.top === window.self && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

const hot = window.claude && window.claude.hot;
if (hot && typeof hot.ready === 'function') hot.ready(boot);
else boot((hot && hot.data) || {});
