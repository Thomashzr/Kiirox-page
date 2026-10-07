# KIIROX — Requisitos

## 1. Alcance V1

### Público

- Home.
- Catálogo.
- Categorías.
- Búsqueda.
- Filtros básicos.
- Detalle de producto.
- Carrito persistido localmente.
- Generación de mensaje de WhatsApp.
- Copiar lista.
- Descargar lista de compra.
- Estado de disponibilidad.
- Responsive/mobile first.

### Administración

- Login.
- Logout.
- Dashboard básico.
- CRUD de productos.
- CRUD de categorías.
- Gestión de imágenes.
- Gestión de precio.
- Gestión de stock.
- Historial de movimientos de stock.
- Marcar producto destacado.
- Marcar producto nuevo.
- Publicar/despublicar.
- Ver productos agotados.
- Configuración básica del catálogo.

## 2. Producto

Campos mínimos:

- id
- SKU
- nombre
- slug
- descripción corta
- descripción larga
- marca
- categoría
- precio
- moneda
- stock
- umbral de bajo stock
- estado
- destacado
- nuevo
- orden de aparición
- timestamps

Estados:

```text
draft
published
archived
```

Un producto archivado no debe aparecer en catálogo público.

## 3. Categorías

- nombre
- slug
- descripción
- imagen opcional
- activa/inactiva
- orden

Inicialmente permitir una categoría principal por producto. Si el negocio requiere múltiples categorías posteriormente, migrar a relación N:M.

## 4. Imágenes

Cada producto puede tener:

- varias imágenes;
- una imagen principal;
- orden;
- texto alternativo.

La URL del objeto debe almacenarse en la base de datos.

## 5. Stock

Operaciones:

- recepción;
- ajuste positivo;
- ajuste negativo;
- corrección;
- venta/pedido futuro;
- devolución futura.

Cada movimiento debe guardar:

- producto;
- cantidad delta;
- tipo;
- motivo;
- referencia opcional;
- usuario administrador;
- timestamp.

Nunca borrar movimientos históricos para "corregir" stock. Crear un movimiento compensatorio.

## 6. Carrito

Cada item:

- product_id;
- nombre mostrado;
- precio actual;
- cantidad;
- imagen opcional.

El cliente puede recalcular la visualización, pero el backend debe ser la autoridad cuando se implemente una solicitud persistente.

En V1 el carrito no representa una reserva de stock.

## 7. WhatsApp

Mensaje recomendado:

```text
Hola KIIROX!

Quiero consultar por el siguiente pedido:

• 2x Producto A — $10.000
• 1x Producto B — $7.500

Total estimado: $27.500

¿Podrían confirmarme disponibilidad y forma de pago?
```

El texto debe construirse de forma segura y URL-encodearse.

## 8. Descargar lista

V1 puede ofrecer:

- copiar al portapapeles;
- descargar `.txt`.

PDF queda como mejora posterior.

## 9. Dashboard

Indicadores iniciales:

- productos publicados;
- productos agotados;
- productos con bajo stock;
- destacados;
- productos nuevos.

No crear métricas financieras complejas hasta que exista el módulo de ventas.

## 10. Requisitos no funcionales

### Rendimiento

- catálogo público cacheable;
- imágenes optimizadas;
- paginación para catálogos grandes;
- índices PostgreSQL;
- evitar N+1 queries.

### Accesibilidad

- navegación por teclado;
- labels;
- contraste suficiente;
- alt text;
- botones claramente identificables.

### SEO

- metadata por página;
- URLs con slugs;
- sitemap;
- robots.txt;
- Open Graph;
- datos estructurados de producto cuando corresponda.

### Seguridad

- HTTPS;
- sesiones seguras;
- CSRF cuando corresponda;
- CORS restringido;
- rate limiting en login;
- validación backend;
- logs sin secretos;
- control de permisos.

## 11. Fuera de alcance V1

- pagos online;
- Mercado Pago;
- facturación;
- cuentas de clientes;
- puntos/recompensas;
- cupones;
- marketplace;
- multi-tenant;
- app móvil;
- microservicios;
- ERP completo.
