// Spilldata: epoker, regioner, bygninger og enheter. Tekst på norsk (nb) og engelsk (en).
import { BALANCE } from './balance.js';

// ---------- EPOKER ----------
export const ERAS = [
  {
    id: 'ohio', map: 'ohio', home: 'home', hq: 0,
    title: { nb: 'Ohio', en: 'Ohio' },
    won: { nb: 'Ohio er ditt!', en: 'Ohio is yours!' },
    name: { nb: 'Ohio', en: 'Ohio' },
    goal: { nb: 'Vinn hele Ohio med militsen din!', en: 'Conquer all of Ohio with your militia!' },
    intro: {
      nb: 'Sjef! Bygda vår er liten, men modig. Bygg opp gården, samle en milits og ta over Ohio – én by om gangen!',
      en: 'Boss! Our village is small but brave. Build up the farm, raise a militia and take over Ohio – one town at a time!',
    },
    theme: { sky1: '#7fd3ff', sky2: '#d4f3ff', ground: '#6cc551', accent: '#ff8a3d' },
  },
  {
    id: 'usa', map: 'usa', home: 'ohio', hq: 1,
    title: { nb: 'USA', en: 'USA' },
    won: { nb: 'USA er ditt!', en: 'The USA is yours!' },
    name: { nb: 'USA', en: 'the USA' },
    goal: { nb: 'Ta over hele USA!', en: 'Take over the whole USA!' },
    intro: {
      nb: 'Ohio er vårt! Men hvorfor stoppe der? 49 stater venter. Nå trenger vi en ekte hær med stridsvogner og helikoptre!',
      en: 'Ohio is ours! But why stop there? 49 states are waiting. Now we need a real army with tanks and helicopters!',
    },
    theme: { sky1: '#ffb36b', sky2: '#ffe4c2', ground: '#7fc95a', accent: '#3559d6' },
  },
  {
    id: 'na', map: 'na', home: 'usa', hq: 2,
    title: { nb: 'Nord-Amerika', en: 'North America' },
    won: { nb: 'Nord-Amerika er ditt!', en: 'North America is yours!' },
    name: { nb: 'Nord-Amerika', en: 'North America' },
    goal: { nb: 'Erobre Canada, Mexico og resten av kontinentet!', en: 'Conquer Canada, Mexico and the rest of the continent!' },
    intro: {
      nb: 'USA bøyer seg for Ohio! Neste: Canada, Mexico og Karibia. Vi tar luften og havet!',
      en: 'The USA bows to Ohio! Next up: Canada, Mexico and the Caribbean. We take the skies and the seas!',
    },
    theme: { sky1: '#8fc9ff', sky2: '#e8f6ff', ground: '#9ad66b', accent: '#e5484d' },
  },
  {
    id: 'sa', map: 'sa', home: 'na', hq: 3,
    title: { nb: 'Sør-Amerika', en: 'South America' },
    won: { nb: 'Sør-Amerika er ditt!', en: 'South America is yours!' },
    name: { nb: 'Sør-Amerika', en: 'South America' },
    goal: { nb: 'Ta over hele Sør-Amerika!', en: 'Take over all of South America!' },
    intro: {
      nb: 'Hele Nord-Amerika er vårt! Sørover gjennom jungelen, over Andesfjellene og helt ned til Ildlandet.',
      en: 'All of North America is ours! South through the jungle, over the Andes and all the way down to Tierra del Fuego.',
    },
    theme: { sky1: '#6ee0b8', sky2: '#d8fff0', ground: '#4fb843', accent: '#ff5d8f' },
  },
  {
    id: 'world', map: 'world', home: 'americas', hq: 4,
    title: { nb: 'Hele jorda', en: 'The Whole Earth' },
    won: { nb: 'Hele jorda er din!', en: 'The whole Earth is yours!' },
    name: { nb: 'hele jorda', en: 'the whole Earth' },
    goal: { nb: 'Ta over resten av verden!', en: 'Take over the rest of the world!' },
    intro: {
      nb: 'Amerika er vårt! Nå venter resten av kloden: Europa, Afrika, Asia, Australia … og noen veldig sinte pingviner.',
      en: 'The Americas are ours! Now the rest of the globe awaits: Europe, Africa, Asia, Australia … and some very angry penguins.',
    },
    theme: { sky1: '#5fb6ff', sky2: '#c8e9ff', ground: '#7fd36b', accent: '#ffb000' },
  },
  {
    id: 'solar', map: 'solar', home: 'earth', hq: 5, space: true,
    title: { nb: 'Solsystemet', en: 'The Solar System' },
    won: { nb: 'Solsystemet er ditt!', en: 'The Solar System is yours!' },
    name: { nb: 'Solsystemet', en: 'the Solar System' },
    goal: { nb: 'Kast romvesenene ut av solsystemet!', en: 'Kick the aliens out of the Solar System!' },
    intro: {
      nb: 'ALARM! Romvesener har invadert solsystemet! De har tatt Månen, Mars og alle planetene. Bare Ohio kan stoppe dem!',
      en: 'ALERT! Aliens have invaded the Solar System! They have taken the Moon, Mars and every planet. Only Ohio can stop them!',
    },
    theme: { sky1: '#2a1f66', sky2: '#5b3fb0', ground: '#8a7bd6', accent: '#7ffcff' },
  },
  {
    id: 'galaxy', map: 'galaxy', home: 'sol', hq: 6, space: true,
    title: { nb: 'Alien-galaksen', en: 'The Alien Galaxy' },
    won: { nb: 'Universet er ditt!', en: 'The universe is yours!' },
    name: { nb: 'Alien-galaksen', en: 'the Alien Galaxy' },
    goal: { nb: 'Knus Keiser Zorgon og vinn universet!', en: 'Crush Emperor Zorgon and win the universe!' },
    intro: {
      nb: 'Vi har sporet romvesenene til hjemgalaksen deres. Keiser Zorgon venter på moderskipet sitt. Dette er siste kamp, sjef!',
      en: 'We have tracked the aliens to their home galaxy. Emperor Zorgon awaits on his mothership. This is the final battle, boss!',
    },
    theme: { sky1: '#3a0f4f', sky2: '#9a2f8f', ground: '#c45bd0', accent: '#ffd23f' },
  },
];

