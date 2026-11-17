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
- **Reisen** (Kart → Reisen, eller «Se hele reisen» på Base) viser hele spillet som et tre: alle 7 kapitler og
  60 områder, og hvor du er nå.
- **Topp** (egen fane) er leaderboardet: konkurrer mot venner og alle andre, legg til venner med vennekode og logg
  inn med Facebook eller Apple.

## Butikk, skins, lootkasser og reklame

- **Skins** i fire kategorier: hær (farger på alle enhetene), flagg (spillerflagget og fargen på erobret land på
  kartet), hovedkvarter og hatter til General Buckeye. 39 skins fordelt på fem sjeldenhetsgrader: Vanlig,
  Sjelden, Episk, Legendarisk og Mytisk. Skins er bare utseende – de gir ingen fordel i kamp.
- **Mine ting** (Butikk → Mine ting) viser kassene og skinsene du eier. Kjøpte kasser havner her, så du kan åpne dem
  med en gang eller spare dem til senere. Du får også en gullkasse hver gang du fullfører et kapittel.
- **Lootkasser**: trekasse (1 skin), gullkasse (3 skins, minst Sjelden) og kosmisk kasse (5 skins, minst Episk).
  Sjansene vises i spillet («Se sjansene»). Legendarisk eller bedre er garantert minst hvert 20. skin, nye skins
  prioriteres, og duplikater blir til edelstener.
- **Edelstener** tjenes ved å erobre områder, fullføre kapitler, fra forsyningskasser og ved å se reklame – og kan
  kjøpes i butikken. De brukes på lootkasser og «tidshopp» (få 1 eller 4 timer med inntekt med en gang).
- **Belønningsreklame** (frivillig): gratis trekasse hvert 30. minutt, +30 edelstener (8 per dag), 2× inntekt i
  10 minutter, dobbel inntekt mens du var borte, og få tilbake soldatene etter et tap.
- **Reklame mellom kampene**: høyst etter annenhver kamp og med minst 3 minutter mellom. Aldri i opplæringen eller de
  første 4 minuttene.
- **Reklamefri**: fjerner reklamen mellom kampene, og alle «se reklame»-belønninger gis uten reklame. Finnes også i
  en startpakke sammen med 500 edelstener og en kosmisk kasse.

## Tjen penger på spillet

Slik det er bygget nå, kjører butikken og reklamen i **demo-modus**: reklamene er spillets egne fiktive merker, og
kjøp koster ingenting. Det er for å teste. For å tjene ekte penger velger du en av veiene under. Alle krever en
konto hos et selskap som betaler ut penger, og nesten alle krever at kontoeieren er **18 år** – er du yngre, må en
forelder eie kontoen.

