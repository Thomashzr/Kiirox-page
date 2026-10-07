import config
import gleam/io
import gleam/list
import gleam/string
import infrastructure/database
import infrastructure/migrations
import infrastructure/schema

pub fn main() -> Nil {
  io.println("=== KIIROX API Starting ===")

  case config.load() {
    Error(err) -> {
      io.println("Config Warning: " <> err)
      io.println("Running in standalone/bootstrap mode")
    }
    Ok(cfg) -> {
      io.println("Config loaded successfully (port: " <> string.inspect(cfg.port) <> ")")
      io.println("Connecting to Neon PostgreSQL...")

      case database.connect(cfg.database_url) {
        Error(db_err) -> {
          io.println("Database connection error: " <> db_err)
        }
        Ok(conn) -> {
          io.println("Connected to PostgreSQL successfully.")
          io.println("Running migrations...")

          let migration_list = [
            #("001_initial_schema", schema.migration_001_initial_schema),
          ]

          case migrations.run_all(conn, migration_list) {
            Ok(results) -> {
              list.each(results, fn(res) {
                let #(version, applied) = res
                case applied {
                  True -> io.println("✓ Applied migration: " <> version)
                  False -> io.println("- Already up-to-date: " <> version)
                }
              })
              io.println("Database migrations verified!")
            }
            Error(mig_err) -> {
              io.println("Migration error: " <> mig_err)
            }
          }
        }
      }
    }
  }
}
