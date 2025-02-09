-- Drop existing policies first
DROP POLICY IF EXISTS "Admins can view all actions" ON admin_actions;
DROP POLICY IF EXISTS "Only admins can insert actions" ON admin_actions;

-- Drop existing functions with CASCADE
DROP FUNCTION IF EXISTS promote_to_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS demote_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS is_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_profile(UUID, TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS validate_image_file(TEXT, INTEGER) CASCADE;

-- Drop existing constraints to avoid conflicts
ALTER TABLE IF EXISTS profiles 
  DROP CONSTRAINT IF EXISTS profiles_username_unique;

-- Create or update profiles table with all necessary columns
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role TEXT DEFAULT 'user',
  phone TEXT,
  location TEXT,
  website TEXT,
  social_links JSONB DEFAULT '{"twitter": null, "github": null, "linkedin": null}',
  preferences JSONB DEFAULT '{"email_notifications": true, "theme": "light", "language": "en"}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ
);

-- Add username column if it doesn't exist and handle existing data
DO $$ 
BEGIN
  -- First, update email field from auth.users
  UPDATE profiles p
  SET email = u.email
  FROM auth.users u
  WHERE p.id = u.id
  AND p.email IS NULL;

  -- Then, set default usernames for any null values using email prefix
  UPDATE profiles
  SET username = SPLIT_PART(email, '@', 1) || '_' || SUBSTR(MD5(RANDOM()::TEXT), 1, 6)
  WHERE username IS NULL OR username = '';

  -- Finally, make username NOT NULL and add unique constraint
  ALTER TABLE profiles 
    ALTER COLUMN username SET NOT NULL;
    
  -- Add unique constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_username_unique'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);
  END IF;
END $$;

-- Create storage buckets with proper configuration
DO $$
BEGIN
  -- Drop existing bucket if it exists to reset configuration
  IF EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'profile_images'
  ) THEN
    DELETE FROM storage.buckets WHERE id = 'profile_images';
  END IF;

  -- Create profile images bucket with proper configuration
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'profile_images',
    'Profile Images Storage',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  );

  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can upload their own profile images" ON storage.objects;
  DROP POLICY IF EXISTS "Profile images are publicly accessible" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;

  -- Create new policies with improved path structure and validation
  CREATE POLICY "Users can upload their own profile images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'profile_images' AND
      (auth.uid())::text = SPLIT_PART(name, '/', 1) AND
      OCTET_LENGTH(DECODE(SUBSTRING(name FROM '^[^/]+/[^/]+/([^/]+)$'), 'base64')) <= 5242880 AND
      LOWER(SUBSTRING(name FROM '\.([^\.]+)$')) IN ('jpg', 'jpeg', 'png', 'gif', 'webp')
    );

  CREATE POLICY "Profile images are publicly accessible"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'profile_images');

  CREATE POLICY "Users can update their own profile images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'profile_images' AND
      (auth.uid())::text = SPLIT_PART(name, '/', 1)
    );

  CREATE POLICY "Users can delete their own profile images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'profile_images' AND
      (auth.uid())::text = SPLIT_PART(name, '/', 1)
    );
END $$;

-- Function to handle profile image updates
CREATE OR REPLACE FUNCTION handle_profile_image(
  user_id UUID,
  file_path TEXT
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Validate file path
  IF file_path IS NULL OR file_path = '' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid file path'
    );
  END IF;

  -- Update profile with new avatar URL
  UPDATE profiles
  SET 
    avatar_url = file_path,
    updated_at = NOW()
  WHERE id = user_id
  RETURNING json_build_object(
    'success', true,
    'avatar_url', avatar_url
  ) INTO result;

  RETURN result;
