# Take over the world Ohio

Et fargerikt tycoon-krigsspill for mobil. Du starter som en liten bygd i Ohio, samler en milits og tar over
Ohio by for by. Så venter USA, Nord-Amerika, Sør-Amerika og resten av jorda – før romvesener invaderer
solsystemet og krigen flytter ut blant planetene.

Spillet er en installerbar web-app (PWA): det kjører i nettleseren på iPhone og Android, kan legges på
hjemskjermen som en vanlig app, og fungerer uten nett etter første besøk. All grafikk er håndtegnet SVG i
tegneseriestil, og lydene lages direkte i nettleseren – det er ingen bilde- eller lydfiler.

## Slik spiller du

1. **Trykk på hovedkvarteret** (låven) for å tjene penger. Trykker du fort, bygges en **kombo** opp (×1,5 etter
   10 trykk, ×2 etter 30, ×2,5 etter 60 og ×3 etter 120), og den faller hvis du stopper. Hvert trykk har 5 % sjanse for
   et **kritisk treff** (×5, sjansen øker med komboen) og en sjelden **megakritt** (×25).
2. **Bygg** økonomi: maisåkre, kufjøs, fabrikker, banker … De tjener penger hele tiden, også når du er borte
   (opptil 8 timer).
3. **Hær**: rekrutter enheter. Hver enhetstype gir hærstyrke og hører til en klasse: infanteri, kjøretøy, fly eller
   skip.
4. **Kart**: velg et område, velg taktikk og trykk **Angrip!** Vinnersjansen vises i prosent og gjelder for en
   automatisk plassering der du ikke gjør noe i kampen. Først med 1,8 ganger så stor hær som forsvaret er seieren
   sikker. Taper du, blir fienden svekket – men svekkelsen bygges opp igjen over tid, og ingen fiende kan svekkes under
   40 %.
5. **Plasser troppene**: før hver kamp fordeler du troppene på tre korridorer – venstre flanke, midten og høyre flanke.
   Trykk på en tropp og så på en korridor, eller dra den dit. Alle enhetstypene dine er med, og hver type vises
   samlet på ett kort – både i «Dine tropper» og i hver korridor. Har en type flere deler, velger du hvor mange som skal
   sendes (alle, to tredjedeler eller en tredjedel), så du kan spre den på flere korridorer. Trykk på en type i en
   korridor for å ta den tilbake. Fienden har en type i hver korridor, og hver type er svak
   mot én av klassene dine (+50 %): infanteri mot kjøretøy, panser mot fly, bunkere mot infanteri, luftvern mot
   kjøretøy (og fly gjør bare halv skade der), kystbatteri mot skip og fly mot fly. Du vinner ved å vinne korridorer som
   til sammen har over halvparten av fiendens styrke, så det kan lønne seg å samle styrken og ofre en korridor. Tropper du
   ikke plasserer, blir hjemme og kan ikke dø, og i korridorer du taper, mister du flere soldater. **Auto** fordeler etter
   fiendens styrke, men tar ikke hensyn til svakheter. Fiendens oppstilling vises i områdearket, så du kan planlegge og
   bygge riktig hær på forhånd.
6. **Kampen**: hæren din har liv som tappes av fiendens ild. Trykk på fiendene med røde sikter (treff på rad gir
   **kombo**), bruk **artilleriet**, og stopp fiendens varslede spesialangrep: **kanonsalve** stoppes med **Skjold**
   (trykk i tide), og **stormangrep** stoppes ved å trykke tre ganger på kapteinen. Hver general har også en egen
   **evne** én gang per kamp. **Trekk tilbake** avbryter kampen med færre tap, og **Hopp over** avgjør den med en gang.
   Uten innsats blir utfallet som vinnersjansen; god innsats gir seier oftere, færre tap og flere stjerner.
7. **Stjerner**: en seier gir 1–3 stjerner etter hvor mye liv hæren har igjen (over halvparten gir tre). Stjernene gir
   **krigsbytte** (penger), **medaljer** til Krigsskolen, ekstra edelstener og sjanse for en gratis powerup.
8. Hvert område du erobrer gir mer inntekt. Ta alle områdene i et kapittel for å låse opp neste kapittel med
   nye bygninger og enheter.

Tips:

