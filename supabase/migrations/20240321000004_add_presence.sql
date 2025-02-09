-- Add last_seen column to profiles table
alter table public.profiles
add column if not exists last_seen timestamp with time zone;

-- Create index for faster online users query
create index if not exists idx_profiles_last_seen
on public.profiles(last_seen desc);

-- Update RLS policies for last_seen
create policy "Users can update their own last_seen"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Grant update permission on last_seen column
grant update(last_seen) on public.profiles to authenticated; 