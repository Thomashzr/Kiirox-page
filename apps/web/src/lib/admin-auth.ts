import { currentUser } from '@clerk/nextjs/server';
import { neon } from '@neondatabase/serverless';

export interface AdminUserRecord {
  id: string;
  clerk_user_id: string | null;
  email: string;
  role: 'admin' | 'super_admin';
  is_active: boolean;
}

export type AdminAuthResult =
  | { authorized: true; admin: AdminUserRecord; clerkUser: any }
  | { authorized: false; reason: 'unauthenticated' }
  | { authorized: false; reason: 'forbidden'; email: string; clerkUserId: string };

export async function verifyAdminAccess(): Promise<AdminAuthResult> {
  const user = await currentUser();

  if (!user) {
    return { authorized: false, reason: 'unauthenticated' };
  }

  const primaryEmail =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
    user.emailAddresses[0]?.emailAddress ||
    '';

  const dbUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;
  if (!dbUrl) {
    // Fallback in local development without DB if email matches superadmin
    if (primaryEmail === 'thomasheinzergz@gmail.com') {
      return {
        authorized: true,
        admin: {
          id: 'local-superadmin',
          clerk_user_id: user.id,
          email: primaryEmail,
          role: 'super_admin',
          is_active: true,
        },
        clerkUser: user,
      };
    }
    return { authorized: false, reason: 'forbidden', email: primaryEmail, clerkUserId: user.id };
  }

  try {
    const sql = neon(dbUrl);

    // 1. Check if user is in admin_users by email or clerk_user_id
    const rows = await sql`
      SELECT id, clerk_user_id, email, role, is_active
      FROM admin_users
      WHERE (email = ${primaryEmail} OR clerk_user_id = ${user.id}) AND is_active = true
      LIMIT 1;
    `;

    if (rows.length === 0) {
      return {
        authorized: false,
        reason: 'forbidden',
        email: primaryEmail,
        clerkUserId: user.id,
      };
    }

    const admin = rows[0] as AdminUserRecord;

    // 2. Link Clerk User ID if not yet assigned
    if (!admin.clerk_user_id || admin.clerk_user_id !== user.id) {
      await sql`
        UPDATE admin_users
        SET clerk_user_id = ${user.id}, updated_at = NOW()
        WHERE id = ${admin.id};
      `;
      admin.clerk_user_id = user.id;
    }

    return {
      authorized: true,
      admin,
      clerkUser: user,
    };
  } catch (err) {
    console.error('Error verifying admin permissions in Neon DB:', err);
    return {
      authorized: false,
      reason: 'forbidden',
      email: primaryEmail,
      clerkUserId: user.id,
    };
  }
}
