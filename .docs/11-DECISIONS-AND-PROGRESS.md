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

### ✅ Fase 6 — Administración de Productos & Carga con Cloudinary
- **Alineación Interactiva (Grill-Me)**:
  - Arquitectura de imágenes: Carga segura server-side en Next.js con el SDK de Node de Cloudinary (`cloudinary` v2) sin exponer API Secret al cliente, con soporte de drag & drop, validación de tipo/tamaño (10MB) y fallback de URL directa.
  - UX de administración: Páginas dedicadas completas (`/admin/products` para listado interactivo, `/admin/products/new` para creación y `/admin/products/[id]` para edición detallada y gestión de fotos).
  - Eliminación: Borrado lógico preferente (`archived`) con opción de borrado permanente (`permanent=true`) que remueve el registro de Neon y elimina el asset en Cloudinary con invalidación de CDN (`invalidate: true`).
- **Backend API en Gleam (`apps/api`)**:
  - Nuevos modelos y tipos en `domain/admin.gleam` y `domain/product.gleam` (`ProductInput`, `ProductImageInput`, `AdminProductFilters`).
  - Implementación completa de métodos en `infrastructure/admin_postgres.gleam` con consultas SQL tipadas en `pog`.
  - Rutas y handlers en `web/router.gleam` y `web/admin_handlers.gleam`:
    - `GET /api/v1/admin/products`: Lista todos los productos sin restricción de estado, con soporte de búsqueda por texto, categoría y orden.
    - `POST /api/v1/admin/products`: Creación de producto con validación de body JSON (`201 Created`).
    - `GET /api/v1/admin/products/:id`: Detalle completo de producto e imágenes.
    - `PATCH /api/v1/admin/products/:id`: Actualización de producto (`200 OK`).
    - `DELETE /api/v1/admin/products/:id`: Archivado lógico por defecto o borrado físico si `?permanent=true`.
    - `POST /api/v1/admin/products/:id/images`: Asociación de imagen a producto (`201 Created`).
    - `DELETE /api/v1/admin/products/:id/images/:image_id`: Eliminación de imagen y auto-promoción de la siguiente a principal.
    - `PATCH /api/v1/admin/products/:id/images/:image_id/primary`: Asignación de imagen principal.
  - Suite de 30 pruebas unitarias y de integración pasando al 100% en verde con `gleeunit`.
  - Desplegado y verificado en producción en Fly.io (`https://kiirox-api.fly.dev`).
- **Frontend Admin en Next.js 16 (`apps/web`)**:
  - `apps/web/src/app/api/admin/cloudinary/upload/route.ts`: Endpoint de subida de imágenes a Cloudinary mediante streams con verificación de sesión de admin.
  - `apps/web/src/app/api/admin/cloudinary/delete/route.ts`: Endpoint de eliminación de assets en Cloudinary con verificación de admin.
  - `apps/web/src/app/admin/products/actions.ts`: Server Actions para consultas y mutaciones directas a Neon DB con `revalidatePath` en `/admin/products` y la tienda pública `/`.
  - `apps/web/src/components/admin/image-uploader.tsx`: Componente con dropzone, feedback visual de subida a Cloudinary y soporte alternativo de URL directa.
  - `apps/web/src/components/admin/products-table.tsx`: Tabla brutalista minimalista con filtros por estado (`Todos`, `Publicados`, `Borradores`, `Archivados`), buscador en tiempo real, selector de categoría, toggle rápido de publicación y acciones de edición y archivado.
  - `apps/web/src/components/admin/product-form.tsx`: Formulario unificado para creación y edición con validación de SKU/Slug único, badges de destacado/nuevo, control de stock y galería con asignación de imagen principal.
  - Páginas `/admin/products`, `/admin/products/new` y `/admin/products/[id]` operativas y desplegadas en producción en Vercel (`https://kiirox.vercel.app`).

### ✅ Fase 7 — Administración de Stock e Inventario & Auditoría Kardex
- **Alineación Interactiva (Grill-Me)**:
  - *Arquitectura de navegación*: Centro de Inventario dedicado y unificado en `/admin/inventory` estructurado en dos pestañas: **Control de Stock y Alertas** (visión operativa en tiempo real con umbrales) y **Historial de Movimientos / Kardex** (trazabilidad y auditoría completa de movimientos).
  - *Modal de Ajuste con Triple Selector*:
    - **Entrada (+)**: Recepción de mercadería o lote nuevo con cantidad y motivo sugerido.
    - **Salida (-)**: Merma, daño, vencimiento o venta manual, validando en tiempo real que no supere el stock disponible.
    - **Conteo Físico**: El operador ingresa el stock real contado en estantería; el sistema calcula automáticamente la variación resultante `delta = stock_real - stock_actual` y genera un movimiento de corrección/balance.
  - *Regla Estricta de No Negatividad*: Bloqueo atómico tanto en cliente como en servidor (`stock + delta >= 0`). Si el stock resultante fuera negativo, la operación se rechaza inmediatamente con `ValidationError` y no se registra ningún movimiento.
