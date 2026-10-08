import domain/catalog.{
  type CatalogRepository, type StoreConfig, CatalogRepository, CategoryNotFound,
  Paginated, Pagination, ProductNotFound,
}
import domain/category.{type Category}
import domain/product.{type Product, Published}
import gleam/float
import gleam/int
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/string

pub fn new(
  categories: List(Category),
  products: List(Product),
  config: StoreConfig,
) -> CatalogRepository {
  CatalogRepository(
    list_products: fn(filters) {
      let filtered =
        products
        |> list.filter(fn(p) { p.status == Published })
        |> filter_by_category(categories, filters.category_slug)
        |> filter_by_search(filters.search)
        |> filter_by_featured(filters.featured)
        |> filter_by_new(filters.is_new)
        |> sort_products(filters.sort)

      let total = list.length(filtered)
      let page = int.max(1, filters.page)
      let page_size = int.clamp(filters.page_size, 1, 100)
      let paged = paginate(filtered, page, page_size)

      Ok(Paginated(
        data: paged,
        pagination: Pagination(page:, page_size:, total:),
      ))
    },
    get_product_by_slug: fn(slug) {
      products
      |> list.find(fn(p) { p.slug == slug && p.status == Published })
      |> fn(res) {
        case res {
          Ok(p) -> Ok(p)
          Error(Nil) -> Error(ProductNotFound(slug))
        }
      }
    },
    list_categories: fn() {
      let active =
        categories
        |> list.filter(fn(c) { c.is_active })
        |> list.sort(fn(a, b) { int.compare(a.sort_order, b.sort_order) })
      Ok(active)
    },
    get_category_by_slug: fn(slug) {
      categories
      |> list.find(fn(c) { c.slug == slug && c.is_active })
      |> fn(res) {
        case res {
          Ok(c) -> Ok(c)
          Error(Nil) -> Error(CategoryNotFound(slug))
        }
      }
    },
    get_category_products: fn(cat_slug, filters) {
      case list.find(categories, fn(c) { c.slug == cat_slug && c.is_active }) {
        Error(Nil) -> Error(CategoryNotFound(cat_slug))
        Ok(cat) -> {
          let cat_products =
            products
            |> list.filter(fn(p) {
              p.status == Published && p.category_id == cat.id
            })
            |> filter_by_search(filters.search)
            |> filter_by_featured(filters.featured)
            |> filter_by_new(filters.is_new)
            |> sort_products(filters.sort)

          let total = list.length(cat_products)
          let page = int.max(1, filters.page)
          let page_size = int.clamp(filters.page_size, 1, 100)
          let paged = paginate(cat_products, page, page_size)

          Ok(Paginated(
            data: paged,
            pagination: Pagination(page:, page_size:, total:),
          ))
        }
      }
    },
    get_public_config: fn() { config },
  )
}

fn filter_by_category(
  products: List(Product),
  categories: List(Category),
  category_slug: Option(String),
) -> List(Product) {
  case category_slug {
    None -> products
    Some(slug) -> {
      case list.find(categories, fn(c) { c.slug == slug }) {
        Error(Nil) -> []
        Ok(cat) -> list.filter(products, fn(p) { p.category_id == cat.id })
      }
    }
  }
}

fn filter_by_search(
  products: List(Product),
  search: Option(String),
) -> List(Product) {
  case search {
    None -> products
    Some(term) -> {
      let lower_term = string.lowercase(string.trim(term))
      case lower_term {
        "" -> products
        _ ->
          list.filter(products, fn(p) {
            let name_match =
              string.contains(string.lowercase(p.name), lower_term)
            let brand_match = case p.brand {
              Some(b) -> string.contains(string.lowercase(b), lower_term)
              None -> False
            }
            let desc_match = case p.short_description {
              Some(d) -> string.contains(string.lowercase(d), lower_term)
              None -> False
            }
            name_match || brand_match || desc_match
          })
      }
    }
  }
}

fn filter_by_featured(
  products: List(Product),
  featured: Option(Bool),
) -> List(Product) {
  case featured {
    None -> products
    Some(val) -> list.filter(products, fn(p) { p.is_featured == val })
  }
}

fn filter_by_new(
  products: List(Product),
  is_new: Option(Bool),
) -> List(Product) {
  case is_new {
    None -> products
    Some(val) -> list.filter(products, fn(p) { p.is_new == val })
  }
}

fn sort_products(
  products: List(Product),
  sort_by: Option(String),
) -> List(Product) {
  case sort_by {
    Some("price_asc") ->
      list.sort(products, fn(a, b) { float.compare(a.price, b.price) })
    Some("price_desc") ->
      list.sort(products, fn(a, b) { float.compare(b.price, a.price) })
    Some("name") ->
      list.sort(products, fn(a, b) { string.compare(a.name, b.name) })
    _ ->
      list.sort(products, fn(a, b) { int.compare(a.sort_order, b.sort_order) })
  }
}

fn paginate(items: List(Product), page: Int, page_size: Int) -> List(Product) {
  let skip = { page - 1 } * page_size
  items
  |> list.drop(skip)
  |> list.take(page_size)
}
