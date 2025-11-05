# Supabase Setup Guide / Installationsguide

Denna guide hjälper dig att sätta upp Supabase för din fakturaapplikation.

## Steg 1: Skapa ett Supabase-projekt

1. Gå till [Supabase Dashboard](https://supabase.com/dashboard)
2. Logga in eller skapa ett gratis konto
3. Klicka på **"New Project"**
4. Fyll i:
   - **Name**: invoice-app (eller valfritt namn)
   - **Database Password**: Skapa ett starkt lösenord (spara det på säker plats!)
   - **Region**: Välj regionen närmast dig (t.ex. `eu-north-1` för Stockholm)
   - **Pricing Plan**: Free tier fungerar bra för utveckling
5. Klicka på **"Create new project"**
6. Vänta 2-3 minuter medan projektet skapas

## Steg 2: Hämta dina API-nycklar

1. I ditt Supabase-projekt, gå till: **Settings → API** (kugghjulsikonen i vänster menyn)
2. Du kommer att se:
   - **Project URL** - något liknande `https://xyzabc123.supabase.co`
   - **API Keys** sektion med:
     - `anon` `public` key - en lång sträng som börjar med `eyJ...`

3. Kopiera dessa två värden

## Steg 3: Konfigurera din .env.local fil

1. Öppna `.env.local` filen i projektets root
2. Ersätt placeholder-värdena:

```env
# Före (placeholder-värden):
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Efter (dina riktiga värden):
VITE_SUPABASE_URL=https://xyzabc123.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJ...
```

3. Spara filen

**⚠️ VIKTIGT:** Committa ALDRIG `.env.local` till git! Den finns redan i `.gitignore`.

## Steg 4: Sätt upp databasschemat

1. Gå till din Supabase Dashboard
2. Klicka på **SQL Editor** (i vänster menyn)
3. Öppna filen `supabase-schema-auth-fixed.sql` från ditt projekt
4. Kopiera ALL SQL-kod från den filen
5. Klistra in den i Supabase SQL Editor
6. Klicka på **"Run"** (eller tryck Ctrl+Enter)
7. Du bör se "Success. No rows returned"

Detta skapar:
- `users` tabell för användarprofiler
- `companies` tabell för företagsinformation
- `customers` tabell för kunddata
- `invoices` och `invoice_items` tabeller
- Triggers för att automatiskt skapa användarprofiler vid registrering
- Row Level Security (RLS) policies

## Steg 5: Konfigurera autentiseringsinställningar

### För Utveckling (Rekommenderat för testning):

1. Gå till: **Authentication → Providers → Email**
2. **Avmarkera** "Confirm email" checkboxen
3. Klicka på **Save**

Detta låter dig registrera dig och logga in direkt utan email-verifiering.

### För Produktion (Mer säkert):

Behåll "Confirm email" ikryssad och konfigurera email:

1. Gå till: **Authentication → Providers → Email**
2. Håll "Confirm email" **ikryssad**
3. Gå till: **Project Settings → Authentication → SMTP Settings**
4. Konfigurera din SMTP-server (eller använd Supabase standard)
5. Anpassa email-mallar i: **Authentication → Email Templates**

## Steg 6: Konfigurera Site URL

1. Gå till: **Authentication → URL Configuration**
2. Lägg till dina site URLs:
   - **Site URL**: `http://localhost:5173`
   - **Redirect URLs**: Lägg till dessa:
     - `http://localhost:5173/**`
     - `http://localhost:5173/reset-password`

3. Klicka på **Save**

## Steg 7: Starta om utvecklingsservern

Efter dessa ändringar:

```bash
# Stoppa dev-servern (Ctrl+C i terminalen)
# Starta sedan igen:
npm run dev
```

Appen kommer nu att laddas om med din Supabase-konfiguration!

## Steg 8: Testa din setup

1. Gå till `http://localhost:5173/register`
2. Skapa ett nytt konto med:
   - Email: din-email@example.com
   - Password: Måste vara 8+ tecken med stora bokstäver, små bokstäver och siffra
   - Exempel: `Password123`

3. Om email-bekräftelse är avaktiverad:
   - Du bör se "Account created successfully!"
   - Navigera till login och logga in direkt

4. Om email-bekräftelse är aktiverad:
   - Kolla din email för bekräftelselänk
   - Klicka på länken för att bekräfta
   - Gå sedan till login-sidan

5. Efter inloggning bör du omdirigeras till dashboarden!

## Felsökning

### "Supabase is not configured" Error
- Se till att du uppdaterade `.env.local` med riktiga värden (inte placeholders)
- Se till att du startade om dev-servern efter att ha ändrat `.env.local`
- Kontrollera att filen heter exakt `.env.local` (inte `.env` eller `env.local`)

### "Email not confirmed" Error
- Antingen avaktivera email-bekräftelse (se Steg 5)
- Eller kolla din email och klicka på bekräftelselänken

### Kan inte se tabeller i Supabase Dashboard
- Se till att du körde SQL-schemat (Steg 4)
- Gå till: **Database → Tables** för att verifiera att tabellerna skapades
- Leta efter: `users`, `companies`, `customers`, `invoices`, `invoice_items`

### Database Password förlorat
- Detta är lösenordet du satte när du skapade projektet
- Du kan återställa det i: **Project Settings → Database → Reset database password**
- OBS: Detta är inte samma som ditt Supabase-kontolösenord!

### Har fortfarande problem?

Kolla dessa filer för mer hjälp:
- `LOGIN_TROUBLESHOOTING.md` - Login-specifika problem
- `README.md` - Allmän projektsetup

Eller kolla Supabase-dokumentationen:
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## Säkerhetsnoteringar

- **Committa ALDRIG** `.env.local` till version control
- **Dela ALDRIG** din `anon` key publikt (även om den är relativt säker)
- **Dela ALDRIG** din `service_role` key - denna har admin-åtkomst!
- För produktion, använd environment variables på din hosting-plattform
- Aktivera Row Level Security (RLS) på alla tabeller (redan gjort i schemat)

## Vad händer nu?

Efter setup kan du:
1. Skapa kunder
2. Generera fakturor
3. Hantera företagsinformation
4. Exportera fakturor som PDF
5. Spåra fakturastatus

Njut av din fakturaapp! 🎉
