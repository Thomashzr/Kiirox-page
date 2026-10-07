# KIIROX — AGENTS.md

> Documento principal de instrucciones para agentes de desarrollo.
>
> Este archivo define las reglas, arquitectura, prioridades y flujo de trabajo del proyecto KIIROX.
> Todo agente que trabaje sobre el repositorio debe leer este archivo antes de modificar código.

---

# 1. Identidad del proyecto

**KIIROX** es una plataforma web comercial para la venta de productos relacionados principalmente con running, nutrición deportiva y accesorios.

La primera versión será un **catálogo/e-commerce sin pago online integrado**.

El cliente:

1. Navega por el catálogo.
2. Consulta productos.
3. Agrega productos al carrito.
4. Revisa el carrito.
5. Finaliza la intención de compra mediante WhatsApp.
6. Opcionalmente descarga o copia la lista de compra.

El administrador:

1. Inicia sesión.
2. Administra productos.
3. Administra categorías.
4. Administra imágenes.
5. Administra precios.
6. Administra stock.
7. Define productos destacados.
8. Define productos nuevos.
9. Publica, despublica o archiva productos.
10. Consulta movimientos de stock.

El sistema debe estar diseñado desde el comienzo para evolucionar posteriormente hacia:

* pedidos;
* clientes;
* proveedores;
* compras;
* costos;
* movimientos financieros;
* rentabilidad;
* pagos online;
* estadísticas;
* gestión integral del negocio.

---

# 2. Objetivo técnico

Construir una aplicación:

* mantenible;
* segura;
* modular;
* escalable;
* portable;
* relativamente económica de operar;
* adecuada para producción;
* comprensible para un desarrollador que continúe el proyecto en el futuro.

La prioridad es:

```text
Correctitud
    >
Seguridad
    >
Mantenibilidad
    >
Simplicidad
    >
Performance
    >
Micro-optimizaciones
```

No agregar complejidad arquitectónica sin una necesidad real.

---

# 3. Stack obligatorio

## Frontend

* Next.js
* TypeScript
* React
* Tailwind CSS
* shadcn/ui

## Backend

* Gleam
* BEAM/OTP
* Wisp
* Mist

El backend debe ser una API REST independiente del frontend.

## Base de datos

**Neon PostgreSQL**

Neon es el proveedor PostgreSQL serverless oficial del proyecto.

La aplicación debe tratar PostgreSQL como la fuente de verdad.

No utilizar Supabase para la base de datos.

## Autenticación

**Clerk**

Clerk es el servicio oficial de autenticación (plan Free).
- Frontend valida sesiones con el SDK oficial de Clerk para React/Next.js.
- Backend Gleam valida el token JWT de Clerk usando `CLERK_JWT_KEY` / `CLERK_SECRET_KEY`.
- Webhooks de Clerk validados con Svix.

## Storage e Imágenes

**Cloudinary**

Cloudinary es el servicio oficial para almacenamiento y entrega de imágenes (plan Free).
- Upload directo con unsigned preset o firmado desde backend.
- Transformaciones automáticas on-the-fly (`w_800,q_auto,f_auto`).
- Guardar en PostgreSQL solo el `public_id` o URL optimizada, nunca binarios.

## Hosting

Frontend:

```text
Vercel (Free Hobby)
```

Backend:

```text
Fly.io (Free allowance - Gleam en VM BEAM de 256 MB)
```

Build mediante `gleam export erlang-shipment` en Dockerfile multietapa y `fly.toml`.

Base de datos:

```text
Neon PostgreSQL (Free)
```

## Control de versiones

```text
Git
GitHub
```

---

# 4. Arquitectura general

La arquitectura inicial será un **monolito modular**, no microservicios.

