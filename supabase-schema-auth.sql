-- ============================================
-- SUPERADMIN SCHEMA
-- ============================================
-- Detta schema lägger till rollbaserad åtkomstkontroll
-- med stöd för superadmin, admin och vanliga användare

-- 1. Skapa enum för roller
CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'user');

-- 2. Skapa users-tabell (utökar auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'user',
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Uppdatera companies-tabellen (om den inte finns)
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

-- 4. Skapa trigger för att automatiskt skapa user-post vid registrering
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    'user', -- Default roll är 'user'
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger om den finns
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Skapa trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Skapa funktion för att kontrollera om användare är superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Skapa funktion för att kontrollera om användare är admin eller superadmin
CREATE OR REPLACE FUNCTION public.is_admin_or_above(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id AND role IN ('admin', 'superadmin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Row Level Security (RLS) för users-tabellen
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Superadmins kan se alla användare
CREATE POLICY "Superadmins can view all users"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    public.is_superadmin(auth.uid()) OR
    id = auth.uid()
  );

-- Superadmins kan uppdatera alla användare
CREATE POLICY "Superadmins can update all users"
  ON public.users FOR UPDATE
  TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

-- Superadmins kan ta bort användare
CREATE POLICY "Superadmins can delete users"
  ON public.users FOR DELETE
  TO authenticated
  USING (public.is_superadmin(auth.uid()));

-- Användare kan se sin egen profil
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Användare kan uppdatera sin egen profil (men inte rollen)
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 8. RLS för companies-tabellen
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Superadmins kan se alla företag
CREATE POLICY "Superadmins can view all companies"
  ON public.companies FOR SELECT
  TO authenticated
  USING (public.is_superadmin(auth.uid()));

-- Användare kan se sitt eget företag
CREATE POLICY "Users can view own company"
  ON public.companies FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Superadmins kan skapa företag
CREATE POLICY "Superadmins can create companies"
  ON public.companies FOR INSERT
  TO authenticated
  WITH CHECK (public.is_superadmin(auth.uid()));

-- Superadmins kan uppdatera företag
CREATE POLICY "Superadmins can update companies"
  ON public.companies FOR UPDATE
  TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

-- 9. Uppdatera customers-tabellen med user_id och company_id
-- Lägg till kolumner om de inte finns
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

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

-- 10. Uppdatera invoices-tabellen med user_id och company_id
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

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

-- 11. Skapa en första superadmin-användare (kör detta manuellt efter registrering)
-- UPDATE public.users SET role = 'superadmin' WHERE email = 'din-email@example.com';

-- 12. Index för bättre prestanda
CREATE INDEX IF NOT EXISTS users_role_idx ON public.users(role);
CREATE INDEX IF NOT EXISTS users_company_id_idx ON public.users(company_id);
CREATE INDEX IF NOT EXISTS customers_user_id_idx ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS invoices_user_id_idx ON public.invoices(user_id);

-- 13. Funktion för updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
