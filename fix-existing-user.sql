-- Fix: Add existing auth users to public.users table
-- This creates user profiles for users that were created before the schema was run

INSERT INTO public.users (id, email, role, full_name)
SELECT
  id,
  email,
  'user' as role,
  COALESCE(raw_user_meta_data->>'full_name', '') as full_name
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- Verify the user was added
SELECT
  email,
  role,
  is_active,
  created_at
FROM public.users
ORDER BY created_at DESC;
