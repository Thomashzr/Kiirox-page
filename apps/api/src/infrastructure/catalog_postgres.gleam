import domain/catalog.{
  type CatalogError, type CatalogRepository, type Paginated,
  type ProductFilters, type StoreConfig, CatalogRepository, CategoryNotFound,
  DatabaseError, Paginated, Pagination, ProductFilters, ProductNotFound,
}
import domain/category.{type Category, Category}
import domain/product.{
  type Product, type ProductImage, Product, ProductImage, Published,
  string_to_status,
}
import gleam/dynamic/decode
import gleam/int
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/result
import gleam/string
import pog

pub fn new(conn: pog.Connection, config: StoreConfig) -> CatalogRepository {
  CatalogRepository(
    list_products: fn(filters) { list_products_from_db(conn, filters) },
    get_product_by_slug: fn(slug) { get_product_by_slug_from_db(conn, slug) },
    list_categories: fn() { list_categories_from_db(conn) },
    get_category_by_slug: fn(slug) { get_category_by_slug_from_db(conn, slug) },
    get_category_products: fn(cat_slug, filters) {
      get_category_products_from_db(conn, cat_slug, filters)
    },
    get_public_config: fn() { config },
  )
}

fn category_decoder() -> decode.Decoder(Category) {
  use id <- decode.field(0, decode.string)
  use name <- decode.field(1, decode.string)
  use slug <- decode.field(2, decode.string)
  use description <- decode.field(3, decode.optional(decode.string))
  use image_url <- decode.field(4, decode.optional(decode.string))
  use is_active <- decode.field(5, decode.bool)
  use sort_order <- decode.field(6, decode.int)
  use created_at <- decode.field(7, decode.string)
  use updated_at <- decode.field(8, decode.string)
  decode.success(Category(
    id:,
    name:,
    slug:,
    description:,
    image_url:,
    is_active:,
    sort_order:,
    created_at:,
    updated_at:,
  ))
}

fn product_image_decoder() -> decode.Decoder(ProductImage) {
  use id <- decode.field(0, decode.string)
  use product_id <- decode.field(1, decode.string)
  use public_id <- decode.field(2, decode.string)
  use public_url <- decode.field(3, decode.string)
  use alt_text <- decode.field(4, decode.optional(decode.string))
  use sort_order <- decode.field(5, decode.int)
  use is_primary <- decode.field(6, decode.bool)
  use created_at <- decode.field(7, decode.string)
  decode.success(ProductImage(
    id:,
    product_id:,
    public_id:,
    public_url:,
    alt_text:,
    sort_order:,
    is_primary:,
    created_at:,
  ))
}

fn product_row_decoder() -> decode.Decoder(Product) {
  use id <- decode.field(0, decode.string)
  use sku <- decode.field(1, decode.string)
  use name <- decode.field(2, decode.string)
  use slug <- decode.field(3, decode.string)
  use brand <- decode.field(4, decode.optional(decode.string))
  use short_description <- decode.field(5, decode.optional(decode.string))
  use description <- decode.field(6, decode.optional(decode.string))
  use price <- decode.field(7, decode.float)
  use currency <- decode.field(8, decode.string)
  use stock <- decode.field(9, decode.int)
  use low_stock_threshold <- decode.field(10, decode.int)
  use status_str <- decode.field(11, decode.string)
  use is_featured <- decode.field(12, decode.bool)
  use is_new <- decode.field(13, decode.bool)
  use sort_order <- decode.field(14, decode.int)
  use category_id <- decode.field(15, decode.string)
  use created_at <- decode.field(16, decode.string)
  use updated_at <- decode.field(17, decode.string)

  let status = case string_to_status(status_str) {
    Ok(s) -> s
    Error(Nil) -> Published
  }

  decode.success(Product(
    id:,
    sku:,
    name:,
    slug:,
    brand:,
    short_description:,
    description:,
    price:,
    currency:,
    stock:,
    low_stock_threshold:,
    status:,
    is_featured:,
    is_new:,
    sort_order:,
    category_id:,
    images: [],
    created_at:,
    updated_at:,
  ))
}

