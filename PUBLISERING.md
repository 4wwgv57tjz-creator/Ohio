# Tjene penger på spillet og publisere det

Denne guiden forklarer hvordan *Take over the world Ohio* kan tjene penger, og hvordan du får det ut i App Store,
Google Play og på spillportaler. Regler og priser endrer seg ofte. Tallene under er sjekket i november 2026 – se
kildene nederst, og sjekk alltid de offisielle sidene før du betaler noe.

## Kort fortalt

| Vei | Koster | Tid før du tjener | Hva du tjener på |
| --- | --- | --- | --- |
| **Spillportaler** (CrazyGames, Poki) | Gratis | Raskest – dager/uker | Portalen viser reklamen og deler inntekten med deg |
| **Google Play** | 25 USD én gang | Minst 2–3 uker (krav om 14 dagers test) | AdMob-reklame (og senere kjøp i appen) |
| **App Store** | 99 USD per år | Noen uker | AdMob-reklame (og senere kjøp i appen) |
| **Egen nettside** (GitHub Pages) | Gratis | Krever godkjent AdSense og eget domene | AdSense-reklame |

Anbefalt rekkefølge: **1)** legg spillet på CrazyGames (ferdig bygg ligger i `builds/crazygames/`), **2)** Google
Play, **3)** App Store. Da får du ekte spillere og tilbakemeldinger tidlig, og tjener litt mens du gjør appene klare.

**Er du under 18?** Apple krever at du er myndig (18 år i Norge) for å melde deg inn selv. Er du yngre, kan en
forelder eller verge melde seg inn med sin Apple-konto og dele den med deg. Avtaler med Google (Play og AdMob) og
utbetalinger krever også en voksen. Snakk med en forelder før du starter – det er de som må signere avtalene.

## Slik tjener spillet penger

Alt er allerede bygget inn, og styres fra `monetize.config.json`:

- **Belønningsreklame** (spilleren velger selv å se en video): gratis trekasse hvert 30. minutt, +30 edelstener
  (8 per dag), 2× inntekt i 10 minutter, dobbel inntekt for tiden man var borte, og soldatene tilbake etter et tap.
  Dette gir mest per visning. Kasser, edelstener og dobbel inntekt krever reklame også for dem som har kjøpt
  reklamefri.
- **Mellomreklame** (bare for dem som ikke har kjøpt reklamefri), i naturlige pauser:
  - etter annenhver kamp (`interstitialEvery`), med minst 3 minutter mellom (`interstitialMinGap`)
  - ved fanebytte når det har gått 4 minutter siden forrige reklame (`interstitialTimer`, 0 slår det av)
  - når et kapittel er ferdig
  - aldri i opplæringen eller de første 4 minuttene
- **Kjøp med ekte penger**: reklamefri (39 kr), edelsteinspakker og startpakke. I nettversjonen er dette demo. I
  appene må kjøpene gå gjennom Apples og Googles egne kjøpssystemer (se «Kjøp i appen» under).

### Hvor mye kan det bli?

Reklameinntekt regnes i **eCPM** – hva du får per 1000 visninger. Det varierer mye med land, sjanger og tid på året,
og tallene fra bransjeblogger spriker opptil fire ganger. Typiske anslag for rike land (som Norge) i 2026:

- belønningsreklame: omtrent 8–30 USD per 1000 visninger
- mellomreklame: omtrent 3–15 USD per 1000 visninger
- bannerreklame: omtrent 0,5–1,5 USD per 1000 visninger (spillet bruker ikke bannere)

**Regneeksempel** (bare et grovt anslag): 1000 spillere per dag som hver ser 3 belønningsvideoer og 2 mellomreklamer
gir 3000 × 10/1000 + 2000 × 5/1000 ≈ 40 USD per dag, rundt 1200 USD i måneden. Det vanskelige er å få så mange
spillere – de fleste nye spill får langt færre. Kjøp av reklamefri og edelstener kommer i tillegg; der tar Apple 15 %
hvis du er med i Small Business Program (se under).

## Spillportaler (raskest)

