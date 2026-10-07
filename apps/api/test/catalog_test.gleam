import domain/admin.{
  type AdminRepository, AdminRepository, AdminUser, SuperAdmin, Unauthorized,
}
import domain/catalog.{
  type CatalogRepository, CategoryNotFound, ProductFilters, ProductNotFound,
  StoreConfig, default_filters,
}
import domain/category.{type Category, Category}
import domain/inventory.{InventoryMovement, Purchase}
import domain/product.{
  type Product, Draft, Product, ProductImage, Published,
}
import gleam/http
import gleam/list
import gleam/option.{None, Some}
import gleam/string
import infrastructure/catalog_in_memory
import web/router
import wisp/simulate

fn dummy_admin_repo() -> AdminRepository {
  let admin =
    AdminUser(
      id: "admin-test-01",
      clerk_user_id: "user_test_clerk",
      email: "thomasheinzergz@gmail.com",
      role: SuperAdmin,
      is_active: True,
      created_at: "2026-10-07T00:00:00Z",
      updated_at: "2026-10-07T00:00:00Z",
    )
  AdminRepository(
    find_admin_by_clerk_id: fn(id) {
      case id == "user_test_clerk" {
        True -> Ok(admin)
        False -> Error(Unauthorized("No autorizado"))
      }
    },
    find_admin_by_email: fn(email) {
      case email == "thomasheinzergz@gmail.com" {
        True -> Ok(admin)
        False -> Error(Unauthorized("No autorizado"))
      }
    },
    list_admin_products: fn(_) {
      Ok(catalog.Paginated(data: [], pagination: catalog.Pagination(page: 1, page_size: 24, total: 0)))
    },
    get_admin_product: fn(_) {
      Error(admin.NotFound("Producto no encontrado"))
    },
    create_product: fn(input) {
      Ok(Product(
        id: "p-test-create",
        sku: input.sku,
        name: input.name,
        slug: input.slug,
        brand: input.brand,
        short_description: input.short_description,
        description: input.description,
        price: input.price,
        currency: input.currency,
        stock: input.stock,
        low_stock_threshold: input.low_stock_threshold,
        status: input.status,
        is_featured: input.is_featured,
        is_new: input.is_new,
        sort_order: input.sort_order,
        category_id: input.category_id,
        images: [],
        created_at: "2026-10-07T00:00:00Z",
        updated_at: "2026-10-07T00:00:00Z",
      ))
    },
    update_product: fn(_id, input) {
      Ok(Product(
        id: "p-test-update",
        sku: input.sku,
        name: input.name,
        slug: input.slug,
        brand: input.brand,
        short_description: input.short_description,
        description: input.description,
        price: input.price,
        currency: input.currency,
        stock: input.stock,
        low_stock_threshold: input.low_stock_threshold,
        status: input.status,
        is_featured: input.is_featured,
        is_new: input.is_new,
        sort_order: input.sort_order,
        category_id: input.category_id,
        images: [],
        created_at: "2026-10-07T00:00:00Z",
        updated_at: "2026-10-07T00:00:00Z",
      ))
    },
    archive_product: fn(_id) {
      Error(admin.NotFound("Producto no encontrado"))
    },
    delete_product: fn(_) { Ok(Nil) },
    add_product_image: fn(_pid, img) {
      Ok(ProductImage(
        id: "img-test-1",
        product_id: "p-test-create",
        public_id: img.public_id,
        public_url: img.public_url,
        alt_text: img.alt_text,
        sort_order: img.sort_order,
        is_primary: img.is_primary,
        created_at: "2026-10-07T00:00:00Z",
      ))
    },
    delete_product_image: fn(_, _) { Ok(Nil) },
    set_primary_image: fn(_, _) { Ok(Nil) },
    record_stock_movement: fn(input) {
      case input.delta < -100 {
        True ->
          Error(admin.ValidationError("Stock insuficiente: resultado negativo"))
        False -> {
          let mov =
            InventoryMovement(
              id: "mov-test-1",
              product_id: input.product_id,
              delta: input.delta,
              movement_type: input.movement_type,
              reason: input.reason,
              reference_type: None,
              reference_id: None,
              admin_user_id: input.admin_user_id,
              created_at: "2026-10-07T00:00:00Z",
            )
          let prod =
            Product(
              id: input.product_id,
              sku: "GEL-001",
              name: "Gel Maurten 100",
              slug: "gel-maurten-100",
              brand: Some("Maurten"),
              short_description: None,
              description: None,
              price: 4800.0,
              currency: "ARS",
              stock: 50 + input.delta,
              low_stock_threshold: 5,
              status: Published,
              is_featured: True,
              is_new: True,
              sort_order: 1,
              category_id: "c1",
              images: [],
              created_at: "2026-10-07T00:00:00Z",
              updated_at: "2026-10-07T00:00:00Z",
            )
          Ok(#(prod, mov))
        }
      }
    },
    list_inventory_movements: fn(_) {
      let mov =
        InventoryMovement(
          id: "mov-test-1",
          product_id: "p1",
          delta: 10,
          movement_type: Purchase,
          reason: Some("Compra inicial"),
          reference_type: None,
          reference_id: None,
          admin_user_id: None,
          created_at: "2026-10-07T00:00:00Z",
        )
      Ok(catalog.Paginated(data: [mov], pagination: catalog.Pagination(page: 1, page_size: 24, total: 1)))
    },
  )
}


fn setup_test_catalog() -> #(CatalogRepository, List(Category), List(Product)) {
  let cat1 =
    Category(
      id: "c1",
      name: "Geles Energéticos",
      slug: "geles-energeticos",
      description: Some("Geles para running"),
      image_url: None,
      is_active: True,
      sort_order: 1,
      created_at: "2026-10-07T00:00:00Z",
      updated_at: "2026-10-07T00:00:00Z",
    )

  let cat2 =
    Category(
      id: "c2",
      name: "Proteínas",
      slug: "proteinas",
      description: None,
      image_url: None,
      is_active: True,
      sort_order: 2,
      created_at: "2026-10-07T00:00:00Z",
      updated_at: "2026-10-07T00:00:00Z",
    )

  let categories = [cat1, cat2]

  let prod1 =
    Product(
      id: "p1",
      sku: "GEL-001",
      name: "Gel Maurten 100",
      slug: "gel-maurten-100",
      brand: Some("Maurten"),
      short_description: Some("Gel hidrogel"),
      description: Some("Descripción completa"),
      price: 4800.0,
      currency: "ARS",
      stock: 50,
      low_stock_threshold: 5,
      status: Published,
      is_featured: True,
      is_new: True,
      sort_order: 1,
      category_id: "c1",
      images: [
        ProductImage(
          id: "img1",
          product_id: "p1",
          public_id: "kiirox/maurten-100",
          public_url: "https://res.cloudinary.com/demo/image/upload/maurten-100.jpg",
          alt_text: Some("Gel Maurten 100"),
          sort_order: 1,
          is_primary: True,
          created_at: "2026-10-07T00:00:00Z",
        ),
      ],
      created_at: "2026-10-07T00:00:00Z",
      updated_at: "2026-10-07T00:00:00Z",
    )

  let prod2 =
    Product(
      id: "p2",
      sku: "GEL-002",
      name: "SiS GO Isotonic Manzana",
      slug: "sis-go-isotonic-manzana",
      brand: Some("Science in Sport"),
      short_description: Some("Gel isotónico"),
      description: None,
      price: 3200.0,
      currency: "ARS",
      stock: 30,
      low_stock_threshold: 5,
      status: Published,
      is_featured: False,
      is_new: False,
      sort_order: 2,
      category_id: "c1",
      images: [],
      created_at: "2026-10-07T00:00:00Z",
      updated_at: "2026-10-07T00:00:00Z",
    )

  let prod_draft =
    Product(
      id: "p3",
      sku: "PROT-001",
      name: "Proteína ON Borrador",
      slug: "proteina-on-borrador",
      brand: Some("ON"),
      short_description: None,
      description: None,
      price: 50000.0,
      currency: "ARS",
      stock: 10,
      low_stock_threshold: 2,
      status: Draft,
      is_featured: False,
      is_new: False,
      sort_order: 3,
      category_id: "c2",
      images: [],
      created_at: "2026-10-07T00:00:00Z",
      updated_at: "2026-10-07T00:00:00Z",
    )

  let products = [prod1, prod2, prod_draft]

  let store_cfg =
    StoreConfig(
      store_name: "KIIROX",
      whatsapp_number: "+5491100000000",
      currency: "ARS",
    )

  let repo = catalog_in_memory.new(categories, products, store_cfg)
  #(repo, categories, products)
}

