// Lager app-ikoner (PNG) fra spillets SVG-logo. Kjør én gang: node tools/icons.mjs
// Krever Playwright + Chromium (finnes i utviklingsmiljøet).
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { logo } from '../src/js/art.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const out = new URL('../assets/icons/', import.meta.url);
mkdirSync(out, { recursive: true });

const bg = (rounded) => `<svg viewBox="0 0 512 512" style="position:absolute;inset:0;width:100%;height:100%">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd3ff"/><stop offset="1" stop-color="#d4f3ff"/></linearGradient></defs>
  <rect width="512" height="512" rx="${rounded ? 112 : 0}" fill="url(#g)"/>
  ${Array.from({ length: 12 }, (_, i) => `<path d="M256 256L${256 + Math.cos((i * Math.PI) / 6) * 520} ${256 + Math.sin((i * Math.PI) / 6) * 520}L${256 + Math.cos((i * Math.PI) / 6 + 0.22) * 520} ${256 + Math.sin((i * Math.PI) / 6 + 0.22) * 520}Z" fill="#fff" opacity=".18"/>`).join('')}
</svg>`;
const page = (size, scale, rounded) => `<html><body style="margin:0;background:transparent">
<div id="i" style="position:relative;width:${size}px;height:${size}px;overflow:hidden;border-radius:${rounded ? size * 0.22 : 0}px">
${bg(rounded)}
<div style="position:absolute;left:50%;top:50%;width:${size * scale}px;height:${size * scale}px;transform:translate(-50%,-48%)">${logo().replace('<svg ', '<svg style="width:100%;height:100%" ')}</div>
</div></body></html>`;

const b = await chromium.launch();
const pg = await b.newPage({ deviceScaleFactor: 1 });
for (const [name, size, scale, rounded] of [
  ['icon-512.png', 512, 0.84, true],
  ['icon-192.png', 192, 0.84, true],
  ['icon-maskable-512.png', 512, 0.66, false],
  ['apple-touch-icon.png', 180, 0.8, false],
]) {
  await pg.setViewportSize({ width: size, height: size });
  await pg.setContent(page(size, scale, rounded));
  await pg.locator('#i').screenshot({ path: new URL(name, out).pathname, omitBackground: true });
  console.log('Skrev', name);
}
await b.close();