fn list_categories_from_db(
  conn: pog.Connection,
) -> Result(List(Category), CatalogError) {
  let sql =
    "SELECT id::text, name, slug, description, image_url, is_active, sort_order, created_at::text, updated_at::text "
    <> "FROM categories WHERE is_active = true ORDER BY sort_order ASC;"

  pog.query(sql)
  |> pog.returning(category_decoder())
  |> pog.execute(conn)
  |> result.map(fn(res) { res.rows })
  |> result.map_error(fn(err) {
    DatabaseError("Error al listar categorías: " <> string.inspect(err))
  })
}

fn get_category_by_slug_from_db(
  conn: pog.Connection,
  slug: String,
) -> Result(Category, CatalogError) {
  let sql =
    "SELECT id::text, name, slug, description, image_url, is_active, sort_order, created_at::text, updated_at::text "
    <> "FROM categories WHERE slug = $1 AND is_active = true LIMIT 1;"

  case
    pog.query(sql)
    |> pog.parameter(pog.text(slug))
    |> pog.returning(category_decoder())
    |> pog.execute(conn)
  {
    Ok(res) ->
      case res.rows {
        [cat, ..] -> Ok(cat)
        [] -> Error(CategoryNotFound(slug))
      }
    Error(err) ->
      Error(DatabaseError("Error al obtener categoría: " <> string.inspect(err)))
  }
}

fn get_product_by_slug_from_db(
  conn: pog.Connection,
  slug: String,
) -> Result(Product, CatalogError) {
  let sql =
    "SELECT id::text, sku, name, slug, brand, short_description, description, price::float8, currency, "
    <> "stock, low_stock_threshold, status, is_featured, is_new, sort_order, category_id::text, created_at::text, updated_at::text "
    <> "FROM products WHERE slug = $1 AND status = 'published' LIMIT 1;"

  use res <- result.try(
    pog.query(sql)
    |> pog.parameter(pog.text(slug))
    |> pog.returning(product_row_decoder())
    |> pog.execute(conn)
    |> result.map_error(fn(err) {
      DatabaseError("Error al consultar producto: " <> string.inspect(err))
    }),
  )

  case res.rows {
    [] -> Error(ProductNotFound(slug))
    [prod, ..] -> {
      // Query images for this product
      let images = get_product_images(conn, prod.id)
      Ok(Product(..prod, images: images))
    }
  }
}

fn get_product_images(
  conn: pog.Connection,
  product_id: String,
) -> List(ProductImage) {
  let sql =
    "SELECT id::text, product_id::text, public_id, public_url, alt_text, sort_order, is_primary, created_at::text "
    <> "FROM product_images WHERE product_id = $1::uuid ORDER BY sort_order ASC;"

  case
    pog.query(sql)
    |> pog.parameter(pog.text(product_id))
    |> pog.returning(product_image_decoder())
    |> pog.execute(conn)
  {
    Ok(res) -> res.rows
    Error(_) -> []
  }
}

