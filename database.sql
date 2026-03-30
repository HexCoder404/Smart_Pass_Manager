-- 1. Create the OTP table for your Node.js backend
CREATE TABLE IF NOT EXISTS public.user_otps (
    email TEXT PRIMARY KEY,
    otp TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add owner_email to vault_settings to separate PINs for each user
ALTER TABLE public.vault_settings 
ADD COLUMN IF NOT EXISTS owner_email TEXT;

-- 3. Add owner_email to vault_entries to separate passwords for each user
ALTER TABLE public.vault_entries 
ADD COLUMN IF NOT EXISTS owner_email TEXT;

-- 4. (Optional but Recommended) Disable Row Level Security (RLS) for testing
-- or add policies that allow access ONLY if owner_email matches.
-- For a simple local project, you can just ensure owner_email is checked in your code.
ALTER TABLE public.vault_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_otps DISABLE ROW LEVEL SECURITY;
