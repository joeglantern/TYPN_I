-- Add blogger information to blogs table
alter table blogs 
add column blogger_name text not null default 'Anonymous',
add column blogger_photo_url text,
add column blogger_bio text;

-- Create a gallery_images table for reusable images
create table gallery_images (
  id bigint primary key generated always as identity,
  title text not null,
  description text,
  image_url text not null,
  category text not null default 'general',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies for gallery_images
alter table gallery_images enable row level security;

-- Allow public read access
create policy "Allow public read access to gallery images"
  on gallery_images for select
  using (true);

-- Allow admin users to manage gallery images
create policy "Allow admin users to manage gallery images"
  on gallery_images for all
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Create trigger for updated_at
create trigger update_gallery_images_updated_at
  before update on gallery_images
  for each row
  execute function update_updated_at_column();

-- Add reference to gallery_images for blog cover photos
alter table blogs
add column cover_image_id bigint references gallery_images(id);

-- Add reference to gallery_images for blogger photos
alter table blogs
add column blogger_photo_id bigint references gallery_images(id); 