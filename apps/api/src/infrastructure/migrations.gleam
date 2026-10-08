import gleam/dynamic/decode
import gleam/list
import gleam/result
import pog

pub fn init_migrations_table(conn: pog.Connection) -> Result(Nil, String) {
  let sql =
    "CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(100) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );"

  pog.query(sql)
  |> pog.execute(conn)
  |> result.replace(Nil)
  |> result.map_error(fn(err) {
    "Failed to initialize schema_migrations table: " <> error_to_string(err)
  })
}

pub fn is_migration_applied(
  conn: pog.Connection,
  version: String,
) -> Result(Bool, String) {
  let query =
    pog.query(
      "SELECT version FROM schema_migrations WHERE version = $1 LIMIT 1;",
    )
    |> pog.parameter(pog.text(version))
    |> pog.returning(decode.string)

  case pog.execute(query, conn) {
    Ok(pog.Returned(count: count, rows: _)) -> Ok(count > 0)
    Error(err) ->
      Error("Failed to check migration status: " <> error_to_string(err))
  }
}

pub fn apply_migration(
  conn: pog.Connection,
  version: String,
  sql: String,
) -> Result(Bool, String) {
  use is_applied <- result.try(is_migration_applied(conn, version))

  case is_applied {
    True -> Ok(False)
    False -> {
      use _ <- result.try(
        pog.query(sql)
        |> pog.execute(conn)
        |> result.replace(Nil)
        |> result.map_error(fn(err) {
          "Failed executing migration "
          <> version
          <> ": "
          <> error_to_string(err)
        }),
      )

      use _ <- result.try(
        pog.query("INSERT INTO schema_migrations (version) VALUES ($1);")
        |> pog.parameter(pog.text(version))
        |> pog.execute(conn)
        |> result.replace(Nil)
        |> result.map_error(fn(err) {
          "Failed recording migration "
          <> version
          <> ": "
          <> error_to_string(err)
        }),
      )

      Ok(True)
    }
  }
}

pub fn run_all(
  conn: pog.Connection,
  migrations: List(#(String, String)),
) -> Result(List(#(String, Bool)), String) {
  use _ <- result.try(init_migrations_table(conn))

  list.try_map(migrations, fn(item) {
    let #(version, sql) = item
    use applied <- result.try(apply_migration(conn, version, sql))
    Ok(#(version, applied))
  })
}

fn error_to_string(err: pog.QueryError) -> String {
  case err {
    pog.ConstraintViolated(message, constraint, _) ->
      "Constraint violation on " <> constraint <> ": " <> message
    pog.PostgresqlError(code, name, message) ->
      "[" <> code <> "] " <> name <> ": " <> message
    pog.UnexpectedArgumentCount(_expected, _got) -> "Unexpected argument count"
    pog.UnexpectedArgumentType(_expected, _got) -> "Unexpected argument type"
    pog.UnexpectedResultType(_) -> "Unexpected result type"
    pog.QueryTimeout -> "Query timeout"
    pog.ConnectionUnavailable -> "Connection unavailable"
  }
}
