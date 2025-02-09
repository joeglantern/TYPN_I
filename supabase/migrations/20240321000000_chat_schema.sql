-- Enable RLS if not already enabled
do $$ 
begin
    if not exists (
        select 1 from pg_tables 
        where schemaname = 'public' 
        and tablename = 'profiles'
        and rowsecurity = true
    ) then
        alter table public.profiles enable row level security;
    end if;
end $$;

-- Drop existing tables and their dependencies in the correct order
drop table if exists public.reports cascade;
drop table if exists public.channel_reads cascade;
drop table if exists public.messages cascade;
drop table if exists public.polls cascade;
drop table if exists public.banned_users cascade;
drop table if exists public.channels cascade;

-- Create channels table
create table public.channels (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    is_locked boolean default false,
    created_by uuid references auth.users(id) on delete set null,
    allow_polls boolean default true
);

-- Create messages table
drop table if exists public.messages;

create table public.messages (
    id uuid default gen_random_uuid() primary key,
    content text not null,
    user_id uuid not null,
    channel_id uuid not null,
    username text not null,
    user_avatar text,
    image_url text,
    reply_to jsonb,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    read_by uuid[] default array[]::uuid[],
    reactions jsonb[] default array[]::jsonb[],
    is_pinned boolean default false,
    edited_at timestamptz,
    poll_id uuid references public.polls(id) on delete set null,
    is_verified boolean default false,
    pinned_at timestamptz,
    pinned_by uuid references auth.users(id) on delete set null,
    constraint messages_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade,
    constraint messages_channel_id_fkey foreign key (channel_id) references public.channels(id) on delete cascade
);

-- Add indexes for better performance
create index if not exists messages_user_id_idx on public.messages(user_id);
create index if not exists messages_channel_id_idx on public.messages(channel_id);
create index if not exists messages_poll_id_idx on public.messages(poll_id);

-- Add RLS policies for messages
create policy "Messages are viewable by everyone"
    on public.messages for select
    to public
    using (true);

create policy "Messages are insertable by authenticated users"
    on public.messages for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Users can update their own messages"
    on public.messages for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Add delete policy for messages
create policy "Users can delete their own messages"
    on public.messages for delete
    to authenticated
    using (auth.uid() = user_id or exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin'
    ));

-- Drop and recreate channel_reads table with correct schema
DROP TABLE IF EXISTS public.channel_reads;

