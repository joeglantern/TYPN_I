-- Create blog_comments table
CREATE TABLE IF NOT EXISTS blog_comments (
  id SERIAL PRIMARY KEY,
  blog_id INTEGER REFERENCES blogs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  parent_id INTEGER REFERENCES blog_comments(id) ON DELETE CASCADE,
  is_edited BOOLEAN DEFAULT FALSE,
  author_name TEXT NOT NULL,
  author_avatar_url TEXT
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS blog_comments_blog_id_idx ON blog_comments(blog_id);
CREATE INDEX IF NOT EXISTS blog_comments_user_id_idx ON blog_comments(user_id);
CREATE INDEX IF NOT EXISTS blog_comments_parent_id_idx ON blog_comments(parent_id);

-- Enable RLS
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public read access to blog_comments"
  ON blog_comments
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to create comments"
  ON blog_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow users to update their own comments"
  ON blog_comments
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Allow users to delete their own comments"
  ON blog_comments
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Function to update comment
CREATE OR REPLACE FUNCTION update_comment(
  p_comment_id INTEGER,
  p_content TEXT
)
RETURNS blog_comments
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_comment blog_comments;
BEGIN
  UPDATE blog_comments
  SET 
    content = p_content,
    updated_at = now(),
    is_edited = TRUE
  WHERE id = p_comment_id
  AND user_id = auth.uid()
  RETURNING * INTO v_comment;

  RETURN v_comment;
END;
$$; 