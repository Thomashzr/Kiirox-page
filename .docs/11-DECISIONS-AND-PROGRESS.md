# KIIROX — Registro de Decisiones y Progreso del Proyecto (Living Document)

> **Propósito de este documento:**  
> Este archivo sirve como bitácora viva, continua y acumulativa de todo el desarrollo del ecosistema KIIROX. Registra las fases completadas, las decisiones arquitectónicas tomadas (ADRs), la configuración de la infraestructura en la nube y el estado del roadmap. Debe mantenerse y actualizarse periódicamente a medida que el proyecto avance.

---

## 📌 1. Información General del Proyecto

- **Nombre:** KIIROX
- **Rubro:** Nutrición deportiva avanzada, suplementación, geles energéticos e hidratación para atletas de resistencia y running.
- **Repositorio Git:** `https://github.com/Thomashzr/Kiirox-page.git`
- **Rama principal activa:** `desarrollo`
- **Ambientes en la Nube:**
  - **Frontend:** [https://kiirox.vercel.app](https://kiirox.vercel.app) *(Vercel Hobby, equipo `gy-tco`)*
  - **Backend API:** [https://kiirox-api.fly.dev](https://kiirox-api.fly.dev) *(Fly.io, región São Paulo `gru`)*
  - **Base de Datos:** Neon PostgreSQL Serverless *(AWS São Paulo `sa-east-1`)*
  - **Autenticación:** Clerk Auth Engine (`app_3KMpNVf0xJxBHt3Jps4RnQiu9yl`)

---

## 🚀 2. Resumen Cronológico de Fases Completadas

### ✅ Fase 0 — Bootstrap del Ecosistema
- Creación de la estructura monorepo:
  - `apps/web`: Next.js 16 (App Router) + React 19 + Tailwind CSS v4 + TypeScript.
  - `apps/api`: Lenguaje Gleam sobre la máquina virtual BEAM/Erlang + servidor HTTP Mist + framework Wisp + cliente PostgreSQL `pog`.
  - `infra`: Scripts de migración en Node.js conectando con el driver `@neondatabase/serverless`.
- Configuración de variables de entorno mediante `.env.local` y variables de plataforma.
- Implementación del endpoint base de salud `GET /health` (`200 OK`).

### ✅ Fase 1 — Base de Datos (Neon PostgreSQL)
- Definición y ejecución de migraciones SQL:
  - `001_initial_schema.sql`: Tablas `categories`, `products`, `product_images`, `admin_users`, `inventory_movements`. Uso de extensiones `uuid-ossp` y `citext`, restricciones de integridad y chequeos de stock no negativo.
  - `002_seed_data.sql`: Carga inicial de datos de categorías de resistencia (Geles, Proteínas, Sales, Hidratación) y productos emblemáticos (Maurten, SiS, Skratch Labs, SaltStick, ON Whey).

### ✅ Fase 2 — Catálogo API en Gleam
- Desarrollo del router y casos de uso en `apps/api/src/domain/catalog.gleam`:
  - `GET /api/v1/products`: Listado con soporte de paginación, filtros (`category`, `featured`, `new`, `search`) y orden.
  - `GET /api/v1/products/:slug`: Consulta de detalle de producto con galería de imágenes.
  - `GET /api/v1/categories`: Listado de categorías activas ordenadas.
  - `GET /api/v1/categories/:slug/products`: Productos filtrados por categoría.
  - `GET /api/v1/config/public`: Parámetros públicos de la tienda (`store_name`, `currency`, `whatsapp_number`).
- Soporte de CORS global (`*`) con manejo de preflight requests `OPTIONS`.
- Suite de pruebas de integración HTTP y lógica de dominio con `gleeunit` (23 tests automatizados pasando en verde).

### ✅ Fase 3 — Frontend Público & Identidad Visual
- Interfaz creada con las directrices de `design-taste-frontend` y `frontend-design`:
  - Estética minimalista monocromática (Black & White puro con contrastes sutiles en gama zinc), limpia y profesional para atletas, dejando espacio preparado para el isotipo de la marca.
  - Tipografía sans-serif de alto impacto para títulos combinada con acentos monospace para SKUs, precios y especificaciones técnicas.
  - Componente `Navbar` con integración de Clerk Auth (botones de ingreso, registro y avatar de usuario), enlace de WhatsApp directo y trigger de carrito.
  - Componente `Hero` enfocado en rendimiento y nutrición deportiva.
  - Componente `CatalogSection` con buscador en tiempo real, pestañas de categorías, selector de orden, toggle de destacados/en stock y tarjetas de producto interactivas.
  - Componente `ProductModal` para ver especificaciones y detalles.
  - Componente `Footer` sobrio y estructurado.

### ☁️ Despliegue en la Nube (Cloud Deployment)
- **Base de Datos en Neon**: Proyecto `proud-rice-11621533` en `sa-east-1` (São Paulo).
- **Backend API en Fly.io (`https://kiirox-api.fly.dev`)**:
  - Empaquetado como contenedor Docker multi-stage con Erlang shipment.
  - Corrección del bug de shebang del shipment de Gleam configurando `ENTRYPOINT ["/bin/sh", "/app/entrypoint.sh"]`.
  - Configuración de `mist.bind("0.0.0.0")` para enrutamiento correcto de tráfico del proxy de Fly.
  - Desplegado en la región `gru` (São Paulo) para máxima proximidad física y mínima latencia con la base de datos Neon.
- **Frontend en Vercel (`https://kiirox.vercel.app`)**:
  - Ajuste de configuración del monorepo (`Root Directory: apps/web`, preset `Next.js`).
  - Sincronización segura de las 10 variables de entorno de producción.
  - Desactivación de la protección restrictiva SSO de Vercel para permitir acceso público universal.
  - Reemplazo de carga estática bloqueante por streaming con `<Suspense>` para compatibilidad con Partial Prerendering de Next.js 16.

### ✅ Fase 4 — Carrito de Compras
- Implementación de estado y persistencia (`apps/web/src/context/cart-context.tsx`):
  - Almacenamiento local mediante `localStorage` bajo clave versionada `kiirox_cart_v1`, inmune a parpadeos de hidratación SSR.
  - Validación de stock en tiempo real con tope automático según `product.stock`.
  - Métricas derivadas calculadas durante el render (`totalItems`, `totalPrice`, `formattedTotalPrice`).
- **Slide-over Drawer (`apps/web/src/components/cart-drawer.tsx`)**:
  - Panel lateral deslizante que se abre desde el Navbar sin interrumpir la navegación del usuario.
  - Accesibilidad con cierre mediante tecla `ESC` o clic en el backdrop con desenfoque.
  - Bloqueo de scroll del body cuando el panel está visible.
  - Control de cantidades (`+` / `-`), eliminación individual y botón para vaciar el pedido.
- **Toast Notification (`apps/web/src/components/cart-toast.tsx`)**:
  - Notificación no invasiva al agregar un producto desde la card o desde el modal, con acceso rápido a "Ver carrito".
- **Canales de salida del pedido (`apps/web/src/lib/cart-utils.ts`)**:
  - Botón principal de **WhatsApp**: Redirige a `wa.me` con mensaje formateado estándar de KIIROX con desglose de productos y total estimado.
  - Botón **Copiar pedido**: Copia el pedido formateado al portapapeles con confirmación visual.
  - Botón **Descargar .txt**: Genera y descarga instantáneamente el comprobante plano `pedido-kiirox-YYYY-MM-DD.txt`.

### ✅ Fase 5 — Autenticación Admin (Clerk)
- **Base de Datos**:
  - Migración `003_admin_users_auth.sql`: Permite pre-autorizar correos electrónicos (`clerk_user_id` nulleable) y registra a `thomasheinzergz@gmail.com` como `super_admin`.
- **Middleware y Seguridad en Next.js**:
  - `apps/web/src/proxy.ts`: Intercepta rutas `/admin(.*)` con `clerkMiddleware`. Redirecciona usuarios anónimos a `/sign-in`.
  - `apps/web/src/lib/admin-auth.ts`: Verifica que el usuario autenticado exista y esté activo en la tabla `admin_users` de Neon. Asocia automáticamente el `clerk_user_id` en el primer inicio de sesión.
  - Pantalla de **Acceso No Autorizado (403)** si un usuario registrado con Clerk no tiene rol de administrador asignado.
- **Panel Administrativo Dedicado (`apps/web/src/app/admin`)**:
  - Layout con sidebar oscura, navegación a secciones del panel, badge de rol (`SUPER ADMIN`) y widget de usuario con Clerk `UserButton`.
  - Dashboard con tarjetas de métricas en tiempo real (Total Productos, Stock Bajo, Agotados, Categorías), estado de los servicios cloud (Neon, Fly.io, Clerk) y tabla de catálogo sincronizada.
- **Backend API en Gleam (`apps/api`)**:
  - Módulo FFI en Erlang (`apps/api/src/infrastructure/db_ffi.erl`) para decodificación de tokens JWT Base64URL.
  - Repositorio `AdminRepository` en PostgreSQL (`admin_postgres.gleam`).
  - Endpoint `GET /api/v1/admin/me`: Valida el token `Authorization: Bearer <token_jwt>` contra la tabla `admin_users` y devuelve la identidad y rol del admin (`200 OK`) o `401 Unauthorized` si no es válido.

---

## 🏛️ 3. Registro de Decisiones de Arquitectura (ADRs)

### ADR-01: Arquitectura Desacoplada (Frontend en Vercel + Backend BEAM en Fly.io + DB en Neon)
- **Decisión:** Mantener el backend como un servicio compilado OTP independiente en Fly.io y el frontend como aplicación Next.js en Vercel, conectándose ambos a una base de datos centralizada en Neon.
- **Justificación:** Proporciona tolerancia a fallos extrema en el backend (supervisión Erlang/OTP), renderizado veloz en el edge para el frontend (Next.js) y escalabilidad elástica en la base de datos sin administrar servidores PostgreSQL dedicados.

### ADR-02: Ubicación Física en São Paulo (`sa-east-1` y `gru`)
- **Decisión:** Alojar la base de datos de Neon en AWS `sa-east-1` (São Paulo) y la máquina virtual de Fly.io en la región `gru` (São Paulo).
- **Justificación:** Reduce la latencia entre la API y la base de datos a menos de 5ms, garantizando respuestas hiperrápidas para usuarios en América Latina (especialmente Argentina/Brasil).

### ADR-03: Delegación de Autenticación a Clerk con Autorización en PostgreSQL
- **Decisión:** Utilizar Clerk para gestionar credenciales, passwords, sesiones y OAuth, pero verificar estrictamente la autorización y roles en la tabla `admin_users` de nuestra propia base de datos.
- **Justificación:** Elimina el riesgo y la complejidad de almacenar contraseñas o gestionar flujos de recuperación de cuenta propios, mientras mantenemos el control absoluto de quién accede al panel de administración sin depender de paneles externos.

### ADR-04: Carrito del Cliente en V1 sin Bloqueo de Stock
- **Decisión:** El carrito vive en el cliente (`localStorage`) y no realiza reservas previas de inventario en la base de datos al agregarse.
- **Justificación:** Reduce el riesgo de bloqueos fantasma de stock por carritos abandonados. Dado que el cierre de venta en V1 se realiza vía WhatsApp con confirmación humana, el stock se valida al momento del pedido.

### ADR-05: Diseño Minimalista Monocromático (Black & White)
- **Decisión:** Desarrollar el frontend íntegramente en paleta blanco y negro con acentos neutros zinc, sin colores secundarios fijos.
- **Justificación:** Permite que el catálogo y las fotos de los productos sean los protagonistas visuales y facilita la posterior adopción de cualquier identidad o logo de marca sin requerir refactorizaciones de color en los componentes.

### ADR-06: Formato Estándar de Salida para Pedidos por WhatsApp y Texto
- **Decisión:** Estandarizar la salida del carrito a un texto claro con viñetas, nombres, SKUs, subtotales y total estimado, ofreciendo botones para WhatsApp, copiar al portapapeles y descarga de archivo plano `.txt`.
- **Justificación:** Otorga flexibilidad total al cliente: puede enviar el mensaje con un solo clic a WhatsApp o guardarlo como comprobante offline.

---

## 🗺️ 4. Estado Actual del Roadmap

| Fase | Descripción | Estado |
| :--- | :--- | :--- |
| **Fase 0** | Bootstrap del monorepo, Docker, health checks | 🟢 Completada |
| **Fase 1** | Migraciones de base de datos y esquemas Neon | 🟢 Completada |
| **Fase 2** | API de Catálogo en Gleam (endpoints públicos) | 🟢 Completada |
| **Fase 3** | Frontend público moderno en Next.js 16 | 🟢 Completada |
| **Fase 4** | Carrito de compras, WhatsApp, copiar y descargar `.txt` | 🟢 Completada |
| **Fase 5** | Autenticación Admin (Clerk), roles y `/admin/me` | 🟢 Completada |
| **Fase 6** | Administración de Productos (CRUD y Cloudinary) | 🟡 **Próxima a iniciar** |
| **Fase 7** | Administración de Stock e Inventario (movimientos) | ⚪ Pendiente |
| **Fase 8** | Hardening y revisión final de producción | ⚪ Pendiente |
| **Fase 9** | Optimizaciones y auditoría | ⚪ Pendiente |
