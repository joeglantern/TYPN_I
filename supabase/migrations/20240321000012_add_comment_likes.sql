-- Create blog_comment_likes table
CREATE TABLE IF NOT EXISTS blog_comment_likes (
  id SERIAL PRIMARY KEY,
  comment_id INTEGER REFERENCES blog_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(comment_id, user_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS blog_comment_likes_comment_id_idx ON blog_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS blog_comment_likes_user_id_idx ON blog_comment_likes(user_id);

-- Enable RLS
ALTER TABLE blog_comment_likes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public read access to blog_comment_likes"
  ON blog_comment_likes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to toggle likes"
  ON blog_comment_likes
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid()); 