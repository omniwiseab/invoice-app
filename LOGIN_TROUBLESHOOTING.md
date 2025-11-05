# Login Troubleshooting Guide

## Common Login Issues and Solutions

### 1. Email Verification Required

**Symptom:** Cannot log in after creating an account, getting error about email confirmation.

**Cause:** Supabase is configured to require email verification before allowing login.

**Solution:**
1. Check your email inbox (including spam folder) for a confirmation email from Supabase
2. Click the confirmation link in the email
3. After confirming, try logging in again

**To Disable Email Confirmation (for development):**
1. Go to Supabase Dashboard
2. Navigate to: **Authentication → Providers → Email**
3. Find the "Confirm email" setting
4. **Uncheck** "Confirm email" checkbox
5. Click **Save**
6. Try creating a new account - it should now work without email confirmation

### 2. Missing User Profile in Database

**Symptom:** Login succeeds in Supabase logs but user cannot access the application.

**Cause:** The database trigger to create user profiles is not set up.

**Solution:**
1. Go to Supabase Dashboard → **SQL Editor**
2. Open the file `supabase-schema-auth-fixed.sql` in this project
3. Copy the entire SQL script
4. Paste it into the Supabase SQL Editor
5. Click **Run** to execute the script
6. This will:
   - Create the `users` table
   - Set up the trigger to auto-create user profiles on signup
   - Add any existing auth users to the `users` table

### 3. Wrong Credentials

**Symptom:** "Invalid email or password" error

**Solution:**
1. Double-check that you're entering the correct email and password
2. Passwords are case-sensitive
3. Make sure there are no extra spaces
4. Try using "Forgot Password" to reset if unsure

### 4. Rate Limiting

**Symptom:** "Too many login attempts" message

**Solution:**
1. Wait 15 minutes for the rate limit to reset
2. Or clear your browser's localStorage:
   - Press F12 → Application tab → Local Storage → Clear All
   - Refresh the page

### 5. Account Locked/Disabled

**Symptom:** Cannot log in even with correct credentials

**Solution:**
Check in Supabase Dashboard → Authentication → Users:
1. Find your user account
2. Check if it's marked as "Email Confirmed: No"
3. Click on the user and manually confirm the email if needed

## Checking Supabase Configuration

### Email Settings
1. **Supabase Dashboard → Authentication → Providers → Email**
   - "Confirm email" - Controls if email verification is required
   - "Secure email change" - Requires confirmation for email changes

### Database Schema
1. **Supabase Dashboard → Database → Tables**
   - Check if `users` table exists in `public` schema
   - Check if `companies` table exists
   - Verify the `on_auth_user_created` trigger exists

### Check if User Profile Exists
Run this query in SQL Editor:
```sql
-- Check if user profile was created
SELECT
  au.email,
  au.email_confirmed_at,
  au.created_at as auth_created_at,
  u.id as user_profile_id,
  u.role,
  u.is_active
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
ORDER BY au.created_at DESC
LIMIT 10;
```

This will show:
- All registered users in auth.users
- Whether they have confirmed their email
- Whether they have a profile in public.users
- Their role and active status

## Development vs Production

### Development Setup (No Email Confirmation)
For easier local development, you can disable email confirmation:
1. Supabase Dashboard → Authentication → Providers → Email
2. Uncheck "Confirm email"
3. Users can now sign up and log in immediately without email verification

### Production Setup (With Email Confirmation)
For production, keep email confirmation enabled:
1. Ensure SMTP is configured for reliable email delivery
2. Customize email templates in Authentication → Email Templates
3. Set up proper redirect URLs in Authentication → URL Configuration

## Still Having Issues?

If none of these solutions work:

1. **Check browser console** (F12 → Console) for detailed error messages
2. **Check Supabase logs** (Supabase Dashboard → Logs → Auth Logs)
3. **Verify environment variables**:
   ```bash
   # Check .env.local file
   cat .env.local
   ```
   Make sure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set correctly

4. **Test Supabase connection**:
   Open browser console and run:
   ```javascript
   // Check if Supabase is configured
   console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
   console.log('Supabase Key (first 20 chars):', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20));
   ```

5. **Create a new test account** with a different email to isolate the issue
