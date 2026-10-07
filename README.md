# KIIROX

Plataforma web comercial para la venta de suplementos deportivos, running y accesorios.

## 🌐 Despliegues en Vivo

- **Tienda Pública**: [https://kiirox.vercel.app](https://kiirox.vercel.app)
- **Panel Administrador**: [https://kiirox.vercel.app/admin](https://kiirox.vercel.app/admin)
- **API Backend**: [https://kiirox-api.fly.dev](https://kiirox-api.fly.dev)
- **Bitácora de Decisiones y Progreso**: [`.docs/11-DECISIONS-AND-PROGRESS.md`](.docs/11-DECISIONS-AND-PROGRESS.md)

## Stack Oficial


- **Frontend**: Next.js 15+ (React, Tailwind CSS, TypeScript, shadcn/ui) en **Vercel**
- **Backend**: Gleam (compilado a Erlang/BEAM con Wisp + Mist) en **Fly.io**
- **Base de datos**: **Neon** (PostgreSQL Serverless con branching)
- **Autenticación**: **Clerk** (Free tier)
- **Imágenes / CDN**: **Cloudinary** (Free tier con transformaciones automáticas on-the-fly)

## Estructura del Proyecto

```text
.
├── apps/
│   ├── web/         # Aplicación Next.js (Storefront & Admin)
│   └── api/         # API REST en Gleam (Wisp + Mist)
├── infra/
│   └── migrations/  # Migraciones SQL para PostgreSQL (Neon)
├── .docs/           # Documentación técnica de arquitectura y diseño
├── agents.md        # Reglas y protocolo para agentes de IA
└── .env.example     # Variables de entorno de referencia
```

## Desarrollo Local

### Requisitos previos

- Node.js >= 20
- Gleam >= 1.0 y Erlang/OTP >= 27
- Cuenta en Neon (PostgreSQL), Clerk y Cloudinary

### Pasos

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/Thomashzr/Kiirox-page.git
   cd Kiirox-page
   ```

2. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   ```

3. Backend (API Gleam):
   ```bash
   cd apps/api
   gleam run
   ```

4. Frontend (Next.js):
   ```bash
   cd apps/web
   npm install
   npm run dev
   ```

## Ramas

- `produccion`: Rama principal de despliegue a producción en Vercel y Fly.io.
- `desarrollo`: Rama de desarrollo e integración continua.