```text
                         INTERNET
                            │
                            ▼
                    ┌───────────────┐
                    │    Vercel     │
                    │   Next.js     │
                    └───────┬───────┘
                            │
                         HTTPS
                            │
                            ▼
                    ┌───────────────┐
                    │ KIIROX API    │
                    │ Gleam         │
                    │ Wisp + Mist   │
                    └───────┬───────┘
                            │
                       PostgreSQL
                            │
                    ┌───────▼───────┐
                    │     Neon      │
                    │  PostgreSQL   │
                    └───────────────┘
```

Storage:

```text
Next.js / Admin
       │
       ▼
Object Storage
       │
       └── URL
            │
            ▼
        PostgreSQL
```

---

# 5. Regla arquitectónica principal

## NO crear microservicios.

La aplicación debe comenzar como:

```text
Frontend
    +
Backend modular
    +
PostgreSQL
```

El backend debe tener límites internos claros.

Por ejemplo:

```text
api/
└── src/
    └── kiirox/
        ├── domain/
        ├── application/
        ├── infrastructure/
        └── interfaces/
```

Los módulos deben poder separarse en el futuro si realmente fuera necesario.

No anticipar esa separación.

---

# 6. Capas del backend

La dependencia debe seguir aproximadamente:

```text
HTTP
 │
 ▼
Application
 │
 ▼
Domain
 │
 ▼
Ports
 │
 ▼
Infrastructure
```

## HTTP

Responsable de:

* routing;
* HTTP;
* headers;
* autenticación de requests;
* parsing;
* serialización;
* status codes.

No debe contener reglas de negocio complejas.

## Application

Responsable de:

* casos de uso;
* coordinación;
* transacciones;
* permisos de aplicación.

Ejemplos:

```text
CreateProduct
UpdateProduct
PublishProduct
ArchiveProduct
AdjustStock
CreateCategory
LoginAdmin
```

## Domain

Responsable de:

* entidades;
* value objects;
* reglas de negocio;
* validaciones propias del dominio.

El dominio no debe conocer:

* HTTP;
* Wisp;
* PostgreSQL;
* Neon;
* JSON;
* Next.js.

## Infrastructure

Responsable de:

* PostgreSQL;
* Storage;
* generación de IDs;
* reloj;
* hashing;
* sesiones;
* implementaciones concretas de repositories.

---

# 7. Frontend

El frontend estará construido con Next.js.

Debe separar claramente:

```text
public store
admin
shared components
features
API client
state
```

Estructura aproximada:

```text
apps/web/

├── app/
│   ├── (store)/
│   │   ├── page.tsx
│   │   ├── productos/
│   │   └── categorias/
│   │
│   └── admin/
│       ├── login/
│       ├── productos/
│       ├── categorias/
│       └── stock/
│
├── components/
├── features/
├── lib/
└── public/
```

La estructura puede adaptarse a las convenciones actuales de Next.js.

No crear carpetas artificiales solamente para seguir este ejemplo.

---

# 8. Catálogo público

El catálogo debe permitir:

* ver productos;
* buscar;
* filtrar por categoría;
* ordenar;
* consultar disponibilidad;
* acceder al detalle;
* agregar al carrito.

Las páginas públicas deben ser optimizadas para:

* SEO;
* performance;
* mobile;
* accesibilidad.

---

# 9. Home

La página principal debe poder mostrar contenido administrable.

Secciones previstas:

```text
Header
Hero
Categorías
Productos destacados
Productos nuevos
Información de KIIROX
CTA
Footer
```

Los productos destacados y nuevos deben provenir de la API/base de datos.

No hardcodear productos.

---

# 10. Productos

Cada producto debe tener como mínimo:

```text
id
sku
name
slug
brand
short_description
description
price
currency
stock
low_stock_threshold
status
is_featured
is_new
sort_order
category_id
created_at
updated_at
```

Estados:

```text
draft
published
archived
```

Reglas:

```text
draft
→ no aparece públicamente

published
→ aparece públicamente

archived
→ no aparece públicamente
```

---

# 11. Categorías

Cada categoría debe tener:

```text
id
name
slug
description
image
is_active
sort_order
created_at
updated_at
```

V1:

```text
category 1 ─── N products
```

No implementar múltiples categorías por producto salvo necesidad real.

---

# 12. Carrito

El carrito V1 será principalmente responsabilidad del frontend.

Puede utilizar:

```text
localStorage
```

Debe sobrevivir a:

* refresh;
* navegación;
* cierre y reapertura del navegador.

El carrito debe contener referencias a productos y cantidades.

No confiar en el carrito como fuente de verdad.

---

# 13. Regla crítica sobre precios

Nunca confiar en precios enviados por el cliente.

El frontend puede mostrar:

```text
Producto A
$10.000
```

pero el backend debe ser la autoridad cuando exista una operación persistente.

Cuando se implemente el sistema de pedidos:

```text
client
  │
  │ product_id + quantity
  ▼
backend
  │
  ├── consulta producto
  ├── verifica stock
  ├── obtiene precio actual
  ├── genera snapshot
  └── calcula total
```

Nunca aceptar:

```json
{
  "price": 1
}
```

como precio válido simplemente porque viene del frontend.

---

# 14. WhatsApp

V1 no tendrá checkout de pago.

El cliente terminará la compra mediante WhatsApp.

Flujo:

```text
Productos
    ↓
Carrito
    ↓
Revisar
    ↓
Comprar por WhatsApp
    ↓
Generar mensaje
    ↓
WhatsApp
```

Mensaje conceptual:

```text
Hola KIIROX!

Quiero consultar por el siguiente pedido:

• 2x Gel X
• 1x Sales Y

Total estimado: $XX.XXX

¿Podrían confirmarme disponibilidad y forma de pago?
```

El sistema debe:

* URL encodear el mensaje;
* no exponer secretos;
* permitir cambiar el número de WhatsApp mediante configuración.

El envío por WhatsApp **no constituye un pedido confirmado**.

---

# 15. Stock

El stock es un área crítica.

Nunca modificar stock directamente desde el frontend.

Toda modificación debe pasar por el backend.

La operación conceptual es:

```text
BEGIN

lock product

validate operation

calculate new stock

update product

insert inventory movement

COMMIT
```

Debe evitarse la condición:

```text
dos administradores
    ↓
leen stock = 5
    ↓
ambos modifican
    ↓
resultado incorrecto
```

Usar transacciones y mecanismos adecuados de concurrencia de PostgreSQL.

---

# 16. Movimientos de stock

Cada modificación debe generar un movimiento.

Ejemplo:

```text
Producto: Gel X

Stock anterior: 10
Movimiento: +20
Motivo: Compra proveedor
Stock nuevo: 30
```

Tabla conceptual:

```text
inventory_movements

id
product_id
delta
movement_type
reason
reference_type
reference_id
admin_user_id
created_at
```

Tipos previstos:

```text
initial_stock
purchase
manual_adjustment
correction
return
sale
reservation
release
```

No utilizar estados futuros hasta que exista el flujo correspondiente.

No borrar movimientos históricos.

Una corrección se hace mediante otro movimiento.

---

# 17. Administración

Ruta:

```text
/admin
```

Debe requerir autenticación.

Secciones iniciales:

```text
Dashboard

Productos
 ├── Todos
 ├── Nuevo
 └── Editar

Categorías

Stock

Configuración
```

Dashboard inicial:

```text
Productos publicados
Productos agotados
Productos con bajo stock
Productos destacados
Productos nuevos
```

---

# 18. Autenticación (Clerk)

El panel administrativo utiliza **Clerk** como proveedor oficial de autenticación:

- El frontend Next.js utiliza el SDK oficial `@clerk/nextjs` (componentes `<SignIn />`, middleware de protección de rutas).
- El backend Gleam valida el token JWT emitido por Clerk en cada petición administrativa (`Authorization: Bearer <token>`).
- Validación en Gleam utilizando clave pública de Clerk (`CLERK_JWT_KEY` / `CLERK_SECRET_KEY`).
- No guardar contraseñas ni implementar hashing manual en la aplicación; Clerk gestiona credenciales de forma segura.

