-- Enable RLS if not already enabled
alter table public.messages enable row level security;

-- Add system message columns
alter table public.messages 
add column if not exists is_system_message boolean default false,
add column if not exists visible_to uuid[] default null;

-- Drop existing policies
do $$ 
begin
    drop policy if exists "Messages are viewable by everyone" on public.messages;
    drop policy if exists "Messages are viewable by everyone or specific users" on public.messages;
    drop policy if exists "Messages are insertable by authenticated users" on public.messages;
    drop policy if exists "Users can update their own messages" on public.messages;
end $$;

-- Create new policies
create policy "Messages are viewable by everyone or specific users"
    on public.messages for select
    to authenticated
    using (
        visible_to is null or 
        auth.uid() = any(visible_to)
    );

create policy "Messages are insertable by authenticated users"
    on public.messages for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Users can update their own messages"
    on public.messages for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Create notification function
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

-- Grant permissions
grant usage on schema public to authenticated;
grant all on public.messages to authenticated;
grant execute on function public.send_system_notification to authenticated; 