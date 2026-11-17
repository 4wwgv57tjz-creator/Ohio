// Take over the world Ohio – brukergrensesnitt, spill-løkke og lagring.
import * as E from './engine.js';
import { ERAS, BUILDINGS, UNITS, REGION_BY_ID, regionsOfEra, SPACE_HOMES } from './data.js';
import { MAPS } from './mapdata.js';
import * as A from './art.js';
import { t, L, fmt, money, duration, setLang, getLang } from './i18n.js';
import { sfx, unlockAudio, setSound, buzz } from './audio.js';

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

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const ico = (n, c) => A.icon(n, c);
const pm = () => E.prestigeMult(S);

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
  const tabs = [['base', 'base'], ['build', 'build'], ['army', 'army'], ['map', 'map']];
  $('#app').innerHTML = `
  <header class="hud">
    <button class="money-pill" type="button" data-action="tab" data-tab="build">${ico('coin')}<span id="hud-money">$0</span><span id="hud-income">+$0/s</span></button>
    <div class="power-pill">${ico('swords')}<span id="hud-power">0</span></div>
    <button class="icon-btn" id="btn-settings" type="button" data-action="settings">${ico('gear')}</button>
    <div class="boost-bar" id="boost-bar" hidden></div>
  </header>
  <main>
    ${tabs.map(([k]) => `<section class="screen" id="scr-${k}" ${k === 'base' ? '' : 'hidden'}></section>`).join('')}
    <div id="crates"></div>
  </main>
  <nav class="tabbar">
    <div class="coach" id="coach" hidden>${A.mascot()}<div class="coach-bubble" id="coach-text"></div></div>
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

function renderShellText() {
  document.documentElement.lang = getLang() === 'nb' ? 'nb' : 'en';
  $$('.tabbar [data-tab]').forEach((b) => { $('.tab-label', b).textContent = t('tab_' + b.dataset.tab); });
  $('#btn-settings').setAttribute('aria-label', t('settings'));
}

function setTab(name) {
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
  else if (tab === 'army') renderList('u');
  else renderMap();
  updateBadges();
}

// ---------------- HUD ----------------
function updateHUD() {
  $('#hud-money').textContent = money(S.money);
  $('#hud-income').textContent = '+' + money(E.incomePerSec(S)) + '/s';
  $('#hud-power').textContent = fmt(E.armyPower(S));
  const left = Math.ceil(((S.boostUntil || 0) - Date.now()) / 1000);
  const bb = $('#boost-bar');
  if (left > 0) { bb.hidden = false; bb.textContent = '⚡ ' + t('boost_left', { s: left }); } else bb.hidden = true;
}

function updateBadges() {
  const canWin = !S.finished && regionsOfEra(S.era).some((r) => !S.conquered[r.id] && E.chanceFor(S, r) >= 1);
  $('#tab-map .badge').hidden = !canWin;
  $('#tab-build .badge').hidden = !(S.era > 0 && (S.seenBuild ?? 0) < S.era);
  $('#tab-army .badge').hidden = !(S.era > 0 && (S.seenArmy ?? 0) < S.era);
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

function targetCardHTML() {
  if (S.finished) {
    return `<div class="tc-head"><div class="tc-art">${A.logo()}</div><div class="tc-info"><div class="eyebrow">${t('final_title')}</div><h3>${t('universe_yours')}</h3><p class="flavor">${t('final_text')}</p></div></div>
    <div class="tc-actions"><button class="btn btn-gold" data-action="prestige">${ico('star')} ${t('play_again')}</button></div>`;
  }
  const r = E.nextTarget(S);
  if (!r) return `<div class="tc-head"><div class="tc-art">${A.mascot()}</div><div class="tc-info"><h3>${esc(L(ERAS[S.era].won))}</h3></div></div>
    <div class="tc-actions"><button class="btn btn-gold" data-action="era-done">${ico('star')} ${t('continue')}</button></div>`;
  const P = E.armyPower(S), D = E.regionDef(S, r), ch = E.winChance(P, D);
  const fill = Math.min(100, (P / (D * E.SAFE_RATIO)) * 100);
  return `<div class="tc-head"><div class="tc-art">${enemyArtFor(r)}</div>
    <div class="tc-info"><div class="eyebrow">${t('next_target')}</div><h3>${esc(L(r.name))}</h3><p class="flavor">${esc(L(r.flavor))}</p></div></div>
    <div class="vs-row"><span class="vs-me">${ico('swords')}<b>${fmt(P)}</b></span><span class="vs-mid">${t('vs')}</span><span class="vs-foe"><b>${fmt(D)}</b>${ico('skull')}</span></div>
    <div class="meter"><div class="meter-fill ${chanceClass(ch)}" style="width:${fill}%"></div><span>${pct(ch)} ${t('win_chance')}</span></div>
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
    <div class="item-stat">${t('tap_value', { v: money(E.tapValue(S)) })}</div></div>
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
    </div>
  </div>
  <div class="stage ${era.space ? 'space' : ''}" id="stage">
    ${backdrop(era)}
    <div class="village-sign">${A.flagSvg('sign-flag')}<span>${esc(S.name)}</span></div>
    <button class="hq" id="hq" type="button" aria-label="${t('tap_hint')}">${A.hq(era.hq)}</button>
    <div class="tap-hint" id="tap-hint">${t('tap_hint')} <b id="tap-val">+${money(E.tapValue(S))}</b></div>
    <div class="parade" id="parade">${paradeHTML()}</div>
  </div>
  <div class="pad stack">
    <div class="card target-card" id="target-card">${targetCardHTML()}</div>
    <div id="tap-card-wrap">${tapCardHTML()}</div>
  </div>`;
  const hq = $('#hq');
  hq.addEventListener('pointerdown', onTap);
  hq.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap(e); } });
}

function onTap(e) {
  if (e.cancelable) e.preventDefault();
  unlockAudio();
  const v = E.doTap(S);
  sfx.tap();
  if (S.settings.vibrate) buzz(8);
  const hq = $('#hq');
  if (hq && hq.animate) hq.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06,.9)' }, { transform: 'scale(.97,1.05)' }, { transform: 'scale(1)' }], { duration: 240, easing: 'ease-out' });
  let x, y;
  if (e.clientX) { x = e.clientX; y = e.clientY; } else { const r = hq.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 3; }
  floatText(x + (Math.random() * 30 - 15), y - 10, '+' + money(v), 'ft-money');
  if (Math.random() < 0.35) coinBurst(x, y);
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
      <div class="item-name">${esc(L(it.name))}</div>
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
    : `<div class="screen-head"><div><div class="eyebrow">${t('army_title')} · ${t('units_count', { n: fmt(E.armySize(S)) })}</div><div class="big-num">${ico('swords')}${fmt(E.armyPower(S))}</div></div>${modeSwitch()}</div>`;
  const el = $(kind === 'b' ? '#scr-build' : '#scr-army');
  el.innerHTML = `<div class="pad stack">${head}
    ${kind === 'u' && E.armySize(S) ? `<div class="mini-parade">${paradeHTML()}</div>` : ''}
    ${avail.map((it) => itemCardHTML(kind, it)).join('')}
    ${teaser ? `<div class="item-card locked"><div class="item-art">${itemArt(teaser)}</div><div class="item-body"><div class="item-name">???</div><div class="item-desc">${ico('lock')} ${t('locked_until', { era: esc(L(ERAS[teaser.era].title)) })}</div></div></div>` : ''}
    ${kind === 'b' ? tapCardHTML() : ''}
  </div>`;
  updateBuyButtons();
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
function renderMap() {
  const era = ERAS[S.era];
  const pr = E.eraProgress(S);
  $('#scr-map').innerHTML = `<div class="pad"><div class="screen-head"><div><div class="eyebrow">${t('chapter', { n: S.era + 1 })} · ${t('conquered_of', { a: pr.done, b: pr.total })}</div><h2 class="h2">${esc(L(era.title))}</h2></div></div></div>
  <div class="map-wrap ${era.space ? 'space' : ''}" id="map-wrap">
    ${era.space ? spaceMapSVG(era) : geoMapSVG(era)}
    ${era.space ? '' : `<button class="map-zoom" type="button" data-action="zoomout" aria-label="${t('zoom_out')}" hidden>${ico('zoomout')}</button>`}
  </div>
  <div class="pad stack">
    <div class="card region-sheet" id="region-sheet">${sheetHTML()}</div>
    <div class="region-list" id="region-list">${regionListHTML()}</div>
  </div>`;
  if (!era.space) setupMapGestures();
}

function geoMapSVG(era) {
  const m = MAPS[era.map];
  if (!viewBox || viewBox.map !== era.map) viewBox = { map: era.map, v: [0, 0, m.w, m.h] };
  const v = viewBox.v;
  let paths = '', labels = '';
  for (const [id, g] of Object.entries(m.regions)) {
    const isHome = id === era.home;
    const r = REGION_BY_ID[id];
    const own = isHome || (r && S.conquered[id]);
    const fill = own ? 'var(--gold)' : r ? r.color : '#ccc';
    paths += `<path class="reg ${own ? 'own' : ''} ${selected === id ? 'sel' : ''}" data-id="${id}" d="${g.d}" style="fill:${fill}"/>`;
  }
  for (const [id, g] of Object.entries(m.regions)) {
    if (!g.l) continue;
    const isHome = id === era.home;
    const r = REGION_BY_ID[id];
    const own = isHome || (r && S.conquered[id]);
    const big = g.b[2] - g.b[0] > m.w * 0.13 && g.b[3] - g.b[1] > m.w * 0.06;
    const [x, y] = g.l;
    const name = isHome ? (S.era === 0 ? S.name : '') : L(r.name);
    if (own) labels += `<g class="pin" transform="translate(${x} ${y - (big && name ? 26 : 0)})">${A.burgee(-6, -20, 1.25)}<path d="M-6 -20v26" stroke="#2b2350" stroke-width="3"/></g>`;
    else {
      const ch = E.chanceFor(S, r);
      labels += `<g class="pin" transform="translate(${x} ${y - (big ? 30 : 0)})">${pinInner(ch, 17)}</g>`;
    }
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
function spaceMapSVG(era) {
  const W = 1000, H = 1300;
  const regs = regionsOfEra(S.era);
  const home = SPACE_HOMES[era.map];
  let stars = '';
  for (let i = 0; i < 90; i++) stars += `<circle cx="${(seeded(i) * W).toFixed(0)}" cy="${(seeded(i + 500) * H).toFixed(0)}" r="${(1 + seeded(i + 900) * 2.6).toFixed(1)}" fill="#fff" opacity="${(0.35 + seeded(i + 77) * 0.6).toFixed(2)}"/>`;
  const pts = [home.pos, ...regs.map((r) => r.pos)];
  const route = 'M' + pts.map((p) => p.join(' ')).join('L');
  const node = (pos, size, kind, cls, id, label, sub) => `<g class="node ${cls}" ${id ? `data-id="${id}"` : ''} transform="translate(${pos[0]} ${pos[1]})">
    <circle r="${size * 0.62}" class="node-hit"/>
    ${cls.includes('sel') ? `<circle r="${size * 0.62 + 10}" class="node-ring"/>` : ''}
    <g transform="scale(${(size / 60).toFixed(3)})">${A.planet(kind, { raw: true })}</g>
    <text y="${size * 0.62 + 34}" text-anchor="middle" class="map-label space-label">${esc(label)}</text>
    ${sub}
  </g>`;
  let nodes = node(home.pos, home.size, home.planet, 'own', '', L(home.name), `<g transform="translate(${home.size * 0.4} ${-home.size * 0.5})">${A.burgee(0, -10, 1.3)}<path d="M0 -10v30" stroke="#2b2350" stroke-width="3"/></g>`);
  for (const r of regs) {
    const own = S.conquered[r.id];
    const ch = E.chanceFor(S, r);
    const sub = own
      ? `<g transform="translate(${r.size * 0.4} ${-r.size * 0.5})">${A.burgee(0, -10, 1.3)}<path d="M0 -10v30" stroke="#2b2350" stroke-width="3"/></g>`
      : `<g class="pin" transform="translate(${r.size * 0.5} ${-r.size * 0.45})">${pinInner(ch, 19)}</g>`;
    nodes += node(r.pos, r.size, r.planet, (own ? 'own ' : '') + (selected === r.id ? 'sel' : ''), r.id, L(r.name), sub);
  }
  return `<svg class="map space-map" id="map-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(L(era.title))}">
    <defs><radialGradient id="neb1"><stop offset="0" stop-color="#ff5dd6" stop-opacity=".35"/><stop offset="1" stop-color="#ff5dd6" stop-opacity="0"/></radialGradient>
    <radialGradient id="neb2"><stop offset="0" stop-color="#56e0ff" stop-opacity=".3"/><stop offset="1" stop-color="#56e0ff" stop-opacity="0"/></radialGradient></defs>
    <circle cx="820" cy="300" r="320" fill="url(#neb1)"/><circle cx="160" cy="900" r="360" fill="url(#neb2)"/>
    ${stars}
    <path d="${route}" class="route"/>
    ${nodes}
  </svg>`;
}

function sheetHTML() {
  const era = ERAS[S.era];
  let id = selected;
  if (!id || (!REGION_BY_ID[id] && id !== era.home)) id = E.nextTarget(S)?.id;
  if (!id) return `<p class="muted">${S.finished ? t('universe_yours') : t('pick_region')}</p>`;
  if (id === era.home) return `<div class="sheet-top"><div class="sheet-art">${A.mascot()}</div><div class="sheet-info"><div class="eyebrow">${t('home')}</div><h3>${esc(S.name)}</h3></div></div>`;
  const r = REGION_BY_ID[id];
  const done = S.conquered[id];
  const inc = money(r.income * pm());
  if (done) {
    return `<div class="sheet-top"><div class="sheet-art">${enemyArtFor(r)}</div><div class="sheet-info"><div class="eyebrow">${ico('check')} ${t('conquered')}</div><h3>${esc(L(r.name))}</h3><p class="flavor">${esc(L(r.flavor))}</p></div></div>
    <div class="reward-row">${ico('coin')} +${inc}/s</div>`;
  }
  const P = E.armyPower(S), D = E.regionDef(S, r), ch = E.winChance(P, D);
  return `<div class="sheet-top"><div class="sheet-art">${enemyArtFor(r)}</div><div class="sheet-info"><h3>${esc(L(r.name))}</h3><p class="flavor">${esc(L(r.flavor))}</p></div></div>
    <div class="vs-row"><span class="vs-me">${ico('swords')}<b>${fmt(P)}</b></span><span class="vs-mid">${t('vs')}</span><span class="vs-foe"><b>${fmt(D)}</b>${ico('skull')}${S.damage[id] ? `<em>${t('weakened')}</em>` : ''}</span></div>
    <div class="meter"><div class="meter-fill ${chanceClass(ch)}" style="width:${ch * 100}%"></div><span>${pct(ch)} ${t('win_chance')} · ${chanceLabel(ch)}</span></div>
    <div class="sheet-foot"><div class="reward-row">${t('reward')}: ${ico('coin')} +${inc}/s</div>
    <button class="btn btn-attack" data-action="attack" data-id="${id}" ${ch <= 0 ? 'disabled' : ''}>${ico('swords')} ${t('attack')}</button></div>`;
}

function regionListHTML() {
  const regs = regionsOfEra(S.era).slice().sort((a, b) => a.def - b.def);
  return regs.map((r) => {
    const done = S.conquered[r.id];
    const ch = E.chanceFor(S, r);
    return `<button type="button" class="region-row ${done ? 'done' : ''} ${selected === r.id ? 'sel' : ''}" data-action="select" data-id="${r.id}">
      <span class="swatch" style="background:${done ? 'var(--gold)' : r.color}"></span>
      <span class="rname">${esc(L(r.name))}</span>
      ${done ? `<span class="rinc">+${money(r.income * pm())}/s</span>${ico('check')}` : `<span class="rdef">${ico('skull')}${fmt(E.regionDef(S, r))}</span><span class="rchance ${chanceClass(ch)}">${pct(ch)}</span>`}
    </button>`;
  }).join('');
}

function selectRegion(id) {
  selected = id;
  const era = ERAS[S.era];
  $$('#map-svg .reg, #map-svg .node').forEach((p) => p.classList.toggle('sel', p.dataset.id === id));
  if (era.space) { const w = $('#map-wrap'); if (w) w.innerHTML = spaceMapSVG(era); }
  $('#region-sheet').innerHTML = sheetHTML();
  $$('#region-list .region-row').forEach((b) => b.classList.toggle('sel', b.dataset.id === id));
  if (!era.space) zoomToRegion(id);
  sfx.click();
  updateTutorial();
}

// ----- zoom og panorering -----
function setViewBox(v) {
  const m = MAPS[ERAS[S.era].map];
  const minW = m.w * 0.22;
  let [x, y, w, h] = v;
  const ratio = m.h / m.w;
  w = Math.max(minW, Math.min(m.w, w)); h = w * ratio;
  x = Math.max(-w * 0.15, Math.min(m.w - w * 0.85, x));
  y = Math.max(-h * 0.15, Math.min(m.h - h * 0.85, y));
  viewBox.v = [x, y, w, h];
  const svg = $('#map-svg');
  if (svg) svg.setAttribute('viewBox', viewBox.v.map((n) => n.toFixed(1)).join(' '));
  const zb = $('.map-zoom');
  if (zb) zb.hidden = w >= m.w * 0.98;
}
function animateViewBox(target, ms = 380) {
  const from = viewBox.v.slice();
  const t0 = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - t0) / ms);
    const e = 1 - Math.pow(1 - k, 3);
    setViewBox(from.map((f, i) => f + (target[i] - f) * e));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function zoomToRegion(id) {
  const m = MAPS[ERAS[S.era].map];
  const g = m.regions[id];
  if (!g) return;
  const [x0, y0, x1, y1] = g.b;
  let w = Math.max((x1 - x0) * 1.7, (y1 - y0) * 1.7 * (m.w / m.h), m.w * 0.3);
  w = Math.min(w, m.w);
  const h = w * (m.h / m.w);
  animateViewBox([(x0 + x1) / 2 - w / 2, (y0 + y1) / 2 - h / 2, w, h]);
}
function setupMapGestures() {
  const svg = $('#map-svg');
  if (!svg) return;
  const pts = new Map();
  let start = null, moved = false;
  const toUnits = () => { const r = svg.getBoundingClientRect(); const v = viewBox.v; return Math.max(v[2] / r.width, v[3] / r.height); };
  svg.addEventListener('pointerdown', (e) => {
    svg.setPointerCapture?.(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved = false;
    start = { v: viewBox.v.slice(), pts: new Map([...pts].map(([k, p]) => [k, { ...p }])), target: e.target };
  });
  svg.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId) || !start) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const k = toUnits();
    if (pts.size === 1) {
      const p0 = start.pts.get(e.pointerId);
      if (!p0) return;
      const dx = e.clientX - p0.x, dy = e.clientY - p0.y;
      if (Math.hypot(dx, dy) > 8) moved = true;
      if (moved && start.v[2] < MAPS[ERAS[S.era].map].w * 0.98) setViewBox([start.v[0] - dx * k, start.v[1] - dy * k, start.v[2], start.v[3]]);
    } else if (pts.size === 2) {
      moved = true;
      const [a, b] = [...pts.values()];
      const [a0, b0] = [...start.pts.values()];
      if (!a0 || !b0) return;
      const d0 = Math.hypot(a0.x - b0.x, a0.y - b0.y), d1 = Math.hypot(a.x - b.x, a.y - b.y);
      if (d0 < 10) return;
      const scale = d0 / d1;
      const r = svg.getBoundingClientRect();
      const mx = ((a0.x + b0.x) / 2 - r.left) * k + start.v[0], my = ((a0.y + b0.y) / 2 - r.top) * k + start.v[1];
      const w = start.v[2] * scale, h = start.v[3] * scale;
      setViewBox([mx - (mx - start.v[0]) * scale, my - (my - start.v[1]) * scale, w, h]);
    }
  });
  const end = (e) => {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    if (!moved && pts.size === 0 && start) {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const reg = el && el.closest && el.closest('[data-id]');
      if (reg && svg.contains(reg)) selectRegion(reg.dataset.id);
    }
    if (pts.size === 0) start = null;
    else start = { v: viewBox.v.slice(), pts: new Map([...pts].map(([k, p]) => [k, { ...p }])) };
  };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);
  svg.addEventListener('wheel', (e) => {
    e.preventDefault();
    const r = svg.getBoundingClientRect();
    const k = toUnits();
    const mx = (e.clientX - r.left) * k + viewBox.v[0], my = (e.clientY - r.top) * k + viewBox.v[1];
    const s = e.deltaY > 0 ? 1.15 : 1 / 1.15;
    const [x, y, w, h] = viewBox.v;
    setViewBox([mx - (mx - x) * s, my - (my - y) * s, w * s, h * s]);
  }, { passive: false });
  // space-kart: trykk på noder
  setViewBox(viewBox.v);
}
// Romkart: enkel trykk-håndtering
document.addEventListener('click', (e) => {
  const node = e.target.closest && e.target.closest('.space-map .node[data-id]');
  if (node) selectRegion(node.dataset.id);
});

// ---------------- KAMP ----------------
function pickMySprites(n) {
  const owned = UNITS.filter((u) => S.units[u.id] > 0).sort((a, b) => E.unitPower(S, b) - E.unitPower(S, a));
  if (!owned.length) return [];
  const out = [];
  const top = owned.slice(0, 3);
  for (let i = 0; i < n; i++) out.push(top[i % top.length].id);
  return out;
}

function startBattle(id) {
  const r = REGION_BY_ID[id];
  if (!r || S.conquered[id]) return;
  unlockAudio();
  const mine = pickMySprites(Math.min(5, Math.max(1, E.armySize(S))));
  const res = E.attack(S, id);
  if (!res) return;
  persist();
  showBattle(r, res, mine);
}

function showBattle(r, res, mine) {
  modalCount++;
  const ov = document.createElement('div');
  ov.className = 'battle' + (ERAS[S.era].space ? ' space' : '');
  const foeCount = r.enemy === 'boss' || r.enemy === 'penguin' ? 5 : 4;
  const foes = Array.from({ length: foeCount }, (_, i) => enemyArtFor(r, i));
  ov.innerHTML = `<div class="battle-inner">
    <div class="battle-head"><div class="eyebrow">${t('attack')}</div><h2>${esc(L(r.name))}</h2></div>
    <div class="battle-bars">
      <div class="bbar me"><div class="bbar-label">${t('you')} · ${fmt(res.P)}</div><div class="bbar-track"><div class="bbar-fill"></div></div></div>
      <div class="bvs">${t('vs')}</div>
      <div class="bbar foe"><div class="bbar-label">${fmt(res.D)}</div><div class="bbar-track"><div class="bbar-fill"></div></div></div>
    </div>
    <div class="battlefield">
      <div class="army me" data-n="${Math.min(mine.length, 4)}">${mine.map((id, i) => `<div class="fighter" style="--i:${i}">${A.unitArt(id, 'me')}</div>`).join('')}</div>
      <div class="army foe" data-n="${Math.min(foes.length, 4)}">${foes.map((svg, i) => `<div class="fighter" style="--i:${i}">${svg}</div>`).join('')}</div>
      <div class="booms"></div>
    </div>
    <div class="battle-skip">${t('battle_skip')}</div>
  </div>`;
  $('#overlay-root').appendChild(ov);
  const lossFrac = res.P > 0 ? Math.min(1, (res.P - res.powerAfter) / res.P) : 1;
  const meEnd = res.win ? Math.max(0.15, 1 - lossFrac - 0.1) : 0.08;
  const foeEnd = res.win ? 0 : Math.max(0.12, 1 - res.dealt / res.D);
  requestAnimationFrame(() => {
    ov.classList.add('go');
    $('.bbar.me .bbar-fill', ov).style.width = meEnd * 100 + '%';
    $('.bbar.foe .bbar-fill', ov).style.width = foeEnd * 100 + '%';
  });
  const words = ['POW!', 'BOOM!', 'BANG!', 'ZAP!', 'KRASJ!', 'PANG!'];
  const timers = [];
  for (let i = 0; i < 9; i++) {
    timers.push(setTimeout(() => {
      const b = document.createElement('div');
      b.className = 'boom';
      b.style.left = 20 + Math.random() * 60 + '%';
      b.style.top = 10 + Math.random() * 60 + '%';
      b.innerHTML = `<svg viewBox="0 0 100 100"><path d="M50 4l9 24 25-12-10 25 24 9-24 10 12 25-25-10-11 23-9-23-25 11 11-25-24-11 24-9-12-25 25 12z" fill="${['#ffd23f', '#ff8a3d', '#ff5d8f', '#7ffcff'][i % 4]}" stroke="#2b2350" stroke-width="4" stroke-linejoin="round"/></svg><span>${words[i % words.length]}</span>`;
      $('.booms', ov)?.appendChild(b);
      i % 2 ? sfx.boom() : sfx.pew();
      if (S.settings.vibrate && i % 3 === 0) buzz(25);
      setTimeout(() => b.remove(), 700);
    }, 250 + i * 240));
  }
  let shown = false;
  const finish = () => {
    if (shown) return;
    shown = true;
    timers.forEach(clearTimeout);
    showBattleResult(ov, r, res);
  };
  timers.push(setTimeout(finish, 2700));
  ov.addEventListener('click', (e) => { if (!shown && !e.target.closest('button')) finish(); });
}

function showBattleResult(ov, r, res) {
  res.win ? sfx.victory() : sfx.defeat();
  ov.classList.add('done');
  const card = document.createElement('div');
  card.className = 'result-card ' + (res.win ? 'win' : 'lose');
  card.innerHTML = `<div class="result-mascot">${A.mascot(res.win ? 'happy' : 'sad')}</div>
    <h2 class="result-title">${res.win ? t('victory') : t('defeat')}</h2>
    <p>${res.win ? t('victory_text', { r: esc(L(r.name)) }) : t('defeat_text', { r: esc(L(r.name)) })}</p>
    ${res.win ? `<p class="result-reward">${ico('coin')} ${t('new_income', { v: money(r.income * pm()) })}</p>` : ''}
    <p class="result-loss">${res.lostTotal ? t('lost_units', { n: fmt(res.lostTotal) }) : t('lost_none')}</p>
    ${!res.win ? `<p class="tip">${t('defeat_tip')}</p>` : ''}
    <button class="btn btn-gold big" type="button" data-action="battle-done">${t('continue')}</button>`;
  $('.battle-inner', ov).appendChild(card);
  if (res.win) confetti(ov, 40);
  ov.dataset.era = res.eraDone ? '1' : '';
  setTimeout(() => $('button', card)?.focus({ preventScroll: true }), 50);
}

function battleDone(btn) {
  const ov = btn.closest('.battle');
  const eraDone = ov && ov.dataset.era === '1';
  ov?.remove();
  modalCount = Math.max(0, modalCount - 1);
  selected = null;
  if (eraDone) { showEraComplete(); return; }
  renderTab();
  updateHUD();
  updateTutorial();
}

// ---------------- MODALER ----------------
function openModal(html, cls = '', onClose) {
  modalCount++;
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
    <label class="field-label" for="village-name">${t('intro_q')}</label>
    <input id="village-name" class="text-input" maxlength="22" autocomplete="off" placeholder="${esc(name)}">
    <button type="button" class="btn btn-gold big" data-action="intro-start">${t('intro_start')}</button>
  </div>`, 'intro-modal');
  $('#village-name', m).addEventListener('keydown', (e) => { if (e.key === 'Enter') startGame(); });
}
function startGame() {
  unlockAudio();
  const input = $('#village-name');
  const name = (input && input.value.trim()) || t('intro_placeholder');
  S = E.newState(name.slice(0, 22));
  S.settings.lang = getLang();
  S.seenIntro = 0;
  persist();
  closeModal($('.intro-modal'));
  applyTheme();
  renderShellText();
  setTab('base');
  updateHUD();
  sfx.fanfare();
  showEraIntro(0);
}
function showEraIntro(e) {
  const era = ERAS[e];
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
  if (!next) { S.finished = true; persist(); showFinal(); return; }
  const unlocks = [...BUILDINGS, ...UNITS].filter((it) => it.era === S.era + 1);
  const m = openModal(`<div class="modal-mascot">${A.mascot()}</div>
    <h2 class="big-title">${esc(L(cur.won))}</h2>
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
    <button type="button" class="btn btn-gold big" data-action="prestige">${ico('star')} ${t('final_again')}<small>${t('final_again_sub')}</small></button>
    <button type="button" class="btn btn-soft" data-action="close">${t('final_stay')}</button>`, 'celebrate');
  confetti(m, 90);
}
function doPrestige(btn) {
  if (btn) closeModal(btn);
  S = E.prestigeReset(S);
  selected = null; viewBox = null;
  persist();
  applyTheme();
  setTab('base');
  updateHUD();
  sfx.fanfare();
  showEraIntro(0);
}

