// Skins (kosmetikk), sjeldenhetsgrader og lootkasser – ren logikk uten DOM.
// Skins er rent kosmetiske: de endrer utseende, ikke styrke eller inntekt.

export const RARITIES = [
  { id: 'common', name: { nb: 'Vanlig', en: 'Common' }, color: '#9aa3b5', refund: 10 },
  { id: 'rare', name: { nb: 'Sjelden', en: 'Rare' }, color: '#3d8bff', refund: 25 },
  { id: 'epic', name: { nb: 'Episk', en: 'Epic' }, color: '#a35cff', refund: 60 },
  { id: 'legendary', name: { nb: 'Legendarisk', en: 'Legendary' }, color: '#ffa600', refund: 150 },
  { id: 'mythic', name: { nb: 'Mytisk', en: 'Mythic' }, color: '#ff3d77', refund: 400 },
  { id: 'prestige', name: { nb: 'Prestisje', en: 'Prestige' }, color: '#7a5cff', refund: 0 }, // kun fra prestisje, aldri i kasser
];
export const RARITY = Object.fromEntries(RARITIES.map((r, i) => [r.id, { ...r, rank: i }]));

export const CATEGORIES = [
  { id: 'army', name: { nb: 'Hær', en: 'Army' } },
  { id: 'flag', name: { nb: 'Flagg', en: 'Flag' } },
  { id: 'hq', name: { nb: 'Hovedkvarter', en: 'HQ' } },
  { id: 'hat', name: { nb: 'General', en: 'General' } },
];

const K = (id, cat, rarity, nb, en, extra = {}) => ({ id, cat, rarity, name: { nb, en }, ...extra });
const team = (main, dark, light, acc) => ({ main, dark, light, acc });

