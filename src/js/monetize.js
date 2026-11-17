// Inntekter: reklame og kjøp. Ett felles grensesnitt med flere leverandører.
//
// Reklame (velg i monetize.config.json, se README):
//   demo        – egne «reklamer» for spillets fiktive merker (for testing; tjener ingen penger)
//   adsense     – Google AdSense H5 Games Ads (egen nettside/domene, krever godkjent AdSense-konto)
//   crazygames  – CrazyGames SDK v3 (last opp spillet på crazygames.com, del av reklameinntekten)
//   poki        – Poki SDK v2 (krever avtale med Poki)
//   none        – ingen reklame
// Kjøp:
//   demo        – viser kjøpsflyten uten ekte betaling
//   none        – skjuler alt som koster ekte penger (påkrevd på spillportaler)
/* global __MONETIZE__ */

const DEFAULTS = {
  ads: { provider: 'demo', adsenseClient: '', testMode: true, interstitialEvery: 2, interstitialMinGap: 180 },
  payments: { provider: 'demo' },
};
function merge(a, b) {
  const out = { ...a };
  for (const k of Object.keys(b || {})) out[k] = b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) ? merge(a[k] || {}, b[k]) : b[k];
  return out;
}
export const CONFIG = merge(DEFAULTS, typeof __MONETIZE__ !== 'undefined' ? __MONETIZE__ : {});

// Produkter som koster ekte penger. Prisene her er bare visning i demo – i en butikk kommer prisen fra butikken.
export const PRODUCTS = [
  { id: 'gems_s', gems: 120, price: { nb: '10 kr', en: '$0.99' } },
  { id: 'gems_m', gems: 650, price: { nb: '49 kr', en: '$4.99' }, tag: 'popular' },
  { id: 'gems_l', gems: 1400, price: { nb: '99 kr', en: '$9.99' } },
  { id: 'gems_xl', gems: 3600, price: { nb: '199 kr', en: '$19.99' }, tag: 'best' },
  { id: 'adfree', adFree: true, gems: 200, price: { nb: '39 kr', en: '$3.99' } },
  { id: 'starter', adFree: true, gems: 500, skinRarity: 'epic', price: { nb: '59 kr', en: '$5.99' }, once: true },
];
export const PRODUCT_BY_ID = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

let ui = null; // { demoAd(type) => Promise<'ok'|'skipped'>, confirmPurchase(product) => Promise<boolean>, onAdStart(), onAdEnd() }
let provider = null;
let ready = false;

function loadScript(src, attrs = {}) {
  return new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = src;
    el.async = true;
    for (const [k, v] of Object.entries(attrs)) if (v !== null && v !== undefined) el.setAttribute(k, v);
    el.onload = () => resolve();
    el.onerror = () => reject(new Error('script ' + src));
    document.head.appendChild(el);
  });
}
// Venter på et svar fra en reklame-SDK, men gir opp hvis reklamen aldri starter (f.eks. adblock).
function guarded(start, startTimeoutMs = 6000) {
  return new Promise((resolve) => {
    let done = false, started = false;
    const finish = (v) => { if (!done) { done = true; resolve(v); } };
    const t = setTimeout(() => { if (!started) finish('none'); }, startTimeoutMs);
    try {
      start({ started: () => { started = true; clearTimeout(t); }, finish });
    } catch { finish('none'); }
  });
}
const hook = (name) => { try { ui && ui[name] && ui[name](); } catch { /* */ } };

