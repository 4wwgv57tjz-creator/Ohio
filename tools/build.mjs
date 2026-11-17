// Bygger spillet til:
//   docs/            – installerbar mobil-webapp (PWA) for GitHub Pages: index.html, manifest, service worker, ikoner
//   dist/artifact.html – samme spill som ett HTML-fragment (for claude.ai Artifact)
// Kjør: npm run build
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import * as esbuild from 'esbuild';

const root = new URL('../', import.meta.url);
const p = (rel) => new URL(rel, root);
const read = (rel) => readFileSync(p(rel), 'utf8');

const TITLE = 'Take over the world Ohio';
const DESC = 'Et fargerikt tycoon-krigsspill: start som en liten bygd i Ohio og ta over Ohio, USA, Amerika, hele jorda – og til slutt verdensrommet mot aliens!';

// 1) JavaScript
const js = (await esbuild.build({
  entryPoints: [p('src/js/main.js').pathname],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020', 'safari14'],
  write: false,
  legalComments: 'none',
})).outputFiles[0].text;

// 2) CSS + innebygde fonter
const font = (file) => readFileSync(p('assets/fonts/' + file)).toString('base64');
const fontCss = `@font-face{font-family:'Luckiest Guy';font-style:normal;font-weight:400;font-display:swap;src:url(data:font/woff2;base64,${font('luckiestguy-latin.woff2')}) format('woff2')}
@font-face{font-family:'Fredoka';font-style:normal;font-weight:300 700;font-display:swap;src:url(data:font/woff2;base64,${font('fredoka-latin.woff2')}) format('woff2')}`;
const css = (await esbuild.transform(read('src/css/style.css'), { loader: 'css', minify: true })).code;

const loading = `<div id="app"><div style="margin:auto;font:700 22px system-ui;color:#2b2350;text-align:center;padding:40vh 16px 0">Take over the world <b>OHIO</b></div></div>`;
const safeJs = js.replace(/<\/script/gi, '<\\/script');

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
<script>${safeJs}</script>
`;
writeFileSync(p('dist/artifact.html'), fragment);

const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(0) + ' KB';
console.log(`JS ${kb(js)} · CSS ${kb(css)} · fonter ${kb(fontCss)}`);
console.log(`docs/index.html ${kb(pwa)} · dist/artifact.html ${kb(fragment)} · versjon ${hash}`);
