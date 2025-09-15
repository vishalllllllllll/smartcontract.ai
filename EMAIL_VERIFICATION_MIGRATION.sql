-- Email Verification Migration for SmartContract.ai
-- Run this SQL in your Supabase SQL Editor

-- Add email verification fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_code TEXT,
ADD COLUMN IF NOT EXISTS verification_expires TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reset_code TEXT,
ADD COLUMN IF NOT EXISTS reset_code_expires TIMESTAMPTZ;

-- Update existing users to be verified (optional - for existing data)
-- Uncomment the line below if you want existing users to be automatically verified
-- UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_verification_code ON users(verification_code);
CREATE INDEX IF NOT EXISTS idx_users_reset_code ON users(reset_code);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);

-- Verify the schema changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;