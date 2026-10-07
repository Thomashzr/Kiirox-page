# Stack del Proyecto — Documento para el Agente

> Este archivo define el stack oficial del proyecto. El agente debe respetarlo
> y no introducir servicios alternativos sin confirmación explícita del usuario.

## Stack oficial

| Pieza      | Servicio            | Plan            | Notas                                          |
|------------|---------------------|-----------------|------------------------------------------------|
| Frontend   | Vercel              | Free (Hobby)    | Ya contratado. Deploy automático desde Git.    |
| Base de datos | Neon (PostgreSQL) | Free            | Ya contratada. Serverless Postgres con branching. |
| Backend    | Fly.io              | Free allowance  | Gleam compilado a Erlang/BEAM.                 |
| Auth       | Clerk               | Free (10k usuarios/mes) | SDK oficial para React/Next.js.          |
| Imágenes   | Cloudinary          | Free (25 GB, 25k transformaciones/mes) | CDN + redimensionamiento on-the-fly. |

## Backend (Gleam en Fly.io)

- El backend está escrito en **Gleam** y se despliega como release Erlang.
- Build: `gleam export erlang-shipment` dentro de un `Dockerfile` multietapa.
- El servicio en Fly.io usa una VM compartida (256 MB RAM) — el BEAM es suficiente.
- Health check obligatorio en `/health` para que Fly lo considere sano.
- Config de despliegue: archivo `fly.toml` en la raíz del backend.

Comandos útiles:

```bash
fly deploy              # desplegar
fly logs                # ver logs
fly status              # estado del servicio
```

## Base de datos (Neon)

- Conexión vía URL de conexión (variable `DATABASE_URL`) — nunca hardcodear credenciales.
- Neon usa conexión serverless: usar un pooler (puerto 5432 con `?sslmode=require` o el pooler de Neon) y mantener la cantidad de conexiones baja (BEAM pool pequeño, ej. 2-5).
- Los branches de Neon sirven para previews en Vercel; el branch `main` es producción.

## Auth (Clerk)

- El frontend valida sesiones con el SDK de Clerk (React/Next.js middleware).
- El backend **no** confía en cookies crudas: valida el JWT de Clerk con su clave pública (`CLERK_JWT_KEY` / `CLERK_SECRET_KEY` en variables de entorno).
- Webhooks de Clerk (creación/actualización de usuario) deben verificar la firma `Svix`.

## Imágenes (Cloudinary)

- Upload directo desde el cliente con **unsigned preset** o firmado desde el backend.
- Usar transformaciones automáticas (ej. `w_800,q_auto,f_auto`) para no servir imágenes originales.
- Guardar en la DB solo la `public_id` o la URL transformada, nunca el archivo binario.

## Variables de entorno esperadas

| Variable              | Dónde vive        | Uso                              |
|-----------------------|-------------------|----------------------------------|
| `DATABASE_URL`        | Backend (Fly.io)  | Conexión a Neon                  |
| `CLERK_SECRET_KEY`    | Backend (Fly.io)  | Validación de JWT / webhooks     |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Frontend (Vercel) | SDK de Clerk en el cliente |
| `CLOUDINARY_CLOUD_NAME` | Ambos           | Identificación del cloud         |
| `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Backend | Firmas de upload           |

## Reglas para el agente

1. No agregar servicios nuevos (Redis, colas, S3, etc.) sin consultar primero — el plan es mantener todo en el tier gratuito.
2. Todo secreto va en variables de entorno; nunca en el código ni en commits.
3. El backend debe compilar con `gleam build` sin warnings críticos antes de cada deploy.
4. Migraciones de DB: aplicarlas de forma reproducible (script de migración en el repo, ejecutado al desplegar o manualmente contra Neon).
5. Si un recurso gratuito se queda corto (ej. límite de Cloudinary), avisar al usuario antes de cambiar de plan o de servicio.