// ---------- STRATEGI: enhetsklasser, terreng og taktikk ----------
// Hver enhet hører til en klasse. Hvert område har et terreng som gir bonus til noen klasser,
// så det lønner seg å bygge en hær som passer til målene. Bonusene er bare positive.
export const CLASSES = {
  inf: { name: { nb: 'Infanteri', en: 'Infantry' } },
  veh: { name: { nb: 'Kjøretøy', en: 'Vehicles' } },
  air: { name: { nb: 'Fly', en: 'Air' } },
  sea: { name: { nb: 'Skip', en: 'Navy' } },
};
const UNIT_CLASS = {'militia': 'inf', 'hunter': 'inf', 'truck': 'veh', 'soldier': 'inf', 'tank': 'veh', 'heli': 'air', 'jet': 'air', 'ship': 'sea', 'drone': 'air', 'carrier': 'sea', 'mech': 'veh', 'rocket': 'air', 'spacemarine': 'inf', 'spacefighter': 'air', 'laser': 'veh', 'megamech': 'veh', 'ohiostar': 'air'};
export const TERRAINS = {
  city: { color: '#c9b8ff', name: { nb: 'By', en: 'City' }, bonus: { inf: 0.5 } },
  plains: { color: '#c5e86c', name: { nb: 'Slette', en: 'Plains' }, bonus: { veh: 0.5 } },
  forest: { color: '#7fd36b', name: { nb: 'Skog', en: 'Forest' }, bonus: { inf: 0.5, air: 0.25 } },
  swamp: { color: '#9ccf8a', name: { nb: 'Sump', en: 'Swamp' }, bonus: { inf: 0.5, air: 0.25 } },
  mountain: { color: '#c4cddb', name: { nb: 'Fjell', en: 'Mountains' }, bonus: { air: 0.5, inf: 0.25 } },
  coast: { color: '#8fd3ff', name: { nb: 'Kyst', en: 'Coast' }, bonus: { sea: 0.5, air: 0.25 } },
  islands: { color: '#6cc4ff', name: { nb: 'Øyer', en: 'Islands' }, bonus: { sea: 0.5, air: 0.5 } },
  desert: { color: '#ffd98a', name: { nb: 'Ørken', en: 'Desert' }, bonus: { veh: 0.5, air: 0.25 } },
  jungle: { color: '#5fc94a', name: { nb: 'Jungel', en: 'Jungle' }, bonus: { inf: 0.5, air: 0.25 } },
  ice: { color: '#e6f6ff', name: { nb: 'Is og snø', en: 'Ice & Snow' }, bonus: { veh: 0.5, sea: 0.25 } },
  crater: { color: '#d6d0e6', name: { nb: 'Krater', en: 'Craters' }, bonus: { veh: 0.5, inf: 0.25 } },
  gas: { color: '#ffc28a', name: { nb: 'Gasskjempe', en: 'Gas Giant' }, bonus: { air: 0.5 } },
  space: { color: '#b39dff', name: { nb: 'Verdensrommet', en: 'Deep Space' }, bonus: { air: 0.5 } },
};
const REGION_TERRAIN = {'lima': 'plains', 'dayton': 'city', 'toledo': 'plains', 'athens': 'forest', 'cincinnati': 'city', 'akron': 'plains', 'cleveland': 'city', 'columbus': 'city', 'midwest': 'plains', 'south': 'forest', 'florida': 'swamp', 'northeast': 'city', 'plains': 'plains', 'texas': 'desert', 'desert': 'desert', 'westcoast': 'mountain', 'alaska': 'ice', 'capital': 'city', 'caribbean': 'islands', 'central': 'jungle', 'mexico': 'desert', 'canada_e': 'coast', 'canada_w': 'mountain', 'canada_n': 'ice', 'greenland': 'ice', 'colombia': 'jungle', 'venezuela': 'coast', 'peru': 'mountain', 'bolivia': 'plains', 'chile': 'coast', 'argentina': 'plains', 'amazonas': 'jungle', 'brasil': 'coast', 'norden': 'mountain', 'westeu': 'city', 'easteu': 'plains', 'nafrica': 'desert', 'savanna': 'plains', 'mideast': 'desert', 'steppes': 'plains', 'russia': 'ice', 'southasia': 'jungle', 'eastasia': 'city', 'oceania': 'islands', 'antarctica': 'ice', 'moon': 'crater', 'mars': 'desert', 'venus': 'gas', 'mercury': 'crater', 'jupiter': 'gas', 'saturn': 'space', 'neptune': 'ice', 'pluto': 'space', 'zorg': 'city', 'krystallia': 'crater', 'godteri': 'plains', 'magmus': 'crater', 'blobbus': 'swamp', 'robotron': 'city', 'mothership': 'space'};
// Taktikk velges før angrep: mer styrke koster flere soldater, og omvendt
// Taktikk velges før angrep. power endrer vinnersjansen; resten virker i selve kampen.
export const TACTICS = {
  normal: { power: 1, loss: 1, weaken: 1, name: { nb: 'Angrep', en: 'Attack' }, desc: { nb: 'Et vanlig angrep uten fordeler eller ulemper.', en: 'A regular attack with no pros or cons.' } },
  blitz: { power: 1.25, loss: 1.6, weaken: 1, name: { nb: 'Lynangrep', en: 'Blitz' }, desc: { nb: '+25 % styrke, men mange flere tap.', en: '+25% power, but many more losses.' } },
  siege: { power: 0.85, loss: 0.45, weaken: 1.6, artyCd: 0.6, name: { nb: 'Beleiring', en: 'Siege' }, desc: { nb: '−15 % styrke, færre tap, artilleriet lader mye raskere, og fienden svekkes mer hvis du taper.', en: '−15% power, fewer losses, much faster artillery, and the enemy is weakened more if you lose.' } },
  ambush: { power: 1, loss: 0.8, weaken: 1, early: 3500, delay: 1200, name: { nb: 'Snikangrep', en: 'Ambush' }, desc: { nb: 'Dobbel skade fra trykk og artilleri de første 3,5 sekundene, og fienden angriper senere.', en: 'Double damage from taps and artillery in the first 3.5 seconds, and the enemy strikes later.' } },
};
export const TACTIC_IDS = Object.keys(TACTICS);

