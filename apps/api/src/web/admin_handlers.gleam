import domain/admin.{
  type AdminError, type AdminProductFilters, type AdminRepository,
  type AdminUser, AdminProductFilters, DatabaseError, Forbidden, NotFound,
  Unauthorized, ValidationError,
}
import domain/product.{
  type ProductImageInput, type ProductInput, Draft, ProductImageInput,
  ProductInput, string_to_status,
}
import gleam/dynamic/decode
import gleam/int
import gleam/json
import gleam/list
import gleam/option.{None}
import gleam/result
import gleam/string
import infrastructure/json_encoders
import wisp.{type Request, type Response}

@external(erlang, "db_ffi", "decode_jwt_payload")
fn decode_jwt_payload(token: String) -> Result(String, Nil)

pub type TokenClaims {
  TokenClaims(sub: String, email: String)
}

fn claims_decoder() -> decode.Decoder(TokenClaims) {
  use sub <- decode.field("sub", decode.string)
  use email <- decode.optional_field("email", "", decode.string)
  decode.success(TokenClaims(sub:, email:))
}

pub fn authenticate_admin(
  req: Request,
  admin_repo: AdminRepository,
  next: fn(AdminUser) -> Response,
) -> Response {
  case extract_bearer_token(req) {
    Error(_) -> error_response("UNAUTHORIZED", "Falta token de autorización Bearer", 401)
    Ok(token) -> {
      case decode_and_verify_token(token) {
        Error(_) -> error_response("UNAUTHORIZED", "Token de autorización inválido o malformado", 401)
        Ok(claims) -> {
          let user_result = case admin_repo.find_admin_by_clerk_id(claims.sub) {
            Ok(user) -> Ok(user)
            Error(_) -> {
              case claims.email {
                "" -> Error(Unauthorized("Administrador no autorizado"))
                email -> admin_repo.find_admin_by_email(email)
              }
            }
          }

          case user_result {
            Ok(admin_user) -> next(admin_user)
            Error(Unauthorized(msg)) -> error_response("UNAUTHORIZED", msg, 401)
            Error(Forbidden(msg)) -> error_response("FORBIDDEN", msg, 403)
            Error(NotFound(msg)) -> error_response("NOT_FOUND", msg, 404)
            Error(ValidationError(msg)) -> error_response("VALIDATION_ERROR", msg, 400)
            Error(DatabaseError(msg)) -> error_response("DATABASE_ERROR", msg, 500)
          }
        }
      }
    }
  }
}

pub fn handle_admin_me(req: Request, admin_repo: AdminRepository) -> Response {
  use admin_user <- authenticate_admin(req, admin_repo)
  json.object([
    #("admin", json_encoders.admin_user_to_json(admin_user)),
  ])
  |> json.to_string
  |> wisp.json_response(200)
}

pub fn handle_admin_list_products(
  req: Request,
  admin_repo: AdminRepository,
) -> Response {
  use _ <- authenticate_admin(req, admin_repo)
  let filters = parse_admin_filters(req)
  case admin_repo.list_admin_products(filters) {
    Ok(paginated) ->
      paginated
      |> json_encoders.paginated_products_to_json
      |> json.to_string
      |> wisp.json_response(200)
    Error(err) -> handle_admin_error(err)
  }
}

pub fn handle_admin_get_product(
  req: Request,
  id: String,
  admin_repo: AdminRepository,
) -> Response {
  use _ <- authenticate_admin(req, admin_repo)
  case admin_repo.get_admin_product(id) {
    Ok(product) ->
      product
      |> json_encoders.product_to_json
      |> json.to_string
      |> wisp.json_response(200)
    Error(err) -> handle_admin_error(err)
  }
}

pub fn handle_admin_create_product(
  req: Request,
  admin_repo: AdminRepository,
) -> Response {
  use _ <- authenticate_admin(req, admin_repo)
  use body <- wisp.require_bit_array_body(req)

  case json.parse_bits(body, product_input_decoder()) {
    Error(_) -> error_response("INVALID_BODY", "Payload JSON inválido para creación de producto", 400)
    Ok(input) -> {
      case admin_repo.create_product(input) {
        Ok(product) ->
          product
          |> json_encoders.product_to_json
          |> json.to_string
          |> wisp.json_response(201)
        Error(err) -> handle_admin_error(err)
      }
    }
  }
}

pub fn handle_admin_update_product(
  req: Request,
  id: String,
  admin_repo: AdminRepository,
) -> Response {
  use _ <- authenticate_admin(req, admin_repo)
  use body <- wisp.require_bit_array_body(req)

  case json.parse_bits(body, product_input_decoder()) {
    Error(_) -> error_response("INVALID_BODY", "Payload JSON inválido para actualización de producto", 400)
    Ok(input) -> {
      case admin_repo.update_product(id, input) {
        Ok(product) ->
          product
          |> json_encoders.product_to_json
          |> json.to_string
          |> wisp.json_response(200)
        Error(err) -> handle_admin_error(err)
      }
    }
  }
}

pub fn handle_admin_delete_product(
  req: Request,
  id: String,
  admin_repo: AdminRepository,
) -> Response {
  use _ <- authenticate_admin(req, admin_repo)
  let query = wisp.get_query(req)
  let permanent =
    list.key_find(query, "permanent")
    |> result.map(fn(v) { v == "true" || v == "1" })
    |> result.unwrap(False)

  case permanent {
    True -> {
      case admin_repo.delete_product(id) {
        Ok(Nil) ->
          json.object([
            #("status", json.string("deleted")),
            #("id", json.string(id)),
          ])
          |> json.to_string
          |> wisp.json_response(200)
        Error(err) -> handle_admin_error(err)
      }
    }
    False -> {
      case admin_repo.archive_product(id) {
        Ok(product) ->
          json.object([
            #("status", json.string("archived")),
            #("product", json_encoders.product_to_json(product)),
          ])
          |> json.to_string
          |> wisp.json_response(200)
        Error(err) -> handle_admin_error(err)
      }
    }
  }
}

pub fn handle_admin_add_image(
  req: Request,
  product_id: String,
  admin_repo: AdminRepository,
) -> Response {
  use _ <- authenticate_admin(req, admin_repo)
  use body <- wisp.require_bit_array_body(req)

  case json.parse_bits(body, product_image_input_decoder()) {
    Error(_) -> error_response("INVALID_BODY", "Payload JSON inválido para imagen de producto", 400)
    Ok(input) -> {
      case admin_repo.add_product_image(product_id, input) {
        Ok(img) ->
          img
          |> json_encoders.product_image_to_json
          |> json.to_string
          |> wisp.json_response(201)
        Error(err) -> handle_admin_error(err)
      }
    }
  }
}

pub fn handle_admin_delete_image(
  req: Request,
  product_id: String,
  image_id: String,
  admin_repo: AdminRepository,
) -> Response {
  use _ <- authenticate_admin(req, admin_repo)
  case admin_repo.delete_product_image(product_id, image_id) {
    Ok(Nil) ->
      json.object([
        #("status", json.string("deleted")),
        #("image_id", json.string(image_id)),
      ])
      |> json.to_string
      |> wisp.json_response(200)
    Error(err) -> handle_admin_error(err)
  }
}

pub fn handle_admin_set_primary_image(
  req: Request,
  product_id: String,
  image_id: String,
  admin_repo: AdminRepository,
) -> Response {
  use _ <- authenticate_admin(req, admin_repo)
  case admin_repo.set_primary_image(product_id, image_id) {
    Ok(Nil) ->
      json.object([
        #("status", json.string("success")),
        #("primary_image_id", json.string(image_id)),
      ])
      |> json.to_string
      |> wisp.json_response(200)
    Error(err) -> handle_admin_error(err)
  }
}

