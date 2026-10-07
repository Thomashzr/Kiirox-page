# KIIROX — Modelo de datos PostgreSQL

## 1. Convenciones

- UUID para IDs públicos.
- `timestamptz` para timestamps.
- Base de datos en UTC.
- `numeric(12,2)` para dinero.
- Nunca usar `float` para precios.
- `citext` puede usarse para valores donde corresponda.
- Foreign keys explícitas.
- Índices en campos de búsqueda.
- Soft-delete mediante estado cuando sea útil; no borrar históricos necesarios.

## 2. Tablas V1

### categories

```sql
id uuid primary key
name varchar(120) not null
slug varchar(140) unique not null
description text
image_url text
is_active boolean not null default true
sort_order integer not null default 0
created_at timestamptz not null
updated_at timestamptz not null
```

### products

```sql
id uuid primary key
sku varchar(80) unique not null
name varchar(180) not null
slug varchar(200) unique not null
brand varchar(120)
short_description varchar(300)
description text
price numeric(12,2) not null
currency varchar(3) not null default 'ARS'
stock integer not null default 0
low_stock_threshold integer not null default 5
status varchar(20) not null
is_featured boolean not null default false
is_new boolean not null default false
sort_order integer not null default 0
category_id uuid not null references categories(id)
created_at timestamptz not null
updated_at timestamptz not null
```

Constraints:

```text
price >= 0
stock >= 0
low_stock_threshold >= 0
status in ('draft','published','archived')
```

### product_images

```sql
id uuid primary key
product_id uuid not null references products(id)
public_id varchar(255) not null -- Cloudinary public_id
public_url text not null        -- URL transformada / CDN Cloudinary
alt_text varchar(250)
sort_order integer not null default 0
is_primary boolean not null default false
created_at timestamptz not null
```

### inventory_movements

```sql
id uuid primary key
product_id uuid not null references products(id)
delta integer not null
movement_type varchar(30) not null
reason text
reference_type varchar(40)
reference_id uuid
admin_user_id uuid references admin_users(id)
created_at timestamptz not null
```

`delta` puede ser positivo o negativo.

Tipos iniciales:

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

No usar `sale`, `reservation` ni `release` en V1 si todavía no existen esos flujos; mantenerlos como extensibilidad del enum/check.

### admin_users

```sql
id uuid primary key
clerk_user_id varchar(120) unique not null
email varchar(320) unique not null
role varchar(30) not null default 'admin'
is_active boolean not null default true
created_at timestamptz not null
updated_at timestamptz not null
```

> **Nota sobre sesiones**: Las sesiones de usuario son administradas integralmente por **Clerk** (emisión de tokens JWT, expiración y revocación). No se requiere una tabla `admin_sessions` en PostgreSQL.

## 3. Relaciones

```text
categories 1 ───── N products
products   1 ───── N product_images
products   1 ───── N inventory_movements
admin_users 1 ───── N inventory_movements
```

## 4. Índices

Crear al menos:

```text
products(slug)
products(status)
products(category_id, status)
products(is_featured, status)
products(is_new, status)
products(stock)
product_images(product_id, sort_order)
inventory_movements(product_id, created_at)
admin_users(clerk_user_id)
admin_users(email)
```

## 5. Regla crítica de stock

Una modificación de stock debe ejecutarse dentro de una transacción:

```text
BEGIN
  lock product row
  validate new stock >= 0
  update product stock
  insert inventory movement
COMMIT
```

No hacer:

```text
SELECT stock
UPDATE stock
INSERT movement
```

sin una transacción y protección contra concurrencia.

## 6. Migraciones

Las migraciones deben estar versionadas en Git.

No modificar manualmente producción para cambios permanentes.

Cada migración debe:

- tener nombre;
- ser reproducible;
- ser revisada;
- poder aplicarse desde CI/CD.

## 7. Futuro

Tablas previstas, no necesariamente V1:

```text
customers
orders
order_items
suppliers
purchase_orders
purchase_items
cost_history
expenses
payments
cash_movements
```

El diseño futuro debe conservar snapshots de precio/costo en entidades históricas.
