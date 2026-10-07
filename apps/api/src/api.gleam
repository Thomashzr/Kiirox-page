import config
import domain/admin.{
  type AdminRepository, AdminRepository, AdminUser, SuperAdmin, Unauthorized,
}

import domain/catalog.{type CatalogRepository, type StoreConfig, StoreConfig}
import domain/category.{Category}
import domain/inventory.{InventoryMovement}
import domain/product.{Product, ProductImage, Published}
import gleam/erlang/process
import gleam/int
import gleam/io
import gleam/option.{None, Some}
import infrastructure/admin_postgres
import infrastructure/catalog_in_memory
import infrastructure/catalog_postgres
import infrastructure/database
import infrastructure/migrations
import infrastructure/schema
import mist
import web/router
import wisp
import wisp/wisp_mist


pub fn main() -> Nil {
  io.println("=== KIIROX API Starting ===")

  let cfg = case config.load() {
    Ok(c) -> c
    Error(_) ->
      config.Config(
        port: 4000,
        database_url: "",
        clerk_secret_key: None,
        cloudinary_cloud_name: None,
        cloudinary_api_key: None,
        cloudinary_api_secret: None,
        cors_origins: ["*"],
      )
  }

  let store_cfg =
    StoreConfig(
      store_name: "KIIROX",
      whatsapp_number: "+5491100000000",
      currency: "ARS",
    )

  let #(repo, admin_repo) = case cfg.database_url {
    "" -> {
      io.println("No DATABASE_URL configured. Starting with in-memory catalog.")
      #(make_fallback_repo(store_cfg), make_fallback_admin_repo())
    }
    db_url -> {
      io.println("Connecting to Neon PostgreSQL...")
      case database.connect(db_url) {
        Ok(conn) -> {
          io.println("Connected to PostgreSQL successfully.")
          let migration_list = [
            #("001_initial_schema", schema.migration_001_initial_schema),
          ]
          let _ = migrations.run_all(conn, migration_list)
          #(
            catalog_postgres.new(conn, store_cfg),
            admin_postgres.new(conn),
          )
        }
        Error(err) -> {
          io.println("PostgreSQL connection error: " <> err)
          io.println("Falling back to in-memory catalog for local execution.")
          #(make_fallback_repo(store_cfg), make_fallback_admin_repo())
        }
      }
    }
  }

  let secret_key_base = wisp.random_string(64)
  let handler = fn(req) { router.handle_request(req, repo, admin_repo) }


  let assert Ok(_) =
    handler
    |> wisp_mist.handler(secret_key_base)
    |> mist.new
    |> mist.bind("0.0.0.0")
    |> mist.port(cfg.port)
    |> mist.start

  io.println(
    "🚀 KIIROX API listening on http://localhost:" <> int.to_string(cfg.port),
  )
  io.println(
    "   - Health:     http://localhost:" <> int.to_string(cfg.port) <> "/health",
  )
  io.println(
    "   - Products:   http://localhost:"
    <> int.to_string(cfg.port)
    <> "/api/v1/products",
  )
  io.println(
    "   - Categories: http://localhost:"
    <> int.to_string(cfg.port)
    <> "/api/v1/categories",
  )
  io.println(
    "   - Config:     http://localhost:"
    <> int.to_string(cfg.port)
    <> "/api/v1/config/public",
  )

  process.sleep_forever()
}

