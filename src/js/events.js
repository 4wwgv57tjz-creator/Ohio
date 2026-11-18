// Tilfeldige hendelser i basen: rare spørsmål med tre svar. Hvert svar er enten bra eller dårlig,
// men spillet viser aldri hvilket før du har valgt – og rekkefølgen på svarene stokkes hver gang.
// Ren logikk uten DOM, slik at den kan testes i Node.
import { baseIncome, incomeMult, tapValue, unitPower } from './engine.js';
import { UNITS } from './data.js';
import { grantRandom } from './powerups.js';
import { addCrate } from './cosmetics.js';

export const EV_FIRST = 75 * 1000; // første hendelse kommer litt etter opplæringen
export const EV_MIN = 4 * 60 * 1000; // deretter med 4–7 minutters mellomrom
export const EV_MAX = 7 * 60 * 1000;
export const EV_PLAYTIME = 120; // sekunder spilt før første hendelse
export const BUFF = { buff: 1.5, slump: 0.7, tap: 3, tapdown: 0.5 };
const RECENT = 24; // så mange hendelser må komme før den samme kan komme igjen

// Virkninger: [type, verdi]
//   gode:    cash (minutter med inntekt), gems (antall), buff (minutter med ×1,5 inntekt), tap (minutter med ×3 per trykk),
//            pu (tilfeldig powerup), crate (trekasse), troops (prosent flere soldater), medal (medaljer til Krigsskolen)
//   dårlige: loss (minutter med inntekt, høyst 15 % av pengene), slump (minutter med ×0,7 inntekt),
//            desert (prosent av soldatene stikker av), tapdown (minutter med ×0,5 per trykk)
export const GOOD_FX = new Set(['cash', 'gems', 'buff', 'tap', 'pu', 'crate', 'troops', 'medal']);

const ev = (id, who, title, q, a) => ({ id, who, title, q, a });
const ans = (nb, en, rnb, ren, fx) => ({ t: { nb, en }, r: { nb: rnb, en: ren }, fx });

