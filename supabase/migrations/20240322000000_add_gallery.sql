-- Create gallery table
CREATE TABLE IF NOT EXISTS gallery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_featured BOOLEAN DEFAULT false
);

-- Add RLS policies
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Everyone can view gallery" ON gallery;
DROP POLICY IF EXISTS "Only admins can insert" ON gallery;
DROP POLICY IF EXISTS "Only admins can update" ON gallery;
DROP POLICY IF EXISTS "Only admins can delete" ON gallery;

-- Create new policies
CREATE POLICY "Everyone can view gallery" ON gallery
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert" ON gallery
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update" ON gallery
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete" ON gallery
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create function to toggle featured status
CREATE OR REPLACE FUNCTION toggle_gallery_featured(p_gallery_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE gallery
  SET is_featured = NOT is_featured
  WHERE id = p_gallery_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create storage bucket policies
BEGIN;
  -- Create gallery bucket if it doesn't exist
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('gallery', 'gallery', true)
  ON CONFLICT (id) DO NOTHING;

  -- Drop existing storage policies if they exist
  DROP POLICY IF EXISTS "Public Access" ON storage.objects;
  DROP POLICY IF EXISTS "Admin Insert Access" ON storage.objects;
  DROP POLICY IF EXISTS "Admin Update Access" ON storage.objects;
  DROP POLICY IF EXISTS "Admin Delete Access" ON storage.objects;

  -- Allow public read access to gallery bucket
  CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gallery');

  -- Allow admin users to insert into gallery bucket
  CREATE POLICY "Admin Insert Access"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'gallery'
    AND (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    )
  );

  -- Allow admin users to update gallery bucket
  CREATE POLICY "Admin Update Access"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'gallery'
    AND (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    )
  );

  -- Allow admin users to delete from gallery bucket
  CREATE POLICY "Admin Delete Access"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'gallery'
    AND (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    )
  );
COMMIT; 