**1. Spillportal – enklest (anbefalt).** Last opp spillet på [CrazyGames](https://developer.crazygames.com/) eller
[Poki](https://developers.poki.com/). Portalen viser reklamen og betaler deg en andel av inntekten. Ferdige versjoner
med portalens reklame bygges automatisk:

- `builds/crazygames/index.html` – pakk mappa som zip og last den opp på CrazyGames sin utviklerside.
- `builds/poki/index.html` – for Poki (de velger ut spillene selv, så du må søke).

Portalene tillater ikke salg med egne betalingsløsninger, så i disse versjonene er kjøp med ekte penger skjult.
Edelstener tjenes ved å spille og se reklame (det er da du tjener penger).

**2. Egen nettside med Google AdSense.** Krever et eget domene (ikke github.io) og en godkjent AdSense-konto med
H5-spillreklame. Sett dette i `monetize.config.json` og kjør `npm run build`:

```json
{ "ads": { "provider": "adsense", "adsenseClient": "ca-pub-DITT-NUMMER", "testMode": false } }
```

Bruk `"testMode": true` mens du tester. I Norge og resten av EØS må reklamen ha et samtykkebanner (GDPR) – det setter
du opp under «Personvern og meldinger» i AdSense.

**3. App i App Store / Google Play.** Ekte kjøp av edelstener og reklamefri krever en app i en appbutikk, med Apple/Google
sitt betalingssystem. Det gjøres best ved å lage spillet i Unity (Unity LevelPlay for reklame og Unity IAP for kjøp)
eller pakke denne web-appen inn med Capacitor (AdMob og et betalingstillegg). Utviklerkonto koster 25 dollar én gang hos
Google og 99 dollar i året hos Apple, og iPhone-versjonen må bygges på en Mac.

**Om lootkasser som koster penger:** App Store og Google Play krever at sjansene vises (det gjør spillet). Lootkasser
som kjøpes for ekte penger er forbudt i Belgia, og flere land, også Norge, vurderer strengere regler. Hvis du selger
edelstener for ekte penger, sjekk reglene der spillet skal selges.

### monetize.config.json

| Felt | Verdier | Betydning |
|------|---------|-----------|
| `ads.provider` | `demo`, `adsense`, `crazygames`, `poki`, `none` | Hvilken reklame `docs/`-versjonen bruker |
| `ads.adsenseClient` | `ca-pub-…` | AdSense-utgivernummeret ditt |
| `ads.testMode` | `true` / `false` | AdSense testreklame (ingen inntekt) |
| `ads.interstitialEvery` | tall | Reklame mellom kamper etter så mange kamper |
| `ads.interstitialMinGap` | sekunder | Minste tid mellom to slike reklamer |
| `payments.provider` | `demo`, `none` | `demo` viser kjøpsflyten uten betaling, `none` skjuler kjøp |

Koden for reklame og kjøp ligger samlet i `src/js/monetize.js`.

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

## Leaderboard, venner og innlogging

Topp-fanen har to lister: **Venner** og **Alle**. Poengene er hvor mange områder du har erobret totalt (også i nye
runder). Hver spiller har en vennekode (f.eks. `OHIO-7K3QPZ`) som kan deles; skriv inn koden til en venn for å legge
dem til. Alle kan spille som gjest, og logge inn med **Facebook** eller **Apple** for å beholde plassen og vennene på
alle enheter (en gjestekonto kobles til innloggingen, så ingenting går tapt). Listen viser bare navnet på bygda –
aldri navnet fra Facebook eller Apple. Innstillinger har «Logg ut» og «Slett nettprofil» (Apple krever at brukere kan
slette kontoen sin).

Uten oppsett kjører dette i **demo-modus**: listen viser eksempelspillere, og venner lagres bare på enheten. Ekte
innlogging og felles liste bruker [Firebase](https://firebase.google.com/) (gratis for små spill):

1. Lag et prosjekt på [console.firebase.google.com](https://console.firebase.google.com/) og legg til en *Web app*.
2. Kopier `apiKey`, `authDomain`, `projectId` og `appId` inn i `online.config.json`, og sett `"provider": "firebase"`.
3. **Authentication → Sign-in method**: slå på *Anonymous*, *Facebook* og *Apple*.
   - Facebook: lag en app på [developers.facebook.com](https://developers.facebook.com/), legg inn App ID og App Secret i
     Firebase, og lim inn lenken Firebase viser under «Valid OAuth Redirect URIs» i Facebook-appen.
   - Apple: krever Apple Developer Program (99 dollar i året). Lag en *Services ID* med «Sign in with Apple», registrer
     domenet og lenken Firebase viser, og legg inn Team ID, Key ID og nøkkelen i Firebase.
4. **Authentication → Settings → Authorized domains**: legg til domenet der spillet ligger (f.eks. `brukernavn.github.io`).
5. **Firestore Database**: opprett databasen og legg inn reglene fra `firebase/firestore.rules` (kopier dem inn i
   konsollen, eller kjør `npx firebase-tools deploy --only firestore:rules --project <prosjekt-id>` fra `firebase/`).
6. Kjør `npm run build` og publiser `docs/`.

Reglene sørger for at hver spiller bare kan skrive sin egen rad, med begrensninger på poeng og felt. Poengene sendes fra
spillerens enhet, så noen som virkelig vil jukse kan fortsatt prøve; helt juksesikre lister krever at serveren regner ut
poengene. Facebook krever at brukere er minst 13 år.

**Test mot Firebase-emulatoren** (uten ekte prosjekt): kjør `SOCIAL_EMULATOR=1 npm run build`, start emulatoren med
`npx firebase-tools emulators:start --only auth,firestore --project demo-ohio` fra mappa `firebase/`, og kjør
`node tools/test-online.cjs`. Testen spiller med to spillere, legger dem til som venner, logger inn med Facebook og
Apple (falske testkontoer), bytter enhet, logger ut, og sjekker at reglene stopper juks.

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
  js/cosmetics.js skins, sjeldenhet og lootkasser (sjanser og garanti)
  js/monetize.js  reklame (demo, AdSense, CrazyGames, Poki) og kjøp
  js/social*.js   leaderboard, venner og innlogging (demo og Firebase)
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
builds/           ferdige versjoner for CrazyGames og Poki
monetize.config.json  valg av reklame og kjøp
online.config.json    valg av leaderboard/innlogging (demo eller Firebase)
firebase/         sikkerhetsregler og emulatoroppsett for Firebase
```

Kommandoer (Node 18+):

```sh
npm install          # henter byggeverktøy og kartdata
npm run build        # bygger docs/ (PWA), builds/crazygames, builds/poki og dist/artifact.html
npm run maps         # lager src/js/mapdata.js på nytt
npm run sim          # balanserer spillet på nytt og skriver src/js/balance.js
CHECK=1 npm run sim  # beholder tallene og viser hvor lang tid hvert område tar
```

Balansen er laget med en simulator: den spiller spillet med en fornuftig strategi (1,5 trykk per sekund) og
justerer forsvaret til hvert område slik at hver erobring tar omtrent ønsket tid, fra cirka 30 sekunder for
første by til et par minutter i verdensrommet. Nye bygninger og enheter i hvert kapittel prises ut fra
inntekten spilleren har når kapitlet starter. Ønsket tempo står øverst i `tools/simulate.mjs`.

For testing: åpne spillet med `#debug` på slutten av adressen. Da finnes `window.__ohio` i konsollen med
hjelpere som `give(1e6)`, `gems(500)`, `power(100)`, `win()` og `era(4)`.

## Lisenser og kreditering

- Kartdata: [US Census Bureau](https://www.census.gov/) via `us-atlas` og [Natural Earth](https://www.naturalearthdata.com/)
  via `world-atlas` – offentlig eie.
- Fonter: [Luckiest Guy](https://fonts.google.com/specimen/Luckiest+Guy) (Apache 2.0) og
  [Fredoka](https://fonts.google.com/specimen/Fredoka) (SIL Open Font License 1.1). Lisensene ligger i `assets/fonts/`.
