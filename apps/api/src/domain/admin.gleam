pub type AdminRole {
  Admin
  SuperAdmin
}

pub fn role_to_string(role: AdminRole) -> String {
  case role {
    Admin -> "admin"
    SuperAdmin -> "super_admin"
  }
}

pub fn string_to_role(str: String) -> Result(AdminRole, Nil) {
  case str {
    "admin" -> Ok(Admin)
    "super_admin" -> Ok(SuperAdmin)
    _ -> Error(Nil)
  }
}

pub type AdminUser {
  AdminUser(
    id: String,
    clerk_user_id: String,
    email: String,
    role: AdminRole,
    is_active: Bool,
    created_at: String,
    updated_at: String,
  )
}

pub type AdminError {
  Unauthorized(String)
  Forbidden(String)
  DatabaseError(String)
}

pub type AdminRepository {
  AdminRepository(
    find_admin_by_clerk_id: fn(String) -> Result(AdminUser, AdminError),
    find_admin_by_email: fn(String) -> Result(AdminUser, AdminError),
  )
}

