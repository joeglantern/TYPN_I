-- Add author_avatar_url column to blogs table
ALTER TABLE blogs
ADD COLUMN IF NOT EXISTS author_avatar_url TEXT;

-- Update existing rows to use author_image as author_avatar_url if it exists
UPDATE blogs
SET author_avatar_url = author_image
WHERE author_image IS NOT NULL;

-- Drop the old author_image column if it exists
ALTER TABLE blogs
DROP COLUMN IF EXISTS author_image; 