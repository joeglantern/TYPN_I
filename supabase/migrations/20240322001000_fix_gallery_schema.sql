-- First, drop the dependent foreign key constraint
ALTER TABLE carousels DROP CONSTRAINT IF EXISTS carousels_image_id_fkey;

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'gallery' AND column_name = 'image_url') THEN
        ALTER TABLE gallery ADD COLUMN image_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'gallery' AND column_name = 'title') THEN
        ALTER TABLE gallery ADD COLUMN title TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'gallery' AND column_name = 'description') THEN
        ALTER TABLE gallery ADD COLUMN description TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'gallery' AND column_name = 'uploaded_by') THEN
        ALTER TABLE gallery ADD COLUMN uploaded_by UUID REFERENCES auth.users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'gallery' AND column_name = 'created_at') THEN
        ALTER TABLE gallery ADD COLUMN created_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'gallery' AND column_name = 'updated_at') THEN
        ALTER TABLE gallery ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'gallery' AND column_name = 'is_featured') THEN
        ALTER TABLE gallery ADD COLUMN is_featured BOOLEAN;
    END IF;
END $$;

-- Now we can safely alter the gallery table
ALTER TABLE gallery 
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN image_url SET NOT NULL,
  ALTER COLUMN uploaded_by SET NOT NULL;

-- Set defaults separately
ALTER TABLE gallery 
  ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now()),
  ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE gallery 
  ALTER COLUMN updated_at SET DEFAULT timezone('utc'::text, now()),
  ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE gallery 
  ALTER COLUMN is_featured SET DEFAULT false;

-- Add back the foreign key constraint
ALTER TABLE carousels 
  ADD CONSTRAINT carousels_image_id_fkey 
  FOREIGN KEY (image_id) 
  REFERENCES gallery(id)
  ON DELETE CASCADE;

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

-- Recreate the toggle function
CREATE OR REPLACE FUNCTION toggle_gallery_featured(p_gallery_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE gallery
  SET is_featured = NOT is_featured
  WHERE id = p_gallery_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 