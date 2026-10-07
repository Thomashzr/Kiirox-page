# KIIROX — Arquitectura

## 1. Objetivo

Diseñar una arquitectura modular, simple de desplegar y preparada para crecimiento.

### Arquitectura lógica

```text
                    INTERNET
                       |
                 HTTPS / CDN
                       |
                    INTERNET
                       |
                 HTTPS / CDN
                       |
                +--------------+
                |   Vercel     |
                | Next.js Web  |
                +------+-------+
                       |
                 HTTPS JSON REST (JWT Clerk)
                       |
                +------+-------+
                | Fly.io: API  |
                | Gleam + Wisp |
                | + Mist (BEAM)|
                +------+-------+
                       |
                 PostgreSQL (SSL)
                       |
                +------+-------+
                |     Neon     |
                |  PostgreSQL  |
                +--------------+

Imágenes & Media:
                +--------------+
                |  Cloudinary  |
                | CDN / Media  |
                +--------------+

Auth:
                +--------------+
                |    Clerk     |
                | Auth Service |
                +--------------+

Admin browser
     |
     +---- Next.js /admin (Clerk Auth)
                |
                +---- Gleam API (Fly.io) ---- Neon PostgreSQL
```

## 2. Principios

- PostgreSQL es la fuente de verdad.
- El frontend nunca modifica directamente inventario.
- El backend contiene las reglas de negocio.
- El stock se modifica mediante operaciones explícitas.
- Los precios de un pedido/solicitud se copian como snapshot cuando se cree una entidad persistente de pedido.
- El carrito V1 puede vivir del lado del cliente.
- WhatsApp es un canal de cierre de compra, no el sistema de inventario.
- Ninguna operación administrativa depende de JavaScript del cliente para su seguridad.
- Toda entrada externa se valida en backend.
- No confiar en valores enviados por el navegador.
- Evitar microservicios hasta que exista una necesidad real.

## 3. Capas del backend

```text
src/
  kiirox/
    domain/
      product.gleam
      category.gleam
      inventory.gleam
      admin.gleam

    application/
      products/
      categories/
      inventory/
      auth/

    infrastructure/
      postgres/
      storage/
      clock/
      id/

    interfaces/
      http/
        routes.gleam
        middleware/
        handlers/
        dto/

    config.gleam
    app.gleam
    main.gleam
```

La estructura exacta puede adaptarse a las convenciones actuales de Gleam, pero se deben conservar las fronteras conceptuales.

## 4. Dependencias entre capas

```text
HTTP handlers
     |
Application services
     |
Domain
     |
Ports/interfaces
     |
Infrastructure
```

Las reglas de negocio no deben depender de Wisp, PostgreSQL, Neon, Clerk ni Cloudinary.

## 5. Módulos

### Catalog

Responsable de:

- productos;
- categorías;
- publicación;
- destacados;
- novedades;
- imágenes;
- precios públicos.

### Inventory

Responsable de:

- stock actual;
- movimientos;
- ajustes;
- entradas;
- salidas;
- reserva futura si se implementa.

Nunca actualizar `products.stock` desde múltiples lugares sin una regla central.

### Admin/Auth

Responsable de:

- login;
- sesiones;
- permisos;
- logout;
- protección de endpoints.

### Cart

En V1 puede ser principalmente frontend. El backend debe ofrecer información de catálogo necesaria para validar que el producto existe y está disponible si se decide crear una solicitud de compra.

### Orders — futuro

Preparar el dominio, pero no implementarlo completamente en V1.

## 6. Flujo público

```text
Home
  -> Productos
  -> Producto
  -> Agregar al carrito
  -> Carrito
  -> Validar datos
  -> Generar mensaje
  -> WhatsApp
```

No afirmar "pedido confirmado" antes de confirmación comercial.

## 7. Flujo administrativo

```text
Login
  -> sesión segura
  -> dashboard
  -> producto/categoría/stock
  -> validación
  -> service
  -> transaction DB
  -> respuesta
```

## 8. Escalabilidad

Primera etapa:

```text
1 frontend + 1 backend + 1 PostgreSQL
```

Si crece:

```text
CDN/cache
   |
Frontend
   |
Load balancer
   |
+------+------+
|             |
API 1        API 2
   \           /
    PostgreSQL
```

Más adelante se pueden extraer módulos concretos, pero no diseñar esa complejidad ahora.

## 9. Integraciones

### Cloudinary (Imágenes)

Usar Cloudinary para imágenes (CDN + redimensionamiento on-the-fly). No almacenar binarios de imágenes en PostgreSQL. Guardar en la DB solo el `public_id` o la URL transformada (`w_800,q_auto,f_auto`). El upload puede realizarse directo desde el cliente con unsigned preset o firmado desde el backend.

### Clerk (Autenticación)

El frontend valida sesiones con el SDK de Clerk (React/Next.js middleware). El backend valida el JWT de Clerk con su clave pública o verifica webhooks con Svix.

### WhatsApp

Generar URL de WhatsApp desde el frontend con un mensaje construido a partir del carrito. El número y texto deben ser configurables.

No usar una API de WhatsApp Business en V1 salvo que aparezca una necesidad comercial real.

## 10. Decisiones explícitas

- No usar ORM de TypeScript para el backend.
- No usar Firebase ni Supabase.
- No usar Redis en V1.
- No usar microservicios.
- No usar serverless para Gleam por defecto (desplegar en Fly.io).
- No exponer credenciales PostgreSQL ni API secrets al frontend.
- No permitir acceso administrativo sin validar el JWT de Clerk en el backend.
