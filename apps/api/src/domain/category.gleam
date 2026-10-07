import gleam/option.{type Option}

pub type Category {
  Category(
    id: String,
    name: String,
    slug: String,
    description: Option(String),
    image_url: Option(String),
    is_active: Bool,
    sort_order: Int,
    created_at: String,
    updated_at: String,
  )
}