pub fn list_products_published_only_test() {
  let #(repo, _cats, _prods) = setup_test_catalog()
  let assert Ok(res) = catalog.list_products(repo, default_filters())

  // Only published products returned (prod_draft excluded)
  assert list.length(res.data) == 2
  assert res.pagination.total == 2
  assert res.pagination.page == 1
}

pub fn list_products_filtered_by_featured_test() {
  let #(repo, _cats, _prods) = setup_test_catalog()
  let filters = ProductFilters(..default_filters(), featured: Some(True))
  let assert Ok(res) = catalog.list_products(repo, filters)

  assert list.length(res.data) == 1
  let assert Ok(first) = list.first(res.data)
  assert first.slug == "gel-maurten-100"
}

pub fn list_products_search_test() {
  let #(repo, _cats, _prods) = setup_test_catalog()
  let filters = ProductFilters(..default_filters(), search: Some("sis"))
  let assert Ok(res) = catalog.list_products(repo, filters)

  assert list.length(res.data) == 1
  let assert Ok(first) = list.first(res.data)
  assert first.slug == "sis-go-isotonic-manzana"
}

pub fn list_products_sort_price_asc_test() {
  let #(repo, _cats, _prods) = setup_test_catalog()
  let filters = ProductFilters(..default_filters(), sort: Some("price_asc"))
  let assert Ok(res) = catalog.list_products(repo, filters)

  let assert [p1, p2] = res.data
  // 3200.0 < 4800.0
  assert p1.price == 3200.0
  assert p2.price == 4800.0
}

