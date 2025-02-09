-- Drop existing foreign key if exists
ALTER TABLE blogs DROP CONSTRAINT IF EXISTS blogs_category_id_fkey;

-- Drop existing index if exists
DROP INDEX IF EXISTS blogs_category_id_idx;

-- Drop the table if it exists to ensure a clean slate
DROP TABLE IF EXISTS blog_categories CASCADE;

-- Create blog_categories table with integer id
CREATE TABLE blog_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add unique constraints
ALTER TABLE blog_categories
  ADD CONSTRAINT blog_categories_name_unique UNIQUE (name),
  ADD CONSTRAINT blog_categories_slug_unique UNIQUE (slug);

-- Modify category_id column in blogs table to match the data type
ALTER TABLE blogs 
  DROP COLUMN IF EXISTS category_id,
  ADD COLUMN category_id INTEGER REFERENCES blog_categories(id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS blogs_category_id_idx ON blogs(category_id);

-- Enable RLS
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public read access to blog_categories"
  ON blog_categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admins to manage blog_categories"
  ON blog_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert some default categories
INSERT INTO blog_categories (name, slug, description, color) VALUES
('Technology', 'technology', 'Latest tech news and updates', '#3B82F6'),
('Design', 'design', 'UI/UX and design principles', '#EC4899'),
('Development', 'development', 'Programming and development', '#10B981'),
('News', 'news', 'Latest updates and announcements', '#F59E0B'),
('Tutorials', 'tutorials', 'Step-by-step guides and tutorials', '#8B5CF6')
ON CONFLICT (slug) DO NOTHING; 
