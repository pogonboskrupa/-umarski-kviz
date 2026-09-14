# Šumarski kviz

Web kviz iz šumarstva na fakultetskom nivou (87 pitanja, 4 ponuđena odgovora), sa 6 grupa
pitanja (uređivanje šuma, uzgajanje šuma, ekonomika šumarstva, iskorištavanje šuma,
dendrometrija, mix) i admin panelom za upravljanje pitanjima i praćenje rezultata.

## 1. Kako se kviz "pravi" — odakle dolaze pitanja

Postoje dva načina, i mogu se kombinovati:

- **Ugrađena pitanja** (`questions.js`) — 87 gotovih pitanja koja rade odmah, bez ikakvog
  podešavanja. Ovo je polazna tačka; ako ih želite mijenjati bez admin panela, uređujete
  direktno taj fajl (svako pitanje ima `category`, `q` — tekst pitanja, `a` — niz od 4
  odgovora, `correct` — indeks tačnog odgovora u `a`).
- **Admin panel** (`admin.html`) — preporučeni način. Nakon što povežete Firebase (uputstvo
  u dijelu 3), admin panel vam daje formu za dodavanje/uređivanje/brisanje pitanja bez
  ikakvog programiranja, uz uvoz ugrađenih pitanja jednim klikom kao polaznu osnovu.

Bez Firebase-a, kviz radi na osnovu `questions.js` i tako i ostaje (ne možete ga mijenjati
kroz admin panel — samo ručnim uređivanjem fajla). Sa Firebase-om, kviz uvijek prvo
pokušava učitati pitanja iz baze; ako baza nema pitanja ili nije dostupna, automatski
koristi ugrađena kao rezervu — aplikacija se nikad ne "sruši" zbog toga.

## 2. Pokretanje — koji link korisnici otvaraju

Ovo su **dvije odvojene stranice s različitom namjenom**:

- **`index.html` — stranica za učesnike kviza.** Ovo je link koji dijelite grupi ljudi
  koja rješava kviz. Ne traži nikakvu prijavu.
- **`admin.html` — stranica samo za organizatora/nastavnika.** Traži prijavu (email +
  lozinka iz Firebase Authentication). Učesnicima se ovaj link ne dijeli.

**Testiranje na svom računaru:** otvorite `index.html` dvoklikom (radi odmah, offline, sa
ugrađenim pitanjima) — dobro za provjeru prije nego što ga podijelite grupi.

**Da bi grupa mogla otvoriti kviz na svojim telefonima/računarima, sajt mora biti online.**
Najjednostavniji besplatan način je GitHub Pages:

1. Na GitHub-u otvorite ovaj repozitorij → **Settings → Pages**.
2. Pod "Build and deployment" → "Source" izaberite **Deploy from a branch**.
3. Pod "Branch" izaberite granu na kojoj su fajlovi (npr. `main`) i folder `/ (root)`,
   pa **Save**.
4. Nakon par minuta GitHub prikazuje link oblika:
   `https://<vaš-github-username>.github.io/<naziv-repozitorija>/`
5. **Taj link (bez ičega dodatnog na kraju) je link koji dijelite učesnicima** — on
   automatski otvara `index.html`. Za sebe kao organizatora, na kraj tog istog linka
   dodajte `admin.html`, npr.:
   `https://<vaš-github-username>.github.io/<naziv-repozitorija>/admin.html`

Svaka naredna izmjena (nova pitanja u `questions.js`, izmjene stila i sl.) koju pushate na
tu granu automatski se objavljuje na isti link u roku od par minuta — ne treba ništa
posebno pokretati.

## 3. Kako ispitati grupu ljudi

1. Podijelite `index.html` link (korak 2) svim učesnicima.
2. Svako na svom telefonu/računaru otvori link, odabere grupu pitanja, unese svoje ime i
   klikne "Započni kviz".
3. Svako prolazi kroz do 20 pitanja nezavisno (redoslijed pitanja i odgovora je nasumičan
   za svakog, tako da ne mogu prepisivati); na kraju vidi svoj rezultat, ocjenu i pregled
   tačnih/netačnih odgovora.
4. Ako je Firebase povezan (upute ispod), svi rezultati sa svih uređaja stižu u admin panel
   uživo — organizator vidi ko je šta odgovorio bez ikakvog prikupljanja podataka ručno.

## 4. Admin panel (`admin.html`)

Omogućava:

- **Upravljanje pitanjima** — dodavanje (uz pretragu postojećih, provjeru da nema
  identičnih ponuđenih odgovora i dugme "Sačuvaj i dodaj novo" za brzo unošenje više
  pitanja zaredom), uređivanje, brisanje, uključivanje/isključivanje pojedinačnih pitanja
  po grupama (isključeno pitanje se ne pojavljuje u kvizu).
- **Uvoz ugrađenih pitanja** — dugme koje jednim klikom ubaci svih 87 ugrađenih pitanja u
  bazu, odakle ih dalje uređujete.
- **Praćenje rezultata** — tabela svih rješavanja (ime, grupa, rezultat, datum), filter po
  grupi, statistika (broj rješavanja, prosjek, najbolji rezultat), izvoz u CSV, brisanje.

Admin panel **zahtijeva Firebase** (bez njega prikazuje samo upozorenje). Rezultati i pitanja
tada su dijeljeni — vidljivi sa svih uređaja, ne samo lokalno.

## 5. Postavljanje Firebase-a (jednom, ~10 minuta)

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
   **"Uvezi ugrađena pitanja"** da napunite bazu, pa dalje uređujte po potrebi.
7. Objavite promjene (commit + push) da `firebase-config.js` stigne na produkciju — ako
   koristite GitHub Pages (dio 2), to se desi automatski u roku od par minuta.

`firebase-config.js` vrijednosti nisu tajne (to je standardan Firebase klijentski konfig) —
stvarna zaštita je u Firestore Rules iz koraka 5.

## Struktura

- `index.html`, `style.css`, `script.js` — sam kviz (link za učesnike)
- `admin.html`, `admin.css`, `admin.js` — admin panel (link samo za organizatora)
- `questions.js` — ugrađenih 87 pitanja fakultetskog nivoa (5 grupa) + definicija grupa
  (`CATEGORIES`); uključuje i pitanja o klasifikaciji stabala (Kraftove klase socijalnog
  položaja) i klasiranju kvaliteta drvnih sortimenata. Koristi se kao rezerva kad Firebase
  nije povezan i kao izvor za uvoz u bazu.
- `firebase-config.js` — vaši Firebase projektni podaci (popunite prema uputama iznad)
- `firebase-init.js` — inicijalizacija Firebase klijenta (`db`, `auth`)