pub fn get_product_by_slug_test() {
  let #(repo, _cats, _prods) = setup_test_catalog()

  // Published product found
  let assert Ok(prod) = catalog.get_product_by_slug(repo, "gel-maurten-100")
  assert prod.name == "Gel Maurten 100"
  assert prod.is_featured == True

  // Draft product not found
  assert catalog.get_product_by_slug(repo, "proteina-on-borrador") ==
    Error(ProductNotFound("proteina-on-borrador"))

  // Nonexistent product not found
  assert catalog.get_product_by_slug(repo, "inexistente") ==
    Error(ProductNotFound("inexistente"))
}

pub fn list_categories_test() {
  let #(repo, _cats, _prods) = setup_test_catalog()
  let assert Ok(categories) = catalog.list_categories(repo)

  assert list.length(categories) == 2
  let assert Ok(first) = list.first(categories)
  assert first.slug == "geles-energeticos"
}

pub fn get_category_products_test() {
  let #(repo, _cats, _prods) = setup_test_catalog()

  let assert Ok(res) =
    catalog.get_category_products(repo, "geles-energeticos", default_filters())
  assert list.length(res.data) == 2

  assert catalog.get_category_products(
    repo,
    "categoria-fantasma",
    default_filters(),
  ) == Error(CategoryNotFound("categoria-fantasma"))
}

