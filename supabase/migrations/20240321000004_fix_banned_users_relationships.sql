-- First, drop existing foreign key constraints if they exist
ALTER TABLE IF EXISTS banned_users
DROP CONSTRAINT IF EXISTS banned_users_user_id_fkey,
DROP CONSTRAINT IF EXISTS banned_users_admin_id_fkey,
DROP CONSTRAINT IF EXISTS banned_users_channel_id_fkey;

-- Drop and recreate the banned_users table with correct references
DROP TABLE IF EXISTS banned_users;
CREATE TABLE banned_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  unbanned_at TIMESTAMP WITH TIME ZONE,
  channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
  unban_reason TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_banned_users_user_id ON banned_users(user_id);
CREATE INDEX IF NOT EXISTS idx_banned_users_admin_id ON banned_users(admin_id);
CREATE INDEX IF NOT EXISTS idx_banned_users_channel_id ON banned_users(channel_id);

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

-- Add foreign key relationships for better querying
COMMENT ON CONSTRAINT banned_users_user_id_fkey ON banned_users IS 
  E'@foreignKey (user_id) references profiles (id)\n@name banned_users_user_id_fkey';

COMMENT ON CONSTRAINT banned_users_admin_id_fkey ON banned_users IS 
  E'@foreignKey (admin_id) references profiles (id)\n@name banned_users_admin_id_fkey';

COMMENT ON CONSTRAINT banned_users_channel_id_fkey ON banned_users IS 
  E'@foreignKey (channel_id) references channels (id)\n@name banned_users_channel_id_fkey'; 