CREATE TABLE public.channel_reads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_read_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    last_read TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(channel_id, user_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS channel_reads_user_id_idx ON public.channel_reads(user_id);
CREATE INDEX IF NOT EXISTS channel_reads_channel_id_idx ON public.channel_reads(channel_id);
CREATE INDEX IF NOT EXISTS channel_reads_last_read_idx ON public.channel_reads(last_read);

-- Add RLS policies for channel_reads
ALTER TABLE public.channel_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own channel reads"
    ON public.channel_reads FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own channel reads"
    ON public.channel_reads FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own channel reads"
    ON public.channel_reads FOR UPDATE
    USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_channel_read_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_channel_read_updated_at
    BEFORE UPDATE ON public.channel_reads
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_channel_read_updated_at();

-- Create polls table
create table public.polls (
    id uuid default gen_random_uuid() primary key,
    channel_id uuid references public.channels(id) on delete cascade not null,
    created_by uuid references auth.users(id) on delete cascade not null,
    question text not null,
    options jsonb not null,
    votes jsonb default '{}'::jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    ends_at timestamp with time zone not null,
    is_closed boolean default false
);

-- Create banned_users table with proper foreign key relationships
drop table if exists public.banned_users;

create table public.banned_users (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  banned_by uuid not null,
  reason text not null,
  channel_id uuid references public.channels(id),
  created_at timestamptz default timezone('utc'::text, now()),
  unbanned_at timestamptz,
  constraint banned_users_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade,
  constraint banned_users_banned_by_fkey foreign key (banned_by) references public.profiles(id) on delete cascade
);

-- Add indexes for better query performance
create index if not exists banned_users_user_id_idx on public.banned_users(user_id);
create index if not exists banned_users_banned_by_idx on public.banned_users(banned_by);
create index if not exists banned_users_channel_id_idx on public.banned_users(channel_id);

-- Create storage bucket for chat uploads if it doesn't exist
insert into storage.buckets (id, name, public)
values ('chat-uploads', 'chat-uploads', true)
on conflict (id) do nothing;

-- Enable RLS on tables
alter table public.channels enable row level security;
alter table public.messages enable row level security;
alter table public.channel_reads enable row level security;
alter table public.polls enable row level security;
alter table public.banned_users enable row level security;

-- Drop existing policies if they exist
do $$ 
begin
    drop policy if exists "Channels are viewable by everyone" on public.channels;
    drop policy if exists "Messages are viewable by everyone" on public.messages;
    drop policy if exists "Messages are insertable by everyone" on public.messages;
    drop policy if exists "Chat uploads are accessible by everyone" on storage.objects;
    drop policy if exists "Channel reads are viewable by authenticated users" on public.channel_reads;
    drop policy if exists "Channel reads are modifiable by authenticated users" on public.channel_reads;
    drop policy if exists "Profiles are viewable by everyone" on public.profiles;
    drop policy if exists "Users can insert their own profile" on public.profiles;
    drop policy if exists "Users can update own profile" on public.profiles;
end $$;

-- Create policies for public access
create policy "Channels are viewable by everyone"
    on public.channels for select
    to public
    using (true);

create policy "Channels are insertable by authenticated users"
    on public.channels for insert
    to authenticated
    with check (auth.uid() = created_by);

-- Create storage policy for chat uploads
create policy "Chat uploads are accessible by everyone"
    on storage.objects for all
    to public
    using (bucket_id = 'chat-uploads')
    with check (bucket_id = 'chat-uploads');

-- Create policies for channel reads
create policy "Channel reads are viewable by authenticated users"
    on public.channel_reads for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Channel reads are modifiable by authenticated users"
    on public.channel_reads for all
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Grant access to public and authenticated users
grant usage on schema public to public, authenticated;
grant select on public.channels to public, authenticated;
grant insert on public.channels to authenticated;
grant select, insert on public.messages to public, authenticated;
grant all on public.channel_reads to authenticated;
grant all on public.polls to authenticated;
grant all on public.banned_users to authenticated;

-- Create or replace updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Drop existing trigger if it exists and create new one
drop trigger if exists handle_updated_at on public.channels;
create trigger handle_updated_at
    before update on public.channels
    for each row
    execute function public.handle_updated_at();

-- Insert default channels if they don't exist
insert into public.channels (name, description)
select name, description
from (values
    ('general', 'General discussion'),
    ('introductions', 'Introduce yourself to the community'),
    ('events', 'Upcoming events and activities'),
    ('projects', 'Share and discuss projects'),
    ('help', 'Get help and support')
) as default_channels(name, description)
where not exists (
    select 1 from public.channels 
    where channels.name = default_channels.name
);

-- Create function to mark messages as read
create or replace function public.mark_messages_as_read(
    p_channel_id uuid,
    p_user_id uuid
) returns void as $$
begin
    update public.messages
    set read_by = array_append(read_by, p_user_id)
    where channel_id = p_channel_id
    and not (read_by @> array[p_user_id]);
end;
$$ language plpgsql security definer;

-- Create function to promote user to admin
create or replace function public.promote_to_admin(
    p_user_id uuid,
    p_admin_id uuid -- The ID of the admin performing the promotion
) returns void as $$
declare
    v_is_admin boolean;
begin
    -- Check if the user performing the action is an admin
    select exists (
        select 1
        from auth.users u
        join public.profiles p on u.id = p.id
        where u.id = p_admin_id
        and p.role = 'admin'
    ) into v_is_admin;

    if not v_is_admin then
        raise exception 'Only administrators can promote users';
    end if;

    -- Update the user's profile to admin role
    update public.profiles
    set role = 'admin'
    where id = p_user_id;

    -- Add admin claims to the user's JWT
    update auth.users
    set raw_app_meta_data = raw_app_meta_data || 
        json_build_object('role', 'admin')::jsonb
    where id = p_user_id;
end;
$$ language plpgsql security definer;

-- Grant execute permissions on functions
grant execute on function public.mark_messages_as_read to authenticated;
grant execute on function public.promote_to_admin to authenticated;

-- Create function to update message
create or replace function public.update_message(
    p_message_id uuid,
    p_content text,
    p_user_id uuid
) returns void as $$
begin
    -- Check if the user owns the message
    if not exists (
        select 1 from public.messages 
        where id = p_message_id 
        and user_id = p_user_id
    ) then
        raise exception 'You can only edit your own messages';
    end if;

    update public.messages
    set 
        content = p_content,
        edited_at = timezone('utc'::text, now())
    where id = p_message_id;
end;
$$ language plpgsql security definer;

-- Create function to toggle message pin
create or replace function public.toggle_message_pin(
    p_message_id uuid,
    p_user_id uuid
) returns void as $$
declare
    v_is_admin boolean;
begin
    -- Check if user is admin
    select exists (
        select 1 from public.profiles
        where id = p_user_id and role = 'admin'
    ) into v_is_admin;

    if not v_is_admin then
        raise exception 'Only administrators can pin messages';
    end if;

    -- Toggle message pin status
    update public.messages
    set is_pinned = not is_pinned
    where id = p_message_id;
end;
$$ language plpgsql security definer;

-- Grant execute permissions on new functions
grant execute on function public.update_message to authenticated;
grant execute on function public.toggle_message_pin to authenticated;

-- Create function to create a poll
create or replace function public.create_poll(
  p_channel_id uuid,
  p_question text,
  p_options jsonb,
  p_duration text,
  p_user_id uuid
) returns uuid as $$
declare
  v_is_admin boolean;
  v_allow_polls boolean;
  v_poll_id uuid;
  v_duration interval;
begin
  -- Check if user is admin
  select exists (
    select 1 from public.profiles
    where id = p_user_id and role = 'admin'
  ) into v_is_admin;

  -- Check if polls are allowed in this channel
  select allow_polls into v_allow_polls
  from public.channels
  where id = p_channel_id;

  if not v_is_admin and not v_allow_polls then
    raise exception 'Polls are not allowed in this channel';
  end if;

  -- Convert duration string to interval
  v_duration := p_duration::interval;

  -- Create poll
  insert into public.polls (
    channel_id,
    created_by,
    question,
    options,
    ends_at
  ) values (
    p_channel_id,
    p_user_id,
    p_question,
    p_options,
    timezone('utc'::text, now()) + v_duration
  ) returning id into v_poll_id;

  return v_poll_id;
end;
$$ language plpgsql security definer;

-- Create function to vote in a poll
create or replace function public.vote_in_poll(
  p_poll_id uuid,
  p_option_index integer,
  p_user_id uuid
) returns void as $$
declare
  v_poll public.polls;
begin
  -- Get poll
  select * into v_poll
  from public.polls
  where id = p_poll_id;

  -- Check if poll exists and is not closed
  if v_poll is null then
    raise exception 'Poll not found';
  end if;

  if v_poll.is_closed or v_poll.ends_at < timezone('utc'::text, now()) then
    raise exception 'Poll is closed';
  end if;

  -- Update votes
  update public.polls
  set votes = jsonb_set(
    votes,
    array[p_option_index::text],
    coalesce(votes->>p_option_index::text, '0')::integer + 1
  )
  where id = p_poll_id;
end;
$$ language plpgsql security definer;

-- Create function to ban user
create or replace function public.ban_user(
  p_user_id uuid,
  p_admin_id uuid,
  p_reason text,
  p_channel_id uuid default null
) returns void as $$
declare
  v_is_admin boolean;
begin
  -- Check if user performing the ban is admin
  select exists (
    select 1 from public.profiles
    where id = p_admin_id and role = 'admin'
  ) into v_is_admin;

  if not v_is_admin then
    raise exception 'Only administrators can ban users';
  end if;

  -- Insert ban record
  insert into public.banned_users (
    user_id,
    banned_by,
    reason,
    channel_id
  ) values (
    p_user_id,
    p_admin_id,
    p_reason,
    p_channel_id
  );
end;
$$ language plpgsql security definer;

-- Create function to unban user
create or replace function public.unban_user(
  p_user_id uuid,
  p_admin_id uuid,
  p_channel_id uuid default null
) returns void as $$
declare
  v_is_admin boolean;
begin
  -- Check if user performing the unban is admin
  select exists (
    select 1 from auth.users u
    join public.profiles p on u.id = p.id
    where u.id = p_admin_id and p.role = 'admin'
  ) into v_is_admin;

  if not v_is_admin then
    raise exception 'Only administrators can unban users';
  end if;

  -- Update ban record
  update public.banned_users
  set unbanned_at = timezone('utc'::text, now())
  where user_id = p_user_id
  and channel_id is not distinct from p_channel_id
  and unbanned_at is null;
end;
$$ language plpgsql security definer;

-- Create function to check if user is banned
create or replace function public.is_user_banned(
  p_user_id uuid,
  p_channel_id uuid
) returns boolean as $$
begin
  return exists (
    select 1
    from public.banned_users
    where user_id = p_user_id
    and unbanned_at is null
    and (channel_id is null or channel_id = p_channel_id)
  );
end;
$$ language plpgsql security definer;

-- Grant execute permissions on functions
grant execute on function public.ban_user to authenticated;
grant execute on function public.is_user_banned to authenticated;

-- Create policies for new tables
create policy "Polls are viewable by everyone"
  on public.polls for select
  to public
  using (true);

create policy "Polls are insertable by authenticated users"
  on public.polls for insert
  to authenticated
  with check (true);

-- Create policy for banned users
create policy "Banned users are viewable by admins"
  on public.banned_users for select
  to authenticated
  using (
    exists (
      select 1
      from auth.users u
      join public.profiles p on u.id = p.id
      where u.id = auth.uid()
      and p.role = 'admin'
    )
  );

-- Policies for admin channel management
create policy "Admins can update channels"
    on public.channels for update
    to authenticated
    using (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'admin'
        )
    );

