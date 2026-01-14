-- Migration: Fix integrations foreign key constraint
-- Make created_by nullable since auth user may not be in approved_users table

ALTER TABLE integrations
  ALTER COLUMN created_by DROP NOT NULL;

-- Optionally, we could also change the foreign key to reference auth.users instead
-- But for now, just making it nullable is the simplest fix

COMMENT ON COLUMN integrations.created_by IS
'References approved_users.id if the creator is in that table, otherwise NULL';

SELECT 'Fixed integrations foreign key constraint!' as status;
