-- Migration 003: Admin Users pre-authorization and SuperAdmin seed

ALTER TABLE admin_users ALTER COLUMN clerk_user_id DROP NOT NULL;

INSERT INTO admin_users (email, role, is_active)
VALUES ('thomasheinzergz@gmail.com', 'super_admin', true)
ON CONFLICT (email) DO UPDATE 
SET role = 'super_admin', is_active = true, updated_at = NOW();
