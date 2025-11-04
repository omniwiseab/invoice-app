# Supabase Setup Guide

## Steg 1: Skapa Supabase-projekt

1. Gå till [supabase.com](https://supabase.com)
2. Logga in eller skapa konto
3. Klicka på "New Project"
4. Fyll i:
   - Project name: `invoice-app` (eller valfritt namn)
   - Database Password: Välj ett starkt lösenord
   - Region: Välj närmaste region (t.ex. `eu-north-1` för Stockholm)
5. Klicka på "Create new project"
6. Vänta några minuter medan projektet skapas

## Steg 2: Konfigurera databasen

1. Gå till SQL Editor i Supabase Dashboard (vänster meny)
2. Klicka på "+ New query"
3. Kopiera hela innehållet från filen `supabase-schema.sql`
4. Klistra in i SQL-editorn
5. Klicka på "Run" (eller tryck Ctrl/Cmd + Enter)
6. Verifiera att alla tabeller skapades utan fel

## Steg 3: Hämta API-nycklar

1. Gå till "Project Settings" (kugghjulsikon i vänster meny)
2. Klicka på "API" i sidomenyn
3. Hitta följande två värden:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")
4. Kopiera dessa värden

## Steg 4: Konfigurera applikationen

1. Öppna filen `.env` i projektets rot
2. Ersätt värdena med dina egna:

```env
VITE_SUPABASE_URL=https://ditt-projekt-id.supabase.co
VITE_SUPABASE_ANON_KEY=din_anon_public_key_här
```

3. Spara filen
4. Starta om utvecklingsservern:
```bash
npm run dev
```

## Steg 5: Aktivera autentisering (valfritt men rekommenderat)

För att lägga till användarautentisering:

1. Gå till "Authentication" i Supabase Dashboard
2. Klicka på "Providers"
3. Aktivera Email (redan aktiverad som standard)
4. Konfigurera eventuella andra providers (Google, GitHub, etc.)

## Steg 6: Konfigurera Storage för logotyper (valfritt)

Om du vill lagra logotyper i Supabase istället för base64:

1. Gå till "Storage" i Supabase Dashboard
2. Klicka på "Create bucket"
3. Namn: `logos`
4. Public bucket: ☑️ (aktivera)
5. Klicka på "Create bucket"

## Funktioner som nu fungerar med Supabase

✅ **Persistent datalagring**
- All data sparas säkert i Supabase PostgreSQL-databas
- Ingen risk att förlora data vid siduppdatering

✅ **Multi-användare**
- Varje användare har sin egen data
- Row Level Security (RLS) skyddar mot obehörig åtkomst

✅ **Realtidsuppdateringar (framtida funktion)**
- Supabase stödjer realtidsuppdateringar
- Kan enkelt aktiveras senare

✅ **Backup och export**
- Supabase tar automatiska backuper
- Kan exportera data när som helst

✅ **Skalbar**
- Hanterar tusentals fakturor utan problem
- Automatisk skalning

## Felsökning

### Problem: "Failed to fetch"
- Kontrollera att URL och API-nyckel är korrekta i `.env`
- Starta om utvecklingsservern efter att du ändrat `.env`

### Problem: "Invalid API key"
- Se till att du kopierade rätt nyckel (anon public, inte service_role)
- Kontrollera att det inte finns extra mellanslag

### Problem: "Permission denied"
- Verifiera att SQL-schemat kördes korrekt
- Kontrollera RLS-policies i Supabase Dashboard

### Problem: Data syns inte
- Kontrollera att du är inloggad (om autentisering är aktiverad)
- Kolla i Supabase Table Editor om data finns där

## Nästa steg

När Supabase är konfigurerat kan du:

1. **Lägga till autentisering** - Se `AUTH_SETUP.md` (kommer snart)
2. **Implementera email-sending** - Använd Supabase Edge Functions
3. **Lägga till filuppladdning** - För att spara PDF:er i Storage
4. **Aktivera realtidsuppdateringar** - För live-synkning

## Support

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- GitHub Issues: https://github.com/supabase/supabase/issues
