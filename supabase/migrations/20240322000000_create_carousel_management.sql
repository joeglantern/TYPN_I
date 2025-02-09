-- Create carousel_items table
CREATE TABLE IF NOT EXISTS public.carousel_items (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    title text NOT NULL,
    description text,
    image_url text NOT NULL,
    link_url text NOT NULL,
    order_index integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add is_active column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'carousel_items' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.carousel_items 
        ADD COLUMN is_active boolean DEFAULT true;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.carousel_items ENABLE ROW LEVEL SECURITY;

-- Create policies for carousel_items
DROP POLICY IF EXISTS "Allow public read carousel_items" ON public.carousel_items;
DROP POLICY IF EXISTS "Allow admin manage carousel_items" ON public.carousel_items;

-- Everyone can view active carousel items
CREATE POLICY "Allow public read carousel_items" ON public.carousel_items
    FOR SELECT USING (is_active = true);

-- Only admins can manage carousel items
CREATE POLICY "Allow admin manage carousel_items" ON public.carousel_items
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create function to update carousel item order
CREATE OR REPLACE FUNCTION public.update_carousel_order(
    p_item_id uuid,
    p_new_order integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Ensure user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only administrators can update carousel order';
    END IF;

    -- First, shift existing items to make space
    UPDATE public.carousel_items
    SET order_index = order_index + 1
    WHERE order_index >= p_new_order
    AND id != p_item_id;

    -- Then update the target item
    UPDATE public.carousel_items
    SET order_index = p_new_order
    WHERE id = p_item_id;

    -- Finally, reorder all items to ensure no gaps
    WITH numbered AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY order_index) - 1 as new_order
        FROM public.carousel_items
    )
    UPDATE public.carousel_items ci
    SET order_index = n.new_order
    FROM numbered n
    WHERE ci.id = n.id;
END;
$$;

-- Drop existing function and trigger
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP TRIGGER IF EXISTS update_carousel_items_updated_at ON public.carousel_items;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger
CREATE TRIGGER update_carousel_items_updated_at
    BEFORE UPDATE ON public.carousel_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column(); 