---

# 19. Sesiones y Webhooks

- Las sesiones son gestionadas integralmente por Clerk (rotación, caducidad, revocación).
- El backend no almacena tablas de sesiones en base de datos.
- Webhooks de Clerk: si el backend escucha eventos de usuario desde Clerk, debe validar la firma utilizando **Svix**.

---

# 20. Seguridad en peticiones de API

- La API administrativa se comunica mediante tokens JWT en el header `Authorization: Bearer <token>`, evitando vulnerabilidades inherentes a cookies de sesión implícitas (CSRF).
- Validar siempre los claims del token en el backend Gleam antes de autorizar cualquier mutación de datos.

---

# 21. CORS

El backend debe permitir solamente origins conocidos.

Producción:

```text
https://kiirox...
```

Desarrollo:

```text
http://localhost:3000
```

No utilizar:

```text
Access-Control-Allow-Origin: *
```

junto con credenciales.

---

# 22. Base de datos

La base de datos oficial es:

```text
Neon PostgreSQL
```

No utilizar Supabase PostgreSQL.

No utilizar SQLite en producción.

No utilizar MongoDB.

No utilizar una base de datos adicional sin justificación arquitectónica.

---

# 23. Acceso a PostgreSQL

El backend Gleam será responsable del acceso a PostgreSQL.

El frontend nunca debe conectarse directamente a Neon.

La arquitectura debe ser:

```text
Next.js
   │
   ▼
Gleam API
   │
   ▼
PostgreSQL
   │
   ▼
Neon
```

Utilizar queries parametrizadas.

No concatenar SQL con input del usuario.

---

# 24. Dinero

Nunca usar `float` para dinero.

Utilizar:

```text
numeric / decimal
```

en PostgreSQL.

Ejemplo:

```text
numeric(12,2)
```

Moneda inicial:

```text
ARS
```

La moneda debe mantenerse como campo explícito para permitir expansión futura.

---

# 25. IDs

Preferir UUID para entidades persistentes.

Las URLs públicas utilizarán `slug`.

Ejemplo:

```text
/products/maurten-gel-100
```

No exponer información sensible mediante IDs secuenciales.

---

# 26. Imágenes (Cloudinary)

Las imágenes no deben almacenarse dentro de PostgreSQL:

- Proveedor oficial: **Cloudinary** (Free tier: 25 GB, 25k transformaciones/mes).
- Guardar en PostgreSQL:
  - `public_id` (identificador en Cloudinary);
  - `public_url` (URL optimizada con transformaciones ej. `w_800,q_auto,f_auto`);
  - `alt_text`;
  - `sort_order`;
  - `is_primary`.
- Subida directa desde cliente con preset o firmada por backend.
- Nunca servir imágenes sin optimizar.

---

# 27. API

Base:

```text
/api/v1
```

Endpoints públicos iniciales:

```text
GET /products
GET /products/:slug

GET /categories
GET /categories/:slug/products

GET /config/public
```

Administración (requiere header `Authorization: Bearer <clerk_jwt>`):

```text
GET  /admin/me
POST /webhooks/clerk

GET    /admin/products
POST   /admin/products
GET    /admin/products/:id
PATCH  /admin/products/:id
DELETE /admin/products/:id

POST   /admin/categories
PATCH  /admin/categories/:id
DELETE /admin/categories/:id

POST   /admin/products/:id/images
DELETE /admin/products/:id/images/:image_id

POST   /admin/products/:id/stock-movements
GET    /admin/products/:id/stock-movements

GET    /admin/dashboard
```

Los endpoints pueden modificarse durante el diseño si existe una razón técnica clara.

Documentar cualquier cambio.

---

# 28. HTTP status codes

Utilizar correctamente:

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

No devolver errores internos al cliente.

No devolver stack traces.

---

# 29. Formato de errores

Utilizar un formato consistente:

```json
{
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product not found",
    "details": {}
  }
}
```

Los códigos deben ser estables.

No utilizar mensajes diferentes para el mismo error sin necesidad.

---

# 30. Validación

Todo input externo debe validarse.

Esto incluye:

* JSON;
* query parameters;
* path parameters;
* UUID;
* strings;
* números;
* cantidades;
* precios;
* slugs;
* archivos.

La validación del frontend mejora UX.

La validación del backend proporciona seguridad.

---

# 31. Rate limiting

Prioridad:

```text
login
admin endpoints
endpoints públicos abusables
```

No introducir Redis solamente para implementar rate limiting en V1.

Usar una solución simple y adecuada al despliegue inicial.

Si posteriormente se necesita rate limiting distribuido, reevaluar.

---

# 32. Logging

Los logs deben ser útiles para debugging y producción.

Registrar:

```text
request_id
method
path
status
duration
error code
authentication events
admin actions relevantes
```

Nunca registrar:

```text
password
session token
cookie
API key
DATABASE_URL
secret
```

---

# 33. Variables de entorno

Nunca hardcodear secretos.

Frontend (Vercel):

```text
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_WHATSAPP_NUMBER
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLOUDINARY_CLOUD_NAME
```

Backend (Fly.io):

```text
PORT
DATABASE_URL
CLERK_SECRET_KEY
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
CORS_ORIGINS
```

Los nombres concretos pueden modificarse.

Crear siempre:

```text
.env.example
```

Nunca subir:

```text
.env
.env.local
.env.production
```

---

# 34. Neon

Neon será utilizado como PostgreSQL administrado.

Separar entornos cuando sea posible:

```text
development
staging
production
```

No desarrollar directamente contra producción.

El agente debe tener especial cuidado con:

* connection strings;
* pooling;
* límites de conexiones;
* migraciones;
* branching si se decide utilizarlo;
* backups/restauración.

No asumir funcionalidades o límites específicos de Neon sin verificar la documentación actual.

---

# 35. Migraciones

Todas las modificaciones del schema deben estar versionadas.

No realizar cambios permanentes manualmente en producción.

Cada migración debe:

1. tener nombre;
2. ser revisable;
3. ser reproducible;
4. estar en Git;
5. poder aplicarse desde CI/CD.

Antes de una migración destructiva:

```text
detener
evaluar
documentar
pedir aprobación
```

---

# 36. CI/CD

Cada Pull Request debe ejecutar como mínimo:

## Frontend

```text
lint
typecheck
test
build
```

## Backend

```text
gleam format --check
gleam check
gleam test
```

Si existen:

```text
integration tests
API tests
migration checks
```

también deben ejecutarse.

No hacer merge con CI roto.

---

# 37. Docker y Fly.io

El backend Gleam se empaqueta y despliega en **Fly.io** mediante Docker:

- Build: multietapa usando `gleam export erlang-shipment` para generar un release Erlang/BEAM optimizado y ligero.
- Configuración: `fly.toml` en la raíz del backend.
- VM de Fly.io: compartida (256 MB RAM) suficiente para BEAM.
- Health check: endpoint `/health` obligatorio.
- No contener secretos en la imagen; usar variables de entorno / Fly secrets.
- Ejecutarse como usuario no root.

La prioridad es la portabilidad y ligereza del contenedor en el runtime BEAM.

---

# 38. Desarrollo local

Configuración conceptual:

```text
Next.js
localhost:3000

Gleam API
localhost:4000

PostgreSQL
Neon development
o PostgreSQL local
```

Se recomienda utilizar una base de desarrollo separada.

---

# 39. Estructura del repositorio

Preferencia:

```text
kiirox/
│
├── AGENTS.md
│
├── apps/
│   ├── web/
│   └── api/
│
├── docs/
│
├── infra/
│   ├── migrations/
│   └── docker/
│
├── .github/
│   └── workflows/
│
├── .env.example
├── README.md
└── .gitignore
```

Si se decide usar monorepo, mantener límites claros.