export const SKINS = [
  // Hær – fargedrakt på alle enhetene (også i kamp og parade)
  K('army_forest', 'army', 'common', 'Skogkamo', 'Forest Camo', { def: true, team: team('#4fb843', '#33862b', '#a3e394', '#ffd23f') }),
  K('army_desert', 'army', 'common', 'Ørkenkamo', 'Desert Camo', { team: team('#d6b06a', '#a07f43', '#f3dfaa', '#7a4b2a') }),
  K('army_navy', 'army', 'common', 'Marineblå', 'Navy Blue', { team: team('#3a62d9', '#253f99', '#9cb6ff', '#ffd23f') }),
  K('army_snow', 'army', 'common', 'Snøkamo', 'Snow Camo', { team: team('#eef3f9', '#a3b0c4', '#ffffff', '#4b5a78') }),
  K('army_ohio', 'army', 'rare', 'Ohio-rød', 'Ohio Red', { team: team('#e5484d', '#a8323a', '#ffa0a3', '#ffffff') }),
  K('army_neon', 'army', 'rare', 'Neon', 'Neon', { team: team('#20e3c8', '#ff3dc8', '#b8fff4', '#fff35c'), fx: 'neon' }),
  K('army_pirate', 'army', 'rare', 'Pirat', 'Pirate', { team: team('#3d3756', '#201b31', '#736b98', '#ef4f5a') }),
  K('army_viking', 'army', 'epic', 'Viking', 'Viking', { team: team('#2d5fd3', '#c8323c', '#a3bcff', '#ffffff') }),
  K('army_cowboy', 'army', 'epic', 'Cowboy', 'Cowboy', { team: team('#b47538', '#744a22', '#e8b77f', '#ffd23f') }),
  K('army_chrome', 'army', 'epic', 'Krom', 'Chrome', { team: team('#cdd6e3', '#7c899f', '#ffffff', '#56e0ff'), fx: 'shine' }),
  K('army_gold', 'army', 'legendary', 'Gullhæren', 'Golden Army', { team: team('#ffc62e', '#cf930c', '#fff0a6', '#ffffff'), fx: 'gold' }),
  K('army_lava', 'army', 'legendary', 'Lava', 'Lava', { team: team('#3a2a3f', '#ff5a1f', '#ffa052', '#ffd23f'), fx: 'lava' }),
  K('army_rainbow', 'army', 'mythic', 'Regnbue', 'Rainbow', { team: team('#ff4d8d', '#7a5cff', '#4dd8ff', '#ffe14d'), fx: 'rainbow' }),
  K('army_galaxy', 'army', 'mythic', 'Galakse', 'Galaxy', { team: team('#4a2b9f', '#1b0f4f', '#c28dff', '#7ffcff'), fx: 'galaxy' }),
  // Flagg – spillerens flagg overalt, og fargen på erobret land på kartet
  K('flag_ohio', 'flag', 'common', 'Ohio', 'Ohio', { def: true, design: 'ohio', own: '#ffd23f' }),
  K('flag_star', 'flag', 'common', 'Stjerne', 'Star', { design: 'star', own: '#7cc4ff' }),
  K('flag_forest', 'flag', 'common', 'Skog', 'Forest', { design: 'forest', own: '#8be06a' }),
  K('flag_pirate', 'flag', 'rare', 'Piratflagg', 'Jolly Roger', { design: 'pirate', own: '#b8b2cc' }),
  K('flag_checker', 'flag', 'rare', 'Målflagg', 'Checkered', { design: 'checker', own: '#f4f4f4' }),
  K('flag_norway', 'flag', 'epic', 'Norge', 'Norway', { design: 'norway', own: '#ff8a8a' }),
  K('flag_fire', 'flag', 'epic', 'Ildflagg', 'Fire Flag', { design: 'fire', own: '#ff9a4d' }),
  K('flag_gold', 'flag', 'legendary', 'Gullflagg', 'Golden Flag', { design: 'gold', own: '#f5b400', fx: 'gold' }),
  K('flag_rainbow', 'flag', 'mythic', 'Regnbueflagg', 'Rainbow Flag', { design: 'rainbow', own: '#ff77c8', fx: 'rainbow' }),
  // Hovedkvarter – utseendet på bygningen du trykker på
  K('hq_classic', 'hq', 'common', 'Klassisk', 'Classic', { def: true, fx: '' }),
  K('hq_winter', 'hq', 'common', 'Vinter', 'Winter', { fx: 'winter' }),
  K('hq_night', 'hq', 'rare', 'Nattmodus', 'Night Mode', { fx: 'night' }),
  K('hq_pink', 'hq', 'rare', 'Rosa drøm', 'Pink Dream', { fx: 'pink' }),
  K('hq_ginger', 'hq', 'epic', 'Pepperkake', 'Gingerbread', { fx: 'ginger' }),
  K('hq_neon', 'hq', 'epic', 'Neonlys', 'Neon Lights', { fx: 'neon' }),
  K('hq_gold', 'hq', 'legendary', 'Gullpalass', 'Golden Palace', { fx: 'gold' }),
  K('hq_diamond', 'hq', 'mythic', 'Diamant', 'Diamond', { fx: 'diamond' }),
  // General Buckeye – hatter
  K('hat_general', 'hat', 'common', 'Generalhatt', 'General’s Cap', { def: true, hat: 'general' }),
  K('hat_cap', 'hat', 'common', 'Caps', 'Baseball Cap', { hat: 'cap' }),
  K('hat_cowboy', 'hat', 'rare', 'Cowboyhatt', 'Cowboy Hat', { hat: 'cowboy' }),
  K('hat_party', 'hat', 'rare', 'Festhatt', 'Party Hat', { hat: 'party' }),
  K('hat_viking', 'hat', 'epic', 'Vikinghjelm', 'Viking Helmet', { hat: 'viking' }),
  K('hat_pirate', 'hat', 'epic', 'Kapteinshatt', 'Captain’s Hat', { hat: 'pirate' }),
  K('hat_crown', 'hat', 'legendary', 'Krone', 'Crown', { hat: 'crown' }),
  K('hat_astro', 'hat', 'mythic', 'Romhjelm', 'Space Helmet', { hat: 'astro' }),

  // ---- flere hær-skins ----
  K('army_jungle', 'army', 'common', 'Jungelkamo', 'Jungle Camo', { team: team('#3f7d3a', '#2a5428', '#7fbf6a', '#c9a26b') }),
  K('army_urban', 'army', 'common', 'Bykamo', 'Urban Camo', { team: team('#8c95a6', '#5b6375', '#c7ccd6', '#f2c94c') }),
  K('army_olive', 'army', 'common', 'Oliven', 'Olive', { team: team('#7a8a3a', '#55621f', '#b5c26e', '#e5484d') }),
  K('army_sky', 'army', 'common', 'Himmelblå', 'Sky Blue', { team: team('#5fb6ff', '#3a83cc', '#bfe3ff', '#ffffff') }),
  K('army_scarlet', 'army', 'rare', 'Skarlagen og grå', 'Scarlet & Grey', { team: team('#bb0000', '#6e0000', '#d9d9d9', '#ffffff') }),
  K('army_candy', 'army', 'rare', 'Godteri', 'Candy', { team: team('#ff8fc8', '#3fc9a8', '#ffd1ea', '#ffffff') }),
  K('army_lime', 'army', 'rare', 'Lime', 'Lime', { team: team('#9be15d', '#4fae3c', '#dcffb8', '#2b2350') }),
  K('army_ocean', 'army', 'rare', 'Havblå', 'Ocean', { team: team('#1fb5c9', '#127a8a', '#9ff0f7', '#ffd23f') }),
  K('army_pumpkin', 'army', 'epic', 'Gresskar', 'Pumpkin', { team: team('#ff8a1f', '#2b2235', '#ffc27a', '#7be07b') }),
  K('army_christmas', 'army', 'epic', 'Julehæren', 'Holiday Army', { team: team('#e5484d', '#2f8a3a', '#ff9a9e', '#ffd23f') }),
  K('army_toxic', 'army', 'epic', 'Giftgrønn', 'Toxic', { team: team('#7dff3a', '#7a2bd6', '#d8ffb0', '#2b2350'), fx: 'neon' }),
  K('army_ice', 'army', 'epic', 'Is', 'Ice', { team: team('#bfefff', '#5fb6e8', '#ffffff', '#56e0ff'), fx: 'shine' }),
  K('army_shadow', 'army', 'legendary', 'Skygge', 'Shadow', { team: team('#2a2438', '#120f1c', '#5d5180', '#c28dff'), fx: 'galaxy' }),
  K('army_phoenix', 'army', 'legendary', 'Føniks', 'Phoenix', { team: team('#ff5a1f', '#c4321a', '#ffb347', '#ffd23f'), fx: 'lava' }),
  K('army_diamond', 'army', 'mythic', 'Diamanthæren', 'Diamond Army', { team: team('#a8f0ff', '#5fc2e8', '#ffffff', '#ff77c8'), fx: 'sparkle' }),
  K('army_hologram', 'army', 'mythic', 'Hologram', 'Hologram', { team: team('#56e0ff', '#7a5cff', '#c8f7ff', '#ff77c8'), fx: 'holo' }),
  // ---- flere flagg ----
  K('flag_sweden', 'flag', 'common', 'Sverige', 'Sweden', { design: 'sweden', own: '#7fb0ff' }),
  K('flag_denmark', 'flag', 'common', 'Danmark', 'Denmark', { design: 'denmark', own: '#ff9a9a' }),
  K('flag_finland', 'flag', 'common', 'Finland', 'Finland', { design: 'finland', own: '#a9c4ff' }),
  K('flag_iceland', 'flag', 'common', 'Island', 'Iceland', { design: 'iceland', own: '#8fb4ff' }),
  K('flag_cow', 'flag', 'common', 'Kuflekker', 'Cow Spots', { design: 'cow', own: '#f2f2f2' }),
  K('flag_corn', 'flag', 'common', 'Maisflagg', 'Corn Flag', { design: 'corn', own: '#ffe066' }),
  K('flag_buckeye', 'flag', 'rare', 'Buckeye', 'Buckeye', { design: 'buckeye', own: '#c9a27a' }),
  K('flag_heart', 'flag', 'rare', 'Hjerte', 'Heart', { design: 'heart', own: '#ffa3c8' }),
  K('flag_moon', 'flag', 'rare', 'Månenatt', 'Moonlit Night', { design: 'moon', own: '#8f9ce8' }),
  K('flag_tiger', 'flag', 'rare', 'Tiger', 'Tiger', { design: 'tiger', own: '#ffb35c' }),
  K('flag_ohiomap', 'flag', 'epic', 'Ohio-kart', 'Ohio Map', { design: 'ohiomap', own: '#ffd23f' }),
  K('flag_lightning', 'flag', 'epic', 'Lyn', 'Lightning', { design: 'lightning', own: '#b39dff' }),
  K('flag_rocket', 'flag', 'epic', 'Rakett', 'Rocket', { design: 'rocket', own: '#a6dcff' }),
  K('flag_alien', 'flag', 'epic', 'Romvesen', 'Alien', { design: 'alien', own: '#9be98f' }),
  K('flag_galaxy', 'flag', 'legendary', 'Galakseflagg', 'Galaxy Flag', { design: 'galaxy', own: '#a98cff', fx: 'gold' }),
  K('flag_diamond', 'flag', 'mythic', 'Diamantflagg', 'Diamond Flag', { design: 'diamond', own: '#8ff0ff', fx: 'rainbow' }),
  // ---- flere hovedkvarter ----
  K('hq_forest', 'hq', 'common', 'Skogsgrønn', 'Forest Green', { fx: 'forest' }),
  K('hq_sunset', 'hq', 'common', 'Solnedgang', 'Sunset', { fx: 'sunset' }),
  K('hq_lava', 'hq', 'rare', 'Lavaborg', 'Lava Keep', { fx: 'lava' }),
  K('hq_ice', 'hq', 'rare', 'Isslott', 'Ice Castle', { fx: 'ice' }),
  K('hq_noir', 'hq', 'rare', 'Svart-hvitt', 'Noir', { fx: 'noir' }),
  K('hq_candy', 'hq', 'epic', 'Godteslott', 'Candy Castle', { fx: 'candy' }),
  K('hq_retro', 'hq', 'epic', 'Gammeldags', 'Retro', { fx: 'retro' }),
  K('hq_ghost', 'hq', 'epic', 'Spøkelseshus', 'Haunted', { fx: 'ghost' }),
  K('hq_rainbow', 'hq', 'legendary', 'Regnbuepalass', 'Rainbow Palace', { fx: 'rainbow' }),
  K('hq_hologram', 'hq', 'mythic', 'Hologramborg', 'Hologram Keep', { fx: 'hologram' }),
  // ---- flere hatter ----
  K('hat_chef', 'hat', 'common', 'Kokkelue', 'Chef’s Hat', { hat: 'chef' }),
  K('hat_beanie', 'hat', 'common', 'Strikkelue', 'Beanie', { hat: 'beanie' }),
  K('hat_flowers', 'hat', 'common', 'Blomsterkrans', 'Flower Crown', { hat: 'flowers' }),
  K('hat_tophat', 'hat', 'rare', 'Flosshatt', 'Top Hat', { hat: 'tophat' }),
  K('hat_santa', 'hat', 'rare', 'Nisselue', 'Santa Hat', { hat: 'santa' }),
  K('hat_propeller', 'hat', 'rare', 'Propellcaps', 'Propeller Cap', { hat: 'propeller' }),
  K('hat_ninja', 'hat', 'rare', 'Ninjabånd', 'Ninja Headband', { hat: 'ninja' }),
  K('hat_russ', 'hat', 'epic', 'Russelue', 'Graduation Cap', { hat: 'russ' }),
  K('hat_wizard', 'hat', 'epic', 'Trollmannshatt', 'Wizard Hat', { hat: 'wizard' }),
  K('hat_bunny', 'hat', 'epic', 'Kaninører', 'Bunny Ears', { hat: 'bunny' }),
  K('hat_fire', 'hat', 'epic', 'Brannhjelm', 'Firefighter Helmet', { hat: 'fire' }),
  K('hat_halo', 'hat', 'legendary', 'Glorie', 'Halo', { hat: 'halo' }),
  // ---- eksklusive prestisje-skins (låses opp med prestisjestjerner, finnes ikke i kasser) ----
  K('flag_stars', 'flag', 'prestige', 'Prestisjeflagg', 'Prestige Flag', { design: 'stars', own: '#ffd23f', prestige: 1 }),
  K('hat_prestige', 'hat', 'prestige', 'Prestisjekrone', 'Prestige Crown', { hat: 'prestige', prestige: 2 }),
  K('hq_star', 'hq', 'prestige', 'Stjernepalasset', 'Star Palace', { fx: 'star', prestige: 3 }),
  K('army_stars', 'army', 'prestige', 'Stjernehæren', 'Star Army', { team: team('#24308a', '#141c55', '#6a7cf0', '#ffd23f'), fx: 'stars', prestige: 5 }),
];
export const SKIN_BY_ID = Object.fromEntries(SKINS.map((k) => [k.id, k]));
export const PRESTIGE_SKINS = Object.fromEntries(SKINS.filter((k) => k.prestige).map((k) => [k.prestige, k.id]));
export const DEFAULT_SKINS = Object.fromEntries(CATEGORIES.map((c) => [c.id, SKINS.find((k) => k.cat === c.id && k.def).id]));

