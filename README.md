# Šumarski kviz

Statički web kviz sa 20 pitanja o šumarstvu (4 ponuđena odgovora po pitanju).

## Pokretanje

Samo otvorite `index.html` u browseru, ili posluži folder preko GitHub Pages / bilo kojeg static hosting servisa.

## Kako ispitati grupu ljudi

Nema potrebe za registracijom ili lozinkom:

1. Podijelite link (ili GitHub Pages URL) svim učesnicima.
2. Svako na svom telefonu/računaru otvori link, unese svoje ime i klikne "Započni kviz".
3. Svako prolazi kroz 20 pitanja nezavisno; na kraju vidi svoj rezultat, ocjenu i pregled tačnih/netačnih odgovora.

Rezultati su lokalni po uređaju (nema baze/servera). Ako vam zatreba zajednička rang-lista uživo (svi rezultati na jednom ekranu u realnom vremenu), to zahtijeva backend/shared bazu — javite ako želite tu proširenu verziju.

## Struktura

- `index.html` — struktura ekrana (unos imena, pitanja, rezultat)
- `style.css` — stilovi
- `questions.js` — 20 pitanja sa odgovorima
- `script.js` — logika kviza
