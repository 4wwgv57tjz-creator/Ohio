// Bygger spillet til:
//   docs/                 – installerbar mobil-webapp (PWA) for GitHub Pages. Reklame/kjøp styres av monetize.config.json
//   dist/artifact.html    – samme spill som ett HTML-fragment (for claude.ai Artifact, alltid demo-reklame)
//   builds/crazygames/, builds/poki/ – egne versjoner for spillportaler (med portalens reklame-SDK, uten kjøp)
//   app/www/              – app-versjonen for App Store og Google Play (Capacitor + AdMob, se PUBLISERING.md)
// Leaderboard/innlogging styres av online.config.json («demo» eller «firebase»).
// Kjør: npm run build        (SOCIAL_EMULATOR=1 lager også dist/emulator/ for testing mot Firebase-emulatoren)
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import * as esbuild from 'esbuild';

const root = new URL('../', import.meta.url);
const p = (rel) => new URL(rel, root);
const read = (rel) => readFileSync(p(rel), 'utf8');

const TITLE = 'Take over the world Ohio';
const DESC = 'Et fargerikt tycoon-krigsspill: start som en liten bygd i Ohio og ta over Ohio, USA, Amerika, hele jorda – og til slutt verdensrommet mot aliens!';

// 1) JavaScript – bygges én gang per reklame-/kjøpsoppsett
const userCfg = existsSync(p('monetize.config.json')) ? JSON.parse(read('monetize.config.json')) : {};
const onlineCfg = existsSync(p('online.config.json')) ? JSON.parse(read('online.config.json')) : { provider: 'demo' };
if (onlineCfg.provider === 'firebase' && !(onlineCfg.firebase && onlineCfg.firebase.apiKey && onlineCfg.firebase.projectId)) {
  console.warn('online.config.json: Firebase mangler apiKey/projectId – bruker demo-leaderboard.');
  onlineCfg.provider = 'demo';
}
const DEMO_SOCIAL = { provider: 'demo', loginProviders: onlineCfg.loginProviders || ['facebook', 'apple'] };
const APP_PKGS = ['@capacitor-community/admob', '@capacitor/core'];
const bundle = async (cfg, social = onlineCfg, app = false) => (await esbuild.build({
  entryPoints: [p('src/js/main.js').pathname],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020', 'safari14'],
  write: false,
  legalComments: 'none',
  external: app ? [] : APP_PKGS,
  define: {
    __MONETIZE__: JSON.stringify(cfg),
    __ADS_PROVIDER__: JSON.stringify((cfg.ads && cfg.ads.provider) || 'demo'),
    __SOCIAL__: JSON.stringify(social),
    __SOCIAL_PROVIDER__: JSON.stringify(social.provider === 'firebase' ? 'firebase' : 'demo'),
  },
})).outputFiles[0].text;
const js = await bundle(userCfg);
const demoCfg = { ...userCfg, ads: { ...(userCfg.ads || {}), provider: 'demo' }, payments: { provider: 'demo' }, privacyUrl: '' };
const jsDemo = await bundle(demoCfg, DEMO_SOCIAL);

// 2) CSS + innebygde fonter
const font = (file) => readFileSync(p('assets/fonts/' + file)).toString('base64');
const fontCss = `@font-face{font-family:'Luckiest Guy';font-style:normal;font-weight:400;font-display:swap;src:url(data:font/woff2;base64,${font('luckiestguy-latin.woff2')}) format('woff2')}
@font-face{font-family:'Fredoka';font-style:normal;font-weight:300 700;font-display:swap;src:url(data:font/woff2;base64,${font('fredoka-latin.woff2')}) format('woff2')}`;
const css = (await esbuild.transform(read('src/css/style.css'), { loader: 'css', minify: true })).code;

const loading = `<div id="app"><div style="margin:auto;font:700 22px system-ui;color:#2b2350;text-align:center;padding:40vh 16px 0">Take over the world <b>OHIO</b></div></div>`;
const safe = (code) => code.replace(/<\/script/gi, '<\\/script');
const safeJs = safe(js);

