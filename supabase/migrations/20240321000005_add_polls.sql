-- Drop existing objects if they exist
drop function if exists create_polls_table();
drop function if exists determine_poll_winner();
drop trigger if exists determine_poll_winner_trigger on public.polls;
drop trigger if exists update_poll_analytics_trigger on public.poll_votes;
drop table if exists public.poll_votes cascade;
drop table if exists public.poll_analytics cascade;
drop table if exists public.poll_comments cascade;
drop table if exists public.polls cascade;

-- Create polls table with enhanced features
create table public.polls (
    id uuid default gen_random_uuid() primary key,
    question text not null,
    description text,
    options jsonb not null default '[]'::jsonb,
    votes jsonb default '{}'::jsonb not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    ends_at timestamp with time zone not null,
    is_closed boolean default false,
    category text,
    tags text[],
    visibility text default 'public' check (visibility in ('public', 'private', 'unlisted')),
    allow_comments boolean default true,
    allow_multiple_votes boolean default false,
    min_auth_level text default 'authenticated' check (min_auth_level in ('authenticated', 'admin', 'moderator')),
    featured boolean default false,
    image_url text,
    last_activity_at timestamp with time zone default timezone('utc'::text, now()),
    view_count integer default 0,
    is_template boolean default false,
    settings jsonb default '{}'::jsonb,
    winning_option jsonb default null,
    winner_determined_at timestamp with time zone
);

-- Create poll_votes table with enhanced tracking
create table public.poll_votes (
    id uuid default gen_random_uuid() primary key,
    poll_id uuid references public.polls(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    option_index integer not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    ip_address text,
    user_agent text,
    device_type text,
    location jsonb,
    unique(poll_id, user_id) -- Ensure users can only vote once per poll
);

-- Create poll analytics table
create table public.poll_analytics (
    id uuid default gen_random_uuid() primary key,
    poll_id uuid references public.polls(id) on delete cascade not null,
    total_votes integer default 0,
    unique_voters integer default 0,
    view_count integer default 0,
    completion_rate numeric(5,2),
    avg_time_to_vote interval,
    demographic_data jsonb,
    hourly_stats jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create poll comments table
create table public.poll_comments (
    id uuid default gen_random_uuid() primary key,
    poll_id uuid references public.polls(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()),
    parent_id uuid references public.poll_comments(id) on delete cascade,
    is_edited boolean default false,
    is_pinned boolean default false,
    reactions jsonb default '{}'::jsonb
);

-- Create indexes for better performance
create index idx_poll_votes_poll_id on public.poll_votes(poll_id);
create index idx_poll_votes_user_id on public.poll_votes(user_id);
create index idx_poll_votes_created_at on public.poll_votes(created_at);
create index idx_polls_created_at on public.polls(created_at desc);
create index idx_polls_user_id on public.polls(user_id);

-- Enable RLS
alter table public.polls enable row level security;
alter table public.poll_votes enable row level security;

-- Create policies for polls
create policy "Polls are viewable by everyone"
    on public.polls for select
    to authenticated
    using (true);

create policy "Polls are insertable by authenticated users"
    on public.polls for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Polls are updatable by owners and admins"
    on public.polls for update
    to authenticated
    using (auth.uid() = user_id or exists (
        select 1 from public.profiles
        where id = auth.uid() and role in ('admin', 'moderator')
    ));

-- Create policies for poll_votes
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

-- Create function to determine poll winner
create or replace function determine_poll_winner()
returns trigger as $$
declare
    max_votes integer := 0;
    winner_index integer := null;
    winner_text text := null;
    vote_count integer;
    options_arr jsonb;
begin
    -- Only proceed if poll is closed or ended
    if (new.is_closed = true or new.ends_at <= now()) and new.winning_option is null then
        options_arr := new.options;
        
        -- Find the option with the most votes
        for i in 0..jsonb_array_length(options_arr) - 1 loop
            vote_count := (new.votes->>i::text)::integer;
            if vote_count > max_votes then
                max_votes := vote_count;
                winner_index := i;
                winner_text := options_arr->>i;
            end if;
        end loop;

        -- Update the winning option
        if winner_index is not null then
            new.winning_option := jsonb_build_object(
                'index', winner_index,
                'text', winner_text,
                'votes', max_votes
            );
            new.winner_determined_at := now();
        end if;
    end if;
    return new;
end;
$$ language plpgsql security definer;

-- Create trigger for winner determination
create trigger determine_poll_winner_trigger
before update on public.polls
for each row
execute function determine_poll_winner();

-- Grant access to authenticated users
grant all on public.polls to authenticated; 
grant all on public.poll_votes to authenticated;
grant execute on function determine_poll_winner to authenticated; 