- **Backend API en Gleam (`apps/api`)**:
  - Modelos de dominio en `domain/inventory.gleam` (`InventoryMovement`, `InventoryMovementInput`, `InventoryFilters`).
  - Extensión de `domain/admin.gleam` (`record_stock_movement`, `list_inventory_movements`).
  - Encoders JSON en `infrastructure/json_encoders.gleam` (`inventory_movement_to_json`, `paginated_inventory_movements_to_json`).
  - Implementación atómica con `pog` en `infrastructure/admin_postgres.gleam`: valida stock previo, inserta en `inventory_movements` y actualiza `products.stock` y `updated_at`.
  - Rutas y handlers en `web/router.gleam` y `web/admin_handlers.gleam`:
    - `POST /api/v1/admin/inventory/adjust`: Registra ajuste y actualiza saldo.
    - `GET /api/v1/admin/inventory/movements`: Bitácora histórica con filtros por producto, tipo de movimiento y paginación.
    - `GET /api/v1/admin/products/:id/movements`: Movimientos específicos de un producto.
  - Suite de 34 pruebas de integración y dominio pasando al 100% en verde con `gleeunit`.
  - Desplegado y verificado en producción en Fly.io (`https://kiirox-api.fly.dev`).
- **Frontend Admin en Next.js 16 (`apps/web`)**:
  - Tipos `MovementType`, `InventoryMovement`, `InventoryMovementWithProduct`, `PaginatedMovements` en `src/types/index.ts`.
  - Server Actions en `src/app/admin/inventory/actions.ts`:
    - `getInventoryOverview`: Cálculo de productos y métricas agregadas (Total SKUs, Unidades Totales, Bajo Stock, Sin Stock).
    - `getInventoryMovements`: Consulta paginada con joins a `products` y `admin_users` para email de operador.
    - `recordStockAdjustmentAction`: Mutación segura con verificación de permisos, validación de no negatividad y revalidación de caché en Next.js (`/admin/inventory`, `/admin/products`, `/admin`, `/productos`).
    - `getProductMovementHistory`: Consulta de historial específico para un producto.
  - Componente modal `StockAdjustModal` (`src/components/admin/stock-adjust-modal.tsx`):
    - Pestañas Entrada (+), Salida (-), Conteo Físico.
    - Caja de previsualización en vivo (Stock Actual, Variación `delta`, Stock Final Resultante).
    - Chips de motivos frecuentes y justificación obligatoria.
    - Bloqueo visual e interactivo si el saldo resulta negativo.
  - Componente unificado `InventoryManager` (`src/components/admin/inventory-manager.tsx`):
    - Tarjetas KPI superiores interactivas con filtrado automático al hacer clic.
    - Pestaña de Control de Stock: tabla de alta densidad con badges `[Óptimo]`, `[Bajo Stock]`, `[Sin Stock]`, umbral mínimo, botones para abrir modal de ajuste y acceso directo al Kardex de ese producto.
    - Pestaña Kardex: tabla de auditoría con fecha/hora local, SKU y nombre del producto, badge por tipo de movimiento, variación en color semántico (`+X` verde / `-Y` ámbar/rojo), motivo y operador responsable.
  - Página `/admin/inventory` operativa.
  - Actualización del layout (`/admin/layout.tsx`) con enlace directo a "Inventario".
  - Enlaces directos desde las tarjetas de métricas del Dashboard `/admin` hacia el Centro de Inventario.
  - Compilación verificada sin errores y desplegada en producción en Vercel (`https://kiirox.vercel.app`).

### ✅ Fase 8 — Despliegue en la Nube & Verificación Operativa
- **Ambientes Cloud Operativos**:
  - Base de Datos: Neon PostgreSQL Serverless (São Paulo `sa-east-1`).
  - Backend API: Fly.io máquina virtual en São Paulo (`gru`), escuchando en `https://kiirox-api.fly.dev`.
  - Frontend: Vercel producción con Edge Network en São Paulo, escuchando en `https://kiirox.vercel.app`.
  - Almacenamiento multimedia: Cloudinary CDN optimizado.
  - Autenticación: Clerk Auth Engine con JWT.
