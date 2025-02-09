-- Add new columns to messages table
alter table public.messages
add column if not exists is_system_message boolean default false,
add column if not exists visible_to uuid[] default null;

-- Update RLS policy for messages to handle visibility
create or replace policy "Messages are viewable by everyone or specific users"
  on public.messages for select
  using (
    visible_to is null or 
    auth.uid() = any(visible_to)
  );

-- Create function to send system notification
create or replace function public.send_system_notification(
  p_user_id uuid,
  p_content text,
  p_channel_id uuid
) returns void
language plpgsql security definer
as $$
begin
  insert into public.messages (
    content,
    user_id,
    channel_id,
    username,
    is_system_message,
    visible_to
  ) values (
    p_content,
    auth.uid(),
    p_channel_id,
    'System',
    true,
    array[p_user_id]
  );
end;
$$; 