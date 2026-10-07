import config
import domain/catalog.{type CatalogRepository, type StoreConfig, StoreConfig}
import domain/category.{Category}
import domain/product.{Product, ProductImage, Published}
import gleam/erlang/process
import gleam/int
import gleam/io
import gleam/option.{None, Some}
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

  let repo = case cfg.database_url {
    "" -> {
      io.println("No DATABASE_URL configured. Starting with in-memory catalog.")
      make_fallback_repo(store_cfg)
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
          catalog_postgres.new(conn, store_cfg)
        }
        Error(err) -> {
          io.println("PostgreSQL connection error: " <> err)
          io.println("Falling back to in-memory catalog for local execution.")
          make_fallback_repo(store_cfg)
        }
      }
    }
  }

  let secret_key_base = wisp.random_string(64)
  let handler = fn(req) { router.handle_request(req, repo) }

  let assert Ok(_) =
    handler
    |> wisp_mist.handler(secret_key_base)
    |> mist.new
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