create policy "Admins can delete channels"
    on public.channels for delete
    to authenticated
    using (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'admin'
        )
    );

-- Policies for admin message management
create policy "Admins can update any message"
    on public.messages for update
    to authenticated
    using (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'admin'
        )
    );

create policy "Admins can delete messages"
    on public.messages for delete
    to authenticated
    using (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'admin'
        )
    );

-- Update grants to include update and delete permissions
grant update, delete on public.channels to authenticated;
grant update, delete on public.messages to authenticated;

-- Create function for channel locking
create or replace function public.toggle_channel_lock(
    p_channel_id uuid,
    p_user_id uuid
) returns void as $$
declare
    v_is_admin boolean;
begin
    -- Check if user is admin
    select exists (
        select 1 from public.profiles
        where id = p_user_id and role = 'admin'
    ) into v_is_admin;

    if not v_is_admin then
        raise exception 'Only administrators can lock/unlock channels';
    end if;

    -- Toggle channel lock
    update public.channels
    set is_locked = not is_locked
    where id = p_channel_id;
end;
$$ language plpgsql security definer;

-- Grant execute on new function
grant execute on function public.toggle_channel_lock to authenticated;

-- Add avatar_url and is_verified fields to profiles if they don't exist
do $$
begin
    if not exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
        and table_name = 'profiles'
        and column_name = 'avatar_url'
    ) then
        alter table public.profiles add column avatar_url text;
    end if;

    if not exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
        and table_name = 'profiles'
        and column_name = 'is_verified'
    ) then
        alter table public.profiles add column is_verified boolean default false;
    end if;