- **Milepæler**: når du eier 10, 25, 50, 100 … av noe, dobles effekten.
- **Forsyningskasser** faller ned med fallskjerm av og til. Trykk på dem for penger eller ×3 inntekt i 30 sekunder.
- **Trykk-kraft** kan oppgraderes, så hvert trykk gir mer.
- **Zoom mellom kapitlene** på kartet: trykk **−** (eller knip fingrene sammen) for å zoome ut og se kapitlene som
  venter, med områdene du ikke har erobret ennå. Trykk **+** (eller knip helt inn på hjemområdet ditt) for å zoome inn
  til kapitlene du allerede har erobret. Prikkene mellom knappene viser alle kapitlene – trykk på en for å hoppe dit.
- **Tre generaler med hver sin strategi**, valgt ved start eller i Butikk → Mine ting (bytte hvert tiende minutt):
  - **General Drip** (dunjakke, USA-genser og gullklokke): økonomi – +15 % inntekt og +50 % krigsbytte. Evne:
    *Bestikkelse* – betal 5 % av pengene, fienden mister styrke og hopper over neste angrep. Drip snakker slang –
    «Wallah bror», «Schpa krig!», «Wallah dette ekke no for meg», «Wallah vi kæsa di da» – og på engelsk
    «Wallahi bro», «Let’s run it!», «No cap» og «Nah bro, this ain’t it». Replikkene står i `src/js/voice.js`.
  - **General Buckeye** (Ohio-nøtta med generalhatt): folkehæren – +25 % infanteri og +50 % per trykk. Evne:
    *Nøtteregn* – treffer alle fiendene på skjermen.
  - **Keiser Zorgon** (romkeiseren som byttet side): teknologi – +25 % fly, raskere artilleri og tidligere varsel.
    Evne: *Laserstråle* – stor skade og lammer fienden i to sekunder.
  Generalen er inne i hovedkvarteret (i låvedøra, borgporten, lobbyen eller koøyet), reagerer når du trykker, sier
  rare ting av og til, viser deg hva du skal gjøre i starten og har sine egne skins.
- **Livet i basen**: innbyggere går rundt (bønder, bestemødre, kokker, forskere, soldater, roboter, romvesener og en
  gås) – trykk på dem, så sier de noe (gåsa sier HONK!). Av og til skjer det **rare ting i byen**. Da står noen med et utropstegn ved hovedkvarteret – trykk på dem.
  Hver hendelse har tre svar, og hvert svar er enten bra eller dårlig, men spillet sier ikke hvilket før du har valgt
  (og rekkefølgen stokkes). Det finnes 47 hendelser, som at folket sulter og det eneste som er igjen er én uendelig
  lang spagetti, at en gås vil bli statsminister, eller at hovedkvarteret har gått i søvne. Utfallet kan være penger,
  edelstener, en powerup, en kasse, en medalje, flere soldater, ×1,5 inntekt eller ×3 per trykk en stund – eller tap
  av penger, soldater som stikker av, eller lavere inntekt en stund. Den første hendelsen kommer litt etter
  opplæringen, og deretter én hvert 4.–7. minutt.
- **Daglig bonus**: logg inn hver dag for større belønninger i sju dager (penger, edelstener, trekasse, powerup og en
  gullkasse med 50 edelstener på dag 7). Hopper du over en dag, starter rekka på nytt. Se en video for å få dobbelt.
  Gaveknappen på Base viser bonusen.
- **Krigsskolen** (Hær → Krigsskole): bruk medaljer på ni retninger med fem nivåer hver – infanteri, panser, fly og
  marine (+10 % per nivå), artilleri, logistikk (færre tap), etterretning (svakere fiender og tidligere varsel),
  økonomi og plyndring (mer krigsbytte og flere powerups). Medaljene rekker ikke til alt, så du må velge en strategi.
  **Omskolering** gir alle medaljene tilbake for 30 edelstener.
- **Strategi**: hvert område har et terreng (by, slette, fjell, kyst, øyer, ørken, jungel, is …) som gir bonus til
  noen enhetsklasser – for eksempel får fly +50 % i fjellet og skip +50 % på øyer. Bygg hæren etter målene dine.
  **Taktikk** velges før angrep: Angrep, Lynangrep (+25 % styrke, mange flere tap), Beleiring (−15 % styrke, færre tap,
  mye raskere artilleri, og fienden svekkes mer hvis du taper) eller Snikangrep (dobbel skade fra trykk og artilleri de
  første 3,5 sekundene, og fienden angriper senere).
