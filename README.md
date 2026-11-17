# Take over the world Ohio

Et fargerikt tycoon-krigsspill for mobil. Du starter som en liten bygd i Ohio, samler en milits og tar over
Ohio by for by. Så venter USA, Nord-Amerika, Sør-Amerika og resten av jorda – før romvesener invaderer
solsystemet og krigen flytter ut blant planetene.

Spillet er en installerbar web-app (PWA): det kjører i nettleseren på iPhone og Android, kan legges på
hjemskjermen som en vanlig app, og fungerer uten nett etter første besøk. All grafikk er håndtegnet SVG i
tegneseriestil, og lydene lages direkte i nettleseren – det er ingen bilde- eller lydfiler.

## Slik spiller du

1. **Trykk på hovedkvarteret** (låven) for å tjene penger.
2. **Bygg** økonomi: maisåkre, kufjøs, fabrikker, banker … De tjener penger hele tiden, også når du er borte
   (opptil 8 timer).
3. **Hær**: rekrutter enheter. Hver enhetstype gir hærstyrke.
4. **Kart**: velg et område og trykk **Angrip!** Vinnersjansen vises i prosent. Med 1,5 ganger så stor hær som
   forsvaret er seieren sikker, og du mister færre soldater. Taper du, blir fienden svekket til neste gang.
5. Hvert område du erobrer gir mer inntekt. Ta alle områdene i et kapittel for å låse opp neste kapittel med
   nye bygninger og enheter.

Tips:

- **Milepæler**: når du eier 10, 25, 50, 100 … av noe, dobles effekten.
- **Forsyningskasser** faller ned med fallskjerm av og til. Trykk på dem for penger eller ×3 inntekt i 30 sekunder.
- **Trykk-kraft** kan oppgraderes, så hvert trykk gir mer.
- **General Buckeye** (Ohio-nøtta med generalhatt) viser deg hva du skal gjøre i starten.

## Kapitlene

| # | Kapittel | Mål | Nye enheter |
|---|----------|-----|-------------|
| 1 | Ohio | Lima, Dayton, Toledo, Athens, Cincinnati, Akron, Cleveland, Columbus | Milits, jeger, monstertruck |
| 2 | USA | Ti regioner, fra Midtvesten til Washington D.C. | Soldat, stridsvogn, helikopter |
| 3 | Nord-Amerika | Karibia, Mellom-Amerika, Mexico, Canada, Grønland | Jagerfly, slagskip |
| 4 | Sør-Amerika | Colombia til Brasil | Dronesverm, hangarskip |
| 5 | Hele jorda | Norden, Europa, Afrika, Asia, Oseania – og Keiserpingvinen i Antarktis | Kamprobot, superrakett |
| 6 | Solsystemet | Månen, Mars, Venus … Pluto, alle okkupert av romvesener | Romsoldat, romjager, laserkanon |
| 7 | Alien-galaksen | Seks alien-planeter og Keiser Zorgons moderskip | Mega-mech, Ohio-stjernen |

Når universet er erobret kan du starte en ny runde med permanent bonus (+50 % inntekt og styrke per runde).

En effektiv spiller bruker omtrent to timer på hele kampanjen, og litt mer uten å trykke mye. Spillet lagres
automatisk på enheten.

Språk: norsk (standard) og engelsk, valgbart i innstillingene.

## Spill på mobilen

Den ferdige appen ligger i mappa [`docs/`](docs/). Den enkleste måten å få en lenke du kan åpne på telefonen,
er GitHub Pages:

1. Gå til repoet på GitHub → **Settings** → **Pages**.
2. Under *Build and deployment* velger du **Deploy from a branch**.
3. Velg grenen (for eksempel `main` etter at endringene er slått sammen) og mappa **`/docs`**, og trykk **Save**.
4. Etter et minutt får du en adresse som `https://<brukernavn>.github.io/Ohio/`.

Legg spillet på hjemskjermen:

- **iPhone/iPad (Safari):** trykk på Del-knappen og velg *Legg til på Hjem-skjerm*.
- **Android (Chrome):** åpne menyen (⋮) og velg *Installer app* eller *Legg til på startsiden*.
  Inne i spillet finnes også en installer-knapp under innstillinger (tannhjulet) når nettleseren støtter det.

Du kan også åpne `docs/index.html` direkte i en nettleser på PC-en.

## For utviklere

Spillet er skrevet i ren JavaScript uten rammeverk. Byggesteget pakker alt (kode, stil, fonter) inn i én
HTML-fil på rundt 275 KB.

```
src/
  js/main.js      grensesnitt, spill-løkke, lagring
  js/engine.js    spillmotor (ren logikk, ingen DOM) – økonomi, kamp, lagring/gjenoppretting
  js/data.js      kapitler, regioner, bygninger og enheter (tekst på norsk og engelsk)
  js/balance.js   priser, inntekt, styrke og forsvar (generert av simulatoren)
  js/art.js       all grafikk som SVG: enheter, bygninger, hovedkvarter, maskot, planeter, ikoner
  js/mapdata.js   forenklede kart (generert fra kartdata)
  js/i18n.js      tekster og tallformatering
  js/audio.js     lydeffekter med Web Audio
  css/style.css   tegneserietemaet
tools/
  build.mjs       bygger docs/ (PWA) og dist/artifact.html
  build-maps.mjs  lager kartene fra US Census- og Natural Earth-data
  simulate.mjs    simulerer en spiller og balanserer spillet
  icons.mjs       lager app-ikonene fra logoen
assets/           fonter (med lisenser) og app-ikoner
docs/             ferdig bygget app (dette er det som publiseres)
```

Kommandoer (Node 18+):

```sh
npm install          # henter byggeverktøy og kartdata
npm run build        # bygger docs/index.html, manifest, service worker og dist/artifact.html
npm run maps         # lager src/js/mapdata.js på nytt
npm run sim          # balanserer spillet på nytt og skriver src/js/balance.js
CHECK=1 npm run sim  # viser bare hvor lang tid hvert område tar med dagens tall
```

Balansen er laget med en simulator: den spiller spillet med en fornuftig strategi (1,5 trykk per sekund) og
justerer forsvaret til hvert område slik at hver erobring tar omtrent ønsket tid, fra cirka 30 sekunder for
første by til et par minutter i verdensrommet. Nye bygninger og enheter i hvert kapittel prises ut fra
inntekten spilleren har når kapitlet starter. Ønsket tempo står øverst i `tools/simulate.mjs`.

For testing: åpne spillet med `#debug` på slutten av adressen. Da finnes `window.__ohio` i konsollen med
hjelpere som `give(1e6)`, `power(100)`, `win()` og `era(4)`.

## Lisenser og kreditering

- Kartdata: [US Census Bureau](https://www.census.gov/) via `us-atlas` og [Natural Earth](https://www.naturalearthdata.com/)
  via `world-atlas` – offentlig eie.
- Fonter: [Luckiest Guy](https://fonts.google.com/specimen/Luckiest+Guy) (Apache 2.0) og
  [Fredoka](https://fonts.google.com/specimen/Fredoka) (SIL Open Font License 1.1). Lisensene ligger i `assets/fonts/`.
