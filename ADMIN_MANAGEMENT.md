# Admin Management Guide

This guide explains how to manage admin users in the TYPNI application using Supabase.

## Initial Admin Setup

The initial admin user is created automatically with these credentials:
- Email: admin@typni.org
- Password: Admin123!@#
- Name: Admin User

**Important**: Change these credentials immediately after first login!

## Managing Admins via Supabase SQL Editor

### View All Admins
```sql
SELECT name, email, created_at 
FROM profiles 
WHERE role = 'admin';
```

### Promote User to Admin
```sql
-- Replace user@example.com with the actual email
SELECT promote_to_admin('user@example.com');
```

### Revoke Admin Access
```sql
-- Replace admin@example.com with the actual email
SELECT revoke_admin_access('admin@example.com');
```

### Create New Admin User
```sql
-- Replace the values with actual details
SELECT create_admin_user(
  'newadmin@typni.org',
  'SecurePassword123!',
  'New Admin Name'
);
```

## Important Notes

1. **Security**:
   - Always use strong passwords
   - Change the default admin password immediately
   - Regularly audit admin access
   - Never share admin credentials

2. **Safety Measures**:
   - Cannot revoke the last admin's access
   - Cannot promote already-admin users
   - Cannot revoke access from non-admin users
   - Cannot promote non-existent users

3. **Best Practices**:
   - Regularly review admin list
   - Remove admin access when no longer needed
   - Use separate admin accounts for each admin user
   - Keep admin count to minimum necessary

## Troubleshooting

If you encounter issues:

1. **Cannot Create Admin**:
   - Check if user already exists
   - Ensure email is unique
   - Verify password meets requirements

2. **Cannot Revoke Admin**:
   - Check if user is actually an admin
   - Ensure there's at least one other admin
   - Verify user email is correct

3. **Cannot Promote to Admin**:
   - Verify user exists in the system
   - Check if user is already an admin
   - Ensure email is spelled correctly

## Admin Access Audit

To audit admin access, run:
```sql
SELECT 
  p.name,
  p.email,
  p.role,
  p.created_at,
  p.updated_at
FROM profiles p
WHERE p.role = 'admin'
ORDER BY p.created_at DESC;
```

## Support

If you need assistance with admin management:
1. Check this documentation first
2. Contact the technical team
3. Never share admin credentials via email or chat
4. Always follow security protocols 