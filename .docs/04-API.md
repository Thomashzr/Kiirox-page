# KIIROX — API REST

## 1. Convenciones

Base URL:

```text
/api/v1
```

Formato:

```text
Content-Type: application/json
```

IDs: UUID.

Errores:

```json
{
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product not found",
    "details": {}
  }
}
```

No devolver stack traces al cliente.

## 2. Público

### GET /products

Query:

```text
?page=1&page_size=24
&category=running-gels
&search=maurten
&featured=true
&new=true
&sort=featured
```

Respuesta conceptual:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "page_size": 24,
    "total": 100
  }
}
```

### GET /products/:slug

Devuelve producto publicado.

### GET /categories

Devuelve categorías activas.

### GET /categories/:slug/products

Devuelve productos publicados de la categoría.

### GET /config/public

Configuración pública no sensible:

```json
{
  "store_name": "KIIROX",
  "whatsapp_number": "...",
  "currency": "ARS"
}
```

## 3. Administración

Todos los endpoints administrativos requieren autenticación mediante JWT de Clerk:
Header: `Authorization: Bearer <token_jwt_clerk>`.
El backend Gleam valida la firma del token con su clave pública (`CLERK_JWT_KEY` / `CLERK_SECRET_KEY`).
(El login, registro, logout y rotación de sesión son manejados en el frontend por Clerk SDK).

### GET /admin/me

Devuelve la identidad y permisos del administrador extraídos/validados del JWT de Clerk.

### POST /webhooks/clerk

Endpoint para recibir eventos del ciclo de vida de usuarios desde Clerk (ej. `user.created`, `user.updated`).
Debe verificar la firma de **Svix** antes de procesar el payload.

### GET /admin/products

CRUD administrativo con filtros.

### POST /admin/products

Crea producto.

### GET /admin/products/:id

Obtiene producto administrativo.

### PATCH /admin/products/:id

Actualiza campos permitidos.

### DELETE /admin/products/:id

Preferir archivar sobre borrar cuando el producto tenga historial.

### POST /admin/categories

Crear categoría.

### PATCH /admin/categories/:id

Modificar categoría.

### DELETE /admin/categories/:id

Desactivar/archivar si tiene productos.

### POST /admin/products/:id/images

Registra una imagen subida a Cloudinary (`public_id`, `public_url`, `alt_text`, `is_primary`, `sort_order`).
Opcionalmente, puede existir un endpoint previo `POST /admin/media/sign-upload` si se requiere firma de subida directa a Cloudinary desde el cliente.

### DELETE /admin/products/:id/images/:image_id

Elimina el registro de la imagen en la base de datos y opcionalmente solicita borrado en Cloudinary mediante API Secret.

### POST /admin/products/:id/stock-movements

Request:

```json
{
  "delta": 10,
  "movement_type": "purchase",
  "reason": "Ingreso proveedor"
}
```

La API calcula el nuevo stock; el cliente no lo establece directamente.

### GET /admin/products/:id/stock-movements

Historial.

### GET /admin/dashboard

Resumen administrativo.

## 4. HTTP status

```text
200 OK
201 Created
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
429 Too Many Requests
500 Internal Server Error
```

## 5. Idempotencia

V1:

- GET es idempotente.
- login/logout debe tolerar repetición.
- movimientos de stock deben evitar duplicación accidental.

Cuando existan pedidos, usar una clave de idempotencia para operaciones que creen entidades o afecten dinero/stock.

## 6. Paginación

No devolver catálogos ilimitados.

V1 puede usar offset pagination. Si el catálogo crece mucho, migrar a cursor pagination.

## 7. CORS

Permitir únicamente:

```text
https://www.kiirox...
https://kiirox...
```

y origins de desarrollo explícitos.

No usar `*` con credenciales.

## 8. Contrato

Si el frontend y backend se desarrollan por separado, generar OpenAPI como fuente de documentación del contrato una vez estabilizados los endpoints.
