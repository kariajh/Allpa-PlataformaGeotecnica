# GeoField Frontend

PWA React + TypeScript + Vite, offline-first, para captura de datos geotécnicos
de campo. Pensada para consumir el backend FastAPI (9 módulos) que ya tenés
corriendo en `localhost:8000`.

## Stack y por qué

| Pieza | Elegido | Por qué |
|---|---|---|
| Build | Vite | Estándar de facto, dev server rápido, ya lo usás en ERP Obras |
| UI | Tailwind + shadcn/ui | Consistencia con ERP Obras, componentes accesibles sobre Radix |
| Routing | React Router v6 | Simple, suficiente para una app de módulos |
| Server state | TanStack Query | Cache, reintentos, y `networkMode: offlineFirst` listo para campo |
| Estado global liviano | Zustand | Sin boilerplate, para auth y estado de sync |
| Almacenamiento offline | Dexie (IndexedDB) | Reemplaza SQLite/SQLCipher del diseño original; ver nota abajo |
| HTTP | Axios | Interceptores para token y detección de error de red |
| Formularios | React Hook Form + Zod | Validación de datos técnicos (SPT, CPT) con buen rendimiento |
| PWA | vite-plugin-pwa (Workbox) | Manifest + service worker con `NetworkFirst` para `/api/*` |

### Nota sobre offline-first: cambio de SQLite/SQLCipher a IndexedDB

El diseño original de GeoField (dispositivo nativo) usaba SQLite con
SQLCipher (AES-256) y sincronizaba vía `.geopack`. Al ser ahora una PWA que
corre en el navegador, no hay acceso a SQLite nativo: el equivalente web es
IndexedDB, acá envuelto con Dexie para que el código sea legible. El cifrado
en reposo de SQLCipher **no tiene un equivalente automático en el browser**;
si te importa mantener esa garantía, hay que sumar `dexie-encrypted` o cifrar
a mano antes de guardar. Lo dejo pendiente como decisión a tomar, no lo
asumí por vos.

`src/db/schema.ts` define las tablas espejo de cada módulo más una tabla
`outbox`: ahí se encolan las mutaciones (crear/editar/eliminar) hechas sin
conexión, para que un worker de sync las dispare cuando vuelve la red. Ese
worker todavía no está implementado — es el siguiente paso lógico después
de levantar las pantallas.

## Estructura

```
geofield-frontend/
├── public/
│   └── icons/              íconos PWA (placeholder, reemplazar por el logo real)
├── src/
│   ├── api/
│   │   ├── client.ts        instancia axios + interceptores (auth, error de red)
│   │   ├── resource.ts       factory CRUD genérica
│   │   ├── index.ts          una instancia de resource por módulo CRUD
│   │   └── sync.ts           push/pull/.geopack (no es CRUD estándar)
│   ├── components/
│   │   ├── layout/           AppLayout, Sidebar, indicador online/offline
│   │   └── ui/                acá van los componentes que genere shadcn (ver Setup)
│   ├── db/
│   │   └── schema.ts          Dexie: tablas offline + outbox
│   ├── features/               un folder por módulo del backend
│   │   ├── proyectos/pages/
│   │   ├── sondeos/pages/
│   │   ├── spt/pages/
│   │   ├── cpt/pages/
│   │   ├── estratigrafia/pages/
│   │   ├── multimedia/pages/
│   │   ├── auditoria/pages/
│   │   ├── dispositivos/pages/
│   │   └── sync/pages/
│   ├── lib/
│   │   ├── utils.ts            helper cn() para Tailwind
│   │   └── queryClient.ts      config de TanStack Query
│   ├── routes/index.tsx        rutas, una por módulo
│   ├── stores/
│   │   ├── authStore.ts        token/login, listo para AUTH_ENABLED
│   │   └── syncStore.ts        online/offline, pendientes, último sync
│   ├── types/index.ts          tipos placeholder, a ajustar contra el backend real
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── vite.config.ts               incluye vite-plugin-pwa + proxy a :8000
├── tailwind.config.js
├── tsconfig.json
└── .env.example
```

Cada módulo (`features/<módulo>/pages/<Módulo>Page.tsx`) hoy es un placeholder
que renderiza un título. Las rutas y el sidebar ya apuntan a los 9, así que
podés ir reemplazando cada página de a una sin tocar el resto.

## Setup local

```bash
# 1. copiar/mover esta carpeta dentro de tu monorepo GeoApp/, por ej. como GeoApp/frontend
cp -r geofield-frontend GeoApp/frontend
cd GeoApp/frontend

# 2. variables de entorno
cp .env.example .env

# 3. instalar dependencias
npm install

# 4. inicializar shadcn/ui (interactivo, elegí "Default" style y "Slate" como color base
#    para que combine con las variables CSS ya definidas en src/index.css)
npx shadcn@latest init

# 5. correr en dev (con el backend FastAPI corriendo en :8000)
npm run dev
```

El `vite.config.ts` ya tiene un proxy de `/api` → `http://localhost:8000`,
así que desde el código podés llamar a rutas relativas si preferís, o usar
`VITE_API_URL` directo como está armado en `src/api/client.ts`.

## Próximos pasos sugeridos

1. **Compartime el OpenAPI del backend** (`localhost:8000/openapi.json` o el
   contenido de `/docs`) para reemplazar los tipos placeholder de
   `src/types/index.ts` y los endpoints de `src/api/index.ts` por los reales
   — nombres de campo exactos, enums, etc.
2. **Auth**: cuando actives `AUTH_ENABLED` en el backend, `authStore.ts` y el
   interceptor de `client.ts` ya están preparados; solo falta la pantalla de
   login y envolver las rutas con un guard.
3. **Worker de sync**: drenar la tabla `outbox` de Dexie contra el backend
   cuando `syncStore.isOnline` pasa a `true`.
4. **Pantallas reales** módulo por módulo, probablemente arrancando por
   Proyectos → Sondeos (son la base jerárquica de todo lo demás: SPT, CPT y
   Estratigrafía cuelgan de un sondeo).

¿Por cuál módulo querés que empecemos a construir la pantalla real?
