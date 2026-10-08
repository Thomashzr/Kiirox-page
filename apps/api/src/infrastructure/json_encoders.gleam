import domain/admin.{type AdminUser, role_to_string}
import domain/catalog.{
  type CatalogError, type Paginated, type StoreConfig, CategoryNotFound,
  DatabaseError, InvalidFilter, ProductNotFound,
}
import domain/category.{type Category}
import domain/inventory.{type InventoryMovement, movement_type_to_string}
import domain/product.{type Product, type ProductImage, status_to_string}
import gleam/json.{type Json}
import gleam/option.{type Option, None, Some}

pub fn admin_user_to_json(admin: AdminUser) -> Json {
  json.object([
    #("id", json.string(admin.id)),
    #("clerk_user_id", json.string(admin.clerk_user_id)),
    #("email", json.string(admin.email)),
    #("role", json.string(role_to_string(admin.role))),
    #("is_active", json.bool(admin.is_active)),
    #("created_at", json.string(admin.created_at)),
    #("updated_at", json.string(admin.updated_at)),
  ])
}

pub fn category_to_json(cat: Category) -> Json {
  json.object([
    #("id", json.string(cat.id)),
    #("name", json.string(cat.name)),
    #("slug", json.string(cat.slug)),
    #("description", option_to_json(cat.description, json.string)),
    #("image_url", option_to_json(cat.image_url, json.string)),
    #("is_active", json.bool(cat.is_active)),
    #("sort_order", json.int(cat.sort_order)),
  ])
}

pub fn product_image_to_json(img: ProductImage) -> Json {
  json.object([
    #("id", json.string(img.id)),
    #("product_id", json.string(img.product_id)),
    #("public_id", json.string(img.public_id)),
    #("public_url", json.string(img.public_url)),
    #("alt_text", option_to_json(img.alt_text, json.string)),
    #("sort_order", json.int(img.sort_order)),
    #("is_primary", json.bool(img.is_primary)),
  ])
}

pub fn product_to_json(prod: Product) -> Json {
  json.object([
    #("id", json.string(prod.id)),
    #("sku", json.string(prod.sku)),
    #("name", json.string(prod.name)),
    #("slug", json.string(prod.slug)),
    #("brand", option_to_json(prod.brand, json.string)),
    #("short_description", option_to_json(prod.short_description, json.string)),
    #("description", option_to_json(prod.description, json.string)),
    #("price", json.float(prod.price)),
    #("currency", json.string(prod.currency)),
    #("stock", json.int(prod.stock)),
    #("low_stock_threshold", json.int(prod.low_stock_threshold)),
    #("status", json.string(status_to_string(prod.status))),
    #("is_featured", json.bool(prod.is_featured)),
    #("is_new", json.bool(prod.is_new)),
    #("sort_order", json.int(prod.sort_order)),
    #("category_id", json.string(prod.category_id)),
    #("images", json.array(prod.images, product_image_to_json)),
  ])
}

pub fn paginated_products_to_json(paginated: Paginated(Product)) -> Json {
  json.object([
    #("data", json.array(paginated.data, product_to_json)),
    #(
      "pagination",
      json.object([
        #("page", json.int(paginated.pagination.page)),
        #("page_size", json.int(paginated.pagination.page_size)),
        #("total", json.int(paginated.pagination.total)),
      ]),
    ),
  ])
}

pub fn store_config_to_json(cfg: StoreConfig) -> Json {
  json.object([
    #("store_name", json.string(cfg.store_name)),
    #("whatsapp_number", json.string(cfg.whatsapp_number)),
    #("currency", json.string(cfg.currency)),
  ])
}

pub fn catalog_error_to_json(err: CatalogError) -> Json {
  let #(code, message) = case err {
    ProductNotFound(slug) -> #(
      "PRODUCT_NOT_FOUND",
      "Producto con slug '" <> slug <> "' no fue encontrado",
    )
    CategoryNotFound(slug) -> #(
      "CATEGORY_NOT_FOUND",
      "Categoría con slug '" <> slug <> "' no fue encontrada",
    )
    InvalidFilter(msg) -> #("INVALID_QUERY", msg)
    DatabaseError(msg) -> #("DATABASE_ERROR", msg)
  }

  json.object([
    #(
      "error",
      json.object([
        #("code", json.string(code)),
        #("message", json.string(message)),
        #("details", json.object([])),
      ]),
    ),
  ])
}

pub fn inventory_movement_to_json(mov: InventoryMovement) -> Json {
  json.object([
    #("id", json.string(mov.id)),
    #("product_id", json.string(mov.product_id)),
    #("delta", json.int(mov.delta)),
    #("movement_type", json.string(movement_type_to_string(mov.movement_type))),
    #("reason", option_to_json(mov.reason, json.string)),
    #("reference_type", option_to_json(mov.reference_type, json.string)),
    #("reference_id", option_to_json(mov.reference_id, json.string)),
    #("admin_user_id", option_to_json(mov.admin_user_id, json.string)),
    #("created_at", json.string(mov.created_at)),
  ])
}

pub fn paginated_inventory_movements_to_json(
  paginated: Paginated(InventoryMovement),
) -> Json {
  json.object([
    #("data", json.array(paginated.data, inventory_movement_to_json)),
    #(
      "pagination",
      json.object([
        #("page", json.int(paginated.pagination.page)),
        #("page_size", json.int(paginated.pagination.page_size)),
        #("total", json.int(paginated.pagination.total)),
      ]),
    ),
  ])
}

fn option_to_json(opt: Option(a), encoder: fn(a) -> Json) -> Json {
  case opt {
    Some(val) -> encoder(val)
    None -> json.null()
  }
}
