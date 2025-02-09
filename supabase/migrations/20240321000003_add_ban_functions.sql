-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS ban_user(uuid, text, uuid, uuid);
DROP FUNCTION IF EXISTS unban_user(uuid, uuid, uuid, text);

-- Create function to ban users
CREATE OR REPLACE FUNCTION ban_user(
    p_user_id uuid,
    p_reason text,
    p_admin_id uuid,
    p_channel_id uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Ensure user is admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only administrators can ban users';
    END IF;

    -- Insert ban record
    INSERT INTO banned_users (
        user_id,
        admin_id,
        reason,
        channel_id
    ) VALUES (
        p_user_id,
        p_admin_id,
        p_reason,
        p_channel_id
    );

    -- If it's a global ban (no channel_id), update the profile
    IF p_channel_id IS NULL THEN
        UPDATE profiles
        SET is_banned = true
        WHERE id = p_user_id;
    END IF;
END;
$$;

-- Create function to unban users
CREATE OR REPLACE FUNCTION unban_user(
    p_user_id uuid,
    p_admin_id uuid,
    p_channel_id uuid DEFAULT NULL,
    p_unban_reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Ensure user is admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only administrators can unban users';
    END IF;

    -- Update ban records
    UPDATE banned_users
    SET 
        unbanned_at = CURRENT_TIMESTAMP,
        unban_reason = p_unban_reason
    WHERE user_id = p_user_id 
    AND (channel_id = p_channel_id OR (p_channel_id IS NULL AND channel_id IS NULL))
    AND unbanned_at IS NULL;

    -- If it's a global unban (no channel_id), update the profile
    IF p_channel_id IS NULL THEN
        UPDATE profiles
        SET is_banned = false
        WHERE id = p_user_id;
    END IF;
END;
$$; 