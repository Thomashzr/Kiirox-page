import gleam/dynamic.{type Dynamic}
import gleam/erlang/process.{type Pid}
import gleam/otp/actor
import gleam/result
import pog

@external(erlang, "db_ffi", "start_pool")
fn start_pool(config: pog.Config) -> Result(Pid, Dynamic)

pub fn start(config: pog.Config) -> actor.StartResult(pog.Connection) {
  case start_pool(config) {
    Ok(pid) -> Ok(actor.Started(pid, pog.named_connection(config.pool_name)))
    Error(reason) -> Error(actor.InitExited(process.Abnormal(reason)))
  }
}

pub fn config_from_url(database_url: String) -> Result(pog.Config, String) {
  let name = process.new_name("pog_db_pool")
  case pog.url_config(name, database_url) {
    Ok(cfg) ->
      Ok(
        pog.Config(
          ..cfg,
          ssl: pog.SslVerified,
          pool_size: 2,
        ),
      )
    Error(Nil) -> Error("Failed to parse database connection URL")
  }
}

pub fn connect(database_url: String) -> Result(pog.Connection, String) {
  use cfg <- result.try(config_from_url(database_url))
  case start(cfg) {
    Ok(actor.Started(_pid, conn)) -> {
      use _ <- result.try(wait_for_ready(conn, 10))
      Ok(conn)
    }
    Error(_) -> Error("Failed to start database connection pool")
  }
}

fn wait_for_ready(conn: pog.Connection, attempts_left: Int) -> Result(Nil, String) {
  case attempts_left <= 0 {
    True -> Error("Timed out waiting for database connection to be ready")
    False -> {
      case pog.query("SELECT 1;") |> pog.execute(conn) {
        Ok(_) -> Ok(Nil)
        Error(_) -> {
          process.sleep(300)
          wait_for_ready(conn, attempts_left - 1)
        }
      }
    }
  }
}
