-- Drop existing foreign key if exists
ALTER TABLE blogs DROP CONSTRAINT IF EXISTS blogs_category_id_fkey;

-- Drop existing index if exists
DROP INDEX IF EXISTS blogs_category_id_idx;

-- Ensure category_id column exists and has correct type
ALTER TABLE blogs 
  DROP COLUMN IF EXISTS category_id,
  ADD COLUMN category_id INTEGER REFERENCES blog_categories(id);

-- Recreate index
CREATE INDEX blogs_category_id_idx ON blogs(category_id);

-- Add RLS policies for the relationship
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Update the blogs table to ensure proper column types
ALTER TABLE blogs
  ALTER COLUMN image_url SET DEFAULT NULL,
  ALTER COLUMN author_avatar_url SET DEFAULT NULL; 