export const EVENTS = [
  ev('hunger', 'chef', { nb: 'Folket sulter', en: 'The people are starving' },
    { nb: 'Folket sulter. Det eneste som er igjen på lageret, er én uendelig lang spagetti og en lapp der det står «ikke spis meg».', en: 'The people are starving. All that is left in the storehouse is one infinitely long spaghetti and a note saying “do not eat me”.' }, [
      ans('Spis spagettien likevel', 'Eat the spaghetti anyway', 'Den smakte som tirsdag. Alle var mette i en uke og jobbet som besatt.', 'It tasted like Tuesday. Everyone was full for a week and worked like mad.', ['buff', 4]),
      ans('Les lappen høyt for spagettien', 'Read the note aloud to the spaghetti', 'Spagettien ble fornærmet og flyttet til nabobygda. Den tok med seg brødet.', 'The spaghetti got offended and moved to the next village. It took the bread with it.', ['loss', 3]),
      ans('Knyt den til en sløyfe og selg den', 'Tie it into a bow and sell it', 'En kunstsamler betalte en formue for «Sløyfe nr. ∞».', 'An art collector paid a fortune for “Bow No. ∞”.', ['cash', 4]),
    ]),
  ev('goose_pm', 'goose', { nb: 'Gåsa vil styre', en: 'The goose wants to rule' },
    { nb: 'En gås står på trappa til hovedkvarteret. Den sier ingenting, men alle vet at den vil bli statsminister.', en: 'A goose is standing on the steps of HQ. It says nothing, but everyone knows it wants to be prime minister.' }, [
      ans('Gi gåsa et slips', 'Give the goose a tie', 'Gåsa fikk slipset og innførte firedagersuke. Produktiviteten eksploderte.', 'The goose got its tie and introduced a four-day week. Productivity exploded.', ['buff', 5]),
      ans('Utfordre gåsa til stirrekonkurranse', 'Challenge the goose to a staring contest', 'Du blunket først. Gåsa tok en bit av statskassen som premie.', 'You blinked first. The goose took a bite of the treasury as its prize.', ['loss', 4]),
      ans('Lat som gåsa er en statue', 'Pretend the goose is a statue', 'Gåsa ble så rørt over å bli tatt for kunst at den la et skinnende egg.', 'The goose was so moved to be mistaken for art that it laid a shiny egg.', ['gems', 15]),
    ]),
  ev('moon_letter', 'scientist', { nb: 'Klage fra månen', en: 'A complaint from the Moon' },
    { nb: 'Månen har sendt et brev. Den skriver at bygda di lyser for sterkt om natta, og at den ikke får sove.', en: 'The Moon has sent a letter. It says your village shines too brightly at night and it cannot sleep.' }, [
      ans('Send månen en sovemaske', 'Send the Moon a sleep mask', 'Månen sov i tre dager. Tidevannet ble forvirret, men fiskerne ble rike.', 'The Moon slept for three days. The tides got confused, but the fishermen got rich.', ['cash', 3]),
      ans('Tenn ett stearinlys formet som deg', 'Light a single candle shaped like you', 'Stearinlyset smeltet på en svært dramatisk måte. Folk trengte terapi.', 'The candle melted in a very dramatic way. People needed therapy.', ['slump', 3]),
      ans('Send en faktura for lysshowet', 'Send an invoice for the light show', 'Månen ble sur og skrudde ned tyngdekraften. Noen soldater fløt bort.', 'The Moon got grumpy and turned down gravity. Some soldiers floated away.', ['desert', 4]),
    ]),
  ev('pancakes', 'kid', { nb: 'Pannekaketårnet', en: 'The pancake tower' },
    { nb: 'Noen har bygd et tårn av pannekaker midt på torget. Det er høyere enn hovedkvarteret, og det knirker.', en: 'Someone has built a tower of pancakes in the square. It is taller than HQ, and it creaks.' }, [
      ans('Klatre opp og plant flagget', 'Climb it and plant your flag', 'Utsikten var fantastisk. Du så rett inn i fiendens leir og fant svakhetene deres.', 'The view was amazing. You saw straight into the enemy camp and spotted their weaknesses.', ['medal', 1]),
      ans('Hell sirup over hele greia', 'Pour syrup over the whole thing', 'Tårnet ble til en klissete flodbølge. Deler av hæren sitter fast.', 'The tower became a sticky tidal wave. Part of the army is stuck.', ['desert', 3]),
      ans('Spis den nederste pannekaken', 'Eat the bottom pancake', 'Tårnet falt sakte og elegant ned i en sulten folkemengde. Mange meldte seg til hæren av ren takknemlighet.', 'The tower fell slowly and elegantly into a hungry crowd. Many joined the army out of pure gratitude.', ['troops', 6]),
    ]),
  ev('door_field', 'farmer', { nb: 'Døra på jordet', en: 'The door in the field' },
    { nb: 'En dør har dukket opp midt på et jorde. Den står helt alene, uten vegger. Noen banker fra den andre siden.', en: 'A door has appeared in the middle of a field. It stands all alone, no walls. Someone is knocking from the other side.' }, [
      ans('Åpne døra', 'Open the door', 'Det var deg selv fra i morgen. Du ga deg selv et veldig godt tips.', 'It was you, from tomorrow. You gave yourself a very good tip.', ['cash', 5]),
      ans('Bank tilbake', 'Knock back', 'Bankingen ble til en rytme, så til et band. De turnerer fortsatt. Med pengene dine.', 'The knocking became a rhythm, then a band. They are still on tour. With your money.', ['loss', 3]),
      ans('Mal en dør til ved siden av', 'Paint another door next to it', 'Nå banker det på begge. Bøndene nekter å jobbe før noen svarer.', 'Now there is knocking on both. The farmers refuse to work until someone answers.', ['slump', 4]),
    ]),
  ev('pigeons', 'granny', { nb: 'Duer med briller', en: 'Pigeons in glasses' },
    { nb: 'Alle duene i byen har plutselig fått små briller. De sitter på taket og ser på deg. De tar notater.', en: 'Every pigeon in town suddenly has tiny glasses. They sit on the roof watching you. Taking notes.' }, [
      ans('Ansett dem som spioner', 'Hire them as spies', 'Duene leverte en rapport på 400 sider om fiendens frokostvaner. Overraskende nyttig!', 'The pigeons delivered a 400-page report on the enemy’s breakfast habits. Surprisingly useful!', ['medal', 1]),
      ans('Gi dem eksamen', 'Give them an exam', 'Alle duene strøk. De var så lei seg at folk sluttet å gå på jobb av medlidenhet.', 'Every pigeon failed. They were so upset that people stopped going to work out of pity.', ['slump', 3]),
      ans('Ta på deg briller selv', 'Put on glasses yourself', 'Nå ser du det duene ser: en hemmelig kiste bak hovedkvarteret.', 'Now you see what the pigeons see: a secret chest behind HQ.', ['crate', 1]),
    ]),
  ev('clock13', 'mayor', { nb: 'Klokka slo tretten', en: 'The clock struck thirteen' },
    { nb: 'Rådhusklokka slo nettopp tretten. Ingen vet hva man skal gjøre i den trettende timen.', en: 'The town hall clock just struck thirteen. Nobody knows what to do during the thirteenth hour.' }, [
      ans('Gjør den til fritime', 'Make it an hour off', 'Folk hvilte i en time som ikke finnes. De kom tilbake dobbelt så effektive.', 'People rested in an hour that does not exist. They came back twice as productive.', ['buff', 5]),
      ans('Bruk den til overtid', 'Use it for overtime', 'Overtid i den trettende timen telte ikke. Lønna måtte betales likevel.', 'Overtime in the thirteenth hour did not count. The wages still had to be paid.', ['loss', 4]),
      ans('Skru klokka tilbake til tolv', 'Turn the clock back to twelve', 'Klokka hikstet og spyttet ut den ekstra timen i form av en liten edelstein.', 'The clock hiccuped and spat out the extra hour in the shape of a tiny gem.', ['gems', 12]),
    ]),
  ev('painting', 'granny', { nb: 'Maleriet blunker', en: 'The painting winks' },
    { nb: 'Det store maleriet av deg i hovedkvarteret har begynt å blunke til folk. Noen sier at det smiler mer enn deg.', en: 'The big portrait of you in HQ has started winking at people. Some say it smiles more than you do.' }, [
      ans('Gi maleriet en medalje', 'Award the painting a medal', 'Maleriet ble så motivert at det heier på arbeiderne hele dagen.', 'The painting got so motivated it cheers on the workers all day.', ['buff', 3]),
      ans('Blunk tilbake', 'Wink back', 'Dere blunket til hverandre i fire timer. Ingen fikk gjort noe som helst.', 'You winked at each other for four hours. Nobody got anything done.', ['slump', 4]),
      ans('Heng det opp ned', 'Hang it upside down', 'Maleriet ble svimmelt og nøs ut en kasse.', 'The painting got dizzy and sneezed out a crate.', ['crate', 1]),
    ]),
  ev('fish_faith', 'kid', { nb: 'Fiskenes tro', en: 'The faith of the fish' },
    { nb: 'Fiskene i dammen har startet en religion. De tror du er Den Store Brødsmulen, og de venter på et tegn.', en: 'The fish in the pond have started a religion. They believe you are The Great Breadcrumb, and they await a sign.' }, [
      ans('Gi dem et tegn: kast en baguette', 'Give them a sign: throw a baguette', 'Baguetten ble tolket som en profeti. Fiskene vervet seg til marinen.', 'The baguette was read as a prophecy. The fish enlisted in the navy.', ['troops', 8]),
      ans('Si at du bare er en vanlig person', 'Tell them you are just a regular person', 'Fiskene fikk trosskrise. Dammen ble grå, og turistene forsvant.', 'The fish had a crisis of faith. The pond turned grey and the tourists vanished.', ['slump', 3]),
      ans('Hopp uti dammen', 'Jump into the pond', 'Du landet på et teppe av mynter som folk har ønsket seg ting med i hundre år.', 'You landed on a carpet of coins that people have been wishing on for a hundred years.', ['cash', 4]),
    ]),
  ev('no_yellow', 'scientist', { nb: 'Gult er borte', en: 'Yellow is missing' },
    { nb: 'Noen har stjålet fargen gul. Sola er hvit, maisen er grå, og bananene er bare lei seg.', en: 'Someone has stolen the colour yellow. The sun is white, the corn is grey and the bananas are just sad.' }, [
      ans('Finn opp en ny farge', 'Invent a new colour', 'Du fant opp «glorp». Folk elsker den. Glorp-maling selges i hele Ohio.', 'You invented “glorp”. People love it. Glorp paint sells all over Ohio.', ['cash', 5]),
      ans('Anklag fargen blå', 'Accuse the colour blue', 'Blå ble fornærmet og dro også. Nå er himmelen beige, og moralen er lav.', 'Blue got offended and left too. Now the sky is beige and morale is low.', ['slump', 4]),
      ans('Utlys en dusør', 'Offer a reward', 'En tyv leverte tilbake gult, pent brettet. Han ville ha betalt i grønt.', 'A thief returned yellow, neatly folded. He wanted to be paid in green.', ['loss', 2]),
    ]),
  ev('wednesday', 'mayor', { nb: 'Hvor ble onsdag av?', en: 'Where did Wednesday go?' },
    { nb: 'Ingen husker hva onsdag er. Kalenderen går rett fra tirsdag til torsdag, og folk er nervøse.', en: 'Nobody remembers what Wednesday is. The calendar goes straight from Tuesday to Thursday, and people are nervous.' }, [
      ans('Finn opp en ny onsdag', 'Invent a new Wednesday', 'Den nye onsdagen hadde to kvelder. Alle elsket den.', 'The new Wednesday had two evenings. Everyone loved it.', ['buff', 4]),
      ans('Hopp over resten av uka', 'Skip the rest of the week', 'Lønningsdagen forsvant også. Det ble mumling i rekkene, og noen gikk hjem.', 'Payday vanished too. There was grumbling in the ranks, and some went home.', ['desert', 3]),
      ans('Spør en gammel kalender', 'Ask an old calendar', 'Kalenderen hvisket at onsdag gjemmer seg i en kasse. Den hadde rett.', 'The calendar whispered that Wednesday was hiding in a crate. It was right.', ['crate', 1]),
    ]),
  ev('cloud_nap', 'kid', { nb: 'Skyen som sov', en: 'The napping cloud' },
    { nb: 'En sky har sovnet på taket av hovedkvarteret. Den snorker torden og drømmer om regnbuer.', en: 'A cloud has fallen asleep on the roof of HQ. It snores thunder and dreams of rainbows.' }, [
      ans('Syng en vuggevise', 'Sing it a lullaby', 'Skyen sov så godt at den drysset gullregn over bygda.', 'The cloud slept so well that it sprinkled golden rain over the village.', ['cash', 3]),
      ans('Pirk på den med en kost', 'Poke it with a broom', 'Skyen våknet sur og regnet bare på lommeboka di.', 'The cloud woke up grumpy and rained only on your wallet.', ['loss', 3]),
      ans('Legg et teppe over den', 'Put a blanket over it', 'Skyen ble så rørt at den meldte seg inn i flyvåpenet, sammen med vennene sine.', 'The cloud was so touched that it joined the air force, along with its friends.', ['troops', 5]),
    ]),
  ev('number7', 'scientist', { nb: 'Tallet 7 er borte', en: 'The number 7 is gone' },
    { nb: 'Rådgiveren din sier at tallet 7 har forsvunnet. Folk teller nå 5, 6, 8. De med sju tær er bekymret.', en: 'Your advisor says the number 7 has disappeared. People now count 5, 6, 8. Those with seven toes are worried.' }, [
      ans('Rund alt opp til 8', 'Round everything up to 8', 'Plutselig hadde alle mer penger enn før. Matematikerne gråt.', 'Suddenly everyone had more money than before. The mathematicians wept.', ['cash', 4]),
      ans('Rund alt ned til 6', 'Round everything down to 6', 'Hæren ble talt på nytt. Det manglet noen.', 'The army was counted again. Some were missing.', ['desert', 4]),
      ans('Henge opp en etterlysning', 'Put up a missing poster', 'Tallet 7 kom tilbake av seg selv, litt flau. Det hadde vært på ferie blant romertallene.', 'The number 7 came back by itself, a bit embarrassed. It had been on holiday among the Roman numerals.', ['gems', 7]),
    ]),
  ev('square_eggs', 'farmer', { nb: 'Firkantede egg', en: 'Square eggs' },
    { nb: 'Hønene har begynt å legge firkantede egg. De er lette å stable, men hønene ser veldig slitne ut.', en: 'The hens have started laying square eggs. They stack nicely, but the hens look very tired.' }, [
      ans('Bygg et hus av eggene', 'Build a house out of the eggs', 'Egghuset ble en turistattraksjon. Billettinntektene strømmer inn.', 'The egg house became a tourist attraction. Ticket money is pouring in.', ['cash', 4]),
      ans('Gi hønene ferie', 'Give the hens a holiday', 'Hønene dro til Florida og sender bare postkort. Ingen egg på en stund.', 'The hens went to Florida and only send postcards. No eggs for a while.', ['slump', 3]),
      ans('Lag firkantede omeletter til hæren', 'Make square omelettes for the army', 'Soldatene ble kantete, sterke og fryktinngytende. Flere vil være med.', 'The soldiers became angular, strong and terrifying. More want to join.', ['troops', 6]),
    ]),
  ev('snail', 'soldier', { nb: 'Kjempesneglen', en: 'The giant snail' },
    { nb: 'En snegle på størrelse med en buss står ved grensa og ber om innreisetillatelse. Den har ventet i tre år.', en: 'A snail the size of a bus is at the border asking for an entry permit. It has been waiting for three years.' }, [
      ans('Slipp den inn', 'Let it in', 'Sneglen la igjen et glinsende spor som viste seg å være ren olje.', 'The snail left a shiny trail that turned out to be pure oil.', ['cash', 5]),
      ans('Be den fylle ut ett skjema til', 'Ask it to fill out one more form', 'Sneglen fylte det ut. Det tok elleve år. Byråkratene dine gikk lei og sluttet.', 'The snail filled it out. It took eleven years. Your bureaucrats got bored and quit.', ['slump', 4]),
      ans('Gjør den til stridsvogn', 'Make it a tank', 'Verdens tregeste stridsvogn, men ingen tør å stå i veien for den.', 'The world’s slowest tank, but nobody dares stand in its way.', ['troops', 5]),
    ]),
  ev('chips_map', 'kid', { nb: 'Kartet i chipsposen', en: 'The map in the crisp bag' },
    { nb: 'I den siste chipsposen i Ohio ligger det et kart. Det viser veien til en enda større chipspose.', en: 'In the last bag of crisps in Ohio there is a map. It shows the way to an even bigger bag of crisps.' }, [
      ans('Følg kartet', 'Follow the map', 'Den enorme chipsposen var full av luft og én edelstein. Typisk.', 'The enormous bag was full of air and a single gem. Typical.', ['gems', 15]),
      ans('Spis kartet', 'Eat the map', 'Kartet smakte paprika. Nå vet magen din veien, men ikke du. Folk ler av deg.', 'The map tasted of paprika. Now your stomach knows the way, but you do not. People laugh at you.', ['slump', 2]),
      ans('Selg kartet til fienden', 'Sell the map to the enemy', 'Fienden marsjerte i ring i en uke. De ble svakere, og du ble rikere.', 'The enemy marched in circles for a week. They got weaker, and you got richer.', ['cash', 3]),
    ]),
  ev('streetlights', 'mayor', { nb: 'Gatelyktene krangler', en: 'The streetlights are arguing' },
    { nb: 'Gatelyktene krangler om hvem som lyser best. To av dem har sluttet å snakke sammen og blinker surt.', en: 'The streetlights are arguing about who shines best. Two of them stopped speaking and are blinking angrily.' }, [
      ans('Arranger en lyskonkurranse', 'Hold a shining contest', 'Lyktene lyste så sterkt at folk jobbet hele natta uten å merke det.', 'The lamps shone so brightly that people worked all night without noticing.', ['buff', 4]),
      ans('Skru av begge to', 'Switch them both off', 'I mørket stjal noen pengeskrinet. Lyktene så alt, men de nekter å si noe.', 'In the dark someone stole the cash box. The lamps saw everything, but refuse to talk.', ['loss', 3]),
      ans('Send dem i parterapi', 'Send them to couples therapy', 'Terapeuten var en lysbryter. Det gikk ikke bra.', 'The therapist was a light switch. It did not go well.', ['slump', 2]),
    ]),
  ev('backwards', 'soldier', { nb: 'Baklengs marsj', en: 'Backwards march' },
    { nb: 'Soldatene har lært seg å marsjere baklengs og nekter å slutte. De sier de ser fienden bedre sånn.', en: 'The soldiers have learned to march backwards and refuse to stop. They say they see the enemy better that way.' }, [
      ans('La dem holde på', 'Let them carry on', 'Fienden trodde hæren din var på vei hjem, og ble totalt overrumplet.', 'The enemy thought your army was heading home and was completely caught off guard.', ['medal', 1]),
      ans('Beordre dem til å marsjere sidelengs', 'Order them to march sideways', 'Sidelengs marsj førte rett ut i en myr. Noen er fortsatt der.', 'Sideways marching led straight into a bog. Some are still there.', ['desert', 4]),
      ans('Marsjer baklengs selv', 'March backwards yourself', 'Du rygget rett inn i en skattekiste. Hæren jublet baklengs.', 'You backed straight into a treasure chest. The army cheered backwards.', ['crate', 1]),
    ]),
  ev('bottled_tuesday', 'alien', { nb: 'Tirsdag på flaske', en: 'Tuesday in a bottle' },
    { nb: 'En fremmed selger «tirsdag på flaske». Han sier at én slurk gir deg en ekstra tirsdag.', en: 'A stranger is selling “Tuesday in a bottle”. He says one sip gives you an extra Tuesday.' }, [
      ans('Kjøp én flaske', 'Buy one bottle', 'Den ekstra tirsdagen brukte du til å tjene penger. Smart.', 'You spent the extra Tuesday making money. Smart.', ['cash', 4]),
      ans('Kjøp hele lageret', 'Buy his entire stock', 'Det var tirsdag i en hel måned. Alle ble deprimerte.', 'It was Tuesday for an entire month. Everyone got depressed.', ['slump', 5]),
      ans('Spør om han har lørdag', 'Ask if he has Saturday', 'Han så skuffet på deg og forsvant i en sky av mandag. Pengene dine også.', 'He looked at you with disappointment and vanished in a cloud of Monday. So did your money.', ['loss', 2]),
    ]),
  ev('dogs_hats', 'kid', { nb: 'Hundene står oppreist', en: 'The dogs stand upright' },
    { nb: 'Alle hundene i byen har begynt å gå på to bein. De ser veldig fornøyde ut og har kjøpt hatter.', en: 'All the dogs in town have started walking on two legs. They look very pleased and have bought hats.' }, [
      ans('Gi dem jobb i hæren', 'Give them jobs in the army', 'Hundene var lojale og raske, og de nektet aldri en ordre om å hente.', 'The dogs were loyal and fast, and never refused an order to fetch.', ['troops', 7]),
      ans('Forby hatter', 'Ban hats', 'Hundene streiket. Kattene tok over posten. Kaos.', 'The dogs went on strike. The cats took over the post office. Chaos.', ['slump', 4]),
      ans('Kjøp en hatt selv', 'Buy a hat yourself', 'Hundene fikk respekt for deg og viste deg hvor de har gravd ned edelsteiner.', 'The dogs gained respect for you and showed you where they buried gems.', ['gems', 12]),
    ]),
  ev('echo', 'farmer', { nb: 'Ekkoet svarer feil', en: 'The echo answers wrong' },
    { nb: 'Ekkoet i dalen har sluttet å gjenta det du sier. Når du roper «hei», svarer det «nei».', en: 'The echo in the valley no longer repeats what you say. When you shout “hello”, it answers “no”.' }, [
      ans('Rop «nei»', 'Shout “no”', 'Ekkoet svarte «hei» og ble din beste venn. Det synger for arbeiderne nå.', 'The echo answered “hello” and became your best friend. It sings for the workers now.', ['buff', 3]),
      ans('Krangle med ekkoet', 'Argue with the echo', 'Ekkoet vant. Det har alltid siste ord.', 'The echo won. It always has the last word.', ['slump', 3]),
      ans('Rop «penger»', 'Shout “money”', 'Ekkoet svarte «penger, penger, penger», og det regnet mynter fra fjellet.', 'The echo answered “money, money, money”, and coins rained from the mountain.', ['cash', 3]),
    ]),
  ev('soup_fountain', 'chef', { nb: 'Suppefontenen', en: 'The soup fountain' },
    { nb: 'Fontenen på torget spruter tomatsuppe. Det lukter godt, men duene har begynt å ta med skjeer.', en: 'The fountain in the square is spraying tomato soup. It smells great, but the pigeons have started bringing spoons.' }, [
      ans('Server suppe til hele hæren', 'Serve soup to the whole army', 'Varm suppe! Moralen skjøt i været, og flere meldte seg.', 'Hot soup! Morale soared, and more people enlisted.', ['troops', 6]),
      ans('Prøv å skru den av', 'Try to turn it off', 'Den eksploderte i krutonger. Ryddejobben kostet en formue.', 'It exploded in croutons. The clean-up cost a fortune.', ['loss', 3]),
      ans('Legg ut brød rundt fontenen', 'Put bread around the fountain', 'Folk kom fra hele landet for suppe og brød. Bygda går med overskudd.', 'People came from all over the country for soup and bread. The village is turning a profit.', ['buff', 4]),
    ]),
  ev('hiccups', 'soldier', { nb: 'Kanonene har hikke', en: 'The cannons have hiccups' },
    { nb: 'Alle kanonene har fått hikke. Hver gang de hikster, fyrer de av et lite popkorn.', en: 'All the cannons have hiccups. Every time they hiccup, they fire a little piece of popcorn.' }, [
      ans('Skrem dem', 'Scare them', 'Kanonene skvatt så mye at de traff blink på øvingsfeltet. Generalene er imponert.', 'The cannons jumped so hard they hit the bullseye on the range. The generals are impressed.', ['medal', 1]),
      ans('Gi dem vann opp ned', 'Give them water upside down', 'Kanonene ble våte og rustne. Reparasjonen var dyr.', 'The cannons got wet and rusty. The repairs were expensive.', ['loss', 3]),
      ans('Selg popkornet', 'Sell the popcorn', 'Popkorn fra krigsmaskiner ble en hit på kino.', 'War-machine popcorn became a hit at the cinema.', ['cash', 4]),
    ]),
  ev('button_rain', 'granny', { nb: 'Det regner knapper', en: 'It is raining buttons' },
    { nb: 'Det regner knapper. Store og små, noen med fire hull og noen med to. Ingen vet hvem de tilhører.', en: 'It is raining buttons. Big and small, some with four holes and some with two. Nobody knows whose they are.' }, [
      ans('Sy en kjempefrakk til hovedkvarteret', 'Sew a giant coat for HQ', 'Hovedkvarteret har aldri sett så stilig ut. Turister betaler for å ta bilder.', 'HQ has never looked so stylish. Tourists pay to take photos.', ['cash', 3]),
      ans('Trykk på alle knappene', 'Press all the buttons', 'Fingrene dine fikk superkrefter av all trykkingen.', 'Your fingers gained superpowers from all that pressing.', ['tap', 3]),
      ans('Send dem tilbake til himmelen', 'Mail them back to the sky', 'Porto til himmelen er dyrt. Veldig dyrt.', 'Postage to the sky is expensive. Very expensive.', ['loss', 3]),
    ]),
  ev('robot_love', 'robot', { nb: 'Robotkjærlighet', en: 'Robot romance' },
    { nb: 'En av robotene dine har forelsket seg i brødristeren i kantina. Den vil gifte seg.', en: 'One of your robots has fallen in love with the toaster in the canteen. It wants to get married.' }, [
      ans('Hold bryllupet', 'Hold the wedding', 'Et vakkert bryllup. Gjestene fikk ristet brød og ga gaver.', 'A beautiful wedding. The guests got toast and gave gifts.', ['gems', 15]),
      ans('Forby forholdet', 'Forbid the relationship', 'Roboten skriver dikt og nekter å jobbe. Brødristeren brenner alt.', 'The robot writes poems and refuses to work. The toaster burns everything.', ['slump', 4]),
      ans('Presenter roboten for mikrobølgeovnen', 'Introduce the robot to the microwave', 'Det ble et sjalusidrama med gnister. Kantina måtte bygges opp igjen.', 'It turned into a jealous drama with sparks. The canteen had to be rebuilt.', ['loss', 2]),
    ]),
  ev('ufo_milkbar', 'alien', { nb: 'UFO i melkebaren', en: 'A UFO in the milk bar' },
    { nb: 'Et romvesen har parkert UFO-en sin i melkebaren. Det bestiller milkshake og stirrer på kua.', en: 'An alien has parked its UFO in the milk bar. It orders a milkshake and stares at the cow.' }, [
      ans('Spander milkshaken', 'Buy it the milkshake', 'Romvesenet var så takknemlig at det ga deg teknologi fra fremtiden.', 'The alien was so grateful that it gave you technology from the future.', ['pu']),
      ans('Gi det regningen', 'Hand it the bill', 'Romvesenet betalte med en mynt fra en annen galakse, og tok med seg kassa som veksel.', 'The alien paid with a coin from another galaxy, and took the till as change.', ['loss', 2]),
      ans('Spør om å få prøvekjøre UFO-en', 'Ask to test-drive the UFO', 'Du kjørte rett inn i hønsehuset. Hønene har sagt opp.', 'You drove straight into the henhouse. The hens have resigned.', ['slump', 3]),
    ]),
  ev('star_word', 'scientist', { nb: 'Stjernene staver', en: 'The stars spell something' },
    { nb: 'Stjernene har byttet plass for å stave et ord. Ingen klarer å lese det. Det ser ut som «blørk».', en: 'The stars have rearranged themselves to spell a word. Nobody can read it. It looks like “blörk”.' }, [
      ans('Svar med et ord av lommelykter', 'Answer with a word made of torches', 'Stjernene ble imponert og sendte en meteoritt full av gaver.', 'The stars were impressed and sent a meteorite full of gifts.', ['crate', 1]),
      ans('Lat som du forstår det', 'Pretend you understand', 'Du sa at det betyr «skatt». Nå må alle betale skatt til stjernene.', 'You said it means “taxes”. Now everyone pays taxes to the stars.', ['loss', 3]),
      ans('Lag en sang om «blørk»', 'Write a song about “blörk”', 'Sangen gikk viralt i hele galaksen.', 'The song went viral across the whole galaxy.', ['cash', 4]),
    ]),
  ev('gravity', 'scientist', { nb: 'Tyngdekraften tar pause', en: 'Gravity takes a break' },
    { nb: 'Tyngdekraften har begynt å ta kaffepause hver tirsdag klokka tre. Da flyter alt, også kaffen.', en: 'Gravity has started taking a coffee break every Tuesday at three. Everything floats, including the coffee.' }, [
      ans('Bruk pausen til å flytte tunge ting', 'Use the break to move heavy things', 'Du flyttet hele lageret på fem minutter. Effektivt!', 'You moved the whole warehouse in five minutes. Efficient!', ['buff', 4]),
      ans('Klag til tyngdekraften', 'Complain to gravity', 'Tyngdekraften tok det personlig og ble dobbelt så tung en hel dag. Alle var slitne.', 'Gravity took it personally and doubled itself for a whole day. Everyone was exhausted.', ['slump', 3]),
      ans('Hold et flytende diskotek', 'Hold a floating disco', 'Alle danset i lufta. Noen soldater danset litt for høyt og kom aldri ned.', 'Everyone danced in mid-air. Some soldiers danced a bit too high and never came down.', ['desert', 3]),
    ]),
  ev('black_hole', 'chef', { nb: 'Et svart hull i kantina', en: 'A black hole in the canteen' },
    { nb: 'Det har dukket opp et lite svart hull i kantina. Det spiser bare teskjeer, og det er alltid sultent.', en: 'A tiny black hole has appeared in the canteen. It eats only teaspoons, and it is always hungry.' }, [
      ans('Gi det alle teskjeene', 'Feed it all the teaspoons', 'Hullet ble mett og spyttet ut noe skinnende som takk.', 'The hole got full and spat out something shiny as thanks.', ['gems', 20]),
      ans('Gi det en gaffel', 'Give it a fork', 'Det svarte hullet ble fornærmet og sugde inn lønnskonvolutten.', 'The black hole was offended and sucked in the payroll envelope.', ['loss', 3]),
      ans('Gjør det til en søppelbøtte', 'Turn it into a rubbish bin', 'Verdens beste søppelbøtte! Bygda er renere, og folk jobber gladere.', 'The world’s best rubbish bin! The village is cleaner and people work happier.', ['buff', 3]),
    ]),
  ev('shadow_leave', 'soldier', { nb: 'Skyggen vil ha fri', en: 'Your shadow wants time off' },
    { nb: 'Skyggen din har søkt om permisjon. Den sier at den har fulgt deg i årevis uten en eneste fridag.', en: 'Your shadow has applied for leave. It says it has followed you for years without a single day off.' }, [
      ans('Gi den permisjon', 'Grant the leave', 'Skyggen kom uthvilt tilbake med suvenirer og en kasse fra Hawaii.', 'Your shadow came back rested, with souvenirs and a crate from Hawaii.', ['crate', 1]),
      ans('Avslå søknaden', 'Reject the application', 'Skyggen streiker. Uten skygge ser du litt skummel ut, og soldater rømmer.', 'Your shadow is on strike. Without a shadow you look a bit scary, and soldiers desert.', ['desert', 3]),
      ans('Gi skyggen en forfremmelse', 'Give your shadow a promotion', 'Skyggen ble general for skyggehæren. Fienden ser dobbelt så mange soldater.', 'Your shadow became general of the shadow army. The enemy sees twice as many soldiers.', ['medal', 1]),
    ]),
  ev('whisper_chest', 'farmer', { nb: 'Kisten som hvisker', en: 'The whispering chest' },
    { nb: 'En kiste har skylt i land. Den hvisker «vær så snill, ikke åpne meg» veldig høflig.', en: 'A chest has washed ashore. It whispers “please don’t open me” very politely.' }, [
      ans('Åpne den', 'Open it', 'Inni lå en mindre kiste som hvisket «takk». Og en powerup.', 'Inside was a smaller chest that whispered “thank you”. And a power-up.', ['pu']),
      ans('La den være i fred', 'Leave it alone', 'Kisten ble stående og hviske hele natta. Ingen fikk sove.', 'The chest stood there whispering all night. Nobody could sleep.', ['slump', 3]),
      ans('Hvisk tilbake', 'Whisper back', 'Dere hvisket så lenge at du glemte å passe på pengene.', 'You whispered for so long that you forgot to watch the money.', ['loss', 2]),
    ]),
  ev('mayor_chicken', 'granny', { nb: 'Ordføreren er en kylling', en: 'The mayor is a chicken' },
    { nb: 'Det viser seg at ordføreren har vært en kylling i trenchcoat hele tiden. Folk vil vite hva du mener.', en: 'It turns out the mayor has been a chicken in a trench coat all along. People want to know what you think.' }, [
      ans('Gi kyllingen fire år til', 'Give the chicken four more years', 'Kyllingen innførte gratis korn til alle. Økonomien blomstret.', 'The chicken introduced free grain for everyone. The economy flourished.', ['buff', 5]),
      ans('Krev å se under trenchcoaten', 'Demand to see under the trench coat', 'Det var tre kyllinger til. De har gått under jorda med kommunekassa.', 'There were three more chickens. They have gone underground with the town treasury.', ['loss', 4]),
      ans('Kjøp en trenchcoat til deg selv', 'Buy yourself a trench coat', 'Nå tror alle at du er tre kyllinger. Respekten økte merkbart.', 'Now everyone thinks you are three chickens. Respect increased noticeably.', ['gems', 10]),
    ]),
  ev('potato_hq', 'kid', { nb: 'Ryktet om poteten', en: 'The potato rumour' },
    { nb: 'Et rykte sier at hovedkvarteret egentlig er en veldig stor potet. Noen har tatt med smør.', en: 'A rumour says HQ is actually a very big potato. Someone has brought butter.' }, [
      ans('Bekreft ryktet', 'Confirm the rumour', 'Potetturister strømmer til fra hele verden. Billettsalget er rekordhøyt.', 'Potato tourists flock in from all over the world. Ticket sales are at a record high.', ['cash', 4]),
      ans('Avkreft ryktet i en tale', 'Deny it in a speech', 'Talen var så kjedelig at halve hæren sovnet og ble liggende.', 'The speech was so boring that half the army fell asleep and stayed down.', ['desert', 3]),
      ans('Smak på veggen', 'Taste the wall', 'Det var en potet. Nå er alle forvirret, men mette og kampklare.', 'It was a potato. Now everyone is confused, but full and ready for battle.', ['troops', 5]),
    ]),
  ev('penguin_suit', 'mayor', { nb: 'Pingvinen i dress', en: 'The penguin in a suit' },
    { nb: 'En pingvin i dress har kjøpt halve hovedgata. Den snakker bare om renter og ser deg dypt inn i øynene.', en: 'A penguin in a suit has bought half of Main Street. It only talks about interest rates and stares deep into your eyes.' }, [
      ans('Selg den resten av gata', 'Sell it the rest of the street', 'Pingvinen betalte kontant, i fisk. Fisken var verdt mer enn gata.', 'The penguin paid cash, in fish. The fish was worth more than the street.', ['cash', 5]),
      ans('Utfordre den til sjakk', 'Challenge it to chess', 'Pingvinen vant på tre trekk og tok løperen din. Og pengene.', 'The penguin won in three moves and took your bishop. And your money.', ['loss', 3]),
      ans('Spør hvor den kjøpte dressen', 'Ask where it bought the suit', 'Skredderen ga deg rabatt på uniformer. Hæren ser skarpere ut enn noensinne.', 'The tailor gave you a discount on uniforms. The army looks sharper than ever.', ['medal', 1]),
    ]),
  ev('opposite_day', 'kid', { nb: 'Motsattdag', en: 'Opposite Day' },
    { nb: 'Noen har erklært motsattdag. Ja betyr nei, opp er ned, og sjefen er … deg? Eller ikke?', en: 'Someone has declared Opposite Day. Yes means no, up is down, and the boss is … you? Or not?' }, [
      ans('Si «nei» til alt', 'Say “no” to everything', 'Alle hørte «ja». Det ble fest, og folk jobbet dobbelt så hardt for å feire.', 'Everyone heard “yes”. There was a party, and people worked twice as hard to celebrate.', ['buff', 4]),
      ans('Si «ja» til alt', 'Say “yes” to everything', 'Alle hørte «nei». Butikkene stengte i protest.', 'Everyone heard “no”. The shops closed in protest.', ['slump', 4]),
      ans('Gå baklengs til jobben', 'Walk backwards to work', 'Du havnet hjemme igjen. Der sto det en kasse i gangen.', 'You ended up back home. There was a crate in the hallway.', ['crate', 1]),
    ]),
  ev('singing_corn', 'farmer', { nb: 'Maisen synger', en: 'The corn is singing' },
    { nb: 'Maisåkeren har begynt å synge. Bare én sang, om og om igjen. Ingen kjenner melodien, men alle nynner med.', en: 'The cornfield has started singing. Just one song, over and over. Nobody knows the tune, but everyone hums along.' }, [
      ans('Gi ut maisens album', 'Release the corn’s album', '«Kolbeklassikere» gikk rett til topps på listene.', '“Cob Classics” went straight to number one.', ['cash', 4]),
      ans('Lær maisen en ny sang', 'Teach the corn a new song', 'Maisen lærte seg nasjonalsangen til fienden. Pinlig.', 'The corn learned the enemy’s national anthem. Embarrassing.', ['slump', 3]),
      ans('Syng med', 'Sing along', 'Du traff en tone som fikk fingertuppene til å krible av kraft.', 'You hit a note that made your fingertips tingle with power.', ['tap', 3]),
    ]),
  ev('tiny_dragon', 'kid', { nb: 'En veldig liten drage', en: 'A very small dragon' },
    { nb: 'En drage på størrelse med et viskelær har flyttet inn i blyantholderen din. Den spruter små flammer når den er sulten.', en: 'A dragon the size of an eraser has moved into your pencil holder. It spits tiny flames when it is hungry.' }, [
      ans('Adopter den', 'Adopt it', 'Dragen vokste ikke, men den lærte seg å varme kaffe. Alle i hovedkvarteret elsker den.', 'The dragon did not grow, but it learned to heat coffee. Everyone at HQ loves it.', ['buff', 3]),
      ans('Mat den med blyanter', 'Feed it pencils', 'Den spiste alle blyantene, alle kontraktene og pengene i skuffen.', 'It ate every pencil, every contract and the money in the drawer.', ['loss', 3]),
      ans('Lær den å fly i formasjon', 'Teach it to fly in formation', 'Dragen ble verdens minste flyvåpen. Fienden ler – helt til den spytter.', 'The dragon became the world’s smallest air force. The enemy laughs – until it spits.', ['troops', 4]),
    ]),
  ev('late_mirror', 'granny', { nb: 'Speilet er forsinket', en: 'The mirror is running late' },
    { nb: 'Speilet i gangen er tre sekunder forsinket. Folk står og vinker til seg selv og venter.', en: 'The hallway mirror is three seconds late. People stand there waving at themselves, waiting.' }, [
      ans('Selg det som tidsmaskin', 'Sell it as a time machine', 'En samler betalte godt. Han oppdaget feilen tre sekunder for sent.', 'A collector paid well. He noticed the flaw three seconds too late.', ['cash', 4]),
      ans('Vent på speilbildet ditt', 'Wait for your reflection', 'Speilbildet ditt kom aldri. Det er visst på vei til Kentucky med lommeboka di.', 'Your reflection never showed up. Apparently it is on its way to Kentucky with your wallet.', ['loss', 3]),
      ans('Snu speilet mot veggen', 'Turn the mirror to face the wall', 'Veggen så seg selv for første gang og begynte å gråte. Folk ble rørt og la igjen gaver.', 'The wall saw itself for the first time and started crying. People were moved and left gifts.', ['gems', 10]),
    ]),
  ev('cheese_moon', 'scientist', { nb: 'Månen er ost', en: 'The Moon is cheese' },
    { nb: 'Forskerne har bekreftet at månen faktisk er ost. Nå krangler alle om hvilken ost.', en: 'Scientists have confirmed that the Moon really is cheese. Now everyone is arguing about which cheese.' }, [
      ans('Det er brunost', 'It is brown cheese', 'Nordmennene i hæren jublet så høyt at de vant et slag ved et uhell.', 'The Norwegians in the army cheered so loudly that they won a battle by accident.', ['medal', 1]),
      ans('Det er sveitserost', 'It is Swiss cheese', 'Hullene i månen ble en unnskyldning for å la alle hullene i budsjettet være.', 'The holes in the Moon became an excuse to leave all the holes in the budget.', ['loss', 3]),
      ans('Smak på den', 'Taste it', 'Det var en helt ny ost. Du kalte den «Ohio-gul», og den selger som hakka møkk.', 'It was a brand-new cheese. You named it “Ohio Yellow”, and it sells like hot cakes.', ['cash', 5]),
    ]),
  ev('invisible', 'soldier', { nb: 'Den usynlige soldaten', en: 'The invisible soldier' },
    { nb: 'En soldat påstår at han er usynlig. Ingen kan se ham, men alle hører at han står i middagskøen.', en: 'A soldier claims he is invisible. Nobody can see him, but everyone hears him in the dinner queue.' }, [
      ans('Send ham på spionoppdrag', 'Send him on a spy mission', 'Han kom tilbake med fiendens planer. Det sier han i hvert fall.', 'He came back with the enemy’s plans. At least, that is what he says.', ['medal', 1]),
      ans('Gi ham dobbel porsjon, for sikkerhets skyld', 'Give him a double portion, just in case', 'Nå sier halve hæren at de er usynlige. Matbudsjettet sprakk.', 'Now half the army claims to be invisible. The food budget burst.', ['loss', 3]),
      ans('Si at du ikke tror på ham', 'Say you do not believe him', 'Han ble så lei seg at han ble usynlig på ordentlig. Vennene hans også.', 'He got so upset that he became properly invisible. So did his friends.', ['desert', 4]),
    ]),
  ev('electric_glove', 'scientist', { nb: 'Den elektriske hansken', en: 'The electric glove' },
    { nb: 'Forskeren din har oppfunnet en hanske som gjør fingre elektriske. Den er ikke testet. Den summer.', en: 'Your scientist has invented a glove that makes fingers electric. It has not been tested. It hums.' }, [
      ans('Test hansken', 'Test the glove', 'Fingeren din lyser blått. Hvert trykk smeller som torden!', 'Your finger glows blue. Every tap cracks like thunder!', ['tap', 4]),
      ans('Gi hansken til gåsa', 'Give the glove to the goose', 'Gåsa er nå elektrisk og sint. Ingen tør å gå på jobb.', 'The goose is now electric and angry. Nobody dares go to work.', ['slump', 4]),
      ans('Selg patentet', 'Sell the patent', 'Et firma kjøpte det for mye penger. De har ikke testet det, de heller.', 'A company bought it for a lot of money. They have not tested it either.', ['cash', 3]),
    ]),
  ev('sleepwalk', 'granny', { nb: 'Hovedkvarteret går i søvne', en: 'HQ is sleepwalking' },
    { nb: 'I natt gikk hovedkvarteret i søvne. I morges sto det tre meter lenger til venstre og så skyldig ut.', en: 'Last night HQ went sleepwalking. This morning it stood three metres further left, looking guilty.' }, [
      ans('Flytt alt annet tre meter til venstre', 'Move everything else three metres left', 'Byen har aldri vært ryddigere. Folk finner endelig ting.', 'The town has never been tidier. People can finally find things.', ['buff', 4]),
      ans('Bind hovedkvarteret fast', 'Tie HQ down', 'Hovedkvarteret ble fornærmet og gir bare halvparten når du trykker på det.', 'HQ got offended and only gives half when you tap it.', ['tapdown', 3]),
      ans('Spør hvor det skulle', 'Ask where it was going', 'Det var på vei til en kasse som ligger begravd under plenen. Smart bygning.', 'It was heading for a crate buried under the lawn. Clever building.', ['crate', 1]),
    ]),
  ev('upside_rain', 'farmer', { nb: 'Regn som går oppover', en: 'Rain falling upwards' },
    { nb: 'Det regner oppover. Vannpyttene tømmer seg opp i skyene, og paraplyene er helt forvirret.', en: 'It is raining upwards. The puddles are emptying into the clouds, and the umbrellas are completely confused.' }, [
      ans('Snu alle paraplyene', 'Turn all the umbrellas upside down', 'Paraplyene fanget det som falt opp: vann, mynter og en edelstein.', 'The umbrellas caught everything falling up: water, coins and a gem.', ['gems', 12]),
      ans('Stå på hodet', 'Stand on your head', 'Nå regner det helt normalt for deg. For alle andre ser du rar ut. De jobber mindre.', 'Now the rain looks perfectly normal to you. Everyone else thinks you look strange. They work less.', ['slump', 3]),
      ans('Selg regnet til ørkenen', 'Sell the rain to the desert', 'Ørkenen betalte godt for omvendt regn. Den har aldri sett noe lignende.', 'The desert paid well for reverse rain. It has never seen anything like it.', ['cash', 4]),
    ]),
  ev('talking_cow', 'farmer', { nb: 'Kua kan latin', en: 'The cow speaks Latin' },
    { nb: 'Kua Berit har begynt å snakke latin. Hun krever fagforening og en større bås med utsikt.', en: 'Berit the cow has started speaking Latin. She demands a union and a bigger stall with a view.' }, [
      ans('Gi Berit utsikten', 'Give Berit the view', 'Berit melker gull nå. Ikke spør hvordan.', 'Berit gives golden milk now. Don’t ask how.', ['cash', 5]),
      ans('Svar henne på latin', 'Answer her in Latin', 'Du kan ikke latin. Du sa noe om skattkammeret. Berit tok det bokstavelig.', 'You do not know Latin. You said something about the treasury. Berit took it literally.', ['loss', 3]),
      ans('Gjør Berit til rådgiver', 'Make Berit an advisor', 'Berits første råd var genialt: «Veni, vidi, muu.» Soldatene elsker det.', 'Berit’s first piece of advice was brilliant: “Veni, vidi, moo.” The soldiers love it.', ['medal', 1]),
    ]),
  ev('lost_sock', 'kid', { nb: 'Sokkenes hemmelighet', en: 'The secret of the socks' },
    { nb: 'Et barn har funnet stedet der alle de forsvunne sokkene havner. Det er en hel by der, med borgermester.', en: 'A child has found the place where all the lost socks end up. There is a whole town there, with a mayor.' }, [
      ans('Inngå en handelsavtale', 'Sign a trade deal', 'Sokkebyen betaler i ull og hemmeligheter. Begge deler er verdt mye.', 'Sock Town pays in wool and secrets. Both are worth a lot.', ['cash', 4]),
      ans('Krev sokkene tilbake', 'Demand the socks back', 'Sokkebyen erklærte krig. Den var kort og lukta vondt. Du tapte.', 'Sock Town declared war. It was short and smelled bad. You lost.', ['desert', 3]),
      ans('Send dem én sokk til, som gave', 'Send them one more sock as a gift', 'Borgermesteren ble så glad at han sendte en hel kasse med gaver.', 'The mayor was so pleased that he sent a whole crate of gifts.', ['crate', 1]),
    ]),
  ev('time_bakery', 'chef', { nb: 'Tiden står stille i bakeriet', en: 'Time stands still in the bakery' },
    { nb: 'Tiden har stoppet i bakeriet. Brødene har vært nybakte siden 1994, og bakeren har sluttet å eldes.', en: 'Time has stopped in the bakery. The bread has been fresh out of the oven since 1994, and the baker has stopped ageing.' }, [
      ans('Selg evig ferskt brød', 'Sell eternally fresh bread', 'Kunder står i kø fra hele landet. Brødet blir aldri tørt, og kassa blir aldri tom.', 'Customers queue from all over the country. The bread never goes stale, and the till never runs dry.', ['buff', 5]),
      ans('Start klokka igjen', 'Restart the clock', 'Alle de 30 årene kom på én gang. Bakeren ble pensjonist på flekken.', 'All 30 years arrived at once. The baker retired on the spot.', ['slump', 3]),
      ans('Gå inn og spis et brød', 'Go in and eat a loaf', 'Brødet ga deg krefter fra 1994. Fingrene dine er raske som en gammel spillkonsoll.', 'The bread gave you the power of 1994. Your fingers are as fast as an old games console.', ['tap', 3]),
    ]),
  ev('balloon_army', 'soldier', { nb: 'Ballonghæren', en: 'The balloon army' },
    { nb: 'En leverandør leverte ved en feil 10 000 oppblåsbare soldater. De vaier i vinden og ser ganske skumle ut.', en: 'A supplier accidentally delivered 10,000 inflatable soldiers. They sway in the wind and look rather scary.' }, [
      ans('Still dem opp ved grensa', 'Line them up at the border', 'Fienden trodde hæren din var tre ganger så stor. Noen av dem byttet side.', 'The enemy thought your army was three times bigger. Some of them switched sides.', ['troops', 7]),
      ans('Send dem tilbake', 'Send them back', 'Returfrakten for 10 000 ballonger var overraskende dyr.', 'Return shipping for 10,000 balloons was surprisingly expensive.', ['loss', 3]),
      ans('Slipp dem løs', 'Let them all go', 'Ballongene fløy til fiendens by og landet på taket. Det ble stor panikk – hos dere også.', 'The balloons floated to the enemy town and landed on the roofs. There was great panic – in your town too.', ['slump', 3]),
    ]),
];
export const EVENT_BY_ID = Object.fromEntries(EVENTS.map((x) => [x.id, x]));