// Krigsskolen: medaljer fra seire kjøper nivåer. Det er ikke nok medaljer til alt – velg en strategi.
export const DOC_MAX = 5;
export const docCost = (level) => 2 * (level + 1); // nivå 1 koster 2, nivå 5 koster 10
export const DOCTRINES = [
  { id: 'inf', cls: 'inf', icon: 'cls_inf', name: { nb: 'Infanteriskolen', en: 'Infantry School' }, desc: { nb: '+10 % styrke for infanteri per nivå', en: '+10% infantry power per level' } },
  { id: 'veh', cls: 'veh', icon: 'cls_veh', name: { nb: 'Panserskolen', en: 'Armour School' }, desc: { nb: '+10 % styrke for kjøretøy per nivå', en: '+10% vehicle power per level' } },
  { id: 'air', cls: 'air', icon: 'cls_air', name: { nb: 'Flyskolen', en: 'Air Academy' }, desc: { nb: '+10 % styrke for fly per nivå', en: '+10% air power per level' } },
  { id: 'sea', cls: 'sea', icon: 'cls_sea', name: { nb: 'Sjøkrigsskolen', en: 'Naval Academy' }, desc: { nb: '+10 % styrke for skip per nivå', en: '+10% navy power per level' } },
  { id: 'arty', icon: 'boom', name: { nb: 'Artilleri', en: 'Artillery' }, desc: { nb: 'Artilleriet gjør 15 % mer skade og lader 6 % raskere per nivå', en: 'Artillery deals 15% more damage and reloads 6% faster per level' } },
  { id: 'log', icon: 'crate', name: { nb: 'Logistikk', en: 'Logistics' }, desc: { nb: '8 % færre tap per nivå', en: '8% fewer losses per level' } },
  { id: 'intel', icon: 'target', name: { nb: 'Etterretning', en: 'Intelligence' }, desc: { nb: 'Fiendene er 3 % svakere, og du ser angrepene deres 15 % tidligere per nivå', en: 'Enemies are 3% weaker, and you see their attacks 15% earlier per level' } },
  { id: 'econ', icon: 'coin', name: { nb: 'Økonomi', en: 'Economy' }, desc: { nb: '+5 % inntekt per nivå', en: '+5% income per level' } },
  { id: 'loot', icon: 'gift', name: { nb: 'Plyndring', en: 'Plunder' }, desc: { nb: '+25 % krigsbytte og +4 % sjanse for powerups fra seire per nivå', en: '+25% spoils and +4% power-up chance from victories per level' } },
];
export const DOCTRINE_BY_ID = Object.fromEntries(DOCTRINES.map((x) => [x.id, x]));

