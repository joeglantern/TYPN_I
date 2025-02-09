-- Create testimonials table
create table if not exists testimonials (
  id bigint primary key generated always as identity,
  name text not null,
  role text not null,
  content text not null,
  image_url text,
  featured boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table testimonials enable row level security;

-- Create policies
create policy "Enable read access for all users"
  on testimonials for select
  using (true);

create policy "Enable insert for authenticated users only"
  on testimonials for insert
  to authenticated
  with check (true);

create policy "Enable update for authenticated users only"
  on testimonials for update
  to authenticated
  using (true);

create policy "Enable delete for authenticated users only"
  on testimonials for delete
  to authenticated
  using (true);

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

create trigger handle_testimonials_updated_at
  before update on testimonials
  for each row
  execute function handle_updated_at(); 