function checkOffline() {
  const { secs, earned } = E.offlineGain(S);
  S.lastSeen = Date.now();
  if (secs < 60 || earned < 1) return;
  openModal(`<div class="modal-mascot">${A.mascot()}</div>
    <h2 class="big-title">${t('welcome_back')}</h2>
    <p class="speech">${t('away_text', { t: duration(secs) })}</p>
    <div class="big-money">${ico('coin')} ${money(earned)}</div>
    <button type="button" class="btn btn-gold big" data-action="collect" data-amount="${earned}">${t('collect')}</button>`, 'welcome');
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
    <div class="stats-box"><b>${t('stats')}</b>
      <div class="stat-list">
        <span>${t('stat_time')}</span><b>${duration(st.playTime)}</b>
        <span>${t('stat_taps')}</span><b>${fmt(st.taps)}</b>
        <span>${t('stat_won')}</span><b>${fmt(st.won)}</b>
        <span>${t('stat_lost')}</span><b>${fmt(st.lost)}</b>
        <span>${t('stat_units_lost')}</span><b>${fmt(st.unitsLost)}</b>
        <span>${t('stat_crates')}</span><b>${fmt(st.crates)}</b>
        ${st.wins ? `<span>${t('stat_wins')}</span><b>${fmt(st.wins)}</b>` : ''}
      </div></div>
    <div class="danger-zone" id="danger"><button type="button" class="btn btn-danger" data-action="reset">${t('reset')}</button></div>
    <p class="credits">${t('credits')}</p>`, 'settings');
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
function coinBurst(x, y) {
  const fx = $('#fx');
  for (let i = 0; i < 3; i++) {
    const c = document.createElement('div');
    c.className = 'coin-fly';
    c.innerHTML = ico('coin');
    c.style.left = x + 'px'; c.style.top = y + 'px';
    fx.appendChild(c);
    const dx = (Math.random() - 0.5) * 140, dy = -60 - Math.random() * 60;
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
  nextCrate = now + 45000 + Math.random() * 50000;
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
}
function collectCrate(x, y) {
  S.stats.crates++;
  sfx.crate();
  if (S.settings.vibrate) buzz(30);
  if (Math.random() < 0.62 || E.boostActive(S)) {
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
  if (S.tut === 0) { text = t('tut0'); target = tab === 'base' ? $('#hq') : $('#tab-base'); }
  else if (S.tut === 1) { text = t('tut1'); target = tab === 'build' ? $('[data-action="buy"][data-id="corn"]') : $('#tab-build'); }
  else if (S.tut === 2) { text = t('tut2'); target = tab === 'army' ? $('[data-action="buy"][data-id="militia"]') : $('#tab-army'); }
  else if (S.tut === 3) { text = t('tut3'); target = tab === 'map' ? $('#region-sheet [data-action="attack"]') : $('#tab-map'); }
  else if (S.tut === 4) {
    text = t('tut4');
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
    const r = E.nextTarget(S);
    const sig = r ? r.id + ':' + Math.floor(Math.log10(E.armyPower(S) + 1) * 40) + ':' + E.chanceFor(S, r).toFixed(2) : 'none';
    if (sig !== lastSig.target) { lastSig.target = sig; const c = $('#target-card'); if (c) c.innerHTML = targetCardHTML(); }
    const tb = $('[data-action="buytap"]');
    if (tb && S.tapLevel < E.TAP_MAX) tb.classList.toggle('cant', S.money < E.tapCost(S.tapLevel));
  } else if (tab === 'build' || tab === 'army') {
    updateBuyButtons();
  }
}
function frame(now) {
  const dt = Math.min(1, Math.max(0, (now - lastFrame) / 1000));
  lastFrame = now;
  if (S) {
    E.tick(S, dt);
    liveAcc += dt; saveAcc += dt; badgeAcc += dt;
    if (liveAcc >= 0.12) { liveAcc = 0; updateLive(); }
    if (badgeAcc >= 1) { badgeAcc = 0; updateBadges(); if (S.tut === 2) updateTutorial(); }
    if (saveAcc >= 5) { saveAcc = 0; persist(); }
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
    case 'tab': sfx.click(); setTab(btn.dataset.tab); break;
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
    case 'attack': startBattle(btn.dataset.id); break;
    case 'select': selectRegion(btn.dataset.id); break;
    case 'zoomout': { const m = MAPS[ERAS[S.era].map]; animateViewBox([0, 0, m.w, m.h]); break; }
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
    case 'install':
      if (installEvt) { installEvt.prompt(); installEvt.userChoice?.finally(() => { installEvt = null; }); closeModal(btn); }
      break;
    default: break;
  }
}

function onVisibility() {
  if (!S) return;
  if (document.hidden) { persist(); return; }
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
  if (!S) showIntro();
  else {
    setSound(S.settings.sound);
    setTab('base');
    updateHUD();
    checkOffline();
    if (S.seenIntro < 0) showEraIntro(S.era);
    if (E.eraComplete(S) && !S.finished) showEraComplete();
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
    };
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