- **Limpieza de Procesos**:
  - Cancelación controlada del proceso local continuo `npm run web:dev` para liberar recursos del sistema.
### ✅ Fase 9 — Hardening, Concurrencia de Stock, Rate Limiting y Backups
- **Pruebas de Concurrencia sobre Stock (`infra/test_stock_concurrency.mjs`)**:
  - Suite de estrés ejecutando 15 peticiones simultáneas sobre un producto con stock inicial de 5 unidades.
  - Resultados: Exactamente 5 operaciones aprobadas, 10 rechazadas con error de stock insuficiente, saldo final en base de datos exactamente 0 (nunca negativo) y 5 movimientos auditados en Kardex.
  - Cero condiciones de carrera (Race Conditions) y cero sobreventa (overselling).
- **Rate Limiting en Memoria (`apps/web/src/lib/rate-limit.ts`)**:
  - Algoritmo de ventana deslizante (sliding window) con limpieza periódica de memoria sin dependencias externas pesadas para V1.
  - Aplicado a subidas de Cloudinary (`max 30 uploads/min por admin`).
  - Aplicado a ajustes de stock (`max 30 ajustes/min por admin`).
- **Logging Estructurado en Tiempo Real**:
  - Backend Gleam Wisp (`use <- wisp.log_request(req)`): trazabilidad de método, path, código de respuesta y duración por petición.
- **Estrategia y Verificación de Backups (Neon PostgreSQL)**:
  - Script de verificación `infra/backup.mjs`: valida las 6 tablas principales del sistema y sus 61 restricciones de integridad referencial.
  - Respaldo continuo con Point-In-Time Recovery (PITR) a nivel de almacenamiento WAL en São Paulo y capacidad de branch snapshots instantáneos.
