-- Add author information columns to blogs table
ALTER TABLE blogs
ADD COLUMN IF NOT EXISTS author_name TEXT NOT NULL DEFAULT 'Anonymous',
ADD COLUMN IF NOT EXISTS author_image TEXT; 