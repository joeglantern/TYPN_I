-- Create a simple reports table
create table if not exists public.reports (
  id uuid default gen_random_uuid() primary key,
  reported_user_id uuid references auth.users(id) on delete cascade,
  reporter_id uuid references auth.users(id) on delete cascade,
  reason text not null,
  status text default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  resolved_at timestamp with time zone,
  notes text,
  message_id uuid references public.messages(id) on delete set null
);

-- Add basic indexes
create index if not exists reports_status_idx on public.reports(status);
create index if not exists reports_reported_user_idx on public.reports(reported_user_id);

-- Enable RLS
alter table public.reports enable row level security;

-- Simple RLS policies
create policy "Enable read access for admin users" on public.reports
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Enable insert access for authenticated users" on public.reports
  for insert with check (auth.uid() = reporter_id);

create policy "Enable update access for admin users" on public.reports
  for update using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Grant necessary privileges
grant all on public.reports to authenticated; 