Ferdige versjoner med portalenes egen reklame ligger i `builds/crazygames/` og `builds/poki/` (bygges med
`npm run build`). Kjøp med ekte penger er skrudd av der, slik portalene krever.

- **CrazyGames**: registrer deg som utvikler og last opp `builds/crazygames/index.html`. CrazyGames viser reklamen og
  deler inntekten. Vilkårene står i utviklerportalen. Ifølge andre kilder ga en CrazyGames-konkurranse i 2026 60 % av
  reklameinntekten til utvikleren, men sjekk gjeldende vilkår selv.
- **Poki**: søk om å bli med. Vilkårene forhandles per spill og kan kreve at spillet bare ligger på Poki på nett.

## App Store – steg for steg

1. **Meld deg inn i Apple Developer Program** (developer.apple.com/programs/enroll). Det koster 99 USD per år, og
   prisen vises i norske kroner når du melder deg inn. Du trenger en Apple-konto med totrinnsbekreftelse, ditt
   juridiske navn og en adresse (ikke postboks). Se avsnittet om alder over.
2. **Skaff en måte å bygge iOS-appen på.** Det vanlige er en Mac med Xcode. Har du ikke Mac, kan du bygge i skyen,
   for eksempel med Codemagic (500 gratis minutter på Mac i måneden for personlige kontoer, og en iOS-bygg tar noen
   minutter). Skytjenesten kan laste appen rett opp til App Store Connect. En kilde oppgir at Apple siden 28. april 2026
   krever at alt som lastes opp er bygget med Xcode 26 eller nyere – skytjenestene holder Xcode oppdatert.
3. **Lag appen med Capacitor** (alt er klargjort i prosjektet):
   ```bash
   npm install                 # installerer Capacitor og AdMob-pluginen
   # Endre "appId" i capacitor.config.json til din egen, f.eks. "no.dittnavn.ohio" (kan ikke endres senere)
   npm run build               # lager app/www/ med AdMob-versjonen av spillet
   npx cap add ios             # lager Xcode-prosjektet i ios/ (gjøres én gang, på Mac)
   npm run app:ios             # bygger, kopierer spillet inn og åpner Xcode
   ```
   I Xcode: velg «Team» (Apple-kontoen din) under *Signing & Capabilities*, og legg inn app-ikon (et ferdig ikon på
   1024 × 1024 ligger i `assets/icons/`; verktøyet `@capacitor/assets` kan lage alle størrelser).
4. **Sett opp AdMob** (admob.google.com):
   - Opprett en konto, legg til appen (iOS og Android hver for seg), og lag to annonseenheter per plattform:
     *Rewarded* (belønning) og *Interstitial* (mellomreklame).
   - Lim inn annonseenhet-ID-ene i `monetize.config.json` under `ads.admob` (nå står Googles test-ID-er der).
   - I `ios/App/App/Info.plist`: legg til `GADApplicationIdentifier` (AdMob-**app**-ID-en, ikke annonseenheten),
     `SKAdNetworkItems` (listen fra Googles iOS-guide) og `NSUserTrackingUsageDescription` (en tekst som forklarer at
     sporingen brukes til mer relevant reklame).
   - Lag samtykkemeldingen for EØS/Storbritannia i AdMob under *Privacy & messaging* (Googles samtykkeskjema).
     Spillet viser skjemaet automatisk ved oppstart, og spør deretter om sporing på iOS (App Tracking Transparency).
   - Test med test-ID-ene og `"testMode": true`. **Klikk aldri på dine egne ekte reklamer** – det kan stenge
     AdMob-kontoen. Sett `"testMode": false` og bruk dine egne ID-er først når appen skal ut.
5. **Personvernerklæring**: App Store og AdMob krever en nettside som forklarer hvilke data som samles inn. Et
   utkast ligger i `docs/personvern.html`. Fyll inn navn og e-post, les gjennom (gjerne med en voksen), og publiser
   via GitHub Pages.
6. **App Store Connect** (appstoreconnect.apple.com): opprett appen med samme Bundle ID som `appId`, og fyll inn navn,
   beskrivelse, skjermbilder, kategori (Spill → Strategi), lenke til personvernerklæringen og *App Privacy*
   (AdMob samler blant annet enhets-ID og bruksdata til reklame). Svar på spørsmålene om aldersgrense – Apple har nå
   aldersgrensene 4+, 9+, 13+, 16+ og 18+. Velg **ikke** Kids-kategorien: der er tredjepartsreklame ikke lov.
7. **Meld deg på App Store Small Business Program** i App Store Connect. Da tar Apple 15 % i stedet for 30 % av kjøp
   i appen så lenge du tjener under 1 million USD i året. Du må melde deg på selv.
8. **Test med TestFlight** (Apples testapp), og **send til gjennomgang** («Submit for Review»).

### Det Apple sjekker særlig

- **Mer enn en nettside (4.2):** appen må gi noe mer enn en innpakket nettside. Spillet fungerer uten nett og er et
  helt spill, men det hjelper å legge til ting som bare apper har, som vibrasjon (`@capacitor/haptics`) og
  Game Center-leaderboard.
- **Lootbokser (3.1.1):** sjansene for hver sjeldenhet må vises før kjøp. Spillet har allerede «Se sjansene».
- **Kjøp (3.1.1):** edelstener, reklamefri og kasser er digitale varer og må selges med Apples kjøpssystem.
- **Reklame (2.5.18):** reklamen må passe aldersgrensen, og mellomreklame må ha en tydelig lukkeknapp (det har
  AdMob sine).
- **Sporing (5.1.2):** krever tillatelse via App Tracking Transparency – det spør spillet om.
- **Belønning for å se reklame** er tillatt (3.2.2 nevner det som eksempel).

## Google Play – steg for steg

1. **Opprett en utviklerkonto** i Play Console. Det koster 25 USD én gang. Du må bekrefte identitet med legitimasjon
   og et kort i ditt navn (ikke forhåndsbetalt kort), og nye personlige kontoer må bekrefte at de har en
   Android-telefon via Play Console-appen.
2. **Lag Android-appen** (på Mac, Windows eller Linux med Android Studio):
   ```bash
   npx cap add android         # én gang
   npm run app:android         # bygger, kopierer og åpner Android Studio
   ```
   Legg AdMob-**app**-ID-en inn i `android/app/src/main/res/values/strings.xml`
   (`<string name="admob_app_id">…</string>`) og i `AndroidManifest.xml` under `<application>`:
   `<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="@string/admob_app_id"/>`.
   Lag en signert app-pakke (AAB) i Android Studio.
3. **Lukket test først:** personlige kontoer opprettet etter 13. november 2023 må ha en lukket test med minst
   **12 testere i 14 dager på rad** før de kan søke om å publisere. Be venner og familie bli testere i god tid.
4. **Fyll ut** datasikkerhetsskjemaet, aldersklassifiseringen, at appen inneholder reklame, og målgruppen
   (ikke barn).
5. **Søk om produksjonstilgang** og publiser.

## Kjøp i appen (neste steg)

I app-versjonen er kjøp med ekte penger foreløpig **skrudd av**, så appen tjener bare på reklame. For å selge
reklamefri og edelstener i appene må kjøpene gå gjennom StoreKit (Apple) og Google Play Billing. Det vanligste i
Capacitor-apper er en ferdig tjeneste som RevenueCat (har egen Capacitor-pakke og håndterer kvitteringer for begge
butikkene), eller `cordova-plugin-purchase`. Produktene (`gems_s`, `gems_m`, `gems_l`, `gems_xl`, `adfree`, `starter`)
må opprettes i App Store Connect og Play Console. Si fra når du vil ha det lagt inn i spillet.

## Skatt i Norge (kort)

- Om det er **hobby eller næring** avgjøres av om aktiviteten er egnet til å gi overskudd over tid. Er det næring,
  skal du betale skatt av **overskuddet** (inntekter minus utgifter, som Apple-avgiften og utstyr), vanligvis som et
  enkeltpersonforetak.
- Grensen på **50 000 kr** gjelder bare plikten til å registrere seg i **merverdiavgiftsregisteret** (salg over
  50 000 kr i løpet av 12 måneder) – ikke om du er næringsdrivende.
- Bruk Skatteetatens veiviser «Er jeg næringsdrivende?», og spør en regnskapsfører om moms på reklame- og
  appinntekter fra utlandet.

## Hva som er klart i koden

- `npm run build` lager alle versjonene: `docs/` (nettversjonen), `builds/crazygames/` og `builds/poki/`
  (spillportaler) og `app/www/` (appene, med AdMob).
- `src/js/monetize.js` har AdMob-støtte med samtykkeskjema, sporingsspørsmål på iOS, belønningsreklame og
  mellomreklame. I en vanlig nettleser viser app-versjonen demo-reklame. Dette er **ikke testet på en ekte telefon
  ennå** – test med TestFlight/lukket test og test-ID-ene før du bytter til ekte reklame.
- `capacitor.config.json` (husk å endre `appId`) og skriptene `app:sync`, `app:ios` og `app:android` i `package.json`.
- Ikke ferdig ennå: kjøp i appen, ekte innlogging til leaderboardet i appene (Facebook/Apple krever egne
  app-plugins – appen bruker demo-leaderboard foreløpig), Game Center, og alle ikonstørrelser og oppstartsbilde
  (lag dem fra `assets/icons/app-icon-1024.png` med `npx @capacitor/assets generate`).

## Kilder

- Apple: [Enroll in the Apple Developer Program](https://developer.apple.com/programs/enroll/) (pris, krav, alder)
- Apple: [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) (3.1.1, 3.2.2, 4.2, 4.7, 2.5.18, 5.1.2, 1.3)
- Apple: aldersgrenser 13+, 16+ og 18+ – [MacRumors](https://www.macrumors.com/2025/07/25/apple-overhauls-app-store-age-ratings/), [9to5Mac](https://9to5mac.com/2025/07/24/apple-notifies-developers-of-new-app-store-age-rating-system/)
- Apple Small Business Program: [Adapty](https://adapty.io/blog/app-store-small-business-program/), [Appbot](https://appbot.co/blog/app-developers-apple-google-small-business-programs/)
- Bygge uten Mac: [Capawesome](https://capawesome.io/blog/comparing-ci-cd-platforms-for-ios-apps/), [Choicely](https://www.choicely.com/blog/publish-ios-app-without-a-mac), [Newly](https://newly.app/guides/build-an-ios-app-without-a-mac)
- Google Play: [Get started with Play Console](https://support.google.com/googleplay/android-developer/answer/6112435?hl=en) (25 USD), [testkrav for nye personlige kontoer](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)
- AdMob: [Capacitor AdMob-pluginen](https://github.com/capacitor-community/admob), [test-annonser for iOS](https://developers.google.com/admob/ios/test-ads), [test-annonser for Android](https://developers.google.com/admob/android/test-ads), [samtykke i Capacitor (Capgo)](https://capgo.app/blog/admob-gdpr-consent-capacitor/)
- eCPM-anslag: [Playwire](https://www.playwire.com/blog/admob-ecpm-benchmarks-what-publishers-should-expect), [MonetizeMore](https://www.monetizemore.com/blog/how-much-ad-revenue-can-apps-generate/), [Playio](https://blog.playio.co/mobile-game-ecpm-benchmarks-2026)
- Spillportaler: [CrazyGames-dokumentasjon](https://docs.crazygames.com), [Cinevva om CrazyGames](https://app.cinevva.com/guides/publish-game-crazygames), [Cinevva om Poki](https://app.cinevva.com/guides/publish-game-poki), [Playgama-sammenligning](https://playgama.com/blog/?p=14181)
- Skatt: [Skatteetaten – Er jeg næringsdrivende?](https://www.skatteetaten.no/person/skatt/hjelp-til-riktig-skatt/arbeid-trygd-og-pensjon/hobby-ekstrainntekt-og-smajobber/veiviser/?22040=22042), [Skatteetaten – mva i delingsøkonomien](https://www.skatteetaten.no/nn/person/skatt/hjelp-til-rett-skatt/arbeid-trygd-og-pensjon/hobby-ekstrainntekt-og-smajobbar/delingsokonomi/mva/), [ung.no](https://www.ung.no/tjener-du-penger-uten-a-betale-skatt)
