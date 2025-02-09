-- Create poll_votes table if it doesn't exist
create table if not exists public.poll_votes (
    id uuid default gen_random_uuid() primary key,
    poll_id uuid references public.polls(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    option_index integer not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    ip_address text,
    user_agent text,
    device_type text,
    unique(poll_id, user_id)
);

-- Create indexes for better performance
create index if not exists idx_poll_votes_poll_id on public.poll_votes(poll_id);
create index if not exists idx_poll_votes_user_id on public.poll_votes(user_id);
create index if not exists idx_poll_votes_created_at on public.poll_votes(created_at);

-- Enable RLS
alter table public.poll_votes enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Poll votes are viewable by everyone" on public.poll_votes;
drop policy if exists "Poll votes are insertable by authenticated users" on public.poll_votes;

-- Create policies
create policy "Poll votes are viewable by everyone"
    on public.poll_votes for select
    to authenticated
    using (true);

create policy "Poll votes are insertable by authenticated users"
    on public.poll_votes for insert
    to authenticated
    with check (
        auth.uid() = user_id and
        not exists (
            select 1 
            from public.poll_votes existing_vote
            where existing_vote.poll_id = poll_id 
            and existing_vote.user_id = auth.uid()
        ) and
        exists (
            select 1 
            from public.polls p 
            where p.id = poll_id 
            and not p.is_closed
            and p.ends_at > now()
        )
    );

-- Grant access
grant all on public.poll_votes to authenticated; 