- **Powerups i hovedkvarteret** (på Base): kjøp en tilfeldig powerup for penger (koster tre minutter med inntekt) eller
  en superboks for 40 edelstener (minst Sjelden). Sett den inn i en av tre plasser i hovedkvarteret, så står den der
  og virker i 10 minutter (UFO-en i 15): pengetrykkeri, turboknapp, kassemagnet, kanontårn, radar, skjoldgenerator,
  feltsykehus, diamantbor, rakettutskyter (luftangrep i kampene), spionsatellitt, gullstatue av generalen din og en
  fanget UFO. Like effekter stables ikke – den sterkeste teller.
- **Reisen** (Kart → Reisen, eller «Se hele reisen» på Base) viser hele spillet som et tre: alle 7 kapitler og
  60 områder, og hvor du er nå.
- **Topp** (egen fane) er leaderboardet: konkurrer mot venner og alle andre, legg til venner med vennekode og logg
  inn med Facebook eller Apple.

## Butikk, skins, lootkasser og reklame

- **Skins**: hær (49 fargedrakter på alle enhetene), flagg (36 – spillerflagget, fargen på erobret land på kartet og
  flagget ditt på leaderboardet), hovedkvarter (27), **trykkeffekter** (14 – det som spruter ut når du trykker:
  mynter, hjerter, pizza, spøkelser, lyn, planeter, regnbue …), og egne skins til hver general: hatter til Buckeye
  (33, blant annet kasserolle, trafikkjegle og mini-UFO), antrekk til Drip (25, blant annet Ku-drip, Kode-drip og
  Galakse-drip) og kapper og kroner til Zorgon (23). 207 skins fordelt på Vanlig, Sjelden, Episk, Legendarisk og
  Mytisk, pluss seks Prestisje-skins. Skins er bare utseende – de gir ingen fordel i kamp.
- **Mine ting** (Butikk → Mine ting) viser kassene og skinsene du eier. Kjøpte kasser havner her, så du kan åpne dem
  med en gang eller spare dem til senere. Du får også en gullkasse hver gang du fullfører et kapittel.
- **Lootkasser**: trekasse (1 skin), gullkasse (3 skins, minst Sjelden) og kosmisk kasse (5 skins, minst Episk).
  Sjansene vises i spillet («Se sjansene»). Legendarisk eller bedre er garantert minst hvert 20. skin, nye skins
  prioriteres, og duplikater blir til edelstener. Når kassen er åpnet, kan du trykke på hvert skin du fikk, bla
  gjennom dem med pilene (eller sveipe / bruke piltastene) og ta dem i bruk med en gang med **Bruk**. «Vis alle»
  hopper over avsløringen. Skins til en annen general merkes, og blir brukt når du bytter til den generalen.
- **Edelstener** tjenes ved å erobre områder, fullføre kapitler, fra forsyningskasser og ved å se reklame – og kan
  kjøpes i butikken. De brukes på lootkasser og «tidshopp» (få 1 eller 4 timer med inntekt med en gang).
- **Belønningsreklame** (frivillig): gratis trekasse hvert 30. minutt, +30 edelstener (8 per dag), 2× inntekt i
  10 minutter, dobbel inntekt mens du var borte, dobbel daglig bonus, og få tilbake soldatene etter et tap.
- **Mellomreklame** (bare for dem som ikke har kjøpt reklamefri) i naturlige pauser: etter annenhver kamp (minst
  3 minutter mellom), ved fanebytte når det har gått 4 minutter siden forrige reklame, og når et kapittel er ferdig.
  Aldri i opplæringen eller de første 4 minuttene.
- **Reklamefri**: fjerner all mellomreklame. Alle belønningsvideoene over (kasser, edelstener, dobbel inntekt, dobbel
  daglig bonus og soldatene tilbake etter et tap) krever fortsatt at man ser en reklame. Finnes også i en startpakke
  sammen med 500 edelstener og en kosmisk kasse.
- **Personvern**: innstillingene har lenke til personvernerklæringen (`docs/personvern.html`, et utkast som må fylles
  ut) og, i app-versjonen, «Reklamevalg» der spilleren kan endre samtykket til reklame.

## Tjen penger på spillet