- **Hardening de Cabeceras HTTP**:
  - Configuración activa en producción de `Content-Security-Policy` (CSP), `Strict-Transport-Security` (HSTS), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` y `Referrer-Policy`.

### ✅ Fase 10 — Auditoría de Diseño Frontend & Eliminación de AI Slop (Skill Impeccable)
- **Instalación de la Skill Impeccable**:
  - Instalada la skill `impeccable` (`pbakaus/impeccable` v4.5.0) en `.agents/skills/impeccable` con suite de directrices `reference/craft-floor.md`, `audit.md`, `polish.md`, etc.
  - Ejecución del inicializador de contexto de la skill y verificación del detector mecánico (`impeccable detect`).
- **Hallazgos Críticos de "AI Slop" y Antipatrones Detectados**:
  - **Kickers / Eyebrow labels sobre encabezados (Baneados por Impeccable)**: Presentes en `Hero` (`KIIROX ATHLETICS · 2026`) y en `CatalogSection` (`INVENTARIO DISPONIBLE · X REFERENCIAS`). Los títulos deben sostenerse con su propio peso tipográfico sin etiquetas redundantes.
  - **Monospace como "Disfraz" (Monospace Costume)**: Botones interactivos (`font-mono`), pestañas de categorías y enlaces de navegación estaban forzados en monoespaciado en lugar de usar tipografía sans-serif deportiva limpia y jerárquica. El monoespaciado se reservó exclusivamente para datos medibles (SKUs, números de lote, métricas de nutrientes y precios).
  - **Contraste Deficiente en Modo Oscuro (WCAG AA)**: Textos secundarios en `text-zinc-500` sobre fondos negros no alcanzaban el ratio mínimo de 4.5:1. Se ajustaron a escalas legibles (`text-zinc-600 dark:text-zinc-400` y `text-zinc-700 dark:text-zinc-300`).
  - **Filtro Grayscale Artificial en Productos**: Las fotos de catálogo se mostraban en escala de grises forzada (`grayscale contrast-125`) que deslucía el packaging real de marcas de alta gama (Maurten, SiS, Skratch). Se eliminó en favor de renderizado de imagen original nítido con micro-interacción de zoom sutil al hover.
  - **Superficies del Navegador Desatendidas**: Falta de scrollbars tematizados, color de caret, selección temática y cifras tabulares (`tabular-nums`) para precios y contadores.
  - **Remanente de Desarrollo**: Etiqueta visual `LOGO_SLOT` visible en el componente de logo en la barra de navegación pública.
  - **Esqueleto Genérico AI**: `CatalogSkeleton` utilizaba `rounded-2xl` genérico en contradicción con la estética brutalista y limpia del proyecto.
- **Refactorización y Mejoras Implementadas**:
  - `apps/web/src/app/globals.css`: Agregadas reglas de `caret-color: currentColor`, scrollbars minimalistas personalizados (`::-webkit-scrollbar`), estilo de selección de alto contraste, `.tabular-nums` con `font-feature-settings: "tnum" 1` y anillos de enfoque accesibles (`:focus-visible`).
  - `apps/web/src/components/brand-logo.tsx`: Eliminado el badge `LOGO_SLOT`, consolidando el isotipo geométrico y el bloque de marca en navegación.
  - `apps/web/src/components/hero.tsx`: Eliminado el kicker prohibido. Encabezado principal ampliado con fuerza editorial. Botones de acción principales actualizados a tipografía sans-serif táctil. Panel derecho transformado en una matriz técnica de rendimiento atlético (ratios de carbohidratos 1:0.8, encapsulación por hidrogel, electrolitos y despacho 24hs) con alto contraste.
  - `apps/web/src/components/catalog-section.tsx`: Eliminado el kicker superior. Pestañas de categorías actualizadas a controles atléticos sans-serif. Eliminado el filtro grayscale en las tarjetas de producto. Precios formateados con `tabular-nums font-mono`. Botón "Agregar" elevado con jerarquía táctil.
  - `apps/web/src/components/product-modal.tsx`: Rediseñado como dossier de especificación técnica atlética. Imagen nítida sin filtros forzados. Badges de stock accesibles en modo claro y oscuro. Selectores de cantidad y botones de carrito y WhatsApp con tipografía clara y contrastada.
  - `apps/web/src/components/cart-drawer.tsx`: Eliminado el grayscale de miniaturas. Precios, cantidades y totales renderizados con cifras tabulares. Botones de compra y utilidades (copiar/descargar .txt) con tipografía optimizada.
  - `apps/web/src/components/navbar.tsx`: Enlaces de navegación y botón de login elevados a tipografía sans-serif con peso adecuado; contador del carrito con cifras tabulares.
  - `apps/web/src/components/footer.tsx`: Contrastes de párrafos y enlaces ajustados para cumplimiento WCAG AA.
  - `apps/web/src/app/page.tsx`: Corregido `CatalogSkeleton` eliminando esquinas `rounded-2xl`.
- **Verificación y Despliegue**:
  - Detector Impeccable ejecutado: 0 infracciones detectadas (`[]`).
  - Lint de ESLint: 0 errores (`npm --prefix apps/web run lint`).
  - Compilación de producción con Turbopack: exitosa en 3.6s (`npm --prefix apps/web run build`).
  - Desplegado en producción en Vercel: `https://kiirox.vercel.app` (`▲ Ready in 37s`, HTTP 200 OK verificado).

- **Instalación de la Skill Apple Design**:
  - Instalada la skill oficial `apple-design` (`emilkowalski/skills@apple-design`) en `.agents/skills/apple-design`.
  - Proporciona principios de diseño e ingeniería de interacción de Apple (WWDC): animaciones fluidas con resortes físicos (springs), retroalimentación instantánea en pointer-down, manipulación directa 1:1, interrupciones sin pérdida de velocidad, translucidez con jerarquía de materiales, proyecciones de momentum y tipografía con optical sizing.

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

### ADR-07: Carga Segura de Imágenes a Cloudinary mediante Node SDK y Route Handlers Server-Side
- **Decisión:** Manejar la subida de imágenes a través de un route handler de Next.js en el servidor (`/api/admin/cloudinary/upload`) autenticado por rol admin, utilizando `cloudinary.v2.uploader.upload_stream` con la carpeta `kiirox/products` y transformaciones automáticas (`f_auto,q_auto`).
- **Justificación:** Previene la exposición de claves privadas (`CLOUDINARY_API_SECRET`), unifica las políticas de tamaño y tipos MIME, y evita requerir presets inseguros o unsigned uploads abiertos en el navegador.

### ADR-08: Gestión de Productos en Páginas Dedicadas (`/admin/products`, `/admin/products/new`, `/admin/products/[id]`)
- **Decisión:** Estructurar la administración de productos en páginas completas dedicadas en lugar de modales o drawers reducidos.
- **Justificación:** Brinda un espacio visual limpio y ergonómico para formularios extensos (datos generales, precios, inventario, descripciones enriquecidas, etiquetas y galería múltiple de fotos), garantizando URLs compartibles, navegación estándar y fácil inspección.