// Router HTTP integration tests
pub fn http_health_endpoint_test() {
  let #(repo, _, _) = setup_test_catalog()
  let admin_repo = dummy_admin_repo()
  let req = simulate.request(http.Get, "/health")
  let res = router.handle_request(req, repo, admin_repo)

  assert res.status == 200
  let body = simulate.read_body(res)
  assert string.contains(body, "\"status\":\"ok\"")
  assert string.contains(body, "\"service\":\"kiirox-api\"")
}

pub fn http_public_config_endpoint_test() {
  let #(repo, _, _) = setup_test_catalog()
  let admin_repo = dummy_admin_repo()
  let req = simulate.request(http.Get, "/api/v1/config/public")
  let res = router.handle_request(req, repo, admin_repo)

  assert res.status == 200
  let body = simulate.read_body(res)
  assert string.contains(body, "\"store_name\":\"KIIROX\"")
  assert string.contains(body, "\"currency\":\"ARS\"")
}

pub fn http_categories_endpoint_test() {
  let #(repo, _, _) = setup_test_catalog()
  let admin_repo = dummy_admin_repo()
  let req = simulate.request(http.Get, "/api/v1/categories")
  let res = router.handle_request(req, repo, admin_repo)

  assert res.status == 200
  let body = simulate.read_body(res)
  assert string.contains(body, "geles-energeticos")
  assert string.contains(body, "proteinas")
}

pub fn http_products_endpoint_test() {
  let #(repo, _, _) = setup_test_catalog()
  let admin_repo = dummy_admin_repo()
  let req = simulate.request(http.Get, "/api/v1/products")
  let res = router.handle_request(req, repo, admin_repo)

  assert res.status == 200
  let body = simulate.read_body(res)
  assert string.contains(body, "\"data\":[")
  assert string.contains(body, "\"pagination\":{")
  assert string.contains(body, "gel-maurten-100")
}

pub fn http_product_by_slug_endpoint_test() {
  let #(repo, _, _) = setup_test_catalog()
  let admin_repo = dummy_admin_repo()

  // 200 OK for existing product
  let req = simulate.request(http.Get, "/api/v1/products/gel-maurten-100")
  let res = router.handle_request(req, repo, admin_repo)
  assert res.status == 200
  let body = simulate.read_body(res)
  assert string.contains(body, "Gel Maurten 100")

  // 404 for missing product
  let req_404 = simulate.request(http.Get, "/api/v1/products/no-existe")
  let res_404 = router.handle_request(req_404, repo, admin_repo)
  assert res_404.status == 404
  let body_404 = simulate.read_body(res_404)
  assert string.contains(body_404, "PRODUCT_NOT_FOUND")
}

pub fn http_category_products_endpoint_test() {
  let #(repo, _, _) = setup_test_catalog()
  let admin_repo = dummy_admin_repo()

  // 200 OK for valid category
  let req = simulate.request(http.Get, "/api/v1/categories/geles-energeticos/products")
  let res = router.handle_request(req, repo, admin_repo)
  assert res.status == 200
  let body = simulate.read_body(res)
  assert string.contains(body, "gel-maurten-100")

  // 404 for missing category
  let req_404 = simulate.request(http.Get, "/api/v1/categories/no-existe/products")
  let res_404 = router.handle_request(req_404, repo, admin_repo)
  assert res_404.status == 404
  let body_404 = simulate.read_body(res_404)
  assert string.contains(body_404, "CATEGORY_NOT_FOUND")
}

pub fn http_cors_options_test() {
  let #(repo, _, _) = setup_test_catalog()
  let admin_repo = dummy_admin_repo()
  let req = simulate.request(http.Options, "/api/v1/products")
  let res = router.handle_request(req, repo, admin_repo)

  assert res.status == 204
  assert list.key_find(res.headers, "access-control-allow-origin") == Ok("*")
}