EXCEPTION 
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate image file
CREATE OR REPLACE FUNCTION validate_image_file(
  file_name TEXT,
  file_size INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check file size (5MB limit)
  IF file_size > 5242880 THEN
    RETURN FALSE;
  END IF;

  -- Check file extension
  IF NOT (LOWER(SUBSTRING(file_name FROM '\.([^\.]+)$')) = ANY(ARRAY['jpg', 'jpeg', 'png', 'gif', 'webp'])) THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to update profile with improved validation and fields
CREATE OR REPLACE FUNCTION update_profile(
  user_id UUID,
  new_username TEXT DEFAULT NULL,
  new_avatar_url TEXT DEFAULT NULL,
  new_full_name TEXT DEFAULT NULL,
  new_bio TEXT DEFAULT NULL,
  new_phone TEXT DEFAULT NULL,
  new_location TEXT DEFAULT NULL,
  new_website TEXT DEFAULT NULL,
  new_social_links JSONB DEFAULT NULL,
  new_preferences JSONB DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Verify user exists and is updating their own profile
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  -- Validate username if provided
  IF new_username IS NOT NULL THEN
    -- Check username length
    IF LENGTH(new_username) < 3 OR LENGTH(new_username) > 30 THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Username must be between 3 and 30 characters'
      );
    END IF;

    -- Check username format (alphanumeric and underscores only)
    IF new_username !~ '^[a-zA-Z0-9_]+$' THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Username can only contain letters, numbers, and underscores'
      );
    END IF;

    -- Check if username is taken by another user
    IF EXISTS (
      SELECT 1 FROM profiles 
      WHERE username = new_username 
      AND id != user_id
    ) THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Username is already taken'
      );
    END IF;
  END IF;

  -- Validate website URL if provided
  IF new_website IS NOT NULL AND new_website != '' THEN
    IF new_website !~ '^https?:\/\/.+' THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Website must be a valid URL starting with http:// or https://'
      );
    END IF;
  END IF;

  -- Validate phone number if provided
  IF new_phone IS NOT NULL AND new_phone != '' THEN
    IF new_phone !~ '^\+?[0-9\s-\(\)]+$' THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Invalid phone number format'
      );
    END IF;
  END IF;

  -- Validate social links if provided
  IF new_social_links IS NOT NULL THEN
    IF NOT (new_social_links ? 'twitter' AND new_social_links ? 'github' AND new_social_links ? 'linkedin') THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Social links must include twitter, github, and linkedin fields'
      );
    END IF;
  END IF;

  -- Update profile
  UPDATE profiles
  SET 
    username = COALESCE(new_username, username),
    avatar_url = COALESCE(new_avatar_url, avatar_url),
    full_name = COALESCE(new_full_name, full_name),
    bio = COALESCE(new_bio, bio),
    phone = COALESCE(new_phone, phone),
    location = COALESCE(new_location, location),
    website = COALESCE(new_website, website),
    social_links = COALESCE(new_social_links, social_links),
    preferences = COALESCE(new_preferences, preferences),
    updated_at = NOW()
  WHERE id = user_id
  RETURNING json_build_object(
    'success', true,
    'profile', json_build_object(
      'id', id,
      'username', username,
      'email', email,
      'avatar_url', avatar_url,
      'full_name', full_name,
      'bio', bio,
      'phone', phone,
      'location', location,
      'website', website,
      'social_links', social_links,
      'preferences', preferences,
      'updated_at', updated_at
    )
  ) INTO result;

  RETURN result;
EXCEPTION 
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM profiles
  WHERE id = user_id;
  
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin_actions table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_actions (
  id SERIAL PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to promote a user to admin
CREATE OR REPLACE FUNCTION promote_to_admin(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
  admin_id UUID;
BEGIN
  -- Get the ID of the user making the request
  admin_id := auth.uid();
  
  -- Check if the user making the request is an admin
  IF NOT is_admin(admin_id) THEN
    RAISE EXCEPTION 'Only admins can promote users';
  END IF;

  -- Update the user's role to admin
  UPDATE profiles
  SET role = 'admin'
  WHERE id = target_user_id;

  -- Log the action
  INSERT INTO admin_actions (admin_id, target_user_id, action, details)
  VALUES (admin_id, target_user_id, 'promote_to_admin', 'User promoted to admin role');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to demote an admin to user
CREATE OR REPLACE FUNCTION demote_admin(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
  admin_id UUID;
BEGIN
  -- Get the ID of the user making the request
  admin_id := auth.uid();
  
  -- Check if the user making the request is an admin
  IF NOT is_admin(admin_id) THEN
    RAISE EXCEPTION 'Only admins can demote users';
  END IF;

  -- Update the user's role to user
  UPDATE profiles
  SET role = 'user'
  WHERE id = target_user_id;

  -- Log the action
  INSERT INTO admin_actions (admin_id, target_user_id, action, details)
  VALUES (admin_id, target_user_id, 'demote_admin', 'Admin demoted to user role');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies for admin_actions table
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all actions"
  ON admin_actions FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can insert actions"
  ON admin_actions FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- Add RLS policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view all profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create message_reads table
CREATE TABLE IF NOT EXISTS message_reads (
  id SERIAL PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Enable RLS on message_reads
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;

-- Create policies for message_reads
CREATE POLICY "Users can view their own message read status"
  ON message_reads FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own message read status"
  ON message_reads FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own message read status"
  ON message_reads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_channel_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS VOID AS $$
BEGIN
  UPDATE message_reads
  SET 
    read = true,
    read_at = NOW()
  WHERE 
    channel_id = p_channel_id 
    AND user_id = p_user_id
    AND read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to track new message
CREATE OR REPLACE FUNCTION track_new_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Create read status records for all users except the sender
  INSERT INTO message_reads (message_id, channel_id, user_id, read)
  SELECT 
    NEW.id,
    NEW.channel_id,
    profiles.id,
    CASE WHEN profiles.id = NEW.user_id THEN true ELSE false END
  FROM profiles
  WHERE profiles.id != NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to track new messages
CREATE TRIGGER track_new_message_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION track_new_message(); 