### ADR-09: Estrategia Híbrida de Eliminación (Borrado Lógico Preferente / Archivar + Eliminación Permanente Protegida)
- **Decisión:** La acción de eliminación por defecto realiza un borrado logical marcando el producto como `archived` (ocultándolo de la tienda pública pero preservando su historial de ventas e inventario). Se ofrece una acción explícita de "Eliminación Permanente" con confirmación de advertencia que borra la fila en SQL (en cascada con sus fotos) y remueve el asset de Cloudinary.
- **Justificación:** Salvaguarda la integridad referencial y las métricas comerciales de pedidos previos, a la vez que permite purgar pruebas o productos creados por error.

### ADR-10: Auditoría Kardex Obligatoria y Restricción Atómica de Stock No Negativo
- **Decisión:** Toda alteración en la disponibilidad física de inventario debe estar respaldada obligatoriamente por un registro inmutable en `inventory_movements` con motivo y operador, prohibiendo terminantemente los saldos negativos (`stock + delta >= 0`) a nivel de verificación previa en código y a nivel de restricción SQL (`CHECK (stock >= 0)`).
- **Justificación:** En una tienda de nutrición y suplementación deportiva, el quiebre de stock no admitido o valores negativos desvirtúan el catálogo público y el cálculo de reposición. El historial de movimientos tipo Kardex garantiza que ante cualquier discrepancia entre el inventario físico y el sistema, exista una justificación clara registrada por el operador.

### ADR-11: Política Estricta de Encabezados de Seguridad y CSP en Producción
- **Decisión:** Exigir cabeceras de seguridad estrictas tanto en el frontend en Vercel (Content-Security-Policy whitelist, HSTS 2 años, X-Frame-Options: DENY, X-Content-Type-Options: nosniff) como en el backend en Fly.io.
- **Justificación:** Mitiga ataques de Clickjacking, XSS, MIME sniffing y degradación SSL/TLS, garantizando que el ecosistema KIIROX cumpla con estándares de nivel bancario/comercio electrónico moderno.

### ADR-12: Prevención de Condiciones de Carrera (Race Conditions) y Rate Limiting en Capa de Aplicación
- **Decisión:** Proteger las mutaciones de stock con comprobaciones condicionales atómicas (`WHERE stock >= delta`) y limitar la frecuencia de peticiones en endpoints sensibles mediante algoritmo sliding window en memoria.
- **Justificación:** Previene la sobreventa ante compras simultáneas concurrentes y neutraliza intentos de denegación de servicio o subidas masivas automatizadas de imágenes.

### ADR-13: Adopción del Estándar Impeccable Craft Floor y Erradicación de AI Slop
- **Decisión:** Aplicar rigurosamente los principios de diseño de la skill `impeccable`:
  1. Prohibir kickers o eyebrow labels sobre encabezados h1/h2 en todo el sitio.
  2. Desterrar el monoespaciado como disfraz decorativo; limitarlo exclusivamente a mediciones científicas, SKUs y precios tabulares (`tabular-nums`).
  3. Descartar filtros destructivos como grayscale sobre productos en favor de la verdad visual del producto.
  4. Atender las superficies del navegador (scrollbars a medida, selección de alto contraste, caret color).
  5. Asegurar contraste mínimo WCAG AA (≥4.5:1) en todos los textos secundarios y placeholders.
- **Justificación:** Los modelos de IA tienden a repetir clichés visuales (tarjetas idénticas, kickers en mayúsculas, filtros grises, botones en monospace). La adopción del Craft Floor garantiza una interfaz única, deportiva, de alto impacto y orientada a atletas reales.

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
| **Fase 6** | Administración de Productos (CRUD y Cloudinary) | 🟢 Completada |
| **Fase 7** | Administración de Stock e Inventario (Kardex audit trail) | 🟢 Completada |
| **Fase 8** | Despliegue en la Nube (Vercel, Fly.io, Neon, Cloudinary, Clerk) | 🟢 **Completada** |
| **Fase 9** | Hardening, Concurrencia de Stock, Rate Limiting & Backups | 🟢 **Completada** |
| **Fase 10** | Auditoría Impeccable: Erradicación de AI Slop y Craft Polish | 🟢 **Completada** |
| **Fase 11** | Expansión V2 (pedidos persistentes, pasarelas de pago, clientes, finanzas) | ⚪ Planificada para V2 |




