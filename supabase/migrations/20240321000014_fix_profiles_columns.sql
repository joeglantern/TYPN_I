-- Add missing columns to profiles if they don't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update the blog_comments query function
CREATE OR REPLACE FUNCTION get_blog_comments(p_blog_id INTEGER)
RETURNS TABLE (
  id INTEGER,
  blog_id INTEGER,
  user_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  parent_id INTEGER,
  is_edited BOOLEAN,
  author_name TEXT,
  author_avatar_url TEXT,
  user_profile JSONB,
  likes JSONB[]
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bc.id,
    bc.blog_id,
    bc.user_id,
    bc.content,
    bc.created_at,
    bc.updated_at,
    bc.parent_id,
    bc.is_edited,
    bc.author_name,
    bc.author_avatar_url,
    jsonb_build_object(
      'username', p.username,
      'avatar_url', p.avatar_url,
      'full_name', p.full_name
    ) as user_profile,
    array_agg(to_jsonb(bcl)) FILTER (WHERE bcl.id IS NOT NULL) as likes
  FROM blog_comments bc
  LEFT JOIN profiles p ON bc.user_id = p.id
  LEFT JOIN blog_comment_likes bcl ON bc.id = bcl.comment_id
  WHERE bc.blog_id = p_blog_id
  GROUP BY bc.id, p.username, p.avatar_url, p.full_name
  ORDER BY bc.created_at ASC;
END;
$$; 