-- Add is_banned column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false;

-- Create banned_users table
CREATE TABLE IF NOT EXISTS banned_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  unbanned_at TIMESTAMP WITH TIME ZONE,
  channel_id UUID REFERENCES channels(id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS banned_users_user_id_idx ON banned_users(user_id);
CREATE INDEX IF NOT EXISTS banned_users_channel_id_idx ON banned_users(channel_id);

-- Add RLS policies
ALTER TABLE banned_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admins full access to banned_users"
  ON banned_users
  FOR ALL
  TO authenticated
    USING (
        EXISTS (
      SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Allow users to view banned users"
  ON banned_users
  FOR SELECT
  TO authenticated
  USING (true);

-- Function to check if a user is banned
CREATE OR REPLACE FUNCTION is_user_banned(user_uuid UUID, channel_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM banned_users
    WHERE user_id = user_uuid
    AND (channel_id = channel_uuid OR channel_id IS NULL)
    AND unbanned_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add is_system_message column to messages if it doesn't exist
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS is_system_message boolean DEFAULT false;

-- Add visible_to column to messages if it doesn't exist
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS visible_to uuid[] DEFAULT NULL;

-- Add resolved_by column to reports if it doesn't exist
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Make channel_id nullable in messages table
ALTER TABLE public.messages 
ALTER COLUMN channel_id DROP NOT NULL;

-- Make username nullable in messages table
ALTER TABLE public.messages 
ALTER COLUMN username DROP NOT NULL;

-- Drop existing functions first
DROP FUNCTION IF EXISTS public.send_system_notification(uuid, text, uuid);
DROP FUNCTION IF EXISTS public.send_system_notification(uuid, text);

-- Create function to send system notifications
CREATE OR REPLACE FUNCTION public.send_system_notification(
    p_user_id uuid,
    p_content text,
    p_channel_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sender_username text;
BEGIN
    -- Get sender username (admin or system)
    SELECT username INTO v_sender_username
    FROM public.profiles
    WHERE id = COALESCE(auth.uid(), p_user_id);

    -- Insert the system message
    INSERT INTO public.messages (
        content,
        user_id,
        channel_id,
        is_system_message,
        visible_to,
        username,
        created_at
    ) VALUES (
        p_content,
        COALESCE(auth.uid(), p_user_id),
        p_channel_id,
        true,
        ARRAY[p_user_id],
        COALESCE(v_sender_username, 'System'),
        CURRENT_TIMESTAMP
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in send_system_notification: %, SQLSTATE: %, SQLERRM: %', 
            SQLERRM, SQLSTATE, SQLERRM;
        RAISE;
END;
$$;

-- Drop all existing ban_user functions to avoid conflicts
DROP FUNCTION IF EXISTS public.ban_user(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.ban_user(uuid, text, uuid);
DROP FUNCTION IF EXISTS public.ban_user(uuid, uuid, text, uuid);
DROP FUNCTION IF EXISTS public.ban_user(uuid, text, uuid, uuid);

-- Create a single, clear ban_user function
CREATE OR REPLACE FUNCTION public.ban_user(
    p_user_id uuid,
    p_admin_id uuid,
    p_reason text,
    p_channel_id uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if admin has permission
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = p_admin_id
        AND role IN ('admin', 'moderator')
    ) THEN
        RAISE EXCEPTION 'Insufficient permissions to ban users';
    END IF;

    -- Update profile to mark as banned
    UPDATE public.profiles
    SET is_banned = true
    WHERE id = p_user_id;

    -- Insert ban record
    INSERT INTO banned_users (user_id, admin_id, reason, channel_id, created_at)
    VALUES (p_user_id, p_admin_id, p_reason, p_channel_id, CURRENT_TIMESTAMP);

    -- Send notification to the banned user
    PERFORM public.send_system_notification(
        p_user_id,
        'Your account has been banned for the following reason: ' || p_reason || 
        '. If you believe this was a mistake, please contact support@typni.com to appeal.',
        NULL
    );
END;
$$;

-- Drop and recreate unban_user function
DROP FUNCTION IF EXISTS public.unban_user(uuid, uuid, text);

CREATE OR REPLACE FUNCTION public.unban_user(
    p_user_id uuid,
    p_admin_id uuid,
    p_unban_reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if admin has permission
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = p_admin_id
        AND role IN ('admin', 'moderator')
    ) THEN
        RAISE EXCEPTION 'Insufficient permissions to unban users';
    END IF;

    -- Update profile to unban
    UPDATE public.profiles
    SET is_banned = false
    WHERE id = p_user_id;

    -- Update ban record
    UPDATE banned_users
    SET 
        unbanned_at = CURRENT_TIMESTAMP,
        unbanned_by = p_admin_id,
        unban_reason = p_unban_reason
    WHERE user_id = p_user_id 
    AND unbanned_at IS NULL;

    -- Send notification to the unbanned user
    PERFORM public.send_system_notification(
        p_user_id,
        'Your account has been unbanned. You can now access all features again. Please ensure to follow our community guidelines to avoid future bans.',
        NULL
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.send_system_notification(uuid, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ban_user(uuid, uuid, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unban_user(uuid, uuid, text) TO authenticated;

-- Create policies for banned_users table
CREATE POLICY "Admins can view banned users"
  ON banned_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admins can create ban records"
  ON banned_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admins can update ban records"
  ON banned_users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

-- Add RLS to messages for banned users
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Banned users cannot send messages"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_banned = true
    )
  );

CREATE POLICY "Everyone can view messages"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (true); 