fn make_fallback_repo(store_cfg: StoreConfig) -> CatalogRepository {
  let categories = [
    Category(
      id: "c1000000-0000-0000-0000-000000000001",
      name: "Geles Energéticos",
      slug: "geles-energeticos",
      description: Some("Geles para running y ciclismo"),
      image_url: None,
      is_active: True,
      sort_order: 1,
      created_at: "2026-10-07T00:00:00Z",
      updated_at: "2026-10-07T00:00:00Z",
    ),
    Category(
      id: "c1000000-0000-0000-0000-000000000002",
      name: "Proteínas & Recuperadores",
      slug: "proteinas-recuperadores",
      description: Some("Proteínas para recuperación"),
      image_url: None,
      is_active: True,
      sort_order: 2,
      created_at: "2026-10-07T00:00:00Z",
      updated_at: "2026-10-07T00:00:00Z",
    ),
    Category(
      id: "c1000000-0000-0000-0000-000000000003",
      name: "Hidratación & Electrolitos",
      slug: "hidratacion-electrolitos",
      description: Some("Electrolitos y sales"),
      image_url: None,
      is_active: True,
      sort_order: 3,
      created_at: "2026-10-07T00:00:00Z",
      updated_at: "2026-10-07T00:00:00Z",
    ),
  ]

  let products = [
    Product(
      id: "b1000000-0000-0000-0000-000000000001",
      sku: "GEL-MAURTEN-100",
      name: "Gel Maurten 100 Hydrogel",
      slug: "gel-maurten-100-hydrogel",
      brand: Some("Maurten"),
      short_description: Some("Gel energético de hidrogel"),
      description: Some("Tecnología de hidrogel para máxima absorción."),
      price: 4800.0,
      currency: "ARS",
      stock: 50,
      low_stock_threshold: 10,
      status: Published,
      is_featured: True,
      is_new: True,
      sort_order: 1,
      category_id: "c1000000-0000-0000-0000-000000000001",
      images: [
        ProductImage(
          id: "img-1",
          product_id: "b1000000-0000-0000-0000-000000000001",
          public_id: "kiirox/products/maurten-gel-100",
          public_url: "https://res.cloudinary.com/demo/image/upload/v1/kiirox/products/maurten-gel-100.jpg",
          alt_text: Some("Gel Maurten 100 Pack"),
          sort_order: 1,
          is_primary: True,
          created_at: "2026-10-07T00:00:00Z",
        ),
      ],
      created_at: "2026-10-07T00:00:00Z",
      updated_at: "2026-10-07T00:00:00Z",
    ),
    Product(
      id: "b1000000-0000-0000-0000-000000000002",
      sku: "GEL-SIS-ISOTONIC-APPLE",
      name: "SiS GO Isotonic Gel Manzana 60ml",
      slug: "sis-go-isotonic-gel-manzana",
      brand: Some("Science in Sport"),
      short_description: Some("Gel isotónico de rápida asimilación"),
      description: None,
      price: 3200.0,
      currency: "ARS",
      stock: 40,
      low_stock_threshold: 8,
      status: Published,
      is_featured: True,
      is_new: False,
      sort_order: 2,
      category_id: "c1000000-0000-0000-0000-000000000001",
      images: [],
      created_at: "2026-10-07T00:00:00Z",
      updated_at: "2026-10-07T00:00:00Z",
    ),
    Product(
      id: "b1000000-0000-0000-0000-000000000003",
      sku: "PROT-ON-GOLD-WHEY-2LB",
      name: "Optimum Nutrition Gold Standard 100% Whey 2lb",
      slug: "on-gold-standard-whey-2lb",
      brand: Some("Optimum Nutrition"),
      short_description: Some("Proteína aislada de suero"),
      description: None,
      price: 52000.0,
      currency: "ARS",
      stock: 15,
      low_stock_threshold: 3,
      status: Published,
      is_featured: True,
      is_new: False,
      sort_order: 1,
      category_id: "c1000000-0000-0000-0000-000000000002",
      images: [],
      created_at: "2026-10-07T00:00:00Z",
      updated_at: "2026-10-07T00:00:00Z",
    ),
  ]

  catalog_in_memory.new(categories, products, store_cfg)
}

fn make_fallback_admin_repo() -> AdminRepository {
  let fallback_admin =
    AdminUser(
      id: "admin-superadmin-01",
      clerk_user_id: "",
      email: "thomasheinzergz@gmail.com",
      role: SuperAdmin,
      is_active: True,
      created_at: "2026-10-07T00:00:00Z",
      updated_at: "2026-10-07T00:00:00Z",
    )
  AdminRepository(
    find_admin_by_clerk_id: fn(_) { Ok(fallback_admin) },
    find_admin_by_email: fn(email) {
      case email == "thomasheinzergz@gmail.com" {
        True -> Ok(fallback_admin)
        False -> Error(Unauthorized("Administrador no autorizado"))
      }
    },
    list_admin_products: fn(_) {
      Ok(catalog.Paginated(data: [], pagination: catalog.Pagination(1, 24, 0)))
    },
    get_admin_product: fn(_) {
      Error(admin.NotFound("Producto no encontrado"))
    },
    create_product: fn(input) {
      Ok(Product(
        id: "fallback-prod-id",
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
        id: "fallback-prod-id",
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
        id: "img-fb-1",
        product_id: "fallback-prod-id",
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
      let mov =
        InventoryMovement(
          id: "mov-fallback-1",
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
          sku: "FALLBACK-SKU",
          name: "Fallback Product",
          slug: "fallback-product",
          brand: None,
          short_description: None,
          description: None,
          price: 1000.0,
          currency: "ARS",
          stock: 50 + input.delta,
          low_stock_threshold: 5,
          status: Published,
          is_featured: False,
          is_new: False,
          sort_order: 1,
          category_id: "c1",
          images: [],
          created_at: "2026-10-07T00:00:00Z",
          updated_at: "2026-10-07T00:00:00Z",
        )
      Ok(#(prod, mov))
    },
    list_inventory_movements: fn(_) {
      Ok(catalog.Paginated(data: [], pagination: catalog.Pagination(1, 24, 0)))
    },
  )
}

