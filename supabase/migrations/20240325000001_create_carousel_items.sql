create type carousel_type as enum ('gallery', 'event', 'program');
create type carousel_status as enum ('active', 'inactive');

create table carousel_items (
  id bigint primary key generated always as identity,
  title text not null,
  description text,
  image_url text not null,
  type carousel_type not null default 'gallery',
  status carousel_status not null default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create an index on type for faster filtering
create index carousel_items_type_idx on carousel_items(type);

-- Create an index on status for faster filtering
create index carousel_items_status_idx on carousel_items(status);

-- Add RLS policies
alter table carousel_items enable row level security;

-- Allow public read access to active items
create policy "Allow public read access to active items"
  on carousel_items for select
  using (status = 'active');

-- Allow authenticated users to read all items
create policy "Allow authenticated users to read all items"
  on carousel_items for select
  to authenticated
  using (true);

-- Allow admin users to manage all items
create policy "Allow admin users to manage all items"
  on carousel_items for all
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Create trigger for updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_carousel_items_updated_at
  before update on carousel_items
  for each row
  execute function update_updated_at_column(); 