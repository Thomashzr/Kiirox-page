import domain/admin.{
  type AdminError, type AdminProductFilters, type AdminRepository,
  type AdminUser, Admin, AdminRepository, AdminUser, DatabaseError, NotFound,
  Unauthorized, string_to_role,
}
import domain/catalog.{type Paginated, Paginated, Pagination}
import domain/product.{
  type Product, type ProductImage, type ProductImageInput, type ProductInput,
  Product, status_to_string,
}
import gleam/dynamic/decode
import gleam/int
import gleam/list
import gleam/option.{None, Some}
import gleam/result
import gleam/string
import infrastructure/catalog_postgres.{
  get_product_images, product_image_decoder, product_row_decoder,
}
import pog

pub fn new(conn: pog.Connection) -> AdminRepository {
  AdminRepository(
    find_admin_by_clerk_id: fn(clerk_id) {
      find_admin_by_clerk_id_from_db(conn, clerk_id)
    },
    find_admin_by_email: fn(email) {
      find_admin_by_email_from_db(conn, email)
    },
    list_admin_products: fn(filters) {
      list_admin_products_from_db(conn, filters)
    },
    get_admin_product: fn(id) {
      get_admin_product_from_db(conn, id)
    },
    create_product: fn(input) {
      create_product_in_db(conn, input)
    },
    update_product: fn(id, input) {
      update_product_in_db(conn, id, input)
    },
    archive_product: fn(id) {
      archive_product_in_db(conn, id)
    },
    delete_product: fn(id) {
      delete_product_in_db(conn, id)
    },
    add_product_image: fn(product_id, input) {
      add_product_image_in_db(conn, product_id, input)
    },
    delete_product_image: fn(product_id, image_id) {
      delete_product_image_in_db(conn, product_id, image_id)
    },
    set_primary_image: fn(product_id, image_id) {
      set_primary_image_in_db(conn, product_id, image_id)
    },
  )
}

fn admin_user_decoder() -> decode.Decoder(AdminUser) {
  use id <- decode.field(0, decode.string)
  use clerk_user_id <- decode.field(1, decode.optional(decode.string))
  use email <- decode.field(2, decode.string)
  use role_str <- decode.field(3, decode.string)
  use is_active <- decode.field(4, decode.bool)
  use created_at <- decode.field(5, decode.string)
  use updated_at <- decode.field(6, decode.string)

  let role = case string_to_role(role_str) {
    Ok(r) -> r
    Error(_) -> Admin
  }
  let c_id = option.unwrap(clerk_user_id, "")

  decode.success(AdminUser(
    id:,
    clerk_user_id: c_id,
    email:,
    role:,
    is_active:,
    created_at:,
    updated_at:,
  ))
}

fn find_admin_by_clerk_id_from_db(
  conn: pog.Connection,
  clerk_id: String,
) -> Result(AdminUser, AdminError) {
  let sql = "
    SELECT id::text, clerk_user_id, email, role, is_active, created_at::text, updated_at::text
    FROM admin_users
    WHERE clerk_user_id = $1 AND is_active = true
    LIMIT 1;
  "

  pog.query(sql)
  |> pog.parameter(pog.text(clerk_id))
  |> pog.returning(admin_user_decoder())
  |> pog.execute(conn)
  |> result.map_error(fn(err) { DatabaseError(pog_error_to_string(err)) })
  |> result.try(fn(res) {
    case res.rows {
      [user, ..] -> Ok(user)
      [] -> Error(Unauthorized("Administrador no encontrado"))
    }
  })
}

fn find_admin_by_email_from_db(
  conn: pog.Connection,
  email: String,
) -> Result(AdminUser, AdminError) {
  let sql = "
    SELECT id::text, clerk_user_id, email, role, is_active, created_at::text, updated_at::text
    FROM admin_users
    WHERE email = $1 AND is_active = true
    LIMIT 1;
  "

  pog.query(sql)
  |> pog.parameter(pog.text(email))
  |> pog.returning(admin_user_decoder())
  |> pog.execute(conn)
  |> result.map_error(fn(err) { DatabaseError(pog_error_to_string(err)) })
  |> result.try(fn(res) {
    case res.rows {
      [user, ..] -> Ok(user)
      [] -> Error(Unauthorized("Administrador no encontrado"))
    }
  })
}

