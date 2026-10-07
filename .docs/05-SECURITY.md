# KIIROX — Seguridad

## 1. Modelo de amenazas mínimo

Proteger contra:

- acceso no autorizado al panel;
- credential stuffing;
- SQL injection;
- XSS;
- CSRF;
- CORS abusivo;
- manipulación de precio;
- manipulación de stock;
- subida de archivos peligrosos;
- exposición de secretos;
- enumeración innecesaria de recursos;
- abuso del login;
- sesiones robadas.

## 2. Autenticación (Clerk)

Para V1 la autenticación es gestionada a través de **Clerk**:

- El frontend valida sesiones mediante el SDK oficial de Clerk para React/Next.js y su middleware.
- El backend Gleam valida el token JWT emitido por Clerk en el header `Authorization: Bearer <token>`.
- La verificación del JWT en Gleam se realiza mediante la clave pública de Clerk (`CLERK_JWT_KEY`) o clave secreta (`CLERK_SECRET_KEY`).
- Los webhooks provenientes de Clerk (ej. creación/actualización de usuario) deben validar su firma criptográfica utilizando **Svix**.
- La gestión de contraseñas, rotación, sesiones activas, hashing y protección contra fuerza bruta es delegada a la infraestructura segura de Clerk.

## 3. Contraseñas y Credenciales

- No almacenar contraseñas de usuarios en la base de datos propia.
- Clerk gestiona el hashing seguro y políticas de contraseñas.
- Aplicar rate limiting y validación de tokens en la API para prevenir abusos.

## 4. CSRF y Tokens

- La comunicación frontend-backend para la API administrativa utiliza encabezados `Authorization: Bearer <token>` con el JWT de Clerk, eliminando los vectores típicos de CSRF asociados a cookies de sesión implícitas.
- Para endpoints que acepten webhooks externos (ej. Clerk/Svix), validar rigurosamente la firma de la petición.

## 5. Autorización

Cada endpoint administrativo debe verificar:

```text
authenticated
AND
active session
AND
required role/permission
```

No confiar en un campo `role` enviado por frontend.

## 6. SQL

Usar queries parametrizadas.

Nunca concatenar:

```text
"SELECT ... WHERE name = '" <> user_input
```

## 7. Validación

Validar en backend:

- strings;
- longitudes;
- UUID;
- precios;
- cantidades;
- enums;
- slugs;
- MIME types;
- tamaño de archivos.

## 8. Stock

El navegador nunca puede mandar:

```json
{
  "stock": 999999
}
```

y hacer que eso se persista sin pasar por el caso de uso correspondiente.

La API debe registrar movimientos.

## 9. Precios

El carrito del navegador no es confiable.

Cuando exista un pedido persistente:

- recibir product IDs y cantidades;
- consultar productos en DB;
- verificar disponibilidad;
- obtener precios actuales;
- generar snapshots;
- calcular total en backend.

## 10. Storage (Cloudinary)

Las imágenes deben gestionarse mediante **Cloudinary**:

- Limitar tamaño máximo permitido antes de la subida.
- Validar formatos de archivo (ej. JPG, PNG, WEBP).
- Upload directo desde el cliente mediante **unsigned preset** restringido o firmado desde el backend con API Secret.
- Aplicar transformaciones automáticas en la URL (`w_800,q_auto,f_auto`) para optimización y no servir imágenes originales pesadas.
- Almacenar únicamente el `public_id` o la URL optimizada en la base de datos PostgreSQL, nunca binarios.

## 11. Secretos

Nunca guardar en Git:

```text
DATABASE_URL
CLERK_SECRET_KEY
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

Usar variables de entorno en Fly.io y Vercel.

## 12. Logging

Loggear:

- request id;
- endpoint;
- status;
- duración;
- errores internos;
- eventos de autenticación;
- cambios administrativos relevantes.

No loggear:

- passwords;
- cookies;
- tokens;
- connection strings;
- secretos.

## 13. Headers

Configurar como mínimo, según compatibilidad:

- Content-Security-Policy;
- X-Content-Type-Options;
- Referrer-Policy;
- Permissions-Policy;
- Strict-Transport-Security en producción;
- frame-ancestors mediante CSP.

## 14. Rate limiting

Prioridad:

1. login;
2. endpoints administrativos;
3. endpoints públicos susceptibles de abuso.

No introducir Redis solo para esto en V1. Puede comenzar con rate limiting apropiado en infraestructura o un mecanismo simple del backend; escalar posteriormente.

## 15. Auditoría

Los cambios de stock deben tener historial.

Más adelante agregar:

```text
audit_logs
```

para acciones administrativas sensibles.
