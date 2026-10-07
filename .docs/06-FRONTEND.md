# KIIROX — Frontend

## 1. Objetivo

Frontend comercial rápido, visual y mobile-first.

## 2. Rutas

```text
/
 /productos
 /productos/[slug]
 /categorias/[slug]
 /carrito

 /admin/login
 /admin
 /admin/productos
 /admin/productos/nuevo
 /admin/productos/[id]
 /admin/categorias
 /admin/stock
```

## 3. Home

Secciones:

1. Header.
2. Hero.
3. Categorías.
4. Productos destacados.
5. Nuevos productos.
6. Beneficios/identidad KIIROX.
7. CTA.
8. Footer.

La selección de productos destacados debe venir de backend/DB, no estar hardcodeada.

## 4. Catálogo

Debe permitir:

- búsqueda;
- categoría;
- disponibilidad;
- orden;
- paginación;
- limpiar filtros.

Estados:

```text
loading
success
empty
error
```

## 5. Card de producto

Mostrar:

- imagen;
- marca;
- nombre;
- precio;
- disponibilidad;
- badge destacado/nuevo;
- agregar.

Si stock = 0:

- mostrar agotado;
- no permitir agregar.

## 6. Detalle

Mostrar:

- galería;
- nombre;
- marca;
- descripción;
- precio;
- disponibilidad;
- selector de cantidad;
- agregar al carrito.

## 7. Carrito

El carrito debe:

- persistir en localStorage;
- sobrevivir a refresh;
- permitir aumentar/disminuir;
- eliminar items;
- calcular subtotal;
- validar cantidades contra disponibilidad conocida;
- generar WhatsApp;
- copiar lista;
- descargar `.txt`.

No enviar automáticamente un pedido sin acción explícita del usuario.

## 8. WhatsApp

Usar configuración:

```text
NEXT_PUBLIC_WHATSAPP_NUMBER
```

o mejor obtener configuración pública desde backend.

Construir:

```text
https://wa.me/{number}?text={encoded_message}
```

No incluir secretos.

## 9. Admin

El panel debe tener:

- sidebar;
- tablas;
- formularios;
- confirmaciones;
- feedback de éxito/error;
- estados de loading;
- protección de rutas.

## 10. Estado

Separar:

### Server state

Productos, categorías y datos del backend.

### Client state

Carrito, filtros temporales y UI.

No introducir Redux si no existe una necesidad concreta. Puede comenzar con React state/context o una librería pequeña.

## 11. Diseño

Usar sistema consistente:

- spacing;
- typography;
- botones;
- cards;
- badges;
- inputs;
- dialogs;
- tablas.

shadcn/ui puede servir para componentes administrativos.

## 12. SEO

Las páginas públicas deben usar rendering/caching de Next.js apropiado para contenido de catálogo.

Generar:

- title;
- description;
- canonical;
- Open Graph;
- sitemap;
- robots.

## 13. Performance

- imágenes responsive;
- lazy loading donde corresponda;
- minimizar JavaScript enviado al cliente;
- evitar fetch duplicados;
- cachear catálogo público cuando sea seguro.

## 14. Accesibilidad

Objetivo mínimo:

- labels;
- focus visible;
- navegación teclado;
- alt;
- estados aria;
- botones con texto claro.