No crear un monorepo excesivamente complejo.

---

# 40. Roadmap obligatorio

El desarrollo debe seguir este orden general.

## Fase 0 — Bootstrap

Crear:

* repositorio;
* Next.js;
* Gleam;
* Wisp;
* Mist;
* configuración;
* health endpoint;
* CI;
* conexión PostgreSQL;
* Docker backend.

Resultado:

```text
web funciona
api funciona
database funciona
CI funciona
```

---

## Fase 1 — Database

Implementar:

```text
categories
products
product_images (public_id Cloudinary)
inventory_movements
admin_users (clerk_user_id)
```

Agregar:

* constraints;
* índices;
* migraciones;
* seed.

---

## Fase 2 — Catalog API

Implementar:

```text
GET /products
GET /products/:slug
GET /categories
GET /categories/:slug/products
GET /config/public
```

Agregar tests.

---

## Fase 3 — Store frontend

Implementar:

* Home;
* catálogo;
* categorías;
* detalle;
* responsive;
* SEO;
* estados loading/error/empty.

---

## Fase 4 — Cart

Implementar:

* localStorage;
* cantidades;
* eliminar;
* resumen;
* WhatsApp;
* copiar;
* descargar `.txt`.

---

## Fase 5 — Admin Auth (Clerk)

Implementar:

* Clerk SDK en Next.js (`<SignIn />`, middleware);
* Validación JWT en Gleam API (`Authorization: Bearer <clerk_jwt>`);
* Webhook de sincronización si aplica (Svix);
* Protección de rutas `/admin`;
* Rate limiting y seguridad de endpoints.

---

## Fase 6 — Product Administration

Implementar:

* listado;
* creación;
* edición;
* publicación;
* archivado;
* destacados;
* nuevos;
* categorías;
* imágenes (Cloudinary upload y registro).

---

## Fase 7 — Inventory

Implementar:

* stock;
* movimientos;
* entradas;
* ajustes;
* historial;
* bajo stock;
* agotados.

Validar concurrencia.

---

## Fase 8 — Production

Configurar:

```text
Vercel (Frontend Next.js)
Fly.io (Backend Gleam/BEAM)
Neon (PostgreSQL)
Cloudinary (Imágenes)
Clerk (Autenticación)
Domain
HTTPS
Environment variables
```

---

## Fase 9 — Security Hardening

Revisar:

* auth;
* CSRF;
* CORS;
* headers;
* rate limiting;
* SQL injection;
* XSS;
* file upload;
* secrets;
* logs;
* stock concurrency.

---

## Fase 10 — V2

Solo después de una V1 estable:

```text
orders
customers
suppliers
purchases
cost_history
expenses
payments
financial reporting
analytics
```

---

# 41. Vertical slices

El agente debe preferir implementar funcionalidades completas pequeñas.

Primer slice:

```text
Category
    ↓
Product
    ↓
PostgreSQL
    ↓
Gleam API
    ↓
Next.js
    ↓
Product page
```

Segundo:

```text
Admin login
    ↓
Create product
    ↓
Database
    ↓
Product appears publicly
```

Tercero:

```text
Admin
    ↓
Stock movement
    ↓
PostgreSQL transaction
    ↓
Updated stock
    ↓
Public availability
```

Esto permite validar la arquitectura antes de construir todo.

---

# 42. Testing

Cada módulo importante debe tener tests.

Prioridad:

1. reglas de dominio;
2. stock;
3. autenticación;
4. autorización;
5. repositories;
6. API;
7. frontend crítico.

Especialmente probar:

```text
stock cannot become negative
concurrent stock modifications
unauthenticated admin access
invalid session
expired session
invalid product
archived product visibility
WhatsApp cart generation
```

---

# 43. Seguridad: reglas no negociables

Nunca:

