-- Create the banned_users_count table if it doesn't exist
CREATE TABLE IF NOT EXISTS banned_users_count (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial row if not exists
INSERT INTO banned_users_count (count)
SELECT 0
WHERE NOT EXISTS (SELECT 1 FROM banned_users_count);

-- Create or replace the update function
CREATE OR REPLACE FUNCTION update_banned_users_count(p_count INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE banned_users_count
  SET count = p_count,
      updated_at = NOW();
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_banned_users_count(INTEGER) TO authenticated; 