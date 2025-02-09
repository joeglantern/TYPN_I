-- Handle url column migration
DO $$ 
BEGIN
  -- Check if image_url exists but url doesn't
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gallery' AND column_name = 'image_url'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gallery' AND column_name = 'url'
  ) THEN
    -- Only rename if image_url exists and url doesn't
    ALTER TABLE gallery RENAME COLUMN image_url TO url;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gallery' AND column_name = 'url'
  ) THEN
    -- Add url column if neither exists
    ALTER TABLE gallery ADD COLUMN url TEXT;
  END IF;

  -- If both columns exist, we might want to migrate data
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gallery' AND column_name = 'image_url'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gallery' AND column_name = 'url'
  ) THEN
    -- Update url with image_url values where url is null
    UPDATE gallery SET url = image_url WHERE url IS NULL;
    -- Drop the old column
    ALTER TABLE gallery DROP COLUMN image_url;
  END IF;
END $$;

-- Make sure url column is not null and has proper constraints
ALTER TABLE gallery ALTER COLUMN url SET NOT NULL; 