const PROVIDERS = {
  none: {
    init: async () => true,
    rewarded: async () => 'none',
    interstitial: async () => {},
  },
  demo: {
    init: async () => true,
    rewarded: async () => (ui ? ui.demoAd('rewarded') : 'none'),
    interstitial: async () => { if (ui) await ui.demoAd('interstitial'); },
  },
  // Google AdSense H5 Games Ads (Ad Placement API): adBreak()/adConfig()
  adsense: {
    async init() {
      const client = CONFIG.ads.adsenseClient;
      if (!/^ca-pub-\d+$/.test(client || '')) throw new Error('adsenseClient mangler');
      window.adsbygoogle = window.adsbygoogle || [];
      window.adBreak = window.adConfig = function (o) { window.adsbygoogle.push(o); };
      await loadScript('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(client), {
        'data-ad-client': client,
        'data-adbreak-test': CONFIG.ads.testMode ? 'on' : null,
        'data-ad-frequency-hint': '120s',
        crossorigin: 'anonymous',
      });
      window.adConfig({ preloadAdBreaks: 'on', sound: 'on' });
      return true;
    },
    rewarded: (name) => guarded(({ started, finish }) => {
      let viewed = false;
      window.adBreak({
        type: 'reward',
        name,
        beforeAd: () => { started(); hook('onAdStart'); },
        afterAd: () => hook('onAdEnd'),
        beforeReward: (showAdFn) => { started(); showAdFn(); },
        adDismissed: () => finish('skipped'),
        adViewed: () => { viewed = true; finish('ok'); },
        adBreakDone: (info) => { started(); finish(viewed ? 'ok' : info && info.breakStatus === 'dismissed' ? 'skipped' : 'none'); },
      });
    }),
    interstitial: (name) => guarded(({ started, finish }) => {
      window.adBreak({
        type: 'next',
        name,
        beforeAd: () => { started(); hook('onAdStart'); },
        afterAd: () => hook('onAdEnd'),
        adBreakDone: () => { started(); finish('done'); },
      });
    }),
  },
  // CrazyGames SDK v3
  crazygames: {
    async init() {
      await loadScript('https://sdk.crazygames.com/crazygames-sdk-v3.js');
      await window.CrazyGames.SDK.init();
      return true;
    },
    rewarded: () => guarded(({ started, finish }) => {
      window.CrazyGames.SDK.ad.requestAd('rewarded', {
        adStarted: () => { started(); hook('onAdStart'); },
        adFinished: () => { hook('onAdEnd'); finish('ok'); },
        adError: () => { started(); hook('onAdEnd'); finish('none'); },
      });
    }, 8000),
    interstitial: () => guarded(({ started, finish }) => {
      window.CrazyGames.SDK.ad.requestAd('midgame', {
        adStarted: () => { started(); hook('onAdStart'); },
        adFinished: () => { hook('onAdEnd'); finish('done'); },
        adError: () => { started(); hook('onAdEnd'); finish('none'); },
      });
    }, 8000),
    gameplayStart: () => window.CrazyGames?.SDK?.game?.gameplayStart?.(),
    gameplayStop: () => window.CrazyGames?.SDK?.game?.gameplayStop?.(),
    happytime: () => window.CrazyGames?.SDK?.game?.happytime?.(),
  },
  // Poki SDK v2
  poki: {
    async init() {
      await loadScript('https://game-cdn.poki.com/scripts/v2/poki-sdk.js');
      await window.PokiSDK.init();
      window.PokiSDK.gameLoadingFinished?.();
      return true;
    },
    async rewarded() {
      hook('onAdStart');
      try { return (await window.PokiSDK.rewardedBreak()) ? 'ok' : 'skipped'; } catch { return 'none'; } finally { hook('onAdEnd'); }
    },
    async interstitial() {
      hook('onAdStart');
      try { await window.PokiSDK.commercialBreak(); } catch { /* */ } finally { hook('onAdEnd'); }
    },
    gameplayStart: () => window.PokiSDK?.gameplayStart?.(),
    gameplayStop: () => window.PokiSDK?.gameplayStop?.(),
  },
};

export async function initMonetization(uiHooks, { forceDemo = false } = {}) {
  ui = uiHooks;
  const name = forceDemo ? 'demo' : CONFIG.ads.provider;
  provider = PROVIDERS[name] || PROVIDERS.demo;
  try { ready = await provider.init(); } catch (e) {
    console.warn('Reklame utilgjengelig:', e.message);
    provider = PROVIDERS.none;
    ready = true;
  }
  if (forceDemo) CONFIG.payments.provider = CONFIG.payments.provider === 'none' ? 'none' : 'demo';
  return ready;
}
export const adsEnabled = () => CONFIG.ads.provider !== 'none';
export const paymentsEnabled = () => CONFIG.payments.provider === 'demo';
export const isDemoAds = () => provider === PROVIDERS.demo;

export async function rewardedAd(placement) {
  if (!provider || !ready) return 'none';
  return provider.rewarded(placement);
}
export async function interstitialAd(placement) {
  if (!provider || !ready) return;
  await provider.interstitial(placement);
}
export const gameplayStart = () => { try { provider?.gameplayStart?.(); } catch { /* */ } };
export const gameplayStop = () => { try { provider?.gameplayStop?.(); } catch { /* */ } };
export const happytime = () => { try { provider?.happytime?.(); } catch { /* */ } };

// Kjøp med ekte penger. I demo-modus bekrefter spilleren et testkjøp; ingen betaling skjer.
export async function purchase(productId) {
  const p = PRODUCT_BY_ID[productId];
  if (!p || !paymentsEnabled() || !ui) return false;
  return ui.confirmPurchase(p);
}
