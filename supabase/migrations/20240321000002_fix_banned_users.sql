-- Drop the existing function first
DROP FUNCTION IF EXISTS is_user_banned(uuid, uuid);

-- Create or replace the is_user_banned function
CREATE OR REPLACE FUNCTION is_user_banned(user_uuid UUID, channel_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM banned_users
    WHERE user_id = user_uuid
    AND (channel_id = channel_uuid OR channel_id IS NULL)
    AND unbanned_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the banned_users table exists with correct structure
CREATE TABLE IF NOT EXISTS banned_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  unbanned_at TIMESTAMP WITH TIME ZONE,
  channel_id UUID REFERENCES channels(id),
  unban_reason TEXT
);

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS banned_users_user_id_idx ON banned_users(user_id);
CREATE INDEX IF NOT EXISTS banned_users_channel_id_idx ON banned_users(channel_id);

-- Enable RLS
ALTER TABLE banned_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow admins full access to banned_users" ON banned_users;
DROP POLICY IF EXISTS "Allow users to view banned users" ON banned_users;

-- Create new policies
CREATE POLICY "Allow admins full access to banned_users"
  ON banned_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Allow users to view banned users"
  ON banned_users
  FOR SELECT
  TO authenticated
  USING (true); 