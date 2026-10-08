import domain/admin.{Admin, AdminUser, role_to_string}
import domain/category.{Category}
import domain/inventory.{
  InitialStock, calculate_new_stock, movement_type_to_string,
}
import domain/product.{Draft, Published, is_available, is_low_stock}
import gleam/option.{None, Some}
import infrastructure/database

pub fn category_test() {
  let cat =
    Category(
      id: "cat-1",
      name: "Geles Energéticos",
      slug: "geles-energeticos",
      description: Some("Geles para running y ciclismo"),
      image_url: None,
      is_active: True,
      sort_order: 1,
      created_at: "2026-10-07T00:00:00Z",
      updated_at: "2026-10-07T00:00:00Z",
    )

  assert cat.name == "Geles Energéticos"
  assert cat.slug == "geles-energeticos"
}

pub fn product_availability_test() {
  let prod =
    product.Product(
      id: "prod-1",
      sku: "GEL-001",
      name: "Gel Maurten 100",
      slug: "gel-maurten-100",
      brand: Some("Maurten"),
      short_description: Some("Gel energético hidrocoloide"),
      description: None,
      price: 4500.0,
      currency: "ARS",
      stock: 10,
      low_stock_threshold: 3,
      status: Published,
      is_featured: True,
      is_new: True,
      sort_order: 0,
      category_id: "cat-1",
      images: [],
      created_at: "2026-10-07T00:00:00Z",
      updated_at: "2026-10-07T00:00:00Z",
    )

  assert is_available(prod) == True
  assert is_low_stock(prod) == False

  let out_of_stock = product.Product(..prod, stock: 0)
  assert is_available(out_of_stock) == False
  assert is_low_stock(out_of_stock) == True

  let draft_prod = product.Product(..prod, status: Draft)
  assert is_available(draft_prod) == False
}

pub fn stock_calculation_test() {
  assert calculate_new_stock(10, 5) == Ok(15)
  assert calculate_new_stock(10, -5) == Ok(5)
  assert calculate_new_stock(10, -10) == Ok(0)
  assert calculate_new_stock(10, -11) == Error(Nil)
}

pub fn admin_user_test() {
  let admin =
    AdminUser(
      id: "adm-1",
      clerk_user_id: "user_test123",
      email: "admin@kiirox.com",
      role: Admin,
      is_active: True,
      created_at: "2026-10-07T00:00:00Z",
      updated_at: "2026-10-07T00:00:00Z",
    )

  assert admin.email == "admin@kiirox.com"
  assert role_to_string(admin.role) == "admin"
}

pub fn movement_type_test() {
  assert movement_type_to_string(InitialStock) == "initial_stock"
}

pub fn database_config_test() {
  let url =
    "postgresql://user:pass@ep-cool-sun.aws.neon.tech:5432/neondb?sslmode=require"
  let res = database.config_from_url(url)
  assert res != Error("Failed to parse database connection URL")
}
