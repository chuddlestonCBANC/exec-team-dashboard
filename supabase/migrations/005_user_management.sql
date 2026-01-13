-- Migration: User Management System
-- Only approved users can log in, executives are linked to user accounts

-- Create user roles enum type
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'executive', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create approved_users table - only users in this table can access the app
CREATE TABLE IF NOT EXISTS approved_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'viewer',
  executive_id UUID REFERENCES executives(id) ON DELETE SET NULL, -- Link to executive profile if applicable
  auth_user_id UUID UNIQUE, -- Will be populated when user first logs in (links to Supabase auth.users)
  is_active BOOLEAN NOT NULL DEFAULT true, -- Can be deactivated without deletion
  invited_by UUID REFERENCES approved_users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  first_login_at TIMESTAMP WITH TIME ZONE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_approved_users_email ON approved_users(email);
CREATE INDEX IF NOT EXISTS idx_approved_users_auth_user_id ON approved_users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_approved_users_executive_id ON approved_users(executive_id);
CREATE INDEX IF NOT EXISTS idx_approved_users_role ON approved_users(role);

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS update_approved_users_updated_at ON approved_users;
CREATE TRIGGER update_approved_users_updated_at BEFORE UPDATE ON approved_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add auth_user_id column to executives table to link executive profile to auth user
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='executives' AND column_name='auth_user_id') THEN
        ALTER TABLE executives ADD COLUMN auth_user_id UUID UNIQUE;
    END IF;
END $$;

-- Seed initial admin user (you should update this with your actual email)
-- This creates the first admin who can then add other users
INSERT INTO approved_users (email, role)
VALUES ('chuddleston@askhapax.ai', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Create approved users for existing executives
INSERT INTO approved_users (email, role, executive_id)
SELECT
  e.email,
  'executive'::user_role,
  e.id
FROM executives e
WHERE e.email IS NOT NULL AND e.email != ''
ON CONFLICT (email) DO UPDATE SET
  role = 'executive',
  executive_id = EXCLUDED.executive_id;

-- Function to check if a user is approved (can be called from RLS policies or app)
CREATE OR REPLACE FUNCTION is_user_approved(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM approved_users
    WHERE email = LOWER(user_email)
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_email TEXT)
RETURNS user_role AS $$
DECLARE
  result user_role;
BEGIN
  SELECT role INTO result FROM approved_users
  WHERE email = LOWER(user_email)
  AND is_active = true;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to link auth user on first login
CREATE OR REPLACE FUNCTION link_auth_user(user_email TEXT, auth_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE approved_users
  SET
    auth_user_id = auth_id,
    first_login_at = COALESCE(first_login_at, NOW()),
    last_login_at = NOW()
  WHERE email = LOWER(user_email)
  AND is_active = true;

  -- Also link to executive if exists
  UPDATE executives
  SET auth_user_id = auth_id
  WHERE email = LOWER(user_email);

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'User management migration completed successfully!' as status;
