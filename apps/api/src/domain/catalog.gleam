import domain/category.{type Category}
import domain/product.{type Product}
import gleam/option.{type Option}

pub type ProductFilters {
  ProductFilters(
    page: Int,
    page_size: Int,
    category_slug: Option(String),
    search: Option(String),
    featured: Option(Bool),
    is_new: Option(Bool),
    sort: Option(String),
  )
}

pub fn default_filters() -> ProductFilters {
  ProductFilters(
    page: 1,
    page_size: 24,
    category_slug: option.None,
    search: option.None,
    featured: option.None,
    is_new: option.None,
    sort: option.None,
  )
}

pub type Pagination {
  Pagination(page: Int, page_size: Int, total: Int)
}

pub type Paginated(a) {
  Paginated(data: List(a), pagination: Pagination)
}

pub type StoreConfig {
  StoreConfig(store_name: String, whatsapp_number: String, currency: String)
}

pub type CatalogError {
  ProductNotFound(slug: String)
  CategoryNotFound(slug: String)
  InvalidFilter(message: String)
  DatabaseError(message: String)
}

pub type CatalogRepository {
  CatalogRepository(
    list_products: fn(ProductFilters) ->
      Result(Paginated(Product), CatalogError),
    get_product_by_slug: fn(String) -> Result(Product, CatalogError),
    list_categories: fn() -> Result(List(Category), CatalogError),
    get_category_by_slug: fn(String) -> Result(Category, CatalogError),
    get_category_products: fn(String, ProductFilters) ->
      Result(Paginated(Product), CatalogError),
    get_public_config: fn() -> StoreConfig,
  )
}

pub fn list_products(
  repo: CatalogRepository,
  filters: ProductFilters,
) -> Result(Paginated(Product), CatalogError) {
  repo.list_products(filters)
}

pub fn get_product_by_slug(
  repo: CatalogRepository,
  slug: String,
) -> Result(Product, CatalogError) {
  repo.get_product_by_slug(slug)
}

pub fn list_categories(
  repo: CatalogRepository,
) -> Result(List(Category), CatalogError) {
  repo.list_categories()
}

pub fn get_category_by_slug(
  repo: CatalogRepository,
  slug: String,
) -> Result(Category, CatalogError) {
  repo.get_category_by_slug(slug)
}

pub fn get_category_products(
  repo: CatalogRepository,
  slug: String,
  filters: ProductFilters,
) -> Result(Paginated(Product), CatalogError) {
  repo.get_category_products(slug, filters)
}

pub fn get_public_config(repo: CatalogRepository) -> StoreConfig {
  repo.get_public_config()
}
