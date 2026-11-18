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
  { id: 'tap', name: { nb: 'Trykkeffekt', en: 'Tap effect' } },
  { id: 'hat', name: { nb: 'Buckeye', en: 'Buckeye' }, gen: 'buckeye' },
  { id: 'drip', name: { nb: 'Drip', en: 'Drip' }, gen: 'drip' },
  { id: 'zorgon', name: { nb: 'Zorgon', en: 'Zorgon' }, gen: 'zorgon' },
];

// Generalene man kan velge mellom. Hver general har sine egne skins (kategorien cat).
export const GENERALS = [
  { id: 'drip', cat: 'drip', name: { nb: 'General Drip', en: 'General Drip' }, desc: { nb: 'Dunjakke, USA-genser og gullklokke. Samler på antrekk.', en: 'Puffer jacket, USA shirt and a gold watch. Collects outfits.' },
    perk: { income: 1.15, spoils: 1.5, ability: 'bribe' },
    style: { nb: 'Økonomi: +15 % inntekt og +50 % krigsbytte', en: 'Economy: +15% income and +50% spoils' } },
  { id: 'buckeye', cat: 'hat', name: { nb: 'General Buckeye', en: 'General Buckeye' }, desc: { nb: 'Ohio-nøtta med generalhatt. Samler på hatter.', en: 'The Ohio nut in a general’s cap. Collects hats.' },
    perk: { tap: 1.5, cls: { inf: 0.25 }, ability: 'nuts' },
    style: { nb: 'Folkehæren: +25 % infanteri og +50 % per trykk', en: 'People’s army: +25% infantry and +50% per tap' } },
  { id: 'zorgon', cat: 'zorgon', name: { nb: 'Keiser Zorgon', en: 'Emperor Zorgon' }, desc: { nb: 'Romkeiseren som byttet side. Samler på kapper og kroner.', en: 'The space emperor who switched sides. Collects capes and crowns.' },
    perk: { cls: { air: 0.25 }, artyCd: 0.75, warn: 1.4, ability: 'laser' },
    style: { nb: 'Teknologi: +25 % fly, raskere artilleri og tidligere varsel om angrep', en: 'Technology: +25% air, faster artillery and earlier attack warnings' } },
];
// Generalens kampevne (én gang per kamp)
export const ABILITIES = {
  bribe: { name: { nb: 'Bestikkelse', en: 'Bribe' }, desc: { nb: 'Betal 5 % av pengene dine: fienden mister styrke og hopper over neste angrep.', en: 'Pay 5% of your money: the enemy loses strength and skips its next attack.' } },
  nuts: { name: { nb: 'Nøtteregn', en: 'Nut Storm' }, desc: { nb: 'Treffer alle fiendene på skjermen på en gang.', en: 'Hits every enemy on screen at once.' } },
  laser: { name: { nb: 'Laserstråle', en: 'Laser Beam' }, desc: { nb: 'Stor skade, og fienden lammes i to sekunder.', en: 'Heavy damage, and the enemy is stunned for two seconds.' } },
};
export const GENERAL_SWITCH_MS = 10 * 60 * 1000; // generalen kan byttes hvert tiende minutt
export const GENERAL_BY_ID = Object.fromEntries(GENERALS.map((g) => [g.id, g]));
export const DEFAULT_GENERAL = 'drip';

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
  K('hq_ocean', 'hq', 'common', 'Undervannsbase', 'Ocean Base', { fx: 'ocean' }),
  K('hq_toxic', 'hq', 'rare', 'Giftfabrikk', 'Toxic Plant', { fx: 'toxic' }),
  K('hq_choco', 'hq', 'rare', 'Sjokoladeslott', 'Chocolate Castle', { fx: 'choco' }),
  K('hq_cyber', 'hq', 'epic', 'Cyberby', 'Cyber City', { fx: 'cyber' }),
  // flere hærfarger – også med generalene som tema
  K('army_reef', 'army', 'common', 'Korallrev', 'Coral Reef', { team: team('#1fb5b0', '#137a77', '#9df0ec', '#ffd23f') }),
  K('army_cherry', 'army', 'common', 'Kirsebær', 'Cherry', { team: team('#e8436f', '#a82a4c', '#ffa6bd', '#ffffff') }),
  K('army_moss', 'army', 'common', 'Mosegrønn', 'Moss Green', { team: team('#2f7d3a', '#1d5226', '#86c98f', '#b5823d') }),
  K('army_arctic', 'army', 'rare', 'Arktis', 'Arctic', { team: team('#dff3ff', '#7fb7e0', '#ffffff', '#3559d6') }),
  K('army_sunset', 'army', 'rare', 'Skumring', 'Dusk', { team: team('#ff8a3d', '#c4527a', '#ffc28a', '#7a5cff') }),
  K('army_bubblegum', 'army', 'rare', 'Tyggegummi', 'Bubblegum', { team: team('#ff9fd0', '#55d6b6', '#ffe0f0', '#fff35c') }),
  K('army_midnight', 'army', 'rare', 'Midnatt', 'Midnight', { team: team('#24308a', '#141c55', '#7f8fe8', '#cdd6e3') }),
  K('army_buckeye', 'army', 'epic', 'Nøttehæren', 'Nut Army', { team: team('#7b4a2a', '#4e2c15', '#e2bd8f', '#4fae3c') }),
  K('army_drip', 'army', 'epic', 'Drip-hæren', 'Drip Army', { team: team('#1f1d2b', '#000000', '#6a6688', '#ffd23f'), fx: 'shine' }),
  K('army_zorgon', 'army', 'epic', 'Zorgons garde', 'Zorgon’s Guard', { team: team('#b38cff', '#7a2fb0', '#e0d0ff', '#ffd23f') }),
  K('army_radioactive', 'army', 'legendary', 'Radioaktiv', 'Radioactive', { team: team('#9dff3d', '#1d2b12', '#d8ffb0', '#ff3dc8'), fx: 'neon' }),
  K('army_frost', 'army', 'legendary', 'Frostkrigere', 'Frost Warriors', { team: team('#9fe7ff', '#3d8bff', '#ffffff', '#bfefff'), fx: 'shine' }),
  // flere flagg
  K('flag_stripes', 'flag', 'common', 'Striper', 'Stripes', { design: 'stripes', own: '#ff8a8a' }),
  K('flag_wave', 'flag', 'common', 'Bølge', 'Wave', { design: 'wave', own: '#8fd3ff' }),
  K('flag_sun', 'flag', 'common', 'Sol', 'Sun', { design: 'sun', own: '#ffc861' }),
  K('flag_pizza', 'flag', 'rare', 'Pizza', 'Pizza', { design: 'pizza', own: '#ffd98a' }),
  K('flag_drip', 'flag', 'epic', 'Drip-flagg', 'Drip Flag', { design: 'drip', own: '#c9c4dc' }),
  K('flag_zorgon', 'flag', 'epic', 'Zorgon-flagg', 'Zorgon Flag', { design: 'zorgon', own: '#c9a6ff' }),
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
  K('hat_sombrero', 'hat', 'common', 'Sombrero', 'Sombrero', { hat: 'sombrero' }),
  K('hat_detective', 'hat', 'rare', 'Detektivlue', 'Detective Cap', { hat: 'detective' }),
  K('hat_knight', 'hat', 'epic', 'Ridderhjelm', 'Knight Helmet', { hat: 'knight' }),
  K('hat_dino', 'hat', 'legendary', 'Dinohette', 'Dino Hood', { hat: 'dino' }),
  // General Drip – antrekk
  K('drip_usa', 'drip', 'common', 'USA-drip', 'USA Drip', { def: true, look: {} }),
  K('drip_red', 'drip', 'common', 'Rød dunjakke', 'Red Puffer', { look: { jacket: '#e5484d', jacketLine: '#a8323a', jacketHi: '#ffb3b5', shirt: '#f4f4f4', text: '', pants: '#2b2d42', pantsLine: '#14151f', hatC: '#e5484d', hatCuff: '#c43c41', hatAcc: '#fff' } }),
  K('drip_winter', 'drip', 'common', 'Snø-drip', 'Snow Drip', { look: { jacket: '#f4f7fb', jacketLine: '#c8d2e0', jacketHi: '#ffffff', shirt: '#3d8bff', hatC: '#f4f7fb', hatCuff: '#dfe6f0', hatAcc: '#3d8bff', crest: '#3d8bff' } }),
  K('drip_camo', 'drip', 'common', 'Kamo-drip', 'Camo Drip', { look: { jacketPattern: 'camo', jacket: '#5d6b3a', camoA: '#3f4a26', camoB: '#8a9a5a', shirt: '#2b2d42', text: '', pants: '#4a5230', pantsLine: '#2f3420', hat: 'cap', hatC: '#5d6b3a', hatCuff: '#3f4a26', hatAcc: '#ffd23f' } }),
  K('drip_italy', 'drip', 'rare', 'Italia-drip', 'Italy Drip', { look: { jacket: '', shirt: '#2f9e44', band: '#ffffff', text: 'ITALY', textC: '#1d1b29', pantsPattern: 'camo', pants: '#a99a6a', camoA: '#7d7a4a', camoB: '#d8cba0', shades: '#ffffff', hat: 'none', chain: '' } }),
  K('drip_ohio', 'drip', 'rare', 'Ohio-drip', 'Ohio Drip', { look: { jacket: '#bb0000', jacketLine: '#7a0000', jacketHi: '#ff9a9a', shirt: '#9aa3ad', text: 'OHIO', textC: '#bb0000', pants: '#3a3d4a', pantsLine: '#24262f', hatC: '#9aa3ad', hatCuff: '#7d8590', hatAcc: '#bb0000', crest: '#bb0000' } }),
  K('drip_norge', 'drip', 'rare', 'Norge-drip', 'Norway Drip', { look: { jacket: '#ba0c2f', jacketLine: '#7d0820', jacketHi: '#ff9aab', shirt: '#00205b', text: 'NORGE', textC: '#ffffff', hatC: '#ba0c2f', hatCuff: '#00205b', hatAcc: '#ffffff', crest: '#ffffff' } }),
  K('drip_track', 'drip', 'rare', 'Treningsdress', 'Tracksuit', { look: { jacket: '#7a5cff', jacketLine: '#5b3fb0', jacketHi: '#c9b8ff', shirt: '#ffffff', text: '', pantsPattern: 'stripe', pants: '#7a5cff', pantsLine: '#ffffff', hat: 'cap', hatC: '#7a5cff', hatCuff: '#5b3fb0', hatAcc: '#ffffff', shoeAcc: '#7a5cff' } }),
  K('drip_pink', 'drip', 'rare', 'Rosa drip', 'Pink Drip', { look: { jacket: '#ff8fc8', jacketLine: '#e0609e', jacketHi: '#ffe0f0', shirt: '#ffffff', text: 'LOVE', textC: '#ff5d8f', hatC: '#ff8fc8', hatCuff: '#e0609e', hatAcc: '#ffffff', crest: '#ffffff' } }),
  K('drip_santa', 'drip', 'rare', 'Jule-drip', 'Holiday Drip', { look: { jacket: '#e5484d', jacketLine: '#a8323a', jacketHi: '#ffd0d0', hat: 'santa', shirt: '#2f9e44', text: 'HO HO', textC: '#ffffff', pants: '#2b2d42', pantsLine: '#14151f' } }),
  K('drip_space', 'drip', 'epic', 'Rom-drip', 'Space Drip', { look: { jacket: '#cdd6e3', jacketLine: '#8a96ab', jacketHi: '#ffffff', shirt: '#2b2d42', text: 'SPACE', textC: '#7ffcff', shades: '#7ffcff', lens: '#1d1b29', hat: 'none', pants: '#5b6476', pantsLine: '#3a4150' } }),
  K('drip_king', 'drip', 'epic', 'Kongen', 'The King', { look: { jacket: '#5b2a8a', jacketLine: '#3a1a5a', jacketHi: '#c9a6ff', hat: 'crown', shirt: '#ffd23f', text: 'KING', textC: '#5b2a8a', pants: '#1d1b29', pantsLine: '#000000' } }),
  K('drip_neon', 'drip', 'epic', 'Neon-drip', 'Neon Drip', { fx: 'neon', look: { jacket: '#39ff88', jacketLine: '#1fbf60', jacketHi: '#d8ffe8', shirt: '#1d1b29', text: 'DRIP', textC: '#39ff88', shades: '#39ff88', lens: '#1d1b29', hatC: '#1d1b29', hatCuff: '#2b2838', hatAcc: '#39ff88', crest: '#39ff88' } }),
  K('drip_gold', 'drip', 'legendary', 'Gull-drip', 'Gold Drip', { fx: 'gold', look: { jacket: '#ffc62e', jacketLine: '#cf930c', jacketHi: '#fff6c2', shirt: '#1d1b29', text: 'GOLD', textC: '#ffd23f', shades: '#ffd23f', lens: '#2b2350', hatC: '#ffc62e', hatCuff: '#e6a816', crest: '#ffffff' } }),
  K('drip_fire', 'drip', 'legendary', 'Ild-drip', 'Fire Drip', { look: { jacketPattern: 'flames', jacket: '#e5484d', shirt: '#1d1b29', text: 'HOT', textC: '#ff8a3d', hatC: '#e5484d', hatCuff: '#1d1b29', hatAcc: '#ffd23f' } }),
  K('drip_ice', 'drip', 'mythic', 'Is-drip', 'Ice Drip', { fx: 'sparkle', look: { jacket: '#9fe7ff', jacketLine: '#5ab8e0', jacketHi: '#ffffff', shirt: '#e6fbff', text: 'ICE', textC: '#3d8bff', chain: '#bfefff', watch: '#bfefff', shades: '#bfefff', lens: '#3d8bff', hatC: '#9fe7ff', hatCuff: '#5ab8e0', hatAcc: '#ffffff', crest: '#ffffff' } }),
  // Keiser Zorgon – kapper og kroner
  K('zorg_royal', 'zorgon', 'common', 'Keiserkappe', 'Imperial Cape', { def: true, look: {} }),
  K('zorg_green', 'zorgon', 'common', 'Grønn klassiker', 'Green Classic', { look: { skin: '#7be07b', skinDark: '#4fb04f', cape: '#2f6b3a', capeIn: '#ffd23f', robe: '#244f2c', monocle: false } }),
  K('zorg_party', 'zorgon', 'common', 'Festkeiser', 'Party Emperor', { look: { crown: 'party', cape: '#56e0ff', capeIn: '#ff5d8f', robe: '#ffb000', monocle: false } }),
  K('zorg_pirate', 'zorgon', 'rare', 'Rompirat', 'Space Pirate', { look: { crown: 'pirate', cape: '#2b2d42', capeIn: '#ef4f5a', robe: '#3d3756', monocle: false } }),
  K('zorg_ohio', 'zorgon', 'rare', 'Ohio-keiser', 'Ohio Emperor', { look: { cape: '#bb0000', capeIn: '#9aa3ad', robe: '#7a0000', trim: '#e3e9f2', orb: '#ff4d4d' } }),
  K('zorg_santa', 'zorgon', 'rare', 'Julekeiser', 'Holiday Emperor', { look: { crown: 'santa', cape: '#e5484d', capeIn: '#ffffff', robe: '#2f9e44', trim: '#ffffff' } }),
  K('zorg_ice', 'zorgon', 'epic', 'Iskeiser', 'Ice Emperor', { look: { skin: '#bfefff', skinDark: '#8fd3f0', cape: '#f4fbff', capeIn: '#7fd3ff', robe: '#5ab8e0', trim: '#ffffff', orb: '#7ffcff', crown: 'ice' } }),
  K('zorg_fire', 'zorgon', 'epic', 'Ildkeiser', 'Fire Emperor', { look: { skin: '#ff8a65', skinDark: '#e0603d', cape: '#c43c41', capeIn: '#ffd23f', robe: '#7a1f24', orb: '#ffb000', crown: 'horns', pattern: 'flames' } }),
  K('zorg_robot', 'zorgon', 'epic', 'Robotkeiser', 'Robot Emperor', { look: { skin: '#cdd6e3', skinDark: '#8a96ab', crown: 'helmet', cape: '#3a4150', capeIn: '#7ffcff', robe: '#5b6476', trim: '#7ffcff', orb: '#7ffcff', eye: '#ef4f5a' } }),
  K('zorg_shadow', 'zorgon', 'epic', 'Skyggekeiser', 'Shadow Emperor', { look: { skin: '#4a3d6b', skinDark: '#2b2350', cape: '#14101f', capeIn: '#7a2fb0', robe: '#1f1830', eye: '#ff3d77', orb: '#ff3d77' } }),
  K('zorg_gold', 'zorgon', 'legendary', 'Gullkeiser', 'Golden Emperor', { fx: 'gold', look: { cape: '#ffc62e', capeIn: '#fff0a6', robe: '#e6a816', trim: '#fff6c2', orb: '#ffffff' } }),
  K('zorg_angel', 'zorgon', 'legendary', 'Englekeiser', 'Angel Emperor', { look: { crown: 'halo', skin: '#fff1b8', skinDark: '#e8d08a', cape: '#ffffff', capeIn: '#ffe680', robe: '#f4f0ff', trim: '#ffd23f', orb: '#ffe680', monocle: false } }),
  K('zorg_galaxy', 'zorgon', 'mythic', 'Galaksekeiser', 'Galaxy Emperor', { fx: 'galaxy', look: { cape: '#1b0f4f', capeIn: '#7ffcff', robe: '#2b1b6f', pattern: 'stars', eye: '#7ffcff', orb: '#7ffcff' } }),
  K('zorg_rainbow', 'zorgon', 'mythic', 'Regnbuekeiser', 'Rainbow Emperor', { look: { pattern: 'rainbow', cape: '#ff4d8d', capeIn: '#7a5cff' } }),
  // ---- trykkeffekter: hva som spruter ut når du trykker på hovedkvarteret ----
  K('tap_coins', 'tap', 'common', 'Mynter', 'Coins', { def: true, burst: 'coin', ft: '' }),
  K('tap_hearts', 'tap', 'common', 'Hjerteregn', 'Heart Shower', { burst: 'heart', ft: 'ft-pink' }),
  K('tap_stars', 'tap', 'common', 'Stjerneskudd', 'Shooting Stars', { burst: 'star', ft: 'ft-yellow' }),
  K('tap_corn', 'tap', 'common', 'Maiskolber', 'Corn Cobs', { burst: 'corn', ft: 'ft-yellow' }),
  K('tap_notes', 'tap', 'common', 'Musikk', 'Music', { burst: 'note', ft: 'ft-green' }),
  K('tap_nuts', 'tap', 'rare', 'Nøtteregn', 'Nut Shower', { burst: 'nut', ft: 'ft-brown' }),
  K('tap_pizza', 'tap', 'rare', 'Pizzafest', 'Pizza Party', { burst: 'pizza', ft: 'ft-orange' }),
  K('tap_bubbles', 'tap', 'rare', 'Såpebobler', 'Soap Bubbles', { burst: 'bubble', ft: 'ft-blue' }),
  K('tap_bolts', 'tap', 'epic', 'Lynnedslag', 'Thunderstrike', { burst: 'bolt', ft: 'ft-electric' }),
  K('tap_flames', 'tap', 'epic', 'Flammer', 'Flames', { burst: 'flame', ft: 'ft-fire' }),
  K('tap_ghosts', 'tap', 'epic', 'Spøkelser', 'Ghosts', { burst: 'ghost', ft: 'ft-ghost' }),
  K('tap_gems', 'tap', 'legendary', 'Diamantregn', 'Diamond Rain', { burst: 'gem', ft: 'ft-cyan' }),
  K('tap_planets', 'tap', 'legendary', 'Planeter', 'Planets', { burst: 'planet', ft: 'ft-purple' }),
  K('tap_rainbow', 'tap', 'mythic', 'Regnbuetrykk', 'Rainbow Tap', { burst: 'rainbow', ft: 'ft-rainbow' }),
  // ---- flere antrekk til General Drip ----
  K('drip_mint', 'drip', 'common', 'Mint-drip', 'Mint Drip', { look: { jacket: '#7fe0c0', jacketLine: '#3fae8a', jacketHi: '#d8fff2', shirt: '#ffffff', text: 'FRESH', textC: '#3fae8a', hatC: '#7fe0c0', hatCuff: '#3fae8a', hatAcc: '#ffffff', crest: '#ffffff' } }),
  K('drip_banana', 'drip', 'common', 'Banan-drip', 'Banana Drip', { look: { jacket: '#ffe14d', jacketLine: '#d9b400', jacketHi: '#fff7b8', shirt: '#5a4512', text: 'NANA', textC: '#ffe14d', pants: '#5a4512', pantsLine: '#3a2c0a', hatC: '#ffe14d', hatCuff: '#d9b400', hatAcc: '#5a4512', crest: '#5a4512' } }),
  K('drip_cow', 'drip', 'rare', 'Ku-drip', 'Cow Drip', { look: { jacketPattern: 'camo', jacket: '#ffffff', camoA: '#2b2350', camoB: '#ffffff', shirt: '#ff9fb0', text: 'MOO', textC: '#2b2350', pants: '#2b2d42', pantsLine: '#14151f', hatC: '#ffffff', hatCuff: '#2b2350', hatAcc: '#ff9fb0', crest: '#2b2350' } }),
  K('drip_halloween', 'drip', 'rare', 'Grøsse-drip', 'Spooky Drip', { look: { jacket: '#ff8a1f', jacketLine: '#c45f00', jacketHi: '#ffc27a', shirt: '#1d1b29', text: 'BOO', textC: '#ff8a1f', pants: '#1d1b29', pantsLine: '#000000', hatC: '#7a2fb0', hatCuff: '#4a1a70', hatAcc: '#ff8a1f', crest: '#ff8a1f' } }),
  K('drip_cloud', 'drip', 'epic', 'Sky-drip', 'Cloud Drip', { look: { jacket: '#e8f4ff', jacketLine: '#a8c8e8', jacketHi: '#ffffff', shirt: '#7fc4ff', text: 'CHILL', textC: '#ffffff', pants: '#a8c8e8', pantsLine: '#7fa8d0', hatC: '#7fc4ff', hatCuff: '#5aa8e8', hatAcc: '#ffffff', crest: '#ffffff' } }),
  K('drip_matrix', 'drip', 'epic', 'Kode-drip', 'Code Drip', { fx: 'neon', look: { jacket: '#0d1a12', jacketLine: '#000000', jacketHi: '#2f6b3a', shirt: '#000000', text: '0101', textC: '#39ff88', shades: '#39ff88', lens: '#0d1a12', hat: 'none', pants: '#0d1a12', pantsLine: '#000000', chain: '#39ff88', watch: '#39ff88' } }),
  K('drip_lava', 'drip', 'legendary', 'Lava-drip', 'Lava Drip', { look: { jacketPattern: 'camo', jacket: '#ff5a1f', camoA: '#ffd23f', camoB: '#c4321a', shirt: '#3a2a3f', text: 'LAVA', textC: '#ffd23f', pants: '#3a2a3f', pantsLine: '#1d1424', hatC: '#3a2a3f', hatCuff: '#1d1424', hatAcc: '#ff5a1f', crest: '#ffd23f' } }),
  K('drip_galaxy', 'drip', 'mythic', 'Galakse-drip', 'Galaxy Drip', { fx: 'galaxy', look: { jacketPattern: 'camo', jacket: '#2a1a5e', camoA: '#7a5cff', camoB: '#56e0ff', shirt: '#1b0f4f', text: '★', textC: '#ffd23f', shades: '#c28dff', lens: '#1b0f4f', pants: '#1b0f4f', pantsLine: '#0d0730', hatC: '#2a1a5e', hatCuff: '#1b0f4f', hatAcc: '#ffd23f', crest: '#ffd23f' } }),
  // ---- flere kapper og kroner til Keiser Zorgon ----
  K('zorg_jungle', 'zorgon', 'common', 'Jungelkeiser', 'Jungle Emperor', { look: { skin: '#9be15d', skinDark: '#5fae3c', cape: '#3f7d3a', capeIn: '#c9a26b', robe: '#2a5428', orb: '#7be07b', crown: 'horns' } }),
  K('zorg_ocean', 'zorgon', 'common', 'Havkeiser', 'Ocean Emperor', { look: { skin: '#7fe0d0', skinDark: '#3fb0a0', cape: '#1f6fd6', capeIn: '#7fe0d0', robe: '#174f9a', orb: '#7ffcff' } }),
  K('zorg_pumpkin', 'zorgon', 'rare', 'Gresskarkeiser', 'Pumpkin Emperor', { look: { crown: 'horns', cape: '#ff8a1f', capeIn: '#2b2235', robe: '#2b2235', trim: '#ff8a1f', orb: '#ffd23f', eye: '#ff8a1f' } }),
  K('zorg_candy', 'zorgon', 'rare', 'Godtekeiser', 'Candy Emperor', { look: { crown: 'party', skin: '#ffb3d9', skinDark: '#e07fb0', cape: '#7fe0c0', capeIn: '#ff8fc8', robe: '#ff8fc8', trim: '#ffffff', orb: '#fff35c', monocle: false } }),
  K('zorg_neon', 'zorgon', 'epic', 'Neonkeiser', 'Neon Emperor', { fx: 'neon', look: { cape: '#1d1b29', capeIn: '#39ff88', robe: '#2b2838', trim: '#ff3dc8', orb: '#39ff88', eye: '#ff3dc8' } }),
  K('zorg_moon', 'zorgon', 'epic', 'Månekeiser', 'Moon Emperor', { look: { skin: '#d6dde8', skinDark: '#a9b4c6', cape: '#24308a', capeIn: '#e3e9f2', robe: '#141c55', pattern: 'stars', orb: '#ffe680' } }),
  K('zorg_lava', 'zorgon', 'legendary', 'Lavakeiser', 'Lava Emperor', { look: { skin: '#3a2a3f', skinDark: '#1d1424', cape: '#ff5a1f', capeIn: '#ffd23f', robe: '#3a2a3f', pattern: 'flames', crown: 'horns', eye: '#ffd23f', orb: '#ff5a1f' } }),
  K('zorg_disco', 'zorgon', 'mythic', 'Diskokeiser', 'Disco Emperor', { fx: 'sparkle', look: { pattern: 'rainbow', crown: 'party', cape: '#c0c8d8', capeIn: '#ff77c8', orb: '#ffffff' } }),
  // ---- flere hatter til General Buckeye ----
  K('hat_cake', 'hat', 'common', 'Bursdagskake', 'Birthday Cake', { hat: 'cake' }),
  K('hat_cone', 'hat', 'common', 'Trafikkjegle', 'Traffic Cone', { hat: 'cone' }),
  K('hat_pot', 'hat', 'common', 'Kasserolle', 'Saucepan', { hat: 'pot' }),
  K('hat_pumpkin', 'hat', 'rare', 'Gresskarhjelm', 'Pumpkin Helmet', { hat: 'pumpkin' }),
  K('hat_mushroom', 'hat', 'rare', 'Fluesopp', 'Toadstool', { hat: 'mushroom' }),
  K('hat_antlers', 'hat', 'epic', 'Reinsdyrgevir', 'Reindeer Antlers', { hat: 'antlers' }),
  K('hat_cheese', 'hat', 'epic', 'Ostehatt', 'Cheesehead', { hat: 'cheese' }),
  K('hat_ufo', 'hat', 'legendary', 'Mini-UFO', 'Mini UFO', { hat: 'ufo' }),
  // ---- flere hærfarger, hovedkvarter og flagg ----
  K('army_lemon', 'army', 'common', 'Sitron', 'Lemon', { team: team('#ffe14d', '#d9b400', '#fff7b8', '#4fae3c') }),
  K('army_mint', 'army', 'common', 'Mint', 'Mint', { team: team('#7fe0c0', '#3fae8a', '#d8fff2', '#ff8fc8') }),
  K('army_grape', 'army', 'rare', 'Drue', 'Grape', { team: team('#8a4fd6', '#5b2a9a', '#c9a6ff', '#7be07b') }),
  K('army_copper', 'army', 'rare', 'Kobber', 'Copper', { team: team('#c87533', '#8a4a1a', '#f0b27a', '#56e0ff'), fx: 'shine' }),
  K('army_cow', 'army', 'epic', 'Kuhæren', 'Cow Army', { team: team('#ffffff', '#2b2350', '#f4f4f4', '#ff9fb0') }),
  K('army_vapor', 'army', 'legendary', 'Vaporwave', 'Vaporwave', { team: team('#ff77c8', '#7a5cff', '#7ffcff', '#fff35c'), fx: 'neon' }),
  K('hq_mint', 'hq', 'common', 'Mintgrønn', 'Mint Green', { fx: 'mint' }),
  K('hq_vapor', 'hq', 'rare', 'Vaporpalass', 'Vapor Palace', { fx: 'vapor' }),
  K('hq_matrix', 'hq', 'epic', 'Kodeborg', 'Code Keep', { fx: 'matrix' }),
  K('hq_cotton', 'hq', 'epic', 'Sukkerspinn', 'Cotton Candy', { fx: 'cotton' }),
  K('flag_cheese', 'flag', 'common', 'Osteflagg', 'Cheese Flag', { design: 'cheese', own: '#ffe066' }),
  K('flag_goose', 'flag', 'common', 'Gåseflagg', 'Goose Flag', { design: 'goose', own: '#a3e394' }),
  K('flag_spiral', 'flag', 'rare', 'Hypnose', 'Hypnosis', { design: 'spiral', own: '#e0e0e0' }),
  K('flag_eye', 'flag', 'epic', 'Øyet', 'The Eye', { design: 'eye', own: '#c9a6ff' }),
  // ---- eksklusive prestisje-skins (låses opp med prestisjestjerner, finnes ikke i kasser) ----
  K('flag_stars', 'flag', 'prestige', 'Prestisjeflagg', 'Prestige Flag', { design: 'stars', own: '#ffd23f', prestige: 1 }),
  K('hat_prestige', 'hat', 'prestige', 'Prestisjekrone', 'Prestige Crown', { hat: 'prestige', prestige: 2 }),
  K('drip_prestige', 'drip', 'prestige', 'Prestisje-drip', 'Prestige Drip', { prestige: 2, fx: 'stars', look: { jacket: '#7a5cff', jacketLine: '#5b3fb0', jacketHi: '#e0d4ff', shirt: '#1d1b29', text: '★', textC: '#ffd23f', hat: 'crown', shades: '#ffd23f', lens: '#2b2350', pants: '#24308a', pantsLine: '#141c55' } }),
  K('zorg_prestige', 'zorgon', 'prestige', 'Prestisjekeiser', 'Prestige Emperor', { prestige: 2, fx: 'stars', look: { cape: '#7a5cff', capeIn: '#ffd23f', robe: '#24308a', pattern: 'stars' } }),
  K('hq_star', 'hq', 'prestige', 'Stjernepalasset', 'Star Palace', { fx: 'star', prestige: 3 }),
  K('army_stars', 'army', 'prestige', 'Stjernehæren', 'Star Army', { team: team('#24308a', '#141c55', '#6a7cf0', '#ffd23f'), fx: 'stars', prestige: 5 }),
];
export const SKIN_BY_ID = Object.fromEntries(SKINS.map((k) => [k.id, k]));
// prestisjenivå → skins som låses opp (★2 gir én til hver general)
export const PRESTIGE_SKINS = {};
for (const k of SKINS) if (k.prestige) (PRESTIGE_SKINS[k.prestige] = PRESTIGE_SKINS[k.prestige] || []).push(k.id);
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
