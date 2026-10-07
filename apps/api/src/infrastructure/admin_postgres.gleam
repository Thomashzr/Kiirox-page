import domain/admin.{
  type AdminError, type AdminRepository, type AdminUser, Admin,
  AdminRepository, AdminUser, DatabaseError, Unauthorized,
  string_to_role,
}
import gleam/dynamic/decode
import gleam/option
import gleam/result
import pog

pub fn new(conn: pog.Connection) -> AdminRepository {
  AdminRepository(
    find_admin_by_clerk_id: fn(clerk_id) {
      find_admin_by_clerk_id_from_db(conn, clerk_id)
    },
    find_admin_by_email: fn(email) {
      find_admin_by_email_from_db(conn, email)
    },
  )
}

fn admin_user_decoder() -> decode.Decoder(AdminUser) {
  use id <- decode.field(0, decode.string)
  use clerk_user_id <- decode.field(1, decode.optional(decode.string))
  use email <- decode.field(2, decode.string)
  use role_str <- decode.field(3, decode.string)
  use is_active <- decode.field(4, decode.bool)
  use created_at <- decode.field(5, decode.string)
  use updated_at <- decode.field(6, decode.string)

  let role = case string_to_role(role_str) {
    Ok(r) -> r
    Error(_) -> Admin
  }
  let c_id = option.unwrap(clerk_user_id, "")

  decode.success(AdminUser(
    id:,
    clerk_user_id: c_id,
    email:,
    role:,
    is_active:,
    created_at:,
    updated_at:,
  ))
}

fn find_admin_by_clerk_id_from_db(
  conn: pog.Connection,
  clerk_id: String,
) -> Result(AdminUser, AdminError) {
  let sql = "
    SELECT id::text, clerk_user_id, email, role, is_active, created_at::text, updated_at::text
    FROM admin_users
    WHERE clerk_user_id = $1 AND is_active = true
    LIMIT 1;
  "

  pog.query(sql)
  |> pog.parameter(pog.text(clerk_id))
  |> pog.returning(admin_user_decoder())
  |> pog.execute(conn)
  |> result.map_error(fn(err) { DatabaseError(pog_error_to_string(err)) })
  |> result.try(fn(res) {
    case res.rows {
      [user, ..] -> Ok(user)
      [] -> Error(Unauthorized("Administrador no encontrado"))
    }
  })
}

fn find_admin_by_email_from_db(
  conn: pog.Connection,
  email: String,
) -> Result(AdminUser, AdminError) {
  let sql = "
    SELECT id::text, clerk_user_id, email, role, is_active, created_at::text, updated_at::text
    FROM admin_users
    WHERE email = $1 AND is_active = true
    LIMIT 1;
  "

  pog.query(sql)
  |> pog.parameter(pog.text(email))
  |> pog.returning(admin_user_decoder())
  |> pog.execute(conn)
  |> result.map_error(fn(err) { DatabaseError(pog_error_to_string(err)) })
  |> result.try(fn(res) {
    case res.rows {
      [user, ..] -> Ok(user)
      [] -> Error(Unauthorized("Administrador no encontrado"))
    }
  })
}

fn pog_error_to_string(err: pog.QueryError) -> String {
  case err {
    pog.ConstraintViolated(msg, _, _) -> "Constraint violation: " <> msg
    pog.PostgresqlError(code, name, msg) ->
      "Postgres error " <> code <> " (" <> name <> "): " <> msg
    pog.UnexpectedArgumentCount(expected, got) ->
      "Unexpected arg count: expected "
      <> int_to_string(expected)
      <> ", got "
      <> int_to_string(got)
    pog.UnexpectedArgumentType(expected, got) ->
      "Unexpected arg type: expected " <> expected <> ", got " <> got
    pog.UnexpectedResultType(_) -> "Unexpected result type from database"
    pog.ConnectionUnavailable -> "Database connection unavailable"
    pog.QueryTimeout -> "Database query timed out"
  }
}


@external(erlang, "erlang", "integer_to_binary")
fn int_to_string(n: Int) -> String
