# JaktApp

En React + Firebase webapp for jaktlogg, Google-innlogging, jaktgarderobe, rewards, kartposisjon, dagbok og bildeopplasting.

Denne versjonen er satt opp for å kjøres direkte på internett:

- Koden legges i GitHub
- GitHub Actions bygger appen automatisk
- Firebase Hosting publiserer appen på nett
- Firebase Authentication gir Google-innlogging
- Firestore lagrer profiler, våpen, jakter, dagbok og rewards
- Firebase Storage lagrer bilder

## Innhold

- Google-innlogging via Firebase Authentication
- Brukerprofil med navn, e-post og bilde
- Jaktgarderobe for våpen, kaliber, våpentype, optikk og notater
- Opprett ny jakt med sted, koordinater, jakttype, våpenvalg og dagbok
- Last opp bilder til Firebase Storage
- Mine jakter med detaljvisning og redigering av dagboknotater
- Rewards/badges basert på aktivitet
- Enkel kartmodul med OpenStreetMap-visning basert på latitude/longitude

## Slik publiseres appen uten lokal kjøring

### 1. Opprett Firebase-prosjekt

Gå til Firebase Console og opprett et nytt prosjekt.

Aktiver deretter:

1. Authentication
2. Google som innloggingsmetode
3. Firestore Database
4. Storage
5. Hosting

### 2. Registrer webapp i Firebase

I Firebase-prosjektet:

1. Gå til Project settings
2. Velg Add app
3. Velg Web app
4. Kopier Firebase-konfigurasjonen

Du trenger disse verdiene:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### 3. Opprett GitHub-repo

1. Opprett et nytt repository i GitHub
2. Last opp alle filene fra denne ZIP-filen
3. Pass på at hovedbranchen heter `main`

### 4. Legg inn GitHub Secrets

I GitHub-repoet:

Settings → Secrets and variables → Actions → New repository secret

Legg inn disse:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
FIREBASE_PROJECT_ID
FIREBASE_SERVICE_ACCOUNT
```

`FIREBASE_PROJECT_ID` er Firebase-prosjekt-ID-en.

`FIREBASE_SERVICE_ACCOUNT` må være JSON-nøkkelen til en service account som har rettigheter til å deploye til Firebase Hosting.

### 5. Automatisk deploy

Når filene pushes til `main`, kjører GitHub Actions workflowen:

```text
.github/workflows/firebase-hosting-live.yml
```

Den gjør dette automatisk:

1. Henter koden fra GitHub
2. Installerer npm-pakker
3. Bygger React/Vite-appen
4. Publiserer `dist/` til Firebase Hosting

### 6. Autoriser domene for Google-innlogging

Etter første deploy får du en Firebase Hosting-adresse, typisk:

```text
https://ditt-prosjekt.web.app
```

I Firebase Console:

Authentication → Settings → Authorized domains

Kontroller at Firebase Hosting-domenet ligger der.

## Firebase-regler

Prosjektet inneholder:

```text
firestore.rules
storage.rules
```

Disse er laget slik at innloggede brukere bare kan lese og skrive egne data under sin egen bruker-ID.

## Database-struktur

```text
users/{userId}
users/{userId}/weapons/{weaponId}
users/{userId}/hunts/{huntId}
users/{userId}/rewards/{rewardId}
```

## Viktig

Firebase-klientnøkler skal ikke hardkodes direkte i kildekoden. I denne løsningen sendes de inn som GitHub Secrets under bygging i GitHub Actions.

Dette er en første MVP, laget for videreutvikling i GitHub.

## Kart og stedssøk

Kartmodulen bruker Leaflet i nettleseren, Kartverket sitt topografiske kartlag som hovedkart, gråtone/topo som alternativ og OpenStreetMap som fallback. Stedssøk forsøker først Kartverket/GeoNorge stedsnavnsøk og faller tilbake til OpenStreetMap Nominatim dersom det ikke kommer treff.


## Kartmodul – viktig

Kartmodulen bruker nå Kartverkets nye cache-URL-er:

- `https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png`
- `https://cache.kartverket.no/v1/wmts/1.0.0/topograatone/default/webmercator/{z}/{y}/{x}.png`
- `https://cache.kartverket.no/v1/wmts/1.0.0/toporaster/default/webmercator/{z}/{y}/{x}.png`

Det gamle `opencache.statkart.no`-endepunktet er ikke lenger brukt.