pub fn http_not_found_endpoint_test() {
  let #(repo, _, _) = setup_test_catalog()
  let admin_repo = dummy_admin_repo()
  let req = simulate.request(http.Get, "/api/v1/inexistente")
  let res = router.handle_request(req, repo, admin_repo)

  assert res.status == 404
  let body = simulate.read_body(res)
  assert string.contains(body, "NOT_FOUND")
}

pub fn http_admin_me_missing_token_test() {
  let #(repo, _, _) = setup_test_catalog()
  let admin_repo = dummy_admin_repo()
  let req = simulate.request(http.Get, "/api/v1/admin/me")
  let res = router.handle_request(req, repo, admin_repo)

  assert res.status == 401
  let body = simulate.read_body(res)
  assert string.contains(body, "UNAUTHORIZED")
}

const valid_mock_token: String = "Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ1c2VyX3Rlc3RfY2xlcmsiLCJlbWFpbCI6InRob21hc2hlaW56ZXJnekBnbWFpbC5jb20ifQ.sig"

pub fn http_admin_products_unauthorized_test() {
  let #(repo, _, _) = setup_test_catalog()
  let admin_repo = dummy_admin_repo()
  let req = simulate.request(http.Get, "/api/v1/admin/products")
  let res = router.handle_request(req, repo, admin_repo)

  assert res.status == 401
}

pub fn http_admin_products_list_test() {
  let #(repo, _, _) = setup_test_catalog()
  let admin_repo = dummy_admin_repo()
  let req =
    simulate.request(http.Get, "/api/v1/admin/products")
    |> simulate.header("authorization", valid_mock_token)
  let res = router.handle_request(req, repo, admin_repo)

  assert res.status == 200
  let body = simulate.read_body(res)
  assert string.contains(body, "\"data\":")
  assert string.contains(body, "\"pagination\":")
}

pub fn http_admin_product_create_test() {
  let #(repo, _, _) = setup_test_catalog()
  let admin_repo = dummy_admin_repo()
  let payload = "{\"sku\":\"GEL-TEST-99\",\"name\":\"Test Gel 99\",\"slug\":\"test-gel-99\",\"price\":1500,\"stock\":20,\"category_id\":\"c1\"}"
  let req =
    simulate.request(http.Post, "/api/v1/admin/products")
    |> simulate.header("authorization", valid_mock_token)
    |> simulate.header("content-type", "application/json")
    |> simulate.string_body(payload)
  let res = router.handle_request(req, repo, admin_repo)

  assert res.status == 201
  let body = simulate.read_body(res)
  assert string.contains(body, "GEL-TEST-99")
  assert string.contains(body, "Test Gel 99")
}

pub fn http_admin_product_update_test() {
  let #(repo, _, _) = setup_test_catalog()
  let admin_repo = dummy_admin_repo()
  let payload = "{\"sku\":\"GEL-UPDATED\",\"name\":\"Updated Gel\",\"slug\":\"updated-gel\",\"price\":2500.5,\"stock\":10,\"category_id\":\"c1\"}"
  let req =
    simulate.request(http.Patch, "/api/v1/admin/products/p-test-update")
    |> simulate.header("authorization", valid_mock_token)
    |> simulate.header("content-type", "application/json")
    |> simulate.string_body(payload)
  let res = router.handle_request(req, repo, admin_repo)

  assert res.status == 200
  let body = simulate.read_body(res)
  assert string.contains(body, "GEL-UPDATED")
  assert string.contains(body, "Updated Gel")
}

pub fn http_admin_product_delete_archive_test() {
  let #(repo, _, _) = setup_test_catalog()
  let admin_repo = dummy_admin_repo()
  let req =
    simulate.request(http.Delete, "/api/v1/admin/products/p1")
    |> simulate.header("authorization", valid_mock_token)
  let res = router.handle_request(req, repo, admin_repo)

  // In dummy_admin_repo, archive returns NotFound("Producto no encontrado")
  assert res.status == 404
}