// ---------- REGIONER ----------
// enemy: 'army' = fiendtlige versjoner av epokens enheter, ellers spesialfiender.
// color: farge på kartet før erobring. pos/planet: kun for romkart.
const R = (id, era, nb, en, fnb, fen, color, enemy = 'army', extra = {}) => ({ id, era, name: { nb, en }, flavor: { nb: fnb, en: fen }, color, enemy, terrain: REGION_TERRAIN[id] || 'plains', ...extra });

export const REGIONS = [
  // Ohio
  R('lima', 0, 'Lima', 'Lima', 'Nabobygda. De har en traktor og en veldig sint gås.', 'The neighbouring town. They have a tractor and a very angry goose.', '#ff8fb1'),
  R('dayton', 0, 'Dayton', 'Dayton', 'Flyets fødeby! Brødrene Wright bygde flyet her.', 'Birthplace of aviation! The Wright brothers built the airplane here.', '#ffab6e'),
  R('toledo', 0, 'Toledo', 'Toledo', 'Holy Toledo! Kaldt vann og varme hoder ved Lake Erie.', 'Holy Toledo! Cold water and hot heads by Lake Erie.', '#5fdbc6'),
  R('athens', 0, 'Athens', 'Athens', 'Nei, ikke den i Hellas. Skog, åser og masse studenter.', 'No, not the one in Greece. Forests, hills and lots of students.', '#7ee0a1'),
  R('cincinnati', 0, 'Cincinnati', 'Cincinnati', 'Chili på spagetti?! Disse folka er tøffe.', 'Chili on spaghetti?! These folks are tough.', '#8cc8ff'),
  R('akron', 0, 'Akron', 'Akron', 'Gummibyen – og LeBron James sin hjemby.', 'Rubber City – and the hometown of LeBron James.', '#d4a5ff'),
  R('cleveland', 0, 'Cleveland', 'Cleveland', 'Rock and roll, sjøvind og sinte fotballfans.', 'Rock and roll, lake wind and angry football fans.', '#ff7a7a'),
  R('columbus', 0, 'Columbus', 'Columbus', 'Hovedstaden! Ta den, så er hele Ohio ditt.', 'The capital! Take it and all of Ohio is yours.', '#b6e36b'),
  // USA
  R('midwest', 1, 'Midtvesten', 'The Midwest', 'Mais så langt øyet kan se.', 'Corn as far as the eye can see.', '#b39dff'),
  R('south', 1, 'Sørstatene', 'The South', 'Grillmat, banjo og stekende sol.', 'Barbecue, banjos and blazing sun.', '#8cc8ff'),
  R('florida', 1, 'Florida', 'Florida', 'Alligatorer og «Florida Man». Alt kan skje!', 'Alligators and "Florida Man". Anything can happen!', '#b6e36b', 'gator'),
  R('northeast', 1, 'Nordøst', 'The Northeast', 'New York, skyskrapere og gule drosjer.', 'New York, skyscrapers and yellow cabs.', '#5fdbc6'),
  R('plains', 1, 'Prærien', 'The Great Plains', 'Cowboyer, bisoner og uendelig himmel.', 'Cowboys, bison and endless sky.', '#d4a5ff'),
  R('texas', 1, 'Texas', 'Texas', 'Alt er større i Texas. Også hæren.', 'Everything is bigger in Texas. Including the army.', '#ff7a7a'),
  R('desert', 1, 'Ørkenen', 'The Desert', 'Hva skjuler de egentlig i Area 51 …?', 'What are they really hiding in Area 51 …?', '#7ee0a1', 'alien'),
  R('westcoast', 1, 'Vestkysten', 'The West Coast', 'Hollywood-stjerner og surfere med solbriller.', 'Hollywood stars and surfers in sunglasses.', '#ffab6e'),
  R('alaska', 1, 'Alaska og Hawaii', 'Alaska & Hawaii', 'Isbjørner i nord, surfere i sør.', 'Polar bears up north, surfers down south.', '#9ad0ec', 'bear'),
  R('capital', 1, 'Washington D.C.', 'Washington D.C.', 'Hovedstaden! Det hvite hus venter.', 'The capital! The White House awaits.', '#ff8fb1'),
  // Nord-Amerika
  R('caribbean', 2, 'Karibia', 'The Caribbean', 'Pirater, palmer og kokosnøtter.', 'Pirates, palm trees and coconuts.', '#ffab6e'),
  R('central', 2, 'Mellom-Amerika', 'Central America', 'Jungel, vulkaner og gamle maya-pyramider.', 'Jungles, volcanoes and ancient Maya pyramids.', '#5fdbc6'),
  R('mexico', 2, 'Mexico', 'Mexico', 'Tacos, ørkener og eldgamle pyramider.', 'Tacos, deserts and ancient pyramids.', '#b39dff'),
  R('canada_e', 2, 'Øst-Canada', 'Eastern Canada', 'Lønnesirup og ishockey!', 'Maple syrup and ice hockey!', '#8cc8ff'),
  R('canada_w', 2, 'Vest-Canada', 'Western Canada', 'Fjell, elger og grizzlybjørner.', 'Mountains, moose and grizzly bears.', '#b6e36b'),
  R('canada_n', 2, 'Nord-Canada', 'Northern Canada', 'Nordlys og isbjørner. Brrr!', 'Northern lights and polar bears. Brrr!', '#ff7a7a', 'bear'),
  R('greenland', 2, 'Grønland', 'Greenland', 'Alle vil ha Grønland. Nå er det din tur!', 'Everyone wants Greenland. Now it is your turn!', '#d4a5ff'),
  // Sør-Amerika
  R('colombia', 3, 'Colombia', 'Colombia', 'Kaffe, fjell og fargerike byer.', 'Coffee, mountains and colourful cities.', '#b39dff'),
  R('venezuela', 3, 'Venezuela og Guyana', 'Venezuela & Guyana', 'Her er verdens høyeste foss, Angel Falls!', 'Home of the world’s highest waterfall, Angel Falls!', '#5fdbc6'),
  R('peru', 3, 'Peru og Ecuador', 'Peru & Ecuador', 'Lamaer som spytter! Pass deg.', 'Llamas that spit! Watch out.', '#ffab6e'),
  R('bolivia', 3, 'Bolivia og Paraguay', 'Bolivia & Paraguay', 'Saltsletter så store at de ser ut som speil.', 'Salt flats so big they look like mirrors.', '#8cc8ff'),
  R('chile', 3, 'Chile', 'Chile', 'Verdens lengste land. Slitsomt å marsjere!', 'The longest country in the world. Tiring to march!', '#b6e36b'),
  R('argentina', 3, 'Argentina og Uruguay', 'Argentina & Uruguay', 'Gauchoer, tango og pingviner i sør.', 'Gauchos, tango and penguins down south.', '#ff7a7a'),
  R('amazonas', 3, 'Amazonas', 'The Amazon', 'Jaguarer, anakondaer og myggsvermer.', 'Jaguars, anacondas and swarms of mosquitoes.', '#d4a5ff'),
  R('brasil', 3, 'Brasil', 'Brazil', 'Samba, fotball og karneval. De gir seg aldri!', 'Samba, football and carnival. They never give up!', '#7ee0a1'),
  // Verden
  R('norden', 4, 'Norden', 'The Nordics', 'Vikinger på ski med brunost i sekken!', 'Vikings on skis with brown cheese in their backpacks!', '#8cc8ff'),
  R('westeu', 4, 'Vest-Europa', 'Western Europe', 'Slott, croissanter og fotball.', 'Castles, croissants and football.', '#5fdbc6'),
  R('easteu', 4, 'Øst-Europa', 'Eastern Europe', 'Fjell, borger og deilige dumplings.', 'Mountains, fortresses and delicious dumplings.', '#ffab6e'),
  R('nafrica', 4, 'Nord-Afrika', 'North Africa', 'Sahara! Kameler og pyramider.', 'The Sahara! Camels and pyramids.', '#d4a5ff'),
  R('savanna', 4, 'Savannen', 'The Savanna', 'Løver, elefanter og sjiraffer.', 'Lions, elephants and giraffes.', '#b6e36b'),
  R('mideast', 4, 'Midtøsten', 'The Middle East', 'Ørken, olje og eldgamle byer.', 'Deserts, oil and ancient cities.', '#ff7a7a'),
  R('steppes', 4, 'Steppene', 'The Steppes', 'Ville hester og endeløse gressletter.', 'Wild horses and endless grasslands.', '#7ee0a1'),
  R('russia', 4, 'Russland', 'Russia', 'Verdens største land. Ta med ullsokker!', 'The biggest country in the world. Bring wool socks!', '#9ad0ec'),
  R('southasia', 4, 'Sør-Asia', 'South Asia', 'Himalaya, krydder og tigre.', 'The Himalayas, spices and tigers.', '#ff8fb1'),
  R('eastasia', 4, 'Øst-Asia', 'East Asia', 'Den kinesiske mur, sushi og pandaer.', 'The Great Wall, sushi and pandas.', '#ffcf6e'),
  R('oceania', 4, 'Oseania', 'Oceania', 'Kenguruer med boksehansker!', 'Kangaroos with boxing gloves!', '#b39dff', 'kangaroo'),
  R('antarctica', 4, 'Antarktis', 'Antarctica', 'Keiserpingvinen og hæren hans venter i isen …', 'The Emperor Penguin and his army await in the ice …', '#e8f4ff', 'penguin'),
  // Solsystemet
  R('moon', 5, 'Månen', 'The Moon', 'Romvesenene har stjålet osten vår!', 'The aliens have stolen our cheese!', '#c9ccd6', 'alien', { planet: 'moon', pos: [300, 1040], size: 70 }),
  R('mars', 5, 'Mars', 'Mars', 'Den røde planeten – full av små grønne menn.', 'The red planet – full of little green men.', '#e8714a', 'alien', { planet: 'mars', pos: [640, 900], size: 80 }),
  R('venus', 5, 'Venus', 'Venus', 'Varm som en badstue. Romvesenene svetter!', 'Hot as a sauna. The aliens are sweating!', '#f5c26b', 'alien', { planet: 'venus', pos: [330, 760], size: 82 }),
  R('mercury', 5, 'Merkur', 'Mercury', 'Nærmest sola. Ta med solkrem!', 'Closest to the Sun. Bring sunscreen!', '#b19a86', 'ufo', { planet: 'mercury', pos: [700, 640], size: 66 }),
  R('jupiter', 5, 'Jupiter', 'Jupiter', 'Kjempeplaneten med en evig storm.', 'The giant planet with an eternal storm.', '#e8b98a', 'ufo', { planet: 'jupiter', pos: [300, 500], size: 120 }),
  R('saturn', 5, 'Saturn', 'Saturn', 'Romvesenene bruker ringene som racerbane.', 'The aliens use the rings as a racetrack.', '#f0d58c', 'ufo', { planet: 'saturn', pos: [700, 360], size: 110 }),
  R('neptune', 5, 'Uranus og Neptun', 'Uranus & Neptune', 'Iskalde, blå kjemper.', 'Ice-cold blue giants.', '#4f7cff', 'alien', { planet: 'neptune', pos: [320, 230], size: 90 }),
  R('pluto', 5, 'Pluto', 'Pluto', 'Den er fortsatt en planet i Ohio!', 'It is still a planet in Ohio!', '#d9b9a0', 'boss', { planet: 'pluto', pos: [660, 110], size: 62 }),
  // Alien-galaksen
  R('zorg', 6, 'Zorg-7', 'Zorg-7', 'Slimplaneten. Alt er klissete.', 'The slime planet. Everything is sticky.', '#7be07b', 'alien', { planet: 'slime', pos: [320, 1040], size: 86 }),
  R('krystallia', 6, 'Krystallia', 'Crystallia', 'Krystall-aliens som glitrer i mørket.', 'Crystal aliens that sparkle in the dark.', '#b38cff', 'alien', { planet: 'crystal', pos: [680, 880], size: 84 }),
  R('godteri', 6, 'Godteplaneten', 'Candy Planet', 'Sukkersøte aliens med tannverk.', 'Sugar-sweet aliens with toothaches.', '#ff9ed2', 'ufo', { planet: 'candy', pos: [320, 720], size: 92 }),
  R('magmus', 6, 'Magmus', 'Magmus', 'Lava overalt. Ikke tråkk på gulvet!', 'Lava everywhere. Don’t touch the floor!', '#ff7a3d', 'alien', { planet: 'lava', pos: [690, 560], size: 90 }),
  R('blobbus', 6, 'Blobbus', 'Blobbus', 'Vannplaneten der alienene svømmer.', 'The water planet where the aliens swim.', '#2f7fe0', 'ufo', { planet: 'ocean', pos: [320, 410], size: 96 }),
  R('robotron', 6, 'Robotron', 'Robotron', 'Robot-aliens med laserøyne.', 'Robot aliens with laser eyes.', '#a9b4c6', 'ufo', { planet: 'robot', pos: [690, 260], size: 92 }),
  R('mothership', 6, 'Moderskipet', 'The Mothership', 'Keiser Zorgon selv! Siste kamp!', 'Emperor Zorgon himself! The final battle!', '#ffd23f', 'boss', { planet: 'mothership', pos: [420, 110], size: 120 }),
];

// Hjem-noder på romkartene
export const SPACE_HOMES = {
  solar: { planet: 'earth', pos: [560, 1190], size: 84, name: { nb: 'Jorda', en: 'Earth' } },
  galaxy: { planet: 'sun', pos: [600, 1200], size: 90, name: { nb: 'Solsystemet', en: 'Solar System' } },
};

// ---------- BYGNINGER (økonomi) ----------
const B = (id, era, cost, income, nb, en, dnb, den) => ({ id, era, cost, income, name: { nb, en }, desc: { nb: dnb, en: den } });
export const BUILDINGS = [
  B('corn', 0, 10, 0.4, 'Maisåker', 'Corn Field', 'Ohio-mais! Selges på torget.', 'Ohio corn! Sold at the market.'),
  B('cow', 0, 110, 3.5, 'Kufjøs', 'Dairy Farm', 'Glade kuer gir melk og penger.', 'Happy cows make milk and money.'),
  B('gas', 0, 1300, 30, 'Bensinstasjon', 'Gas Station', 'Alle trenger bensin – og pølser.', 'Everyone needs gas – and hot dogs.'),
  B('factory', 1, 2.2e4, 400, 'Fabrikk', 'Factory', 'Lager alt fra bildekk til hjelmer.', 'Makes everything from tyres to helmets.'),
  B('oil', 1, 3.5e5, 5200, 'Oljepumpe', 'Oil Pump', 'Svart gull rett fra bakken.', 'Black gold straight from the ground.'),
  B('burger', 2, 6e6, 7.4e4, 'Burgerkjede', 'Burger Chain', 'Ohio Burger – nå i hele Amerika!', 'Ohio Burger – now all over America!'),
  B('bank', 2, 1e8, 1.05e6, 'Bank', 'Bank', 'Pengene dine lager flere penger.', 'Your money makes more money.'),
  B('coffee', 3, 1.8e9, 1.5e7, 'Kaffeplantasje', 'Coffee Plantation', 'Hele hæren trenger morgenkaffe.', 'The whole army needs its morning coffee.'),
  B('goldmine', 3, 3e10, 2.1e8, 'Gullgruve', 'Gold Mine', 'Gull! Masse gull!', 'Gold! Lots of gold!'),
  B('tech', 4, 5.5e11, 3e9, 'Tech-selskap', 'Tech Company', 'OhioPhone – verdens beste mobil.', 'OhioPhone – the best phone in the world.'),
  B('rocketbase', 4, 1e13, 4.4e10, 'Rakettbase', 'Rocket Base', 'Romturisme for de rike.', 'Space tourism for the rich.'),
  B('mooncheese', 5, 1.9e14, 6.3e11, 'Måneostgruve', 'Moon Cheese Mine', 'Månen ER laget av ost!', 'The Moon IS made of cheese!'),
  B('asteroid', 5, 3.6e15, 9e12, 'Asteroidegruve', 'Asteroid Mine', 'Edelstener fra verdensrommet.', 'Gems from outer space.'),
  B('antimatter', 6, 7e16, 1.3e14, 'Antimaterie-reaktor', 'Antimatter Reactor', 'Uendelig energi. Ikke trykk på den røde knappen.', 'Infinite energy. Do not press the red button.'),
  B('dyson', 6, 1.4e18, 1.9e15, 'Dyson-sfære', 'Dyson Sphere', 'Fanger energien fra en hel stjerne.', 'Captures the energy of an entire star.'),
];

