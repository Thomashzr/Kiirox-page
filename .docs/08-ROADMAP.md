# KIIROX — Roadmap de implementación

## Fase 0 — Bootstrap

Objetivo: repositorio ejecutable.

- crear repo;
- Next.js;
- Gleam;
- Wisp/Mist;
- conexión PostgreSQL;
- configuración por entorno;
- Docker para API si corresponde;
- CI;
- health endpoint.

Criterio de terminado:

```text
web responde
api responde
api conecta a DB
CI verde
```

## Fase 1 — Base de datos

- migraciones;
- categories;
- products;
- product_images;
- inventory_movements;
- admin_users;
- admin_sessions;
- índices;
- constraints.

Crear seed de desarrollo.

## Fase 2 — Catálogo API

Implementar:

```text
GET /products
GET /products/:slug
GET /categories
GET /categories/:slug/products
GET /config/public
```

Tests de integración.

## Fase 3 — Frontend público

- Home;
- catálogo;
- categorías;
- producto;
- responsive;
- SEO;
- loading/error/empty states.

## Fase 4 — Carrito

- localStorage;
- cantidades;
- eliminar;
- resumen;
- WhatsApp;
- copiar;
- descargar `.txt`.

## Fase 5 — Autenticación admin (Clerk)

- Integración de Clerk en Next.js (middleware, componentes de login);
- Middleware de validación de JWT de Clerk en Gleam API (`Authorization: Bearer <token>`);
- Webhook de Clerk para sincronización de admin si aplica (validación Svix);
- Protección de rutas `/admin` y endpoints de API.

## Fase 6 — Administración de productos

- listado;
- crear;
- editar;
- publicar;
- archivar;
- destacado;
- nuevo;
- orden;
- imágenes (subida e integración con Cloudinary).

## Fase 7 — Stock

- ajuste;
- entrada;
- salida;
- historial;
- bajo stock;
- agotado.

Toda modificación debe crear movimiento.

## Fase 8 — Deploy

- Neon PostgreSQL producción (branch main);
- Cloudinary configuración y credenciales;
- Clerk configuración de producción;
- Backend en Fly.io (`fly deploy`, `fly.toml`);
- Frontend en Vercel;
- Dominio y certificados HTTPS;
- Variables de entorno en producción;
- Smoke tests.

## Fase 9 — Hardening

- revisión de seguridad;
- rate limiting;
- headers;
- CORS;
- backups;
- logs;
- pruebas de concurrencia sobre stock.

## Fase 10 — V2

Solo después de tener V1 estable:

- pedidos;
- clientes;
- proveedores;
- compras;
- costos;
- historial de precios;
- gastos;
- rentabilidad;
- dashboard financiero;
- exportaciones.

## Regla de desarrollo

No implementar Fase 10 antes de cerrar Fases 0–9.

## Vertical slice recomendado

Primera funcionalidad completa:

```text
Category
  -> Product
  -> GET public product
  -> render frontend
```

Después:

```text
Admin login
  -> create product
  -> product appears publicly
```

Después:

```text
Admin stock movement
  -> stock changes
  -> public availability changes
```

Esto valida la arquitectura antes de construir todo el sistema.