pub fn http_admin_product_delete_permanent_test() {
  let #(repo, _, _) = setup_test_catalog()
  let admin_repo = dummy_admin_repo()
  let req =
    simulate.request(http.Delete, "/api/v1/admin/products/p1?permanent=true")
    |> simulate.header("authorization", valid_mock_token)
  let res = router.handle_request(req, repo, admin_repo)

  assert res.status == 200
  let body = simulate.read_body(res)
  assert string.contains(body, "\"status\":\"deleted\"")
}

pub fn http_admin_product_image_create_test() {
  let #(repo, _, _) = setup_test_catalog()
  let admin_repo = dummy_admin_repo()
  let payload = "{\"public_id\":\"kiirox/test\",\"public_url\":\"https://res.cloudinary.com/test.jpg\",\"sort_order\":1,\"is_primary\":true}"
  let req =
    simulate.request(http.Post, "/api/v1/admin/products/p1/images")
    |> simulate.header("authorization", valid_mock_token)
    |> simulate.header("content-type", "application/json")
    |> simulate.string_body(payload)
  let res = router.handle_request(req, repo, admin_repo)

  assert res.status == 201
  let body = simulate.read_body(res)
  assert string.contains(body, "kiirox/test")
}

pub fn http_admin_inventory_adjust_test() {
  let #(repo, _, _) = setup_test_catalog()
  let admin_repo = dummy_admin_repo()
  let payload = "{\"product_id\":\"p1\",\"delta\":10,\"movement_type\":\"purchase\",\"reason\":\"Compra de lote nuevo\"}"
  let req =
    simulate.request(http.Post, "/api/v1/admin/inventory/adjust")
    |> simulate.header("authorization", valid_mock_token)
    |> simulate.header("content-type", "application/json")
    |> simulate.string_body(payload)
  let res = router.handle_request(req, repo, admin_repo)

  assert res.status == 201
  let body = simulate.read_body(res)
  assert string.contains(body, "\"success\":true")
  assert string.contains(body, "\"delta\":10")
}

pub fn http_admin_inventory_adjust_insufficient_stock_test() {
  let #(repo, _, _) = setup_test_catalog()
  let admin_repo = dummy_admin_repo()
  let payload = "{\"product_id\":\"p1\",\"delta\":-500,\"movement_type\":\"sale\",\"reason\":\"Salida excesiva\"}"
  let req =
    simulate.request(http.Post, "/api/v1/admin/inventory/adjust")
    |> simulate.header("authorization", valid_mock_token)
    |> simulate.header("content-type", "application/json")
    |> simulate.string_body(payload)
  let res = router.handle_request(req, repo, admin_repo)

  assert res.status == 400
  let body = simulate.read_body(res)
  assert string.contains(body, "VALIDATION_ERROR")
}

pub fn http_admin_inventory_movements_list_test() {
  let #(repo, _, _) = setup_test_catalog()
  let admin_repo = dummy_admin_repo()
  let req =
    simulate.request(http.Get, "/api/v1/admin/inventory/movements")
    |> simulate.header("authorization", valid_mock_token)
  let res = router.handle_request(req, repo, admin_repo)

  assert res.status == 200
  let body = simulate.read_body(res)
  assert string.contains(body, "\"data\":")
  assert string.contains(body, "mov-test-1")
}

pub fn http_admin_product_movements_test() {
  let #(repo, _, _) = setup_test_catalog()
  let admin_repo = dummy_admin_repo()
  let req =
    simulate.request(http.Get, "/api/v1/admin/products/p1/movements")
    |> simulate.header("authorization", valid_mock_token)
  let res = router.handle_request(req, repo, admin_repo)

  assert res.status == 200
  let body = simulate.read_body(res)
  assert string.contains(body, "\"data\":")
  assert string.contains(body, "mov-test-1")
}


