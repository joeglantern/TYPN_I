-- Create channels table
create table if not exists channels (
  id bigint primary key generated always as identity,
  name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create messages table
create table if not exists messages (
  id bigint primary key generated always as identity,
  content text not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  channel_id bigint references channels(id) on delete cascade not null,
  username text not null,
  user_avatar text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table channels enable row level security;
alter table messages enable row level security;

-- Create policies for channels
create policy "Enable read access for all users"
  on channels for select
  using (true);

create policy "Enable insert for authenticated users only"
  on channels for insert
  to authenticated
  with check (true);

-- Create policies for messages
create policy "Enable read access for all users"
  on messages for select
  using (true);

create policy "Enable insert for authenticated users only"
  on messages for insert
  to authenticated
  with check (true);

-- Add some default channels
insert into channels (name, description) values
  ('general', 'General discussion'),
  ('introductions', 'Introduce yourself to the community'),
  ('events', 'Upcoming events and activities'),
  ('projects', 'Share and discuss community projects'),
  ('help', 'Get help and support');

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Create trigger for channels
create trigger handle_channels_updated_at
  before update on channels
  for each row
  execute function handle_updated_at(); 