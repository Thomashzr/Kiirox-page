# KIIROX — Estructura inicial recomendada

```text
kiirox/
├── apps/
│   ├── web/
│   │   ├── app/
│   │   │   ├── (store)/
│   │   │   ├── admin/
│   │   │   └── api-proxy/        # solo si luego resulta necesario
│   │   ├── components/
│   │   ├── features/
│   │   ├── lib/
│   │   └── public/
│   │
│   └── api/
│       ├── src/
│       │   └── kiirox/
│       │       ├── domain/
│       │       ├── application/
│       │       ├── infrastructure/
│       │       ├── interfaces/
│       │       ├── config.gleam
│       │       ├── app.gleam
│       │       └── main.gleam
│       └── test/
│
├── infra/
│   ├── migrations/
│   ├── seeds/
│   └── docker/
│
├── docs/
├── .github/
│   └── workflows/
├── .env.example
└── README.md
```

## Regla

No crear carpetas por anticipación si no contienen una responsabilidad real.

El agente puede adaptar nombres a las convenciones de Next.js y Gleam, pero debe preservar separación entre:

- dominio;
- aplicación;
- infraestructura;
- interfaces HTTP.
