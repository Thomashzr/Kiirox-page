import envoy
import gleam/int
import gleam/option.{type Option}
import gleam/result
import gleam/string

pub type Config {
  Config(
    database_url: String,
    port: Int,
    clerk_secret_key: Option(String),
    cloudinary_cloud_name: Option(String),
    cloudinary_api_key: Option(String),
    cloudinary_api_secret: Option(String),
    cors_origins: List(String),
  )
}

pub fn load() -> Result(Config, String) {
  use db_url <- result.try(
    envoy.get("DATABASE_URL")
    |> result.replace_error("DATABASE_URL environment variable is required"),
  )

  let port =
    envoy.get("PORT")
    |> result.try(int.parse)
    |> result.unwrap(4000)

  let clerk_secret_key = envoy.get("CLERK_SECRET_KEY") |> option.from_result
  let cloudinary_cloud_name =
    envoy.get("CLOUDINARY_CLOUD_NAME") |> option.from_result
  let cloudinary_api_key = envoy.get("CLOUDINARY_API_KEY") |> option.from_result
  let cloudinary_api_secret =
    envoy.get("CLOUDINARY_API_SECRET") |> option.from_result

  let cors_origins =
    envoy.get("CORS_ORIGINS")
    |> result.map(fn(s) { string.split(s, ",") })
    |> result.unwrap(["http://localhost:3000"])

  Ok(Config(
    database_url: db_url,
    port: port,
    clerk_secret_key: clerk_secret_key,
    cloudinary_cloud_name: cloudinary_cloud_name,
    cloudinary_api_key: cloudinary_api_key,
    cloudinary_api_secret: cloudinary_api_secret,
    cors_origins: cors_origins,
  ))
}
