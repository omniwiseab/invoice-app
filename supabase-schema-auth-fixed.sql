-- ============================================
-- SUPERADMIN SCHEMA (FIXED VERSION)
-- ============================================
-- Kör detta schema i Supabase SQL Editor

-- 1. Skapa enum för roller (om den inte finns)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Skapa companies-tabellen FÖRST (om den inte finns)
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  organization_number TEXT,
  vat_number TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Sverige',
  phone TEXT,
  email TEXT,
  website TEXT,
  logo TEXT,
  bank_account TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Skapa users-tabellen (utökar auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'user',
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Funktion för updated_at trigger (om den inte finns)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Skapa trigger för att automatiskt skapa user-post vid registrering
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    'user', -- Default roll är 'user'
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger om den finns och skapa ny
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Skapa funktion för att kontrollera om användare är superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Skapa funktion för att kontrollera om användare är admin eller superadmin
CREATE OR REPLACE FUNCTION public.is_admin_or_above(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id AND role IN ('admin', 'superadmin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Row Level Security (RLS) för users-tabellen
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop alla existerande policies först
DROP POLICY IF EXISTS "Superadmins can view all users" ON public.users;
DROP POLICY IF EXISTS "Superadmins can update all users" ON public.users;
DROP POLICY IF EXISTS "Superadmins can delete users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Skapa nya policies
CREATE POLICY "Superadmins can view all users"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    public.is_superadmin(auth.uid()) OR
    id = auth.uid()
  );

CREATE POLICY "Superadmins can update all users"
  ON public.users FOR UPDATE
  TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can delete users"
  ON public.users FOR DELETE
  TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 9. RLS för companies-tabellen
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Drop existerande policies
DROP POLICY IF EXISTS "Superadmins can view all companies" ON public.companies;
DROP POLICY IF EXISTS "Users can view own company" ON public.companies;
DROP POLICY IF EXISTS "Superadmins can create companies" ON public.companies;
DROP POLICY IF EXISTS "Superadmins can update companies" ON public.companies;

-- Skapa nya policies
CREATE POLICY "Superadmins can view all companies"
  ON public.companies FOR SELECT
  TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Users can view own company"
  ON public.companies FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Superadmins can create companies"
  ON public.companies FOR INSERT
  TO authenticated
  WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can update companies"
  ON public.companies FOR UPDATE
  TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

-- 10. Uppdatera customers-tabellen (om den finns)
DO $$
BEGIN
  -- Lägg till kolumner om de inte finns
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
    ALTER TABLE public.customers
      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

    -- Drop existerande policies
    DROP POLICY IF EXISTS "Users can view own customers" ON public.customers;
    DROP POLICY IF EXISTS "Users can create own customers" ON public.customers;
    DROP POLICY IF EXISTS "Users can update own customers" ON public.customers;
    DROP POLICY IF EXISTS "Users can delete own customers" ON public.customers;

    -- RLS för customers
    CREATE POLICY "Users can view own customers"
      ON public.customers FOR SELECT
      TO authenticated
      USING (
        user_id = auth.uid() OR
        public.is_superadmin(auth.uid())
      );

    CREATE POLICY "Users can create own customers"
      ON public.customers FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());

    CREATE POLICY "Users can update own customers"
      ON public.customers FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid() OR public.is_superadmin(auth.uid()))
      WITH CHECK (user_id = auth.uid() OR public.is_superadmin(auth.uid()));

    CREATE POLICY "Users can delete own customers"
      ON public.customers FOR DELETE
      TO authenticated
      USING (user_id = auth.uid() OR public.is_superadmin(auth.uid()));
  END IF;
END $$;

-- 11. Uppdatera invoices-tabellen (om den finns)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoices') THEN
    ALTER TABLE public.invoices
      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

    -- Drop existerande policies
    DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
    DROP POLICY IF EXISTS "Users can create own invoices" ON public.invoices;
    DROP POLICY IF EXISTS "Users can update own invoices" ON public.invoices;
    DROP POLICY IF EXISTS "Users can delete own invoices" ON public.invoices;

    -- RLS för invoices
    CREATE POLICY "Users can view own invoices"
      ON public.invoices FOR SELECT
      TO authenticated
      USING (
        user_id = auth.uid() OR
        public.is_superadmin(auth.uid())
      );

    CREATE POLICY "Users can create own invoices"
      ON public.invoices FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());

    CREATE POLICY "Users can update own invoices"
      ON public.invoices FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid() OR public.is_superadmin(auth.uid()))
      WITH CHECK (user_id = auth.uid() OR public.is_superadmin(auth.uid()));

    CREATE POLICY "Users can delete own invoices"
      ON public.invoices FOR DELETE
      TO authenticated
      USING (user_id = auth.uid() OR public.is_superadmin(auth.uid()));
  END IF;
END $$;

-- 12. Lägg till befintliga auth.users till public.users (för existerande användare)
INSERT INTO public.users (id, email, role, full_name)
SELECT
  id,
  email,
  'user' as role,
  COALESCE(raw_user_meta_data->>'full_name', '') as full_name
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- 13. Index för bättre prestanda
CREATE INDEX IF NOT EXISTS users_role_idx ON public.users(role);
CREATE INDEX IF NOT EXISTS users_company_id_idx ON public.users(company_id);
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);

-- 14. Triggers för updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 15. Visa alla användare (för verifiering)
SELECT
  email,
  role,
  is_active,
  created_at,
  'Run: UPDATE public.users SET role = ''superadmin'' WHERE email = ''' || email || ''';' as upgrade_command
FROM public.users
ORDER BY created_at DESC;
