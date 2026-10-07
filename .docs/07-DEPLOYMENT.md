# KIIROX — Desarrollo y despliegue

## 1. Repositorio

Recomendación:

```text
kiirox/
  apps/
    web/
    api/
  packages/
    contracts/
    config/
  infra/
    migrations/
  docs/
```

Alternativa inicial aceptable: dos repositorios separados. Si se usa monorepo, mantener claramente separado Next.js y Gleam.

## 2. Desarrollo local

Servicios:

```text
Next.js       localhost:3000
Gleam API     localhost:4000
PostgreSQL    local o Neon dev branch
```

Preferencia:

- PostgreSQL local o Neon branch de desarrollo;
- Branch `main` en Neon para producción (con branching para previews).

No usar producción como entorno de desarrollo.

## 3. Variables de entorno

Frontend (Vercel):

```text
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_WHATSAPP_NUMBER=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLOUDINARY_CLOUD_NAME=
```

Backend (Fly.io):

```text
PORT=4000
DATABASE_URL=
CLERK_SECRET_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CORS_ORIGINS=
```

## 4. Entornos

```text
development
staging
production
```

No mezclar bases de datos.

## 5. Vercel

Deploy del frontend Next.js.

Configurar:

- dominio;
- variables de entorno;
- preview deployments;
- production deployment.

No asumir que el backend Gleam corre en Vercel.

## 6. Backend (Fly.io)

El backend Gleam se compila a release Erlang/BEAM y se despliega en **Fly.io**:

- Build: `gleam export erlang-shipment` dentro de un `Dockerfile` multietapa.
- VM en Fly.io: compartida (256 MB RAM) dentro del Free allowance.
- Health check obligatorio en `/health` para que Fly lo considere sano.
- Configuración de despliegue: archivo `fly.toml` en la raíz del backend.
- Comandos útiles: `fly deploy`, `fly logs`, `fly status`.

## 7. Health checks

Endpoint:

```text
GET /health
```

Respuesta:

```json
{
  "status": "ok"
}
```

Opcional:

```text
GET /ready
```

que compruebe dependencias críticas sin exponer información sensible.

## 8. CI

En cada PR:

```text
frontend:
  lint
  typecheck
  test
  build

backend:
  gleam format --check
  gleam check
  gleam test
```

Además:

- migraciones verificadas;
- tests de API;
- seguridad básica;
- build de Docker si aplica.

## 9. Producción

Orden:

```text
merge
 -> CI
 -> migración compatible
 -> deploy backend (Fly.io)
 -> deploy frontend (Vercel)
 -> smoke tests
```

No ejecutar migraciones destructivas automáticamente sin revisión.

## 10. Base de datos (Neon)

Neon proporciona PostgreSQL serverless con branching:

- Conexión vía URL de conexión (`DATABASE_URL`) con `?sslmode=require`.
- Usar pooler de Neon o mantener el pool de BEAM pequeño (ej. 2-5 conexiones) para no saturar los límites de Neon.
- Branch `main` para producción; branches efímeros para previews o staging.
- Mantener scripts de migración reproducibles y versionados en el repositorio.

## 11. Storage e Imágenes (Cloudinary)

Cloudinary proporciona CDN y redimensionamiento/optimización de imágenes:

- Plan gratuito: 25 GB y 25k transformaciones/mes.
- Subida directa desde el cliente mediante unsigned preset o firmado desde backend con API Secret.
- Transformaciones on-the-fly automáticas (`w_800,q_auto,f_auto`).
- Guardar únicamente el `public_id` o URL optimizada en Neon PostgreSQL.

## 12. Dominio

Ideal:

```text
kiirox.com.ar
www.kiirox.com.ar
api.kiirox.com.ar
```

Frontend:

```text
www.kiirox.com.ar
```

Backend:

```text
api.kiirox.com.ar
```

El frontend debe llamar siempre al API mediante HTTPS.

## 13. Free tier

La arquitectura puede arrancar con servicios gratuitos o de bajo costo, pero el agente no debe asumir límites permanentes.

Antes de seleccionar proveedor de backend, verificar:

- si soporta BEAM/Gleam;
- si el free tier sigue vigente;
- si duerme el proceso;
- límites de RAM;
- límites de CPU;
- límites de transferencia;
- persistencia;
- restricciones de puerto.

Si el free tier no es adecuado, priorizar portabilidad sobre forzar una plataforma.

## 14. Observabilidad

V1:

- logs estructurados;
- request ID;
- health endpoint.

Posteriormente:

- métricas;
- tracing;
- error tracking.
