-- First, ensure the blog_comments table has the correct foreign key
ALTER TABLE blog_comments
DROP CONSTRAINT IF EXISTS blog_comments_user_id_fkey;

-- Add the correct foreign key constraint
ALTER TABLE blog_comments
ADD CONSTRAINT blog_comments_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id)
ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_comments_user_id ON blog_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_blog_id ON blog_comments(blog_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_parent_id ON blog_comments(parent_id);

-- Update the RLS policies
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to blog_comments" ON blog_comments;
DROP POLICY IF EXISTS "Allow authenticated users to create comments" ON blog_comments;
DROP POLICY IF EXISTS "Allow users to update their own comments" ON blog_comments;
DROP POLICY IF EXISTS "Allow users to delete their own comments" ON blog_comments;

-- Create new policies
CREATE POLICY "Allow public read access to blog_comments"
ON blog_comments FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow authenticated users to create comments"
ON blog_comments FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY "Allow users to update their own comments"
ON blog_comments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own comments"
ON blog_comments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add comment function with proper profile relationship
CREATE OR REPLACE FUNCTION create_blog_comment(
  p_blog_id INTEGER,
  p_content TEXT,
  p_parent_id INTEGER DEFAULT NULL
) RETURNS blog_comments
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_profile profiles;
  v_comment blog_comments;
BEGIN
  -- Get the current user's ID
  v_user_id := auth.uid();
  
  -- Get the user's profile
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = v_user_id;
  
  IF v_profile IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- Insert the comment
  INSERT INTO blog_comments (
    blog_id,
    user_id,
    content,
    parent_id,
    author_name,
    author_avatar_url
  ) VALUES (
    p_blog_id,
    v_user_id,
    p_content,
    p_parent_id,
    v_profile.full_name,
    v_profile.avatar_url
  )
  RETURNING * INTO v_comment;

  RETURN v_comment;
END;
$$; 