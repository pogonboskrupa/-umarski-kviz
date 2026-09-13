# Šumarski kviz

Statički web kviz o šumarstvu (4 ponuđena odgovora po pitanju), sa 6 grupa pitanja
(uređivanje šuma, uzgajanje šuma, ekonomika šumarstva, iskorištavanje šuma,
dendrometrija, mix) i admin panelom za upravljanje pitanjima i praćenje rezultata.

## Pokretanje

Samo otvorite `index.html` u browseru, ili posluži folder preko GitHub Pages / bilo kojeg static hosting servisa.

Bez postavljanja Firebase-a (vidi ispod) kviz radi odmah, koristi ugrađenih 75 pitanja iz
`questions.js`, a rezultati se pamte samo lokalno na uređaju (dugme "Rang lista").

## Kako ispitati grupu ljudi

Nema potrebe za registracijom ili lozinkom za učesnike:

1. Podijelite link (ili GitHub Pages URL) svim učesnicima.
2. Svako na svom telefonu/računaru otvori link, odabere grupu pitanja, unese svoje ime i
   klikne "Započni kviz".
3. Svako prolazi kroz do 20 pitanja nezavisno (redoslijed pitanja i odgovora je nasumičan);
   na kraju vidi svoj rezultat, ocjenu i pregled tačnih/netačnih odgovora.
4. Ako je Firebase povezan (vidi ispod), svi rezultati sa svih uređaja stižu u admin panel
   uživo — organizator vidi ko je šta odgovorio bez ikakvog prikupljanja podataka ručno.

## Admin panel (`admin.html`)

Omogućava:

- **Upravljanje pitanjima** — dodavanje, uređivanje, brisanje, uključivanje/isključivanje
  pojedinačnih pitanja po grupama (isključeno pitanje se ne pojavljuje u kvizu).
- **Uvoz ugrađenih pitanja** — dugme koje jednim klikom ubaci svih 75 ugrađenih pitanja u bazu,
  odakle ih dalje uređujete.
- **Praćenje rezultata** — tabela svih rješavanja (ime, grupa, rezultat, datum), filter po
  grupi, statistika (broj rješavanja, prosjek, najbolji rezultat), izvoz u CSV, brisanje.

Admin panel **zahtijeva Firebase** (bez njega prikazuje samo upozorenje). Rezultati i pitanja
tada su dijeljeni — vidljivi sa svih uređaja, ne samo lokalno.

## Postavljanje Firebase-a (jednom, ~10 minuta)

1. Idite na [console.firebase.google.com](https://console.firebase.google.com) i kliknite
   **Add project** (besplatno, Spark plan je dovoljan).
2. U projektu otvorite **Build → Firestore Database → Create database** (odaberite bilo koji
   region, mod "Start in production mode" — pravila ćete postaviti u koraku 5).
3. Otvorite **Build → Authentication → Get started → Sign-in method → Email/Password**,
   uključite ga. Zatim u tabu **Users** dodajte admin nalog (email + lozinka) — to su podaci
   kojima ćete se prijavljivati na `admin.html`.
4. Otvorite **Project settings** (zupčanik gore lijevo) → **General** → dolje pod
   "Your apps" kliknite web ikonu (`</>`), registrujte app (bilo koje ime). Dobit ćete
   `firebaseConfig` objekat — kopirajte vrijednosti u `firebase-config.js` u ovom repozitoriju
   (zamijenite `YOUR_API_KEY` i sl.).
5. U **Firestore Database → Rules** zalijepite sljedeća pravila i kliknite **Publish**:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /questions/{questionId} {
         allow read: if true;
         allow write: if request.auth != null;
       }
       match /results/{resultId} {
         allow create: if true;
         allow read, update, delete: if request.auth != null;
       }
     }
   }
   ```

   Ovim: svi mogu čitati pitanja (da bi kviz radio) i upisivati rezultat (da bi kviz mogao
   poslati svoj rezultat), ali samo prijavljeni admin može mijenjati pitanja i čitati/brisati
   rezultate.

6. Otvorite `admin.html`, prijavite se nalogom iz koraka 3, kliknite
   **"Uvezi ugrađenih 75 pitanja"** da napunite bazu, pa dalje uređujte po potrebi.
7. Objavite promjene (commit + push, ili redeploy static hostinga) da `firebase-config.js`
   stigne na produkciju.

`firebase-config.js` vrijednosti nisu tajne (to je standardan Firebase klijentski konfig) —
stvarna zaštita je u Firestore Rules iz koraka 5.

## Struktura

- `index.html`, `style.css`, `script.js` — sam kviz
- `admin.html`, `admin.css`, `admin.js` — admin panel
- `questions.js` — ugrađenih 75 pitanja (5 grupa × 15) + definicija grupa (`CATEGORIES`),
  koristi se kao fallback kad Firebase nije povezan i kao izvor za uvoz u bazu
- `firebase-config.js` — vaši Firebase projektni podaci (popunite prema uputama iznad)
- `firebase-init.js` — inicijalizacija Firebase klijenta (`db`, `auth`)
