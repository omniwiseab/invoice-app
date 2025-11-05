-- QUICK FIX: Make RLS more permissive so users can read their own profile
-- Run this in Supabase SQL Editor

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

-- Create a simpler, more permissive policy
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);  -- Allow all authenticated users to read any profile for now

-- Verify your user exists
SELECT id, email, role, is_active FROM public.users WHERE email = 'conny@omniwise.se';
