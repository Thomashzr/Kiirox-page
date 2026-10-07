import gleam/option.{type Option}

pub type ProductStatus {
  Draft
  Published
  Archived
}

pub fn status_to_string(status: ProductStatus) -> String {
  case status {
    Draft -> "draft"
    Published -> "published"
    Archived -> "archived"
  }
}

pub fn string_to_status(str: String) -> Result(ProductStatus, Nil) {
  case str {
    "draft" -> Ok(Draft)
    "published" -> Ok(Published)
    "archived" -> Ok(Archived)
    _ -> Error(Nil)
  }
}

pub type ProductImage {
  ProductImage(
    id: String,
    product_id: String,
    public_id: String,
    public_url: String,
    alt_text: Option(String),
    sort_order: Int,
    is_primary: Bool,
    created_at: String,
  )
}

pub type Product {
  Product(
    id: String,
    sku: String,
    name: String,
    slug: String,
    brand: Option(String),
    short_description: Option(String),
    description: Option(String),
    price: Float,
    currency: String,
    stock: Int,
    low_stock_threshold: Int,
    status: ProductStatus,
    is_featured: Bool,
    is_new: Bool,
    sort_order: Int,
    category_id: String,
    images: List(ProductImage),
    created_at: String,
    updated_at: String,
  )
}

pub type ProductInput {
  ProductInput(
    sku: String,
    name: String,
    slug: String,
    brand: Option(String),
    short_description: Option(String),
    description: Option(String),
    price: Float,
    currency: String,
    stock: Int,
    low_stock_threshold: Int,
    status: ProductStatus,
    is_featured: Bool,
    is_new: Bool,
    sort_order: Int,
    category_id: String,
  )
}

pub type ProductImageInput {
  ProductImageInput(
    public_id: String,
    public_url: String,
    alt_text: Option(String),
    sort_order: Int,
    is_primary: Bool,
  )
}

pub fn is_available(product: Product) -> Bool {
  product.status == Published && product.stock > 0
}

pub fn is_low_stock(product: Product) -> Bool {
  product.stock <= product.low_stock_threshold
}

