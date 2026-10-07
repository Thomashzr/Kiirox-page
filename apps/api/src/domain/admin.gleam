import domain/catalog.{type Paginated}
import domain/product.{
  type Product, type ProductImage, type ProductImageInput, type ProductInput,
  type ProductStatus,
}
import gleam/option.{type Option}

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
  NotFound(String)
  ValidationError(String)
  DatabaseError(String)
}

pub type AdminProductFilters {
  AdminProductFilters(
    page: Int,
    page_size: Int,
    category_id: Option(String),
    status: Option(ProductStatus),
    search: Option(String),
    sort: Option(String),
  )
}

pub type AdminRepository {
  AdminRepository(
    find_admin_by_clerk_id: fn(String) -> Result(AdminUser, AdminError),
    find_admin_by_email: fn(String) -> Result(AdminUser, AdminError),
    list_admin_products: fn(AdminProductFilters) ->
      Result(Paginated(Product), AdminError),
    get_admin_product: fn(String) -> Result(Product, AdminError),
    create_product: fn(ProductInput) -> Result(Product, AdminError),
    update_product: fn(String, ProductInput) -> Result(Product, AdminError),
    archive_product: fn(String) -> Result(Product, AdminError),
    delete_product: fn(String) -> Result(Nil, AdminError),
    add_product_image: fn(String, ProductImageInput) ->
      Result(ProductImage, AdminError),
    delete_product_image: fn(String, String) -> Result(Nil, AdminError),
    set_primary_image: fn(String, String) -> Result(Nil, AdminError),
  )
}


