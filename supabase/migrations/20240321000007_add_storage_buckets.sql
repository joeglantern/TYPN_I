-- Create storage buckets for different types of uploads
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('testimonials', 'testimonials', true),
  ('events', 'events', true),
  ('programs', 'programs', true),
  ('blogs', 'blogs', true),
  ('gallery', 'gallery', true),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Drop ALL existing policies
DO $$ 
BEGIN
    EXECUTE (
        SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON storage.objects;', E'\n')
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
    );
END $$;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Public Access Policy (can view all objects)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id IN ('testimonials', 'events', 'programs', 'blogs', 'gallery', 'avatars'));

-- Authenticated users can upload to any bucket
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id IN ('testimonials', 'events', 'programs', 'blogs', 'gallery', 'avatars'));

-- Authenticated users can update their own uploads
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (auth.uid() = owner);

-- Authenticated users can delete their own uploads
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (auth.uid() = owner);

-- Give bucket access to authenticated users
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated; 