// 3) PWA (docs/)
const hash = createHash('sha256').update(js + css).digest('hex').slice(0, 10);
mkdirSync(p('docs/icons/'), { recursive: true });
const pwa = `<!doctype html>
<html lang="nb">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,maximum-scale=1,user-scalable=no">
<title>${TITLE}</title>
<meta name="description" content="${DESC}">
<meta name="theme-color" content="#7fd3ff">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="TOTW Ohio">
<meta property="og:title" content="${TITLE}">
<meta property="og:description" content="${DESC}">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}</style>
<style>${fontCss}${css}</style>
</head>
<body>
${loading}
<script>${safeJs}</script>
</body>
</html>
`;
writeFileSync(p('docs/index.html'), pwa);
writeFileSync(p('docs/manifest.webmanifest'), JSON.stringify({
  name: TITLE,
  short_name: 'TOTW Ohio',
  description: DESC,
  lang: 'nb',
  start_url: './',
  scope: './',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#7fd3ff',
  theme_color: '#7fd3ff',
  categories: ['games'],
  icons: [
    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}, null, 2));
writeFileSync(p('docs/sw.js'), `// Service worker: gjør spillet spillbart uten nett. Versjon ${hash}
const CACHE = 'totw-ohio-${hash}';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => {
    const net = fetch(req).then((res) => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
`);
writeFileSync(p('docs/.nojekyll'), '');
const iconDir = p('assets/icons/');
if (existsSync(iconDir)) for (const f of readdirSync(iconDir)) copyFileSync(new URL(f, iconDir), p('docs/icons/' + f));
else console.warn('Mangler assets/icons – kjør: node tools/icons.mjs');

// 4) Artifact-fragment (claude.ai legger selv på <!doctype>, <head> og <body>)
mkdirSync(p('dist/'), { recursive: true });
const fragment = `<title>${TITLE}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="theme-color" content="#7fd3ff">
<style>${fontCss}${css}</style>
${loading}
<script>${safe(jsDemo)}</script>
`;
writeFileSync(p('dist/artifact.html'), fragment);

// 5) Spillportaler: portalen viser reklamen og deler inntekten. Kjøp med ekte penger er av.
for (const portal of ['crazygames', 'poki']) {
  const cfg = { ...userCfg, ads: { ...(userCfg.ads || {}), provider: portal }, payments: { provider: 'none' } };
  const code = await bundle(cfg);
  mkdirSync(p(`builds/${portal}/`), { recursive: true });
  writeFileSync(p(`builds/${portal}/index.html`), `<!doctype html>
<html lang="nb">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,maximum-scale=1,user-scalable=no">
<title>${TITLE}</title>
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}</style>
<style>${fontCss}${css}</style>
</head>
<body>
${loading}
<script>${safe(code)}</script>
</body>
</html>
`);
}

const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(0) + ' KB';
console.log(`JS ${kb(js)} · CSS ${kb(css)} · fonter ${kb(fontCss)}`);
console.log(`docs/index.html ${kb(pwa)} · dist/artifact.html ${kb(fragment)} · versjon ${hash}`);
console.log(`Reklame i docs/: ${(userCfg.ads && userCfg.ads.provider) || 'demo'} · kjøp: ${(userCfg.payments && userCfg.payments.provider) || 'demo'} · portalversjoner i builds/crazygames og builds/poki`);

// 6) App-versjonen (Capacitor): AdMob-reklame. Kjøp med ekte penger er av til kjøp i appen (StoreKit / Google Play
//    Billing) er lagt inn, og leaderboardet bruker demo til innlogging i appen er satt opp (se PUBLISERING.md).
if (existsSync(p('node_modules/@capacitor-community/admob/package.json'))) {
  const appCfg = { ...userCfg, ads: { ...(userCfg.ads || {}), provider: 'admob' }, payments: { provider: 'none' } };
  const code = await bundle(appCfg, DEMO_SOCIAL, true);
  mkdirSync(p('app/www/'), { recursive: true });
  writeFileSync(p('app/www/index.html'), `<!doctype html>
<html lang="nb">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,maximum-scale=1,user-scalable=no">
<title>${TITLE}</title>
<meta name="theme-color" content="#7fd3ff">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}</style>
<style>${fontCss}${css}</style>
</head>
<body>
${loading}
<script>${safe(code)}</script>
</body>
</html>
`);
  copyFileSync(p('docs/personvern.html'), p('app/www/personvern.html'));
  console.log(`app/www/index.html ${kb(code)} JS (AdMob ${userCfg.ads && userCfg.ads.testMode === false ? 'ekte reklame' : 'testreklame'}) – kjør «npx cap sync» for å kopiere til iOS/Android`);
} else console.log('App-versjonen hoppes over: kjør «npm install» først (Capacitor og AdMob-pakkene mangler).');

// 7) Testversjon mot Firebase-emulatoren (kun ved SOCIAL_EMULATOR=1)
if (process.env.SOCIAL_EMULATOR) {
  const emu = { provider: 'firebase', loginProviders: ['facebook', 'apple'], firebase: { apiKey: 'demo-key', authDomain: 'localhost', projectId: 'demo-ohio', appId: 'demo-app' }, emulator: { auth: 'http://127.0.0.1:9099', host: '127.0.0.1', firestorePort: 8080 } };
  const code = await bundle(demoCfg, emu);
  mkdirSync(p('dist/emulator/'), { recursive: true });
  writeFileSync(p('dist/emulator/index.html'), `<!doctype html><html lang="nb"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${TITLE} (emulator)</title><style>${fontCss}${css}</style></head><body>${loading}<script>${safe(code)}</script></body></html>`);
  console.log('Skrev dist/emulator/index.html (Firebase-emulator)');
}
