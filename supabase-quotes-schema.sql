-- ============================================
-- QUOTES/PROPOSALS SYSTEM SCHEMA
-- ============================================
-- Run this schema in Supabase SQL Editor to add quote functionality

-- 1. Create enum for quote status
DO $$ BEGIN
    CREATE TYPE quote_status AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create quotes table
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  quote_number TEXT NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  vat_amount DECIMAL(12, 2) NOT NULL,
  total DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SEK',
  quote_date DATE NOT NULL,
  valid_until DATE NOT NULL,
  delivery_time TEXT,
  payment_terms TEXT,
  notes TEXT,
  internal_notes TEXT,
  status quote_status NOT NULL DEFAULT 'draft',
  discount DECIMAL(5, 2), -- Percentage discount
  discount_amount DECIMAL(12, 2), -- Fixed discount amount
  sent_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  converted_to_invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_quote_number_per_user UNIQUE (user_id, quote_number)
);

-- 3. Create quote_items table
CREATE TABLE IF NOT EXISTS public.quote_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  vat_rate DECIMAL(5, 2) NOT NULL,
  total DECIMAL(12, 2) NOT NULL,
  category TEXT,
  notes TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create quote_item_templates table (for reusable items)
CREATE TABLE IF NOT EXISTS public.quote_item_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  default_quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  default_unit_price DECIMAL(12, 2) NOT NULL,
  default_vat_rate DECIMAL(5, 2) NOT NULL DEFAULT 25,
  category TEXT NOT NULL,
  tags TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS quotes_user_id_idx ON public.quotes(user_id);
CREATE INDEX IF NOT EXISTS quotes_customer_id_idx ON public.quotes(customer_id);
CREATE INDEX IF NOT EXISTS quotes_status_idx ON public.quotes(status);
CREATE INDEX IF NOT EXISTS quotes_quote_date_idx ON public.quotes(quote_date);
CREATE INDEX IF NOT EXISTS quote_items_quote_id_idx ON public.quote_items(quote_id);
CREATE INDEX IF NOT EXISTS quote_item_templates_user_id_idx ON public.quote_item_templates(user_id);
CREATE INDEX IF NOT EXISTS quote_item_templates_category_idx ON public.quote_item_templates(category);

-- 6. Add updated_at trigger
DROP TRIGGER IF EXISTS update_quotes_updated_at ON public.quotes;
CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_quote_item_templates_updated_at ON public.quote_item_templates;
CREATE TRIGGER update_quote_item_templates_updated_at
  BEFORE UPDATE ON public.quote_item_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Row Level Security (RLS)
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_item_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can create own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can update own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can delete own quotes" ON public.quotes;

DROP POLICY IF EXISTS "Users can view own quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Users can create own quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Users can update own quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Users can delete own quote items" ON public.quote_items;

DROP POLICY IF EXISTS "Users can view own quote templates" ON public.quote_item_templates;
DROP POLICY IF EXISTS "Users can create own quote templates" ON public.quote_item_templates;
DROP POLICY IF EXISTS "Users can update own quote templates" ON public.quote_item_templates;
DROP POLICY IF EXISTS "Users can delete own quote templates" ON public.quote_item_templates;

-- Quotes policies
CREATE POLICY "Users can view own quotes"
  ON public.quotes FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    public.is_superadmin(auth.uid())
  );

CREATE POLICY "Users can create own quotes"
  ON public.quotes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own quotes"
  ON public.quotes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_superadmin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_superadmin(auth.uid()));

CREATE POLICY "Users can delete own quotes"
  ON public.quotes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_superadmin(auth.uid()));

-- Quote items policies
CREATE POLICY "Users can view own quote items"
  ON public.quote_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quotes
      WHERE quotes.id = quote_items.quote_id
      AND (quotes.user_id = auth.uid() OR public.is_superadmin(auth.uid()))
    )
  );

CREATE POLICY "Users can create own quote items"
  ON public.quote_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quotes
      WHERE quotes.id = quote_items.quote_id
      AND quotes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own quote items"
  ON public.quote_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quotes
      WHERE quotes.id = quote_items.quote_id
      AND (quotes.user_id = auth.uid() OR public.is_superadmin(auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quotes
      WHERE quotes.id = quote_items.quote_id
      AND (quotes.user_id = auth.uid() OR public.is_superadmin(auth.uid()))
    )
  );

CREATE POLICY "Users can delete own quote items"
  ON public.quote_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quotes
      WHERE quotes.id = quote_items.quote_id
      AND (quotes.user_id = auth.uid() OR public.is_superadmin(auth.uid()))
    )
  );

-- Quote templates policies
CREATE POLICY "Users can view own quote templates"
  ON public.quote_item_templates FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    public.is_superadmin(auth.uid())
  );

CREATE POLICY "Users can create own quote templates"
  ON public.quote_item_templates FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own quote templates"
  ON public.quote_item_templates FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_superadmin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_superadmin(auth.uid()));

CREATE POLICY "Users can delete own quote templates"
  ON public.quote_item_templates FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_superadmin(auth.uid()));

-- 8. Function to automatically update quote status to expired
CREATE OR REPLACE FUNCTION public.update_expired_quotes()
RETURNS void AS $$
BEGIN
  UPDATE public.quotes
  SET status = 'expired'
  WHERE status = 'sent'
  AND valid_until < CURRENT_DATE
  AND status != 'expired';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- You can run this function periodically or set up a cron job
-- SELECT public.update_expired_quotes();
