-- Add reply_to and image_url columns to messages table
alter table public.messages
add column if not exists reply_to jsonb,
add column if not exists image_url text;

-- Add suggestions channel if it doesn't exist
insert into public.channels (name, description)
select 'suggestions', 'Share your ideas and suggestions for improvement'
where not exists (
    select 1 from public.channels where name = 'suggestions'
); 