* guardar passwords;
* hardcodear secretos;
* confiar en el frontend;
* confiar en precios enviados por cliente;
* modificar stock sin transacción;
* concatenar SQL;
* permitir admin sin autenticación;
* exponer DATABASE_URL;
* exponer session secrets;
* devolver stack traces;
* subir archivos sin validación;
* usar CORS `*` con credenciales.

---

# 44. No agregar complejidad prematuramente

No agregar en V1:

```text
Redis
Kafka
RabbitMQ
Kubernetes
microservices
GraphQL
event sourcing
CQRS
Elasticsearch
Terraform
service mesh
```

salvo que una necesidad concreta aparezca y sea documentada.

La arquitectura debe ser escalable, pero no innecesariamente compleja.

---

# 45. Futuro financiero

KIIROX eventualmente deberá poder manejar:

```text
Products
    ↓
Inventory
    ↓
Purchases
    ↓
Costs
    ↓
Sales
    ↓
Revenue
    ↓
Profit
```

También eventualmente:

```text
Gross profit
Net profit
Reinvestment
Reserve
Owner withdrawal
Tithe
```

No implementar esto en V1.

Sin embargo, evitar decisiones que hagan imposible agregarlo posteriormente.

---

# 46. Decisiones de diseño futuras

Cuando aparezca una necesidad nueva, evaluar primero:

### ¿Puede resolverse dentro del monolito modular?

Si sí:

```text
mantener dentro del monolito
```

Si no:

```text
documentar motivo
evaluar alternativas
aprobar extracción
```

No extraer servicios simplemente porque "es más escalable".

---

# 47. Dependencias

Antes de incorporar una dependencia:

1. verificar si realmente es necesaria;
2. revisar mantenimiento;
3. revisar compatibilidad con Gleam/Next.js;
4. revisar licencia;
5. evaluar tamaño/complejidad;
6. evitar duplicación funcional.

Preferir librerías pequeñas y mantenidas.

No copiar implementaciones criptográficas propias.

---

# 48. Uso de documentación externa

Cuando una API, librería, framework o proveedor pueda haber cambiado:

* verificar documentación oficial actual;
* no asumir que una versión vieja sigue siendo válida;
* registrar la versión utilizada.

Especialmente para:

```text
Gleam
Wisp
Mist
PostgreSQL
Neon
Next.js
Next.js deployment
Vercel
Storage provider
```

---

# 49. Manejo de decisiones ambiguas

Si la decisión:

* afecta seguridad;
* afecta datos;
* afecta dinero;
* cambia arquitectura;
* crea lock-in;
* es difícil de revertir;

el agente debe detenerse y presentar:

```text
Problema
Opciones
Recomendación
Consecuencias
```

No improvisar.

Para decisiones pequeñas y reversibles:

* elegir la opción más simple;
* documentarla;
* continuar.
---

# 50. Cambios arquitectónicos

Toda modificación importante debe actualizar:

```text
AGENTS.md
```

o el documento específico correspondiente en:

```text
docs/
```

No dejar decisiones arquitectónicas importantes únicamente en código.

---

# 51. Definition of Done

Una funcionalidad está terminada solamente cuando:

* compila;
* está formateada;
* pasa tests;
* tiene manejo de errores;
* tiene validación;
* respeta seguridad;
* tiene migración si corresponde;
* tiene documentación si cambia arquitectura/API;
* no introduce secretos;
* no rompe funcionalidades existentes.

---

# 52. Formato de entrega del agente

Al terminar una tarea, responder:

```text
## Implementado

- ...

## Archivos modificados

- ...

## Tests

- ...

## Decisiones

- ...

## Pendientes

- ...
```

No declarar una tarea completa si existe un fallo conocido.

---

# 53. Regla final

KIIROX debe crecer desde:

```text
catálogo
    ↓
e-commerce
    ↓
gestión de stock
    ↓
gestión comercial
    ↓
gestión financiera
```

sin convertir la V1 en un ERP.

Construir primero una base sólida, pequeña y correcta.

La arquitectura debe permitir crecer.

No debe obligar a crecer antes de tiempo.

