-- Add deleted_at column to messages table
ALTER TABLE public.messages
ADD COLUMN deleted_at timestamptz DEFAULT NULL;

-- Create index for better performance when filtering deleted messages
CREATE INDEX messages_deleted_at_idx ON public.messages(deleted_at);

-- Update the messages view policy to exclude deleted messages
DROP POLICY IF EXISTS "Messages are viewable by everyone" ON public.messages;
CREATE POLICY "Messages are viewable by everyone"
    ON public.messages FOR SELECT
    TO public
    USING (deleted_at IS NULL); 