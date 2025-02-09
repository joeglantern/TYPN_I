# Admin Management Guide

## Promoting Users to Admin

1. First, get the user's ID from the profiles table:
```sql
select id, email, username 
from profiles 
where email = 'user@example.com';
```

2. Once you have the user's ID, you can promote them to admin using the function:
```sql
select promote_to_admin('USER_ID_HERE');
```

## Demoting Admins to Users

1. To demote an admin back to a regular user:
```sql
select demote_admin('USER_ID_HERE');
```

## Checking User Roles

1. To check if a user is an admin:
```sql
select is_admin('USER_ID_HERE');
```

2. To view all admins:
```sql
select id, email, username 
from profiles 
where role = 'admin';
```

## Viewing Admin Actions

1. To view all admin actions (promotions/demotions):
```sql
select 
    aa.created_at,
    admin_profile.username as admin_username,
    target_profile.username as target_username,
    aa.action,
    aa.details
from admin_actions aa
join profiles admin_profile on aa.admin_id = admin_profile.id
join profiles target_profile on aa.target_user_id = target_profile.id
order by aa.created_at desc;
```

## Important Notes

1. Only existing admins can promote other users to admin
2. Only existing admins can demote other admins
3. All admin actions are logged in the admin_actions table
4. Admin privileges include:
   - Managing other users' roles
   - Viewing admin action logs
   - Access to admin-only features

## Security Best Practices

1. Limit the number of admin users
2. Regularly review the admin actions log
3. Remove admin privileges when no longer needed
4. Use strong passwords for admin accounts
5. Never share admin credentials 

## User Profile Update

1. Users can update their profile using the `update_profile` function:
```sql
SELECT update_profile(
  auth.uid(),      -- user's ID
  'new_username',  -- new username
  'avatar_url',    -- new avatar URL
  'Full Name',     -- new full name
  'Bio text'       -- new bio
);
```

The function will:
1. Check if the new username is already taken
2. Update only the provided fields (NULL values are ignored)
3. Automatically update the `updated_at` timestamp
4. Return true if successful, false if failed 