**Se [PUBLISERING.md](PUBLISERING.md)** for en full guide: hva det koster, hvor mye reklame kan gi, steg for steg til
App Store og Google Play, AdMob, personvern og skatt i Norge.

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

**3. App i App Store / Google Play.** Prosjektet er klargjort med Capacitor og Google AdMob: `npm run build` lager
app-versjonen i `app/www/`, og `npm run app:ios` / `npm run app:android` åpner den i Xcode eller Android Studio (etter
`npx cap add ios` / `npx cap add android`). Utviklerkonto koster 25 dollar én gang hos Google og 99 dollar i året hos
Apple, og iPhone-versjonen må bygges på en Mac eller i en skytjeneste. Kjøp med ekte penger er foreløpig av i appene
(det krever Apples og Googles kjøpssystemer). Alle stegene står i [PUBLISERING.md](PUBLISERING.md).

**Om lootkasser som koster penger:** App Store og Google Play krever at sjansene vises (det gjør spillet). Lootkasser
som kjøpes for ekte penger er forbudt i Belgia, og flere land, også Norge, vurderer strengere regler. Hvis du selger
edelstener for ekte penger, sjekk reglene der spillet skal selges.

### monetize.config.json

| Felt | Verdier | Betydning |
|------|---------|-----------|
| `ads.provider` | `demo`, `adsense`, `crazygames`, `poki`, `none` | Hvilken reklame `docs/`-versjonen bruker (appene bruker alltid AdMob) |
| `ads.adsenseClient` | `ca-pub-…` | AdSense-utgivernummeret ditt |
| `ads.testMode` | `true` / `false` | Testreklame (ingen inntekt) – gjelder AdSense og AdMob |
| `ads.interstitialEvery` | tall | Mellomreklame etter så mange kamper |
| `ads.interstitialMinGap` | sekunder | Minste tid mellom to mellomreklamer |
| `ads.interstitialTimer` | sekunder | Mellomreklame ved fanebytte etter så lang tid uten reklame (`0` = av) |
| `ads.admob` | annonseenhet-ID-er | `iosRewarded`, `iosInterstitial`, `androidRewarded`, `androidInterstitial` (nå Googles test-ID-er) |
| `payments.provider` | `demo`, `none` | `demo` viser kjøpsflyten uten betaling, `none` skjuler kjøp |
| `privacyUrl` | adresse | Personvernerklæringen som innstillingene lenker til (`personvern.html`) |

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

## Prestisje

Når universet er erobret kan du ta **prestisje**: du starter på nytt som en liten bygd i Ohio, men med en prestisjestjerne
(★, ★2, ★3 …) og disse bonusene for hver stjerne:

- +50 % inntekt og hærstyrke for alltid (★2 gir +100 %, ★3 +150 % osv.)
- +300 edelstener og en kosmisk kasse
- du beholder skins, kasser, edelstener, venner, den daglige bonusrekka og reklamefri, mens bygninger, hær,
  trykk-kraft og erobrede områder starter på nytt
- eksklusive prestisje-skins som ikke finnes i kasser: Prestisjeflagg (★1), et prestisje-skin til hver general (★2),
  Stjernepalasset (★3) og Stjernehæren (★5)
- powerups på lager og i hovedkvarteret, og generalen du har valgt, blir med videre; Krigsskolen og medaljene starter
  på nytt, så du kan prøve en ny strategi

Stjernen vises ved bygd-skiltet, på profilen og på leaderboardet.

En effektiv spiller bruker omtrent to timer på hele kampanjen, og litt mer uten å trykke mye. Spillet lagres
automatisk på enheten.

Språk: norsk (standard) og engelsk, valgbart i innstillingene.

## Leaderboard, venner og innlogging

Topp-fanen har to lister: **Venner** og **Alle**. Hver rad viser spillerens flagg og prestisjestjerne. Poengene er hvor
mange områder du har erobret totalt (også i nye runder). Hver spiller har en vennekode (f.eks. `OHIO-7K3QPZ`) som kan deles; skriv inn koden til en venn for å legge
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

## Lyd

