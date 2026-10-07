import domain/admin.{
  type AdminRepository, DatabaseError, Forbidden, Unauthorized,
}

import gleam/dynamic/decode
import gleam/json
import gleam/list
import gleam/result
import gleam/string
import infrastructure/json_encoders
import wisp.{type Request, type Response}

@external(erlang, "db_ffi", "decode_jwt_payload")
fn decode_jwt_payload(token: String) -> Result(String, Nil)

pub fn handle_admin_me(req: Request, admin_repo: AdminRepository) -> Response {
  case extract_bearer_token(req) {
    Error(_) -> error_response("UNAUTHORIZED", "Falta token de autorización Bearer", 401)
    Ok(token) -> {
      case decode_and_verify_token(token) {
        Error(_) -> error_response("UNAUTHORIZED", "Token de autorización inválido o malformado", 401)
        Ok(claims) -> {
          let user_result = case admin_repo.find_admin_by_clerk_id(claims.sub) {
            Ok(user) -> Ok(user)
            Error(_) -> {
              case claims.email {
                "" -> Error(Unauthorized("Administrador no autorizado"))
                email -> admin_repo.find_admin_by_email(email)
              }
            }
          }

          case user_result {
            Ok(admin_user) -> {
              json.object([
                #("admin", json_encoders.admin_user_to_json(admin_user)),
              ])
              |> json.to_string
              |> wisp.json_response(200)
            }
            Error(Unauthorized(msg)) -> error_response("UNAUTHORIZED", msg, 401)
            Error(Forbidden(msg)) -> error_response("FORBIDDEN", msg, 403)
            Error(DatabaseError(msg)) -> error_response("DATABASE_ERROR", msg, 500)
          }
        }
      }
    }
  }
}

pub type TokenClaims {
  TokenClaims(sub: String, email: String)
}

fn claims_decoder() -> decode.Decoder(TokenClaims) {
  use sub <- decode.field("sub", decode.string)
  use email <- decode.optional_field("email", "", decode.string)
  decode.success(TokenClaims(sub:, email:))
}

fn extract_bearer_token(req: Request) -> Result(String, Nil) {
  let auth_header =
    list.key_find(req.headers, "authorization")
    |> result.unwrap("")

  case string.starts_with(auth_header, "Bearer ") {
    True -> Ok(string.drop_start(auth_header, 7))
    False -> Error(Nil)
  }
}

fn decode_and_verify_token(token: String) -> Result(TokenClaims, Nil) {
  use payload_json <- result.try(decode_jwt_payload(token))
  json.parse(payload_json, claims_decoder())
  |> result.replace_error(Nil)
}

fn error_response(code: String, message: String, status: Int) -> Response {
  json.object([
    #(
      "error",
      json.object([
        #("code", json.string(code)),
        #("message", json.string(message)),
        #("details", json.object([])),
      ]),
    ),
  ])
  |> json.to_string
  |> wisp.json_response(status)
}