// ---------- lootkasser ----------
// Sjansene vises for spilleren i butikken (krav i App Store og Google Play).
export const CRATES = [
  { id: 'wood', price: 100, items: 1, name: { nb: 'Trekasse', en: 'Wooden Crate' }, odds: { common: 62, rare: 26, epic: 9, legendary: 2.5, mythic: 0.5 } },
  { id: 'gold', price: 280, items: 3, guarantee: 'rare', name: { nb: 'Gullkasse', en: 'Gold Crate' }, odds: { common: 40, rare: 38, epic: 16, legendary: 5, mythic: 1 } },
  { id: 'cosmic', price: 700, items: 5, guarantee: 'epic', name: { nb: 'Kosmisk kasse', en: 'Cosmic Crate' }, odds: { common: 15, rare: 40, epic: 30, legendary: 12, mythic: 3 } },
];
export const CRATE_BY_ID = Object.fromEntries(CRATES.map((c) => [c.id, c]));
export const PITY = 20; // Legendarisk eller bedre garantert innen så mange skins

export function newCosmetics() {
  const owned = {};
  for (const id of Object.values(DEFAULT_SKINS)) owned[id] = 1;
  return { owned, equipped: { ...DEFAULT_SKINS } };
}
export function restoreCosmetics(c) {
  const base = newCosmetics();
  if (!c || typeof c !== 'object') return base;
  const owned = { ...base.owned, ...(c.owned || {}) };
  const equipped = { ...base.equipped };
  for (const cat of Object.keys(equipped)) {
    const id = c.equipped && c.equipped[cat];
    if (id && owned[id] && SKIN_BY_ID[id] && SKIN_BY_ID[id].cat === cat) equipped[cat] = id;
  }
  for (const id of Object.keys(owned)) if (!SKIN_BY_ID[id]) delete owned[id];
  return { owned, equipped };
}

