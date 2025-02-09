-- Drop existing table if it exists
DROP TABLE IF EXISTS blogs CASCADE;

-- Create blogs table with correct structure
CREATE TABLE blogs (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  author_name TEXT NOT NULL,
  author_image TEXT,
  category_id INTEGER REFERENCES blog_categories(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX blogs_category_id_idx ON blogs(category_id);
CREATE INDEX blogs_created_at_idx ON blogs(created_at DESC);

-- Enable RLS
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public read access to blogs"
  ON blogs
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admins to manage blogs"
  ON blogs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add some sample blog posts
INSERT INTO blogs (title, content, author_name, category_id) VALUES
('Getting Started with Web Development', 
 'Learn the basics of web development including HTML, CSS, and JavaScript...', 
 'Admin',
 (SELECT id FROM blog_categories WHERE slug = 'tutorials')),
('Design Trends 2024', 
 'Explore the latest design trends that are shaping the digital landscape...', 
 'Admin',
 (SELECT id FROM blog_categories WHERE slug = 'design')),
('The Future of Technology', 
 'Discover emerging technologies that will shape our future...', 
 'Admin',
 (SELECT id FROM blog_categories WHERE slug = 'technology')); 