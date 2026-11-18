// Replikker generalene sier i basen, i opplæringen, i kamp og i hendelser.
// General Drip snakker slang – på norsk og på engelsk. Mangler en replikk, brukes standardteksten i i18n.js.
const V = (nb, en) => ({ nb, en });

export const VOICE = {
  drip: {
    quip: [
      V('Wallah bror, vi tar over hele Ohio.', 'Wallahi bro, we’re taking over all of Ohio.'),
      V('Shu bror, skjer’a?', 'Wagwan bro, what’s good?'),
      V('Wallah, dette antrekket koster mer enn hele Lima.', 'Wallahi, this fit costs more than all of Lima.'),
      V('Bror, jeg er altfor fresh for dette hovedkvarteret.', 'Bro, I’m way too fresh for this HQ.'),
      V('Jalla, flere soldater! Schpa krig snart, bror.', 'Yalla, more troops! We’re going to war soon, bro.'),
      V('Wallah dette ekke no for meg.', 'Nah bro, this ain’t it for me.'),
      V('Kæsj på kæsj på kæsj, bror.', 'Cash on cash on cash, bro.'),
      V('Hææ? Hvem flytta kartet?', 'Huh? Who moved the map, bro?'),
      V('Mæn, gåsa stirrer på meg igjen.', 'Bro, the goose is staring at me again.'),
      V('Chill, bror. Vi har full kontroll.', 'Chill, bro. We got this.'),
      V('Wallah, klokka mi går så fort at det allerede er i morgen.', 'On god, my watch is so fast it’s already tomorrow.'),
      V('Lættis, bror. Helt lættis.', 'Easy, bro. Too easy.'),
      V('Bror, snart er Ohio vårt, wallah.', 'Bro, Ohio is ours soon, no cap.'),
      V('Sykt fett ass, se på hæren vår!', 'No cap, look at our army. Bussin’!'),
      V('Ikke stress, bror. Drip fikser det.', 'Don’t stress, bro. Drip’s got it.'),
      V('Wallah vi kæsa di da. Alle sammen.', 'Wallahi we cook them. Every single one.'),
      V('Drip er ikke en stil, bror. Det er en strategi.', 'Drip ain’t a style, bro. It’s a strategy.'),
      V('Hvem tok den siste maiskolben? Ikke kult, bror.', 'Who took the last corn cob? Not cool, bro.'),
    ],
    combo3: [V('Wallah bror, fortere!', 'Faster, bro, on god!')],
    combo4: [V('MAKS KOMBO! Sykt raske fingre ass!', 'MAX COMBO! Your fingers are cracked, no cap!')],
    mega: [V('WALLAH!', 'WALLAHI!'), V('Hææ? Sykt!', 'NO WAY, BRO!')],
    evSpawn: [V('Wallah bror, noe rart skjer i byen!', 'Wallahi bro, something weird is going on in town!')],
    evGood: [V('Wallah, vi kæsa det!', 'Wallahi, we cooked that!')],
    evBad: [V('Wallah dette ekke no for meg …', 'Nah bro, this ain’t it …')],
    welcome: [V('Wallah bror, du er tilbake!', 'Wallahi bro, you’re back!')],
    away: [V('Du var borte i {t}, bror. Imperiet tjente sykt mye kæsj:', 'You were gone for {t}, bro. The empire made bare cash:')],
    call: [V('SCHPA KRIG!', 'LET’S RUN IT!')],
    win: [
      V('Wallah vi kæsa di da!', 'Wallahi we cooked them!'),
      V('Lættis, bror!', 'Too easy, bro!'),
      V('Sykt fett ass!', 'That was bussin’, no cap!'),
    ],
    lose: [
      V('Wallah dette ekke no for meg.', 'Nah bro, this ain’t it.'),
      V('Bror … neste gang, wallah.', 'Bro … next time, on god.'),
      V('Hææ? Hvordan tapte vi?', 'Huh? How did we lose, bro?'),
    ],
    tut0: [V('Wallah bror, trykk på låven for å tjene kæsj!', 'Wallahi bro, tap the barn to make some cash!')],
    tut1: [V('Sykt fett! Gå til Bygg og kjøp en maisåker, bror. Den lager kæsj hele tiden.', 'Bussin’! Go to Build and buy a corn field, bro. It makes cash all day.')],
    tut2: [V('Nå trenger vi gutta! Rekrutter milits i Hær til vi har 100 % vinnersjanse mot Lima, wallah.', 'Now we need the squad! Recruit militia in Army until we have a 100% win chance against Lima, on god.')],
    tut3: [V('Schpa krig! Gå til Kart og angrip Lima, bror!', 'Let’s run it! Go to the Map and attack Lima, bro!')],
    tut4: [V('Wallah vi kæsa di da! Hver by vi tar gir mer kæsj. Ta hele Ohio, bror!', 'Wallahi we cooked them! Every town we take means more cash. Take all of Ohio, bro!')],
  },
  buckeye: {
    win: [
      V('Det var en hard nøtt – for dem!', 'That was a tough nut – for them!'),
      V('Ohio vinner igjen!', 'Ohio wins again!'),
      V('Nøtter er sterkere enn man tror.', 'Nuts are stronger than you think.'),
    ],
    lose: [
      V('Au. Rett i skallet.', 'Ouch. Right in the shell.'),
      V('Vi kommer tilbake. Nøtter gir aldri opp.', 'We will be back. Nuts never give up.'),
      V('Hatten min er skuffet.', 'My hat is disappointed.'),
    ],
  },
  zorgon: {
    win: [
      V('Som forventet av en keiser.', 'As expected of an emperor.'),
      V('Universet bøyer seg igjen.', 'The universe bows once more.'),
      V('Jordboere. Så forutsigbare.', 'Earthlings. So predictable.'),
    ],
    lose: [
      V('Dette var … en taktisk retrett.', 'That was … a tactical retreat.'),
      V('Selv keisere har mandager.', 'Even emperors have Mondays.'),
      V('Monokkelen min så ikke det komme.', 'My monocle did not see that coming.'),
    ],
  },
};

// En tilfeldig replikk for generalen og situasjonen, eller null hvis generalen ikke har en egen
export function voice(gen, key, rnd = Math.random) {
  const list = VOICE[gen] && VOICE[gen][key];
  return list && list.length ? list[Math.floor(rnd() * list.length)] : null;
}