export const equippedSkin = (s, cat) => SKIN_BY_ID[s.skins.equipped[cat]] || SKIN_BY_ID[DEFAULT_SKINS[cat]];
export function equip(s, id) {
  const k = SKIN_BY_ID[id];
  if (!k || !s.skins.owned[id]) return false;
  s.skins.equipped[k.cat] = id;
  return true;
}
export const ownedCount = (s) => SKINS.filter((k) => s.skins.owned[k.id]).length;

function rollRarity(odds, rnd) {
  let x = rnd() * 100;
  for (const r of RARITIES) { x -= odds[r.id] || 0; if (x < 0) return r.id; }
  return 'common';
}

// Kasser spilleren eier, men ikke har åpnet ennå
export const EMPTY_INV = { wood: 0, gold: 0, cosmic: 0 };
export const crateCount = (s, id) => (s.crates && s.crates.inv && s.crates.inv[id]) || 0;
export const cratesOwned = (s) => CRATES.reduce((a, c) => a + crateCount(s, c.id), 0);
export function addCrate(s, id, n = 1) {
  s.crates = s.crates || { opened: 0, pity: 0 };
  s.crates.inv = { ...EMPTY_INV, ...(s.crates.inv || {}) };
  s.crates.inv[id] = (s.crates.inv[id] || 0) + n;
}
// Kjøper en kasse for edelstener og legger den i «Mine ting»
export function buyCrate(s, crateId) {
  const c = CRATE_BY_ID[crateId];
  if (!c || (s.gems || 0) < c.price) return false;
  s.gems -= c.price;
  addCrate(s, crateId);
  return true;
}

