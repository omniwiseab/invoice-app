# Superadmin Setup Guide

Detta är en komplett guide för att sätta upp superadmin-funktionaliteten i FakturaApp.

## 📋 Översikt

Systemet har nu tre rollnivåer:
- **user** - Vanlig användare (standard)
- **admin** - Administratör
- **superadmin** - Superadministratör (full kontroll)

## 🗄️ Steg 1: Kör Database Schema

1. Logga in på din Supabase Dashboard: https://app.supabase.com
2. Välj ditt projekt
3. Gå till **SQL Editor**
4. Öppna filen `supabase-schema-auth.sql` och kopiera innehållet
5. Klistra in SQL-koden i SQL Editor
6. Klicka på **Run** för att köra scriptet

Detta kommer att:
- Skapa `users`-tabellen med roller
- Skapa `companies`-tabellen
- Sätta upp Row Level Security (RLS)
- Lägga till automatisk trigger för att skapa användarprofil vid registrering
- Uppdatera `customers` och `invoices` tabellerna med user_id

## 👤 Steg 2: Skapa Din Första Superadmin

### Alternativ A: Via Supabase Dashboard (Enklast)

1. Registrera dig via appen på `/register`
2. Gå till Supabase Dashboard → **Authentication** → **Users**
3. Hitta din användare i listan
4. Gå till Supabase Dashboard → **SQL Editor**
5. Kör följande SQL (byt ut email):

```sql
UPDATE public.users
SET role = 'superadmin'
WHERE email = 'din-email@example.com';
```

6. Logga ut och logga in igen i appen

### Alternativ B: Via SQL Editor direkt

Om du redan känner till din user ID:

```sql
UPDATE public.users
SET role = 'superadmin'
WHERE id = 'user-uuid-här';
```

## 🔐 Steg 3: Verifiera Åtkomst

1. Logga in i appen
2. Du bör nu se **Admin Panel** i sidomenyn (med röd bakgrund)
3. Klicka på Admin Panel
4. Du bör se:
   - Översikt med statistik
   - Användarhantering
   - Möjlighet att ändra roller och hantera användare

## 📊 Funktioner i Admin Panel

### Översikt
- Visa totalt antal användare
- Visa antal aktiva användare
- Visa antal kunder och fakturor
- Systemstatistik

### Användarhantering
- Lista alla användare
- Redigera användaruppgifter
- Ändra roller (user, admin, superadmin)
- Aktivera/inaktivera användare
- Ta bort användare (ej superadmins)

## 🛡️ Säkerhet

### Row Level Security (RLS)
Alla tabeller är skyddade med RLS-policies:

- **users**: Endast superadmins kan se alla användare
- **companies**: Endast superadmins kan hantera alla företag
- **customers**: Användare ser bara sina egna kunder
- **invoices**: Användare ser bara sina egna fakturor

### Rollbaserad åtkomst
- Vanliga användare: Kan bara se sin egen data
- Admins: Kan se data inom sitt företag (future feature)
- Superadmins: Kan se och hantera all data

## 🔧 Felsökning

### Problem: Ser inte Admin Panel efter upgrade
**Lösning**: Logga ut och logga in igen för att refresha användardata.

### Problem: "Du har inte behörighet"
**Lösning**:
1. Kontrollera att din roll är `superadmin` i databasen:
```sql
SELECT email, role FROM public.users WHERE email = 'din-email@example.com';
```
2. Om rollen är fel, uppdatera den med UPDATE-kommandot ovan

### Problem: Users-tabellen är tom
**Lösning**: Triggern skapar automatiskt en user-post när någon registrerar sig. Om du redan har registrerade användare FÖRE att du körde schemat, kör:

```sql
INSERT INTO public.users (id, email, role)
SELECT id, email, 'user' as role
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users);
```

### Problem: Kan inte se andra användares data
**Lösning**: Detta är förväntat beteende! Endast superadmins kan se all data. Kontrollera din roll i databasen.

## 📝 Viktiga SQL-kommandon

### Visa alla användare och roller
```sql
SELECT email, role, is_active, created_at
FROM public.users
ORDER BY created_at DESC;
```

### Uppgradera en användare till admin
```sql
UPDATE public.users
SET role = 'admin'
WHERE email = 'user@example.com';
```

### Uppgradera en användare till superadmin
```sql
UPDATE public.users
SET role = 'superadmin'
WHERE email = 'user@example.com';
```

### Inaktivera en användare
```sql
UPDATE public.users
SET is_active = false
WHERE email = 'user@example.com';
```

### Återaktivera en användare
```sql
UPDATE public.users
SET is_active = true
WHERE email = 'user@example.com';
```

## 🎨 UI-komponenter

### Nya komponenter
- `AuthContext` - Uppdaterad med rollhantering
- `UserManagement` - Hantera användare
- `AdminPanel` - Admin dashboard
- `RoleGuard` - Skydda routes baserat på roll
- `useRole` - Hook för rollkontroller

### Nya routes
- `/admin` - Admin Panel (endast superadmins)

### Nya typer
- `UserRole` - Type för roller
- `UserProfile` - User-profil från databasen
- `Company` - Företagsinformation

## 🚀 Nästa steg

1. **Multi-tenant företag**: Lägg till funktionalitet för att skapa och hantera företag
2. **Team-hantering**: Låt admins hantera användare inom sitt företag
3. **Audit logs**: Logga alla admin-åtgärder
4. **Email-notifieringar**: Skicka email när roller ändras
5. **Permissions**: Finare granulär behörighetskontroll

## 📞 Support

Om du har problem, kontrollera:
1. Supabase-loggar i Dashboard → Logs
2. Browser console för JavaScript-fel
3. Network-tab för API-fel
4. SQL-queries i Supabase SQL Editor

---

**Skapad**: 2025-11-03
**Version**: 1.0
**Status**: ✅ Production Ready