fn list_products_from_db(
  conn: pog.Connection,
  filters: ProductFilters,
) -> Result(Paginated(Product), CatalogError) {
  let page = int.max(1, filters.page)
  let page_size = int.clamp(filters.page_size, 1, 100)
  let offset = { page - 1 } * page_size

  // If filtered by category_slug, lookup category id first
  let cat_filter_res = case filters.category_slug {
    None -> Ok(None)
    Some(cslug) ->
      case get_category_by_slug_from_db(conn, cslug) {
        Ok(cat) -> Ok(Some(cat.id))
        Error(err) -> Error(err)
      }
  }

  use cat_id_opt <- result.try(cat_filter_res)

  let base_sql =
    "SELECT id::text, sku, name, slug, brand, short_description, description, price::float8, currency, "
    <> "stock, low_stock_threshold, status, is_featured, is_new, sort_order, category_id::text, created_at::text, updated_at::text "
    <> "FROM products WHERE status = 'published'"

  let #(where_clauses, params) = build_product_query_params(cat_id_opt, filters)

  let order_by = case filters.sort {
    Some("price_asc") -> " ORDER BY price ASC"
    Some("price_desc") -> " ORDER BY price DESC"
    Some("name") -> " ORDER BY name ASC"
    _ -> " ORDER BY sort_order ASC, created_at DESC"
  }

  let full_sql =
    base_sql
    <> where_clauses
    <> order_by
    <> " LIMIT "
    <> int.to_string(page_size)
    <> " OFFSET "
    <> int.to_string(offset)
    <> ";"

  let q = pog.query(full_sql) |> pog.returning(product_row_decoder())
  let q_with_params = list.fold(params, q, fn(query, p) { pog.parameter(query, p) })

  use res <- result.try(
    pog.execute(q_with_params, conn)
    |> result.map_error(fn(err) {
      DatabaseError("Error al listar productos: " <> string.inspect(err))
    }),
  )

  // Attach images
  let products_with_images =
    list.map(res.rows, fn(prod) {
      let images = get_product_images(conn, prod.id)
      Product(..prod, images: images)
    })

  // Total count
  let count_sql =
    "SELECT count(*)::int FROM products WHERE status = 'published'" <> where_clauses <> ";"
  let count_q =
    pog.query(count_sql)
    |> pog.returning(decode.at([0], decode.int))
  let count_q_with_params =
    list.fold(params, count_q, fn(query, p) { pog.parameter(query, p) })

  let total = case pog.execute(count_q_with_params, conn) {
    Ok(c_res) -> case c_res.rows {
      [t, ..] -> t
      [] -> 0
    }
    Error(_) -> list.length(products_with_images)
  }

  Ok(Paginated(
    data: products_with_images,
    pagination: Pagination(page:, page_size:, total:),
  ))
}

fn get_category_products_from_db(
  conn: pog.Connection,
  cat_slug: String,
  filters: ProductFilters,
) -> Result(Paginated(Product), CatalogError) {
  let filters_with_category =
    ProductFilters(..filters, category_slug: Some(cat_slug))
  list_products_from_db(conn, filters_with_category)
}

fn build_product_query_params(
  cat_id_opt: Option(String),
  filters: ProductFilters,
) -> #(String, List(pog.Value)) {
  let clauses = []
  let params = []

  let #(clauses, params) = case cat_id_opt {
    Some(cat_id) -> #(
      [" AND category_id = $" <> int.to_string(list.length(params) + 1), ..clauses],
      [pog.text(cat_id), ..params],
    )
    None -> #(clauses, params)
  }

  let #(clauses, params) = case filters.featured {
    Some(feat) -> #(
      [" AND is_featured = $" <> int.to_string(list.length(params) + 1), ..clauses],
      [pog.bool(feat), ..params],
    )
    None -> #(clauses, params)
  }

  let #(clauses, params) = case filters.is_new {
    Some(new_val) -> #(
      [" AND is_new = $" <> int.to_string(list.length(params) + 1), ..clauses],
      [pog.bool(new_val), ..params],
    )
    None -> #(clauses, params)
  }

  let #(clauses, params) = case filters.search {
    Some(term) -> {
      let trimmed = string.trim(term)
      case trimmed {
        "" -> #(clauses, params)
        _ -> #(
          [
            " AND (name ILIKE $"
              <> int.to_string(list.length(params) + 1)
              <> " OR brand ILIKE $"
              <> int.to_string(list.length(params) + 1)
              <> ")",
            ..clauses
          ],
          [pog.text("%" <> trimmed <> "%"), ..params],
        )
      }
    }
    None -> #(clauses, params)
  }

  let joined_clauses = string.join(list.reverse(clauses), "")
  #(joined_clauses, list.reverse(params))
}