// ---------- ENHETER (hær) ----------
const U = (id, era, cost, power, nb, en, dnb, den) => ({ id, era, cost, power, cls: UNIT_CLASS[id] || 'inf', name: { nb, en }, desc: { nb: dnb, en: den } });
export const UNITS = [
  U('militia', 0, 12, 1, 'Milits', 'Militia', 'Bønder med høygafler. Modige, men litt rotete.', 'Farmers with pitchforks. Brave, but a bit messy.'),
  U('hunter', 0, 140, 13, 'Jeger', 'Hunter', 'Treffer et ekorn på hundre meter.', 'Can hit a squirrel at a hundred metres.'),
  U('truck', 0, 1700, 170, 'Monstertruck', 'Monster Truck', 'Pickup med kanon på lasteplanet!', 'A pickup with a cannon in the back!'),
  U('soldier', 1, 2.6e4, 2800, 'Soldat', 'Soldier', 'Ekte soldater med hjelm og alt.', 'Real soldiers with helmets and everything.'),
  U('tank', 1, 4e5, 4.6e4, 'Stridsvogn', 'Tank', 'Ruller over alt som står i veien.', 'Rolls over anything in its way.'),
  U('heli', 1, 6e6, 7.4e5, 'Helikopter', 'Helicopter', 'Full rotor fra lufta!', 'Whirly-bird power from above!'),
  U('jet', 2, 9e7, 1.2e7, 'Jagerfly', 'Fighter Jet', 'Raskere enn lyden!', 'Faster than sound!'),
  U('ship', 2, 1.4e9, 2e8, 'Slagskip', 'Battleship', 'Hersker over alle hav.', 'Rules every sea.'),
  U('drone', 3, 2.2e10, 3.3e9, 'Dronesverm', 'Drone Swarm', 'Hundrevis av små summende roboter.', 'Hundreds of tiny buzzing robots.'),
  U('carrier', 3, 3.5e11, 5.5e10, 'Hangarskip', 'Aircraft Carrier', 'En flyplass som flyter!', 'An airport that floats!'),
  U('mech', 4, 5.5e12, 9e11, 'Kamprobot', 'Battle Mech', 'Ti meter høy og veldig sint.', 'Ten metres tall and very angry.'),
  U('rocket', 4, 9e13, 1.5e13, 'Superrakett', 'Super Rocket', 'Treffer hvor som helst på kloden.', 'Hits anywhere on the globe.'),
  U('spacemarine', 5, 1.5e15, 2.6e14, 'Romsoldat', 'Space Marine', 'Soldater med jetpack og laser.', 'Soldiers with jetpacks and lasers.'),
  U('spacefighter', 5, 2.5e16, 4.4e15, 'Romjager', 'Space Fighter', 'Pew-pew blant stjernene!', 'Pew-pew among the stars!'),
  U('laser', 5, 4.2e17, 7.6e16, 'Laserkanon', 'Laser Cannon', 'Svevende stridsvogn med megalaser.', 'A hovering tank with a mega laser.'),
  U('megamech', 6, 7e18, 1.3e18, 'Mega-mech', 'Mega Mech', 'Hundre meter høy. Spiser romvesener til frokost.', 'A hundred metres tall. Eats aliens for breakfast.'),
  U('ohiostar', 6, 1.2e20, 2.3e19, 'Ohio-stjernen', 'The Ohio Star', 'En romstasjon formet som Ohio. Det ultimate våpenet!', 'A space station shaped like Ohio. The ultimate weapon!'),
];

// Kalibrerte verdier (genereres av tools/simulate.mjs)
for (const r of REGIONS) {
  const b = BALANCE.r && BALANCE.r[r.id];
  r.def = b ? b.def : 10;
  r.income = b ? b.income : 1;
  r.time = b && b.t ? b.t : 120; // forventet antall sekunder for å ta området (fra simulatoren)
}
for (const it of [...BUILDINGS, ...UNITS]) {
  const b = BALANCE.i && BALANCE.i[it.id];
  if (b) Object.assign(it, b);
}

export const REGION_BY_ID = Object.fromEntries(REGIONS.map((r) => [r.id, r]));
export const BUILDING_BY_ID = Object.fromEntries(BUILDINGS.map((b) => [b.id, b]));
export const UNIT_BY_ID = Object.fromEntries(UNITS.map((u) => [u.id, u]));
export const regionsOfEra = (e) => REGIONS.filter((r) => r.era === e);