// ---------- planlegging ----------
const shuffle = (n, rnd) => { const a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export function scheduleNext(s, now = Date.now(), rnd = Math.random) { s.ev.next = now + EV_MIN + rnd() * (EV_MAX - EV_MIN); }
// Er det tid for en ny hendelse? (kalles jevnlig fra spill-løkka)
export function eventDue(s, now = Date.now()) {
  if (!s || !s.ev || s.ev.cur || (s.tut || 0) < 5 || ((s.stats && s.stats.playTime) || 0) < EV_PLAYTIME) return false;
  if (!s.ev.next) { s.ev.next = now + EV_FIRST; return false; }
  return now >= s.ev.next;
}
export function pickEvent(s, rnd = Math.random) {
  const recent = new Set(s.ev.recent || []);
  let pool = EVENTS.filter((x) => !recent.has(x.id));
  if (!pool.length) pool = EVENTS;
  return pool[Math.floor(rnd() * pool.length)];
}
export function startEvent(s, now = Date.now(), rnd = Math.random, id = null) {
  const x = (id && EVENT_BY_ID[id]) || pickEvent(s, rnd);
  s.ev.cur = { id: x.id, order: shuffle(x.a.length, rnd), at: now };
  return x;
}
export const currentEvent = (s) => (s.ev && s.ev.cur && EVENT_BY_ID[s.ev.cur.id]) || null;

// ---------- virkninger ----------
// Inntekt per sekund uten midlertidige boost (minst et lite beløp tidlig i spillet)
export const steadyIncome = (s, now = Date.now()) => Math.max(baseIncome(s) * incomeMult(s), tapValue(s, now) * 1.5, 2);
const bestUnit = (s) => {
  const owned = UNITS.filter((u) => (s.units[u.id] || 0) > 0);
  if (owned.length) return owned.slice().sort((a, b) => unitPower(s, b, 1) - unitPower(s, a, 1))[0];
  return UNITS.filter((u) => u.era <= s.era)[0] || UNITS[0];
};
// Bruker virkningen fx på spillet og returnerer et sammendrag til skjermen
export function applyFx(s, fx, now = Date.now(), rnd = Math.random) {
  const [kind, val = 0] = fx;
  const out = { kind, val, good: GOOD_FX.has(kind), amount: 0 };
  const perSec = steadyIncome(s, now);
  switch (kind) {
    case 'cash': out.amount = perSec * 60 * val; s.money += out.amount; s.totalEarned += out.amount; break;
    case 'loss': out.amount = Math.min(s.money * 0.15, perSec * 60 * val); s.money = Math.max(0, s.money - out.amount); break;
    case 'gems': out.amount = val; s.gems = (s.gems || 0) + val; break;
    case 'buff': case 'slump': s.ev.buff.inc = { m: BUFF[kind], until: now + val * 60000 }; out.amount = BUFF[kind]; break;
    case 'tap': case 'tapdown': s.ev.buff.tap = { m: BUFF[kind], until: now + val * 60000 }; out.amount = BUFF[kind]; break;
    case 'pu': out.pu = grantRandom(s, rnd); break;
    case 'crate': addCrate(s, 'wood', Math.max(1, val)); out.amount = Math.max(1, val); break;
    case 'medal': s.medals = (s.medals || 0) + val; s.medalsEarned = (s.medalsEarned || 0) + val; out.amount = val; break;
    case 'troops': case 'desert': {
      const u = bestUnit(s);
      const have = s.units[u.id] || 0;
      out.unit = u;
      if (kind === 'troops') {
        out.amount = Math.max(1, Math.floor(have * val / 100));
        s.units[u.id] = have + out.amount;
      } else {
        out.amount = have >= 2 ? Math.max(1, Math.floor(have * val / 100)) : 0;
        if (!out.amount) return applyFx(s, ['loss', 2], now, rnd); // ingen å miste – det koster penger i stedet
        s.units[u.id] = have - out.amount;
        s.stats.unitsLost = (s.stats.unitsLost || 0) + out.amount;
      }
      break;
    }
    default: break;
  }
  return out;
}
// Spilleren valgte svaret som står på plass «pos» på skjermen
export function answerEvent(s, pos, now = Date.now(), rnd = Math.random) {
  const x = currentEvent(s);
  if (!x) { s.ev.cur = null; return null; }
  const idx = s.ev.cur.order[pos];
  const a = x.a[idx];
  if (!a) return null;
  const res = applyFx(s, a.fx, now, rnd);
  s.ev.recent = [...(s.ev.recent || []).filter((id) => id !== x.id), x.id].slice(-RECENT);
  s.ev.n = (s.ev.n || 0) + 1;
  s.stats.events = (s.stats.events || 0) + 1;
  s.ev.cur = null;
  scheduleNext(s, now, rnd);
  return { event: x, answer: a, res };
}