end $$;

-- Create function to toggle user verification status
create or replace function public.toggle_user_verification(
    p_user_id uuid,
    p_admin_id uuid
) returns void as $$
declare
    v_is_admin boolean;
begin
    -- Check if the user performing the action is an admin
    select exists (
        select 1
        from auth.users u
        join public.profiles p on u.id = p.id
        where u.id = p_admin_id
        and p.role = 'admin'
    ) into v_is_admin;

    if not v_is_admin then
        raise exception 'Only administrators can verify users';
    end if;

    -- Toggle verification status
    update public.profiles
    set is_verified = not is_verified
    where id = p_user_id;
end;
$$ language plpgsql security definer;

-- Grant execute permissions on new function
grant execute on function public.toggle_user_verification to authenticated;

-- Create avatars storage bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Update storage policies for avatars
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
drop policy if exists "Users can upload their own avatar" on storage.objects;
drop policy if exists "Users can update their own avatar" on storage.objects;

create policy "Avatar images are publicly accessible"
    on storage.objects for select
    to public
    using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
    on storage.objects for insert
    to authenticated
    with check (bucket_id = 'avatars');

create policy "Users can update their own avatar"
    on storage.objects for update
    to authenticated
    using (bucket_id = 'avatars');

create policy "Users can delete their own avatar"
    on storage.objects for delete
    to authenticated
    using (bucket_id = 'avatars');

