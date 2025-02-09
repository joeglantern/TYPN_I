-- First, let's make sure we have the blog_categories table
CREATE TABLE IF NOT EXISTS blog_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#666666',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Now let's ensure the blogs table has the correct structure
CREATE TABLE IF NOT EXISTS blogs (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    author_name TEXT NOT NULL,
    author_avatar_url TEXT,
    category_id INTEGER REFERENCES blog_categories(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blogs_category_id ON blogs(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON blog_categories(slug);

-- Enable RLS
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for blog_categories
CREATE POLICY "Enable read access for all users" ON blog_categories
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Enable write access for authenticated users" ON blog_categories
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create RLS policies for blogs
CREATE POLICY "Enable read access for all users" ON blogs
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Enable write access for authenticated users" ON blogs
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Insert default categories if they don't exist
INSERT INTO blog_categories (name, slug, description, color)
VALUES
    ('Technology', 'technology', 'Latest tech news and updates', '#3B82F6'),
    ('Design', 'design', 'UI/UX and design principles', '#EC4899'),
    ('Development', 'development', 'Programming and development', '#10B981'),
    ('News', 'news', 'Latest updates and announcements', '#F59E0B'),
    ('Tutorials', 'tutorials', 'Step-by-step guides and tutorials', '#8B5CF6')
ON CONFLICT (slug) DO NOTHING;

-- Add function to handle blog category management
CREATE OR REPLACE FUNCTION manage_blog_category(
    p_blog_id INTEGER,
    p_category_id INTEGER
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update the blog's category
    UPDATE blogs
    SET 
        category_id = p_category_id,
        updated_at = now()
    WHERE id = p_blog_id;
END;
$$; 