fn parse_admin_filters(req: Request) -> AdminProductFilters {
  let query = wisp.get_query(req)

  let page =
    list.key_find(query, "page")
    |> result.try(int.parse)
    |> result.unwrap(1)

  let page_size =
    list.key_find(query, "page_size")
    |> result.try(int.parse)
    |> result.unwrap(24)

  let category_id =
    list.key_find(query, "category_id")
    |> option.from_result

  let status =
    list.key_find(query, "status")
    |> result.try(string_to_status)
    |> option.from_result

  let search =
    list.key_find(query, "search")
    |> option.from_result

  let sort =
    list.key_find(query, "sort")
    |> option.from_result

  AdminProductFilters(page:, page_size:, category_id:, status:, search:, sort:)
}

fn float_or_int_decoder() -> decode.Decoder(Float) {
  decode.one_of(decode.float, [
    decode.int |> decode.map(int.to_float),
  ])
}

fn product_input_decoder() -> decode.Decoder(ProductInput) {
  use sku <- decode.field("sku", decode.string)
  use name <- decode.field("name", decode.string)
  use slug <- decode.field("slug", decode.string)
  use brand <- decode.optional_field("brand", None, decode.optional(decode.string))
  use short_description <- decode.optional_field("short_description", None, decode.optional(decode.string))
  use description <- decode.optional_field("description", None, decode.optional(decode.string))
  use price <- decode.field("price", float_or_int_decoder())
  use currency <- decode.optional_field("currency", "ARS", decode.string)
  use stock <- decode.field("stock", decode.int)
  use low_stock_threshold <- decode.optional_field("low_stock_threshold", 5, decode.int)
  use status_str <- decode.optional_field("status", "draft", decode.string)
  use is_featured <- decode.optional_field("is_featured", False, decode.bool)
  use is_new <- decode.optional_field("is_new", False, decode.bool)
  use sort_order <- decode.optional_field("sort_order", 0, decode.int)
  use category_id <- decode.field("category_id", decode.string)

  let status = case string_to_status(status_str) {
    Ok(s) -> s
    Error(Nil) -> Draft
  }

  decode.success(ProductInput(
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
  ))
}

fn product_image_input_decoder() -> decode.Decoder(ProductImageInput) {
  use public_id <- decode.field("public_id", decode.string)
  use public_url <- decode.field("public_url", decode.string)
  use alt_text <- decode.optional_field("alt_text", None, decode.optional(decode.string))
  use sort_order <- decode.optional_field("sort_order", 0, decode.int)
  use is_primary <- decode.optional_field("is_primary", False, decode.bool)

  decode.success(ProductImageInput(
    public_id:,
    public_url:,
    alt_text:,
    sort_order:,
    is_primary:,
  ))
}

fn extract_bearer_token(req: Request) -> Result(String, Nil) {
  let auth_header =
    list.key_find(req.headers, "authorization")
    |> result.unwrap("")

  case string.starts_with(auth_header, "Bearer ") {
    True -> Ok(string.drop_start(auth_header, 7))
    False -> Error(Nil)
  }
}

fn decode_and_verify_token(token: String) -> Result(TokenClaims, Nil) {
  use payload_json <- result.try(decode_jwt_payload(token))
  json.parse(payload_json, claims_decoder())
  |> result.replace_error(Nil)
}

fn handle_admin_error(err: AdminError) -> Response {
  case err {
    Unauthorized(msg) -> error_response("UNAUTHORIZED", msg, 401)
    Forbidden(msg) -> error_response("FORBIDDEN", msg, 403)
    NotFound(msg) -> error_response("NOT_FOUND", msg, 404)
    ValidationError(msg) -> error_response("VALIDATION_ERROR", msg, 400)
    DatabaseError(msg) -> error_response("DATABASE_ERROR", msg, 500)
  }
}

fn error_response(code: String, message: String, status: Int) -> Response {
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
  |> json.to_string
  |> wisp.json_response(status)
}
