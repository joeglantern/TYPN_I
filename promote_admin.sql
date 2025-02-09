-- Replace YOUR_USER_ID with your actual user ID from Supabase
DO $$
BEGIN
  -- Update the profile role
  UPDATE public.profiles
  SET role = 'admin'
  WHERE id = 'YOUR_USER_ID';

  -- Add admin claims to JWT
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || 
      json_build_object('role', 'admin')::jsonb
  WHERE id = 'YOUR_USER_ID';
END $$; 