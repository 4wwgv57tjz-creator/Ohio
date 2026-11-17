// Ende-til-ende-test av leaderboard, venner og Facebook/Apple-innlogging mot Firebase-emulatoren.
// Se README («Test mot Firebase-emulatoren»). Krever Playwright og at emulatoren kjører.
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const OUT = require('os').tmpdir() + '/';
const PAGE = require('path').join(__dirname, '..', 'dist', 'emulator', 'index.html');
const PROJECT = 'demo-ohio';
const FS = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`;
const AUTH = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';

const server = http.createServer((req, res) => {
  if (req.url !== '/' && !req.url.startsWith('/#') && !req.url.startsWith('/?')) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(fs.readFileSync(PAGE));
}).listen(8766);

const log = (...a) => console.log(...a);
async function startPlayer(browser, name, wins) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  p.setDefaultTimeout(15000);
  p.on('pageerror', (e) => log(`[${name}] pageerror:`, e.message));
  p.on('console', (m) => { if (m.type() === 'error') log(`[${name}] console:`, m.text()); });
  await p.goto('http://localhost:8766/#debug');
  await p.fill('#village-name', name);
  await p.click('[data-action="intro-start"]');
  await p.click('.era-intro [data-action="close"]');
  await p.waitForFunction(() => window.__ohio && window.__ohio.social() && window.__ohio.social().state().code, null, { timeout: 20000 });
  await p.evaluate((w) => { const S = window.__ohio.state(); S.stats.won = w; S.tut = 9; return window.__ohio.social().submit(true); }, wins);
  const st = await p.evaluate(() => window.__ohio.social().state());
  log(`${name}: gjest=${!st.signedIn} kode=${st.code}`);
  return { ctx, p, code: st.code };
}

async function rest(method, url, body, token) {
  const r = await fetch(url, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let j = null; try { j = await r.json(); } catch { /* */ }
  return { status: r.status, j };
}
const fsDoc = (o) => ({ fields: Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'string' ? { stringValue: v } : Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }])) });

async function emulatorLogin(page, button) {
  const [popup] = await Promise.all([page.waitForEvent('popup'), page.click(button)]);
  await popup.waitForLoadState();
  await popup.screenshot({ path: OUT + `emu-popup-${button.includes('apple') ? 'apple' : 'fb'}.png` });
  await popup.click('text=/Add new account/i');
  const auto = popup.locator('text=/Auto-generate user information/i');
  if (await auto.count()) await auto.first().click();
  await popup.click('text=/Sign in with/i');
  await popup.waitForEvent('close', { timeout: 15000 }).catch(() => {});
}

(async () => {
  const browser = await chromium.launch();
  try {
    const A = await startPlayer(browser, 'Alfa', 12);
    const B = await startPlayer(browser, 'Beta', 20);

    // A legger til B som venn via skjemaet i Topp-fanen
    await A.p.click('#tab-top');
    await A.p.fill('#friend-code', 'ohio-' + B.code.toLowerCase());
    await A.p.click('[data-action="add-friend"]');
    await A.p.waitForSelector('.board-row:nth-child(2)');
    const friends = await A.p.$$eval('.board-row', (rows) => rows.map((r) => r.querySelector('.who b').textContent + ' ' + r.querySelector('.score').textContent));
    log('A sine venner:', JSON.stringify(friends));
    await A.p.screenshot({ path: OUT + 'emu-friends.png' });
    // feilkoder
    await A.p.fill('#friend-code', A.code); await A.p.click('[data-action="add-friend"]');
    await A.p.waitForTimeout(700);
    log('egen kode →', await A.p.locator('.toast').last().textContent());
    await A.p.fill('#friend-code', 'ZZZZZZ'); await A.p.click('[data-action="add-friend"]');
    await A.p.waitForTimeout(700);
    log('ukjent kode →', await A.p.locator('.toast').last().textContent());

    // global liste
    await A.p.click('[data-action="topview"][data-view="global"]');
    await A.p.waitForSelector('.board-row:nth-child(2)');
    log('Global liste:', JSON.stringify(await A.p.$$eval('.board-row', (rows) => rows.map((r) => r.querySelector('.place').textContent + '. ' + r.querySelector('.who b').textContent))));

    // Facebook-innlogging for A (kobler gjestekontoen: samme bruker, plass og venner beholdes)
    await A.p.click('[data-action="topview"][data-view="friends"]');
    const uidA = await A.p.evaluate(() => window.__ohioEmu.uid());
    const stA = await A.p.evaluate(() => window.__ohioEmu.link('facebook', { sub: 'fb-alfa-1', email: 'alfa@example.com', name: 'Alfa Testesen' }));
    const uidA2 = await A.p.evaluate(() => window.__ohioEmu.uid());
    log(`A etter Facebook: innlogget=${stA.signedIn} via=${stA.provider} samme bruker=${uidA === uidA2} samme kode=${stA.code === A.code}`);
    await A.p.click('#tab-base'); await A.p.click('#tab-top');
    await A.p.waitForSelector('.board-row:nth-child(2)');
    log('A sine venner etter innlogging:', JSON.stringify(await A.p.$$eval('.board-row', (rows) => rows.map((r) => r.querySelector('.who b').textContent))));
    await A.p.screenshot({ path: OUT + 'emu-fb-loggedin.png' });

    // Apple-innlogging for B
    const stB = await B.p.evaluate(() => window.__ohioEmu.link('apple', { sub: 'apple-beta-1', email: 'beta@privaterelay.appleid.com' }));
    log(`B etter Apple: innlogget=${stB.signedIn} via=${stB.provider} samme kode=${stB.code === B.code}`);

    // A på en ny enhet: starter som gjest, logger inn med samme Facebook-konto og skal få tilbake profilen sin
    const C = await startPlayer(browser, 'Alfa-mobil', 0);
    const stC = await C.p.evaluate(() => window.__ohioEmu.link('facebook', { sub: 'fb-alfa-1', email: 'alfa@example.com', name: 'Alfa Testesen' }));
    log(`Ny enhet etter Facebook: samme bruker som A=${(await C.p.evaluate(() => window.__ohioEmu.uid())) === uidA} kode=${stC.code} (A sin var ${A.code})`);
    await C.p.click('#tab-top');
    await C.p.waitForSelector('.board-row:nth-child(2)');
    log('Venner på ny enhet:', JSON.stringify(await C.p.$$eval('.board-row', (rows) => rows.map((r) => r.querySelector('.who b').textContent))));

    // Logg ut → blir ny gjest
    await A.p.evaluate(() => window.__ohio.social().logout());
    await A.p.waitForFunction(() => !window.__ohio.social().state().signedIn && window.__ohio.social().state().code, null, { timeout: 15000 });
    log('A etter utlogging: ny gjestekode =', await A.p.evaluate(() => window.__ohio.social().state().code));

    // Hva som faktisk ligger i databasen (admin-tilgang i emulatoren)
    const all = await rest('GET', `${FS}/players`, null, 'owner');
    log('Databasen:', JSON.stringify((all.j.documents || []).map((d) => ({ name: d.fields.name?.stringValue, score: d.fields.score?.integerValue ?? d.fields.score?.doubleValue, provider: d.fields.provider?.stringValue, friends: (d.fields.friends?.arrayValue?.values || []).length }))));

    // Sikkerhetsregler: en ny bruker prøver å jukse
    const u = await rest('POST', `${AUTH}/accounts:signUp?key=demo-key`, { returnSecureToken: true });
    const tok = u.j.idToken, me = u.j.localId;
    const other = (all.j.documents || [])[0].name.split('/').pop();
    const valid = { name: 'Juks', score: 3, lifetime: 10, era: 0, prestige: 0, rank: 3.01 };
    log('skrive egen rad:', (await rest('PATCH', `${FS}/players/${me}`, fsDoc(valid), tok)).status, '(forventet 200)');
    log('skrive andres rad:', (await rest('PATCH', `${FS}/players/${other}`, fsDoc(valid), tok)).status, '(forventet 403)');
    log('juksepoeng 999999:', (await rest('PATCH', `${FS}/players/${me}`, fsDoc({ ...valid, score: 999999 }), tok)).status, '(forventet 403)');
    log('ukjent felt:', (await rest('PATCH', `${FS}/players/${me}`, fsDoc({ ...valid, admin: 'ja' }), tok)).status, '(forventet 403)');
    log('stjele vennekode:', (await rest('PATCH', `${FS}/codes/ABCDEF`, fsDoc({ uid: other }), tok)).status, '(forventet 403)');
    log('uten innlogging:', (await rest('PATCH', `${FS}/players/${me}`, fsDoc(valid))).status, '(forventet 403)');
  } catch (e) {
    log('FEIL:', e.message.split('\n')[0]);
  } finally {
    await browser.close();
    server.close();
  }
})();