-- Create policies for profiles
create policy "Profiles are viewable by everyone"
    on public.profiles for select
    to public
    using (true);

create policy "Users can insert their own profile"
    on public.profiles for insert
    to authenticated
    with check (auth.uid() = id);

create policy "Users can update own profile"
    on public.profiles for update
    to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);

-- Create trigger to automatically create profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, username, email, role)
    values (
        new.id,
        new.raw_user_meta_data->>'username',
        new.email,
        'user'
    );
    return new;
end;
$$ language plpgsql security definer;

-- Drop if exists and create trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- Create reports table
create table public.reports (
  id uuid default gen_random_uuid() primary key,
  reported_user_id uuid not null references public.profiles(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  message_id uuid references public.messages(id) on delete set null,
  reason text not null,
  status text not null default 'pending',
  created_at timestamptz default timezone('utc'::text, now()) not null,
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  notes text,
  constraint reports_status_check check (status in ('pending', 'resolved', 'dismissed'))
);

-- Add indexes
create index if not exists reports_reported_user_id_idx on public.reports(reported_user_id);
create index if not exists reports_reporter_id_idx on public.reports(reporter_id);
create index if not exists reports_status_idx on public.reports(status);

-- Enable RLS
alter table public.reports enable row level security;

-- Create RLS policies
create policy "Reports are viewable by admins only"
  on public.reports for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

create policy "Users can create reports"
  on public.reports for insert
  to authenticated
  with check (
    auth.uid() = reporter_id and
    auth.uid() != reported_user_id
  );

-- Create function to report a user
create or replace function public.report_user(
  p_reported_user_id uuid,
  p_message_id uuid,
  p_reason text
) returns uuid
language plpgsql security definer
as $$
declare
  v_report_id uuid;
begin
  -- Check if reporter is not reporting themselves
  if auth.uid() = p_reported_user_id then
    raise exception 'You cannot report yourself';
  end if;

  -- Insert the report
  insert into public.reports (
    reported_user_id,
    reporter_id,
    message_id,
    reason,
    status
  ) values (
    p_reported_user_id,
    auth.uid(),
    p_message_id,
    p_reason,
    'pending'
  ) returning id into v_report_id;

  return v_report_id;
end;
$$;

-- Create function to resolve a report
create or replace function public.resolve_report(
  p_report_id uuid,
  p_status text,
  p_notes text default null
) returns void
language plpgsql security definer
as $$
begin
  -- Check if user is admin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'admin'
  ) then
    raise exception 'Only administrators can resolve reports';
  end if;

  -- Update the report
  update public.reports
  set
    status = p_status,
    resolved_at = now(),
    resolved_by = auth.uid(),
    notes = p_notes
  where id = p_report_id;
end;
$$;

-- Grant access to authenticated users
grant usage on schema public to public, authenticated;
grant all on public.reports to authenticated;
grant execute on function public.report_user to authenticated;
grant execute on function public.resolve_report to authenticated;

-- Create admins table
create table if not exists public.admins (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
);

-- Add RLS policies for admins table
alter table public.admins enable row level security;

create policy "Admins can be viewed by all users"
  on public.admins for select
  to authenticated
  using (true);

create policy "Only super admins can insert/delete/update admins"
  on public.admins for all
  to authenticated
  using (auth.uid() in (
    select user_id from public.admins where user_id = auth.uid()
  ))
  with check (auth.uid() in (
    select user_id from public.admins where user_id = auth.uid()
  ));

-- Add indexes
create index if not exists admins_user_id_idx on public.admins(user_id);

-- Grant permissions
grant usage on schema public to authenticated;
grant all on public.admins to authenticated;

-- Add function to check if user is admin
create or replace function public.is_admin(user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1
    from public.admins
    where admins.user_id = user_id
  );
end;
$$ language plpgsql security definer; 