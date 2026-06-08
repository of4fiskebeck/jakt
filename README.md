# Jegerapp

React + Firebase webapp for jaktlogg, Google-innlogging, jaktgarderobe, tid på jakt, felte dyr, bilder, jegervenner, kommentarer og rewards.

## Publisering

Prosjektet er satt opp for GitHub Actions og Firebase Hosting. Last opp filene i roten av GitHub-repoet og commit til `main`.

## Viktige Firebase-tjenester

- Authentication: Google må være aktivert.
- Firestore Database: brukes til brukerdata, jakter, våpen, felte dyr, venner og kommentarer.
- Storage: brukes til jaktbilder og bilder av felte dyr.
- Hosting: publiserer appen på nett.

## GitHub Secrets

Disse må ligge under Settings → Secrets and variables → Actions:

- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID
- VITE_FIREBASE_MEASUREMENT_ID
- FIREBASE_PROJECT_ID
- FIREBASE_SERVICE_ACCOUNT

## Nytt i denne versjonen

- Navn endret til Jegerapp.
- Tid på jakt: start/slutt, beregnet varighet og manuell varighet.
- Dyr skutt / felt vilt: art, kjønn, kategori, vekt, skuddavstand, notat og bilde.
- Bildeopplasting er forbedret med feilmeldinger og tryggere Storage-sti.
- Jegervenner: legg til venn med e-post, godta forespørsler og se venners delte felte dyr.
- Kommentarer på egne felte dyr og felte dyr delt av venner.
- Delingsnivå: privat eller synlig for jegervenner.
- Kartverket topografisk kart og forbedret stedsøk.

## Ikonoppdatering

Denne versjonen har integrerte premium-ikoner i grønn/gull-stil:

- hovedikon for Jegerapp
- favicon og PWA/webapp-ikoner
- ikon på innloggingssiden
- ikon i toppmenyen
- ikon på hovedsider, dashboardkort, bildeopplasting og kartmodul

Ikonfilene ligger i `public/icons/`, mens app-/favicon-filene ligger i `public/`.