fn list_admin_products_from_db(
  conn: pog.Connection,
  filters: AdminProductFilters,
) -> Result(Paginated(Product), AdminError) {
  let page = int.max(1, filters.page)
  let page_size = int.clamp(filters.page_size, 1, 100)
  let offset = { page - 1 } * page_size

  let base_sql =
    "SELECT id::text, sku, name, slug, brand, short_description, description, price::float8, currency, "
    <> "stock, low_stock_threshold, status, is_featured, is_new, sort_order, category_id::text, created_at::text, updated_at::text "
    <> "FROM products WHERE 1=1"

  let #(where_clauses, params) = build_admin_query_params(filters)

  let order_by = case filters.sort {
    Some("price_asc") -> " ORDER BY price ASC"
    Some("price_desc") -> " ORDER BY price DESC"
    Some("name") -> " ORDER BY name ASC"
    Some("stock_asc") -> " ORDER BY stock ASC"
    Some("newest") -> " ORDER BY created_at DESC"
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
      DatabaseError("Error al listar productos (admin): " <> pog_error_to_string(err))
    }),
  )

  let products_with_images =
    list.map(res.rows, fn(prod) {
      let images = get_product_images(conn, prod.id)
      Product(..prod, images: images)
    })

  let count_sql =
    "SELECT count(*)::int FROM products WHERE 1=1" <> where_clauses <> ";"
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

fn get_admin_product_from_db(
  conn: pog.Connection,
  id: String,
) -> Result(Product, AdminError) {
  let sql =
    "SELECT id::text, sku, name, slug, brand, short_description, description, price::float8, currency, "
    <> "stock, low_stock_threshold, status, is_featured, is_new, sort_order, category_id::text, created_at::text, updated_at::text "
    <> "FROM products WHERE id = $1::uuid LIMIT 1;"

  use res <- result.try(
    pog.query(sql)
    |> pog.parameter(pog.text(id))
    |> pog.returning(product_row_decoder())
    |> pog.execute(conn)
    |> result.map_error(fn(err) {
      DatabaseError("Error al consultar producto: " <> pog_error_to_string(err))
    }),
  )

  case res.rows {
    [] -> Error(NotFound("Producto no encontrado"))
    [prod, ..] -> {
      let images = get_product_images(conn, prod.id)
      Ok(Product(..prod, images: images))
    }
  }
}

fn create_product_in_db(
  conn: pog.Connection,
  input: ProductInput,
) -> Result(Product, AdminError) {
  let sql = "
    INSERT INTO products (
      sku, name, slug, brand, short_description, description,
      price, currency, stock, low_stock_threshold,
      status, is_featured, is_new, sort_order, category_id
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10,
      $11, $12, $13, $14, $15::uuid
    )
    RETURNING id::text, sku, name, slug, brand, short_description, description, price::float8, currency, stock, low_stock_threshold, status, is_featured, is_new, sort_order, category_id::text, created_at::text, updated_at::text;
  "

  let res =
    pog.query(sql)
    |> pog.parameter(pog.text(input.sku))
    |> pog.parameter(pog.text(input.name))
    |> pog.parameter(pog.text(input.slug))
    |> pog.parameter(pog.nullable(pog.text, input.brand))
    |> pog.parameter(pog.nullable(pog.text, input.short_description))
    |> pog.parameter(pog.nullable(pog.text, input.description))
    |> pog.parameter(pog.float(input.price))
    |> pog.parameter(pog.text(input.currency))
    |> pog.parameter(pog.int(input.stock))
    |> pog.parameter(pog.int(input.low_stock_threshold))
    |> pog.parameter(pog.text(status_to_string(input.status)))
    |> pog.parameter(pog.bool(input.is_featured))
    |> pog.parameter(pog.bool(input.is_new))
    |> pog.parameter(pog.int(input.sort_order))
    |> pog.parameter(pog.text(input.category_id))
    |> pog.returning(product_row_decoder())
    |> pog.execute(conn)

  case res {
    Ok(pog.Returned(rows: [prod, ..], ..)) -> Ok(Product(..prod, images: []))
    Ok(_) -> Error(DatabaseError("No se pudo crear el producto"))
    Error(err) -> Error(DatabaseError("Error al insertar producto: " <> pog_error_to_string(err)))
  }
}

fn update_product_in_db(
  conn: pog.Connection,
  id: String,
  input: ProductInput,
) -> Result(Product, AdminError) {
  let sql = "
    UPDATE products SET
      sku = $1,
      name = $2,
      slug = $3,
      brand = $4,
      short_description = $5,
      description = $6,
      price = $7,
      currency = $8,
      stock = $9,
      low_stock_threshold = $10,
      status = $11,
      is_featured = $12,
      is_new = $13,
      sort_order = $14,
      category_id = $15::uuid,
      updated_at = NOW()
    WHERE id = $16::uuid
    RETURNING id::text, sku, name, slug, brand, short_description, description, price::float8, currency, stock, low_stock_threshold, status, is_featured, is_new, sort_order, category_id::text, created_at::text, updated_at::text;
  "

  let res =
    pog.query(sql)
    |> pog.parameter(pog.text(input.sku))
    |> pog.parameter(pog.text(input.name))
    |> pog.parameter(pog.text(input.slug))
    |> pog.parameter(pog.nullable(pog.text, input.brand))
    |> pog.parameter(pog.nullable(pog.text, input.short_description))
    |> pog.parameter(pog.nullable(pog.text, input.description))
    |> pog.parameter(pog.float(input.price))
    |> pog.parameter(pog.text(input.currency))
    |> pog.parameter(pog.int(input.stock))
    |> pog.parameter(pog.int(input.low_stock_threshold))
    |> pog.parameter(pog.text(status_to_string(input.status)))
    |> pog.parameter(pog.bool(input.is_featured))
    |> pog.parameter(pog.bool(input.is_new))
    |> pog.parameter(pog.int(input.sort_order))
    |> pog.parameter(pog.text(input.category_id))
    |> pog.parameter(pog.text(id))
    |> pog.returning(product_row_decoder())
    |> pog.execute(conn)

  case res {
    Ok(pog.Returned(rows: [prod, ..], ..)) -> {
      let images = get_product_images(conn, prod.id)
      Ok(Product(..prod, images: images))
    }
    Ok(_) -> Error(NotFound("Producto no encontrado"))
    Error(err) -> Error(DatabaseError("Error al actualizar producto: " <> pog_error_to_string(err)))
  }
}

fn archive_product_in_db(
  conn: pog.Connection,
  id: String,
) -> Result(Product, AdminError) {
  let sql = "
    UPDATE products SET
      status = 'archived',
      updated_at = NOW()
    WHERE id = $1::uuid
    RETURNING id::text, sku, name, slug, brand, short_description, description, price::float8, currency, stock, low_stock_threshold, status, is_featured, is_new, sort_order, category_id::text, created_at::text, updated_at::text;
  "

  let res =
    pog.query(sql)
    |> pog.parameter(pog.text(id))
    |> pog.returning(product_row_decoder())
    |> pog.execute(conn)

  case res {
    Ok(pog.Returned(rows: [prod, ..], ..)) -> {
      let images = get_product_images(conn, prod.id)
      Ok(Product(..prod, images: images))
    }
    Ok(_) -> Error(NotFound("Producto no encontrado"))
    Error(err) -> Error(DatabaseError("Error al archivar producto: " <> pog_error_to_string(err)))
  }
}

fn delete_product_in_db(
  conn: pog.Connection,
  id: String,
) -> Result(Nil, AdminError) {
  let sql = "DELETE FROM products WHERE id = $1::uuid;"

  case
    pog.query(sql)
    |> pog.parameter(pog.text(id))
    |> pog.execute(conn)
  {
    Ok(_) -> Ok(Nil)
    Error(err) -> Error(DatabaseError("Error al eliminar producto: " <> pog_error_to_string(err)))
  }
}

fn add_product_image_in_db(
  conn: pog.Connection,
  product_id: String,
  input: ProductImageInput,
) -> Result(ProductImage, AdminError) {
  // If set to primary, clear existing primary
  case input.is_primary {
    True -> {
      let _ =
        pog.query("UPDATE product_images SET is_primary = false WHERE product_id = $1::uuid;")
        |> pog.parameter(pog.text(product_id))
        |> pog.execute(conn)
      Nil
    }
    False -> Nil
  }

  let sql = "
    INSERT INTO product_images (product_id, public_id, public_url, alt_text, sort_order, is_primary)
    VALUES ($1::uuid, $2, $3, $4, $5, $6)
    RETURNING id::text, product_id::text, public_id, public_url, alt_text, sort_order, is_primary, created_at::text;
  "

  let res =
    pog.query(sql)
    |> pog.parameter(pog.text(product_id))
    |> pog.parameter(pog.text(input.public_id))
    |> pog.parameter(pog.text(input.public_url))
    |> pog.parameter(pog.nullable(pog.text, input.alt_text))
    |> pog.parameter(pog.int(input.sort_order))
    |> pog.parameter(pog.bool(input.is_primary))
    |> pog.returning(product_image_decoder())
    |> pog.execute(conn)

  case res {
    Ok(pog.Returned(rows: [img, ..], ..)) -> Ok(img)
    Ok(_) -> Error(DatabaseError("No se pudo agregar la imagen"))
    Error(err) -> Error(DatabaseError("Error al insertar imagen: " <> pog_error_to_string(err)))
  }
}

fn delete_product_image_in_db(
  conn: pog.Connection,
  product_id: String,
  image_id: String,
) -> Result(Nil, AdminError) {
  let sql = "DELETE FROM product_images WHERE id = $1::uuid AND product_id = $2::uuid;"

  use _ <- result.try(
    pog.query(sql)
    |> pog.parameter(pog.text(image_id))
    |> pog.parameter(pog.text(product_id))
    |> pog.execute(conn)
    |> result.map_error(fn(err) {
      DatabaseError("Error al eliminar imagen: " <> pog_error_to_string(err))
    }),
  )

  // Auto-promote first remaining image if none is primary
  let promote_sql = "
    UPDATE product_images
    SET is_primary = true
    WHERE id = (
      SELECT id FROM product_images
      WHERE product_id = $1::uuid
      ORDER BY sort_order ASC
      LIMIT 1
    )
    AND NOT EXISTS (
      SELECT 1 FROM product_images
      WHERE product_id = $1::uuid AND is_primary = true
    );
  "
  let _ =
    pog.query(promote_sql)
    |> pog.parameter(pog.text(product_id))
    |> pog.execute(conn)

  Ok(Nil)
}

fn set_primary_image_in_db(
  conn: pog.Connection,
  product_id: String,
  image_id: String,
) -> Result(Nil, AdminError) {
  let _ =
    pog.query("UPDATE product_images SET is_primary = false WHERE product_id = $1::uuid;")
    |> pog.parameter(pog.text(product_id))
    |> pog.execute(conn)

  case
    pog.query("UPDATE product_images SET is_primary = true WHERE id = $1::uuid AND product_id = $2::uuid;")
    |> pog.parameter(pog.text(image_id))
    |> pog.parameter(pog.text(product_id))
    |> pog.execute(conn)
  {
    Ok(_) -> Ok(Nil)
    Error(err) -> Error(DatabaseError("Error al establecer imagen principal: " <> pog_error_to_string(err)))
  }
}

fn build_admin_query_params(
  filters: AdminProductFilters,
) -> #(String, List(pog.Value)) {
  let clauses = []
  let params = []

  let #(clauses, params) = case filters.category_id {
    Some(cat_id) -> #(
      [" AND category_id = $" <> int.to_string(list.length(params) + 1) <> "::uuid", ..clauses],
      [pog.text(cat_id), ..params],
    )
    None -> #(clauses, params)
  }

  let #(clauses, params) = case filters.status {
    Some(st) -> #(
      [" AND status = $" <> int.to_string(list.length(params) + 1), ..clauses],
      [pog.text(status_to_string(st)), ..params],
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
              <> " OR sku ILIKE $"
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

fn pog_error_to_string(err: pog.QueryError) -> String {
  case err {
    pog.ConstraintViolated(msg, _, _) -> "Constraint violation: " <> msg
    pog.PostgresqlError(code, name, msg) ->
      "Postgres error " <> code <> " (" <> name <> "): " <> msg
    pog.UnexpectedArgumentCount(expected, got) ->
      "Unexpected arg count: expected "
      <> int_to_string(expected)
      <> ", got "
      <> int_to_string(got)
    pog.UnexpectedArgumentType(expected, got) ->
      "Unexpected arg type: expected " <> expected <> ", got " <> got
    pog.UnexpectedResultType(_) -> "Unexpected result type from database"
    pog.ConnectionUnavailable -> "Database connection unavailable"
    pog.QueryTimeout -> "Database query timed out"
  }
}

@external(erlang, "erlang", "integer_to_binary")
fn int_to_string(n: Int) -> String