All lyd lages i nettleseren med Web Audio (ingen lydfiler, se `src/js/audio.js`): trykk, kritiske treff, kombo,
kasser (risting, åpning og egen avsløringslyd for hver sjeldenhet), bla og ta i bruk skins, innbyggere (gås, robot,
romvesen, barn, bestemor, bonde, kokk, soldat, ordfører og forsker), generalen som prater når den sier noe, hendelser
(eget «ta-da» og «wah-wah» for bra og dårlig utfall), daglig bonus, fallskjermkasser, powerups som settes inn og går
ut, kamp (treff, alarm, skjold, artilleri, generalenes evner og en «pling» per stjerne), fanebytte, vinduer og zoom
mellom kapitlene. Lyden kan slås av i innstillingene.

## For utviklere

Spillet er skrevet i ren JavaScript uten rammeverk. Byggesteget pakker alt (kode, stil, fonter) inn i én
HTML-fil på rundt 620 KB.

```
src/
  js/main.js      grensesnitt, spill-løkke, lagring
  js/engine.js    spillmotor (ren logikk, ingen DOM) – økonomi, kamp, lagring/gjenoppretting
  js/data.js      kapitler, regioner, terreng, taktikk, bygninger og enheter (tekst på norsk og engelsk)
  js/balance.js   priser, inntekt, styrke og forsvar (generert av simulatoren)
  js/art.js       all grafikk som SVG: enheter, bygninger, hovedkvarter, generaler, powerups, planeter, ikoner
  js/mapdata.js   forenklede kart (generert fra kartdata)
  js/cosmetics.js generaler, skins, sjeldenhet og lootkasser (sjanser og garanti)
  js/powerups.js  powerups i hovedkvarteret (sjanser, plasser og effekter)
  js/events.js    hendelser i basen: 47 rare spørsmål med svar og utfall (norsk og engelsk)
  js/daily.js     daglig innloggingsbonus (sju dager, rekke)
  js/voice.js     replikker generalene sier (Drip snakker slang på norsk og engelsk)
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
app/www/          app-versjonen for Capacitor (lages av npm run build, ikke i git)
capacitor.config.json oppsett for iOS- og Android-appene (endre appId)
PUBLISERING.md    guide til å tjene penger og publisere i App Store og Google Play
monetize.config.json  valg av reklame og kjøp
online.config.json    valg av leaderboard/innlogging (demo eller Firebase)
firebase/         sikkerhetsregler og emulatoroppsett for Firebase
```

Kommandoer (Node 18+):

```sh
npm install          # henter byggeverktøy og kartdata
npm run build        # bygger docs/ (PWA), builds/crazygames, builds/poki, app/www og dist/artifact.html
npm run app:ios      # bygger og åpner iOS-appen i Xcode (etter npx cap add ios, på Mac)
npm run app:android  # bygger og åpner Android-appen i Android Studio (etter npx cap add android)
npm run maps         # lager src/js/mapdata.js på nytt
npm run sim          # balanserer spillet på nytt og skriver src/js/balance.js
CHECK=1 npm run sim  # beholder tallene og viser hvor lang tid hvert område tar
```

Balansen er laget med en simulator: den spiller spillet med en fornuftig strategi (1,5 trykk per sekund) og
justerer forsvaret til hvert område slik at hver erobring tar omtrent ønsket tid, fra cirka 30 sekunder for
første by til et par minutter i verdensrommet. Nye bygninger og enheter i hvert kapittel prises ut fra
inntekten spilleren har når kapitlet starter. Ønsket tempo står øverst i `tools/simulate.mjs`.

For testing: åpne spillet med `#debug` på slutten av adressen. Da finnes `window.__ohio` i konsollen med
hjelpere som `give(1e6)`, `gems(500)`, `power(100)`, `win()`, `era(4)`, `event('hunger')` (start en hendelse),
`daily('', 0)` (nullstill daglig bonus), `combo(120)` og `gen('zorgon')`. Med `#debug&noauto` kommer det ingen
hendelser eller daglig bonus-vindu av seg selv (nyttig i automatiske tester).

## Lisenser og kreditering

- Kartdata: [US Census Bureau](https://www.census.gov/) via `us-atlas` og [Natural Earth](https://www.naturalearthdata.com/)
  via `world-atlas` – offentlig eie.
- Fonter: [Luckiest Guy](https://fonts.google.com/specimen/Luckiest+Guy) (Apache 2.0) og
  [Fredoka](https://fonts.google.com/specimen/Fredoka) (SIL Open Font License 1.1). Lisensene ligger i `assets/fonts/`.
