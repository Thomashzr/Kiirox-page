import domain/catalog.{
  type CatalogError, type CatalogRepository, type ProductFilters,
  CategoryNotFound, DatabaseError, InvalidFilter, ProductFilters,
  ProductNotFound,
}
import gleam/http
import gleam/int
import gleam/json
import gleam/list
import gleam/option
import gleam/result
import infrastructure/json_encoders
import wisp.{type Request, type Response}

pub fn handle_request(req: Request, repo: CatalogRepository) -> Response {
  use <- wisp.rescue_crashes
  use req <- wisp.handle_head(req)

  case req.method {
    http.Options -> handle_cors_preflight()
    _ ->
      route(req, repo)
      |> add_cors_headers()
  }
}

fn route(req: Request, repo: CatalogRepository) -> Response {
  case wisp.path_segments(req) {
    ["health"] -> handle_health()
    ["api", "v1", "health"] -> handle_health()

    ["api", "v1", "products"] -> {
      use <- wisp.require_method(req, http.Get)
      let filters = parse_filters(req)
      case catalog.list_products(repo, filters) {
        Ok(paginated) ->
          paginated
          |> json_encoders.paginated_products_to_json
          |> json.to_string
          |> wisp.json_response(200)
        Error(err) -> handle_catalog_error(err)
      }
    }

    ["api", "v1", "products", slug] -> {
      use <- wisp.require_method(req, http.Get)
      case catalog.get_product_by_slug(repo, slug) {
        Ok(product) ->
          product
          |> json_encoders.product_to_json
          |> json.to_string
          |> wisp.json_response(200)
        Error(err) -> handle_catalog_error(err)
      }
    }

    ["api", "v1", "categories"] -> {
      use <- wisp.require_method(req, http.Get)
      case catalog.list_categories(repo) {
        Ok(categories) ->
          json.array(categories, json_encoders.category_to_json)
          |> json.to_string
          |> wisp.json_response(200)
        Error(err) -> handle_catalog_error(err)
      }
    }

    ["api", "v1", "categories", slug, "products"] -> {
      use <- wisp.require_method(req, http.Get)
      let filters = parse_filters(req)
      case catalog.get_category_products(repo, slug, filters) {
        Ok(paginated) ->
          paginated
          |> json_encoders.paginated_products_to_json
          |> json.to_string
          |> wisp.json_response(200)
        Error(err) -> handle_catalog_error(err)
      }
    }

    ["api", "v1", "config", "public"] -> {
      use <- wisp.require_method(req, http.Get)
      let config = catalog.get_public_config(repo)
      config
      |> json_encoders.store_config_to_json
      |> json.to_string
      |> wisp.json_response(200)
    }

    _ ->
      json.object([
        #(
          "error",
          json.object([
            #("code", json.string("NOT_FOUND")),
            #("message", json.string("Ruta no encontrada")),
            #("details", json.object([])),
          ]),
        ),
      ])
      |> json.to_string
      |> wisp.json_response(404)
  }
}

fn handle_health() -> Response {
  json.object([
    #("status", json.string("ok")),
    #("service", json.string("kiirox-api")),
    #("version", json.string("1.0.0")),
  ])
  |> json.to_string
  |> wisp.json_response(200)
}

fn handle_catalog_error(err: CatalogError) -> Response {
  let status = case err {
    ProductNotFound(_) -> 404
    CategoryNotFound(_) -> 404
    InvalidFilter(_) -> 400
    DatabaseError(_) -> 500
  }

  err
  |> json_encoders.catalog_error_to_json
  |> json.to_string
  |> wisp.json_response(status)
}

fn parse_filters(req: Request) -> ProductFilters {
  let query = wisp.get_query(req)

  let page =
    list.key_find(query, "page")
    |> result.try(int.parse)
    |> result.unwrap(1)

  let page_size =
    list.key_find(query, "page_size")
    |> result.try(int.parse)
    |> result.unwrap(24)

  let category_slug =
    list.key_find(query, "category")
    |> option.from_result

  let search =
    list.key_find(query, "search")
    |> option.from_result

  let featured =
    list.key_find(query, "featured")
    |> result.map(fn(v) { v == "true" || v == "1" })
    |> option.from_result

  let is_new =
    list.key_find(query, "new")
    |> result.map(fn(v) { v == "true" || v == "1" })
    |> option.from_result

  let sort =
    list.key_find(query, "sort")
    |> option.from_result

  ProductFilters(
    page:,
    page_size:,
    category_slug:,
    search:,
    featured:,
    is_new:,
    sort:,
  )
}

fn add_cors_headers(res: Response) -> Response {
  res
  |> wisp.set_header("access-control-allow-origin", "*")
  |> wisp.set_header(
    "access-control-allow-methods",
    "GET, POST, PATCH, DELETE, OPTIONS",
  )
  |> wisp.set_header(
    "access-control-allow-headers",
    "Content-Type, Authorization",
  )
}

fn handle_cors_preflight() -> Response {
  wisp.no_content()
  |> add_cors_headers()
}
