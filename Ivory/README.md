# Hospital Projects App

Multi-projectapp voor de inrichting en uitrusting van ziekenhuisprojecten.
Begint met het Shajar-ziekenhuisproject (Dibba Al Husn, VAE), en is
gebouwd om moeiteloos meerdere projecten naast elkaar te beheren.

Elk project heeft zijn eigen: Dashboard, Risicoregister, Taken/Kanban,
Scope-log, Registratietracker (bv. MDMA/MOHAP), Apparatuuroverzicht,
en Partijen & Communicatie (met "wachten op extern"-bord). Je schakelt
tussen projecten via de projectkiezer op `/projects`.

Deze handleiding gaat ervan uit dat je **geen ervaring hebt met de
terminal**. Alles kan via de browser en GitHub Desktop.

---

## Stap 1 — Supabase-project aanmaken (de database)

1. Ga naar [supabase.com](https://supabase.com) en log in (of maak een
   gratis account aan).
2. Klik op **New Project**.
3. Naam: `shajar-hospital` (of wat je wilt).
4. Kies een wachtwoord voor de database en bewaar dit ergens veilig.
5. Kies een regio dicht bij jullie (bijv. **Europe West**).
6. Klik **Create new project** en wacht tot deze klaar is (circa 2
   minuten).

### Database-schema installeren

1. Klik in het Supabase-menu links op **SQL Editor**.
2. Klik op **New query**.
3. Open het bestand `supabase/schema.sql` uit deze projectmap, kopieer
   de volledige inhoud, en plak dit in de SQL Editor.
4. Klik op **Run**. Je ziet nu een lijst met nieuwe tabellen onder
   **Table Editor**.

### (Optioneel) Voorbeeldproject laden

Als je wilt starten met het Shajar-project inclusief de risico's,
scope-items en taken die al uit de projectdocumenten bekend zijn:

1. Log eerst één keer in de app in (zie Stap 4) zodat er een gebruiker
   bestaat.
2. Open een **nieuwe query** in de SQL Editor.
3. Kopieer de inhoud van `supabase/seed.sql` en klik **Run**. Dit maakt
   automatisch het project "Shajar Hospital" aan en vult het met de
   bestaande data.
4. Ga in de app naar `/projects` en klik het project aan.

Nieuwe projecten maak je vanaf dat moment gewoon in de app zelf via de
knop **+ Nieuw project** op de projectenpagina — geen SQL meer nodig.

### API-sleutels ophalen

1. Ga naar **Project Settings → API**.
2. Kopieer de **Project URL** en de **anon public key** — deze heb je
   zo nodig.

---

## Stap 2 — Gebruikers aanmaken

1. Ga in Supabase naar **Authentication → Users**.
2. Klik **Add user → Create new user**.
3. Maak een gebruiker aan voor Ibrahim, Jan, en Gertjan, bijvoorbeeld:
   - `ibrahim@shajar-project.local`
   - `jan@shajar-project.local`
   - `gertjan@shajar-project.local`
4. Geef elk een wachtwoord (kunnen jullie later zelf wijzigen).
5. Er wordt automatisch een profiel aangemaakt. Om Gertjan "op de
   achtergrond" te zetten: ga naar **Table Editor → profiles**, zoek
   zijn rij, en zet **visible** op `false`.

> Wil je namen/rollen meteen goed instellen? Voeg bij het aanmaken van
> de gebruiker onder **User Metadata** toe:
> `{"full_name": "Ibrahim", "role": "CFO", "visible": true}`

---

## Stap 3 — Bestanden openen in GitHub Desktop

1. Download en installeer [GitHub Desktop](https://desktop.github.com)
   als je dat nog niet hebt.
2. Pak deze projectmap (de zip) uit op je computer.
3. Open GitHub Desktop → **File → Add local repository** → wijs naar
   de uitgepakte map.
4. Als GitHub Desktop vraagt om een Git-repository te initialiseren,
   klik dan **Create a repository**.
5. Klik rechtsboven op **Publish repository**. Zet deze op **Private**
   (dit project bevat vertrouwelijke tenderinformatie).

---

## Stap 4 — .env.local instellen (lokaal testen)

1. Zoek in de projectmap het bestand `.env.local.example`.
2. Maak een kopie en hernoem deze naar `.env.local`.
3. Vul de twee waarden in met wat je bij Stap 1 hebt gekopieerd:

```
NEXT_PUBLIC_SUPABASE_URL=https://jouw-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=jouw-anon-key
```

4. Installeer [Node.js](https://nodejs.org) (LTS-versie) als je dat
   nog niet hebt — nodig om de app lokaal te testen.
5. Open de projectmap in **VS Code** (gratis, [code.visualstudio.com](https://code.visualstudio.com)),
   open een terminal via **Terminal → New Terminal**, en typ:

```
npm install
npm run dev
```

6. Open in je browser: `http://localhost:3000`. Log in met een van de
   gebruikers uit Stap 2.

---

## Stap 5 — Live zetten via Vercel

1. Ga naar [vercel.com](https://vercel.com) en log in met je
   GitHub-account.
2. Klik **Add New → Project**.
3. Kies de repository die je in Stap 3 hebt gepubliceerd
   (`shajar-hospital-app`).
4. Bij **Environment Variables**, voeg dezelfde twee waarden toe als
   in je `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Klik **Deploy**. Na 1-2 minuten krijg je een live-link, bijv.
   `shajar-hospital-app.vercel.app`.

Vanaf nu: elke keer dat je via GitHub Desktop wijzigingen commit en
"Push origin" doet, deployt Vercel automatisch een nieuwe versie.

---

## Wat kun je nu al doen?

- Inloggen en op `/projects` al je projecten zien
- Zelf nieuwe projecten aanmaken via **+ Nieuw project**
- Per project: Dashboard met live voortgang, risico's, budget en
  deadlines
- Per project: risico's, taken, scope, registraties, apparatuur en
  partijen bekijken (Shajar is gevuld met voorbeelddata als je
  `seed.sql` hebt gedraaid)
- Taken verplaatsen tussen Te doen / Mee bezig / Klaar
- Elk project is afgeschermd: je ziet alleen projecten waar je zelf
  lid van bent

## Gegevens toevoegen of aanpassen

Voor nu werkt data toevoegen/bewerken het snelst via **Supabase Table
Editor** (Stap 1 → Table Editor → kies een tabel → **Insert row**).
Formulieren in de app zelf (zodat dit niet meer nodig is) zijn een
logische volgende stap — laat het weten en we bouwen die erbij.

## Fase 2 — nog te bouwen

- Google Drive-koppeling voor documenten
- E-mailkoppeling (Gmail API of forward-adres)
- Formulieren in de app zelf om data toe te voegen zonder Supabase
- Teamleden per project uitnodigen via de app zelf (nu nog via
  Supabase Table Editor: tabel `project_members`)
- Volledige apparatuurlijst (3.267 regelitems voor Shajar)
- Budget-detail per categorie/afdeling
- Compliance/KYC-log
- Entiteitsoverzicht (Ivory BV / Ivory LLC Dubai)

## Nieuwe teamleden aan een project toevoegen

Voorlopig via Supabase:
1. **Authentication → Users** → maak de gebruiker aan (indien nog niet
   aanwezig).
2. **Table Editor → project_members** → **Insert row**: vul
   `project_id` (te vinden in de tabel `projects`) en `user_id` in.
   Zet `visible` op `false` om iemand op de achtergrond te houden.