// Åpner en kasse fra «Mine ting» (eller gratis) og returnerer det spilleren fikk.
export function openCrate(s, crateId, { free = false, rnd = Math.random } = {}) {
  const c = CRATE_BY_ID[crateId];
  if (!c) return null;
  if (!free) {
    if (crateCount(s, crateId) <= 0) return null;
    s.crates.inv[crateId]--;
  }
  s.crates = s.crates || { opened: 0, pity: 0 };
  const rolls = [];
  for (let i = 0; i < c.items; i++) {
    let rar = rollRarity(c.odds, rnd);
    s.crates.pity = (s.crates.pity || 0) + 1;
    if (s.crates.pity >= PITY && RARITY[rar].rank < RARITY.legendary.rank) rar = rnd() < 0.85 ? 'legendary' : 'mythic';
    if (RARITY[rar].rank >= RARITY.legendary.rank) s.crates.pity = 0;
    rolls.push(rar);
  }
  if (c.guarantee && !rolls.some((r) => RARITY[r].rank >= RARITY[c.guarantee].rank)) rolls[rolls.length - 1] = c.guarantee;
  const items = rolls.map((rar) => {
    const pool = SKINS.filter((k) => k.rarity === rar && !k.def && !k.prestige);
    const fresh = pool.filter((k) => !s.skins.owned[k.id]);
    const from = fresh.length && rnd() < 0.75 ? fresh : pool; // nye skins prioriteres
    const skin = from[Math.floor(rnd() * from.length)];
    const dup = !!s.skins.owned[skin.id];
    const refund = dup ? RARITY[rar].refund : 0;
    if (dup) s.gems = (s.gems || 0) + refund;
    else s.skins.owned[skin.id] = Date.now();
    return { skin, rarity: rar, dup, refund };
  });
  s.crates.opened = (s.crates.opened || 0) + 1;
  return items;
}
