# Alaska Kids · Catálogo

Una app web para cargar productos (con varias fotos, nombre, descripción, precio, talles y si está disponible) que después se sincronizan con el catálogo de Meta y se publican en las redes.

**Etapa 1 (esta versión):** login, carga y edición de productos con varias fotos, listado y el interruptor de disponible/agotado.
**Etapa 2:** sincronización con el catálogo de Meta y publicación en Instagram y Facebook.

## Stack

- Next.js 15 (App Router) + Tailwind 4
- Supabase: Postgres, Auth (email y contraseña) y Storage (bucket público `productos`)
- Las fotos se comprimen en el navegador (JPEG de hasta 1600 px) antes de subirse

## Puesta en marcha

1. **Proyecto de Supabase.** Crealo en la organización de Alaska Kids y corré `supabase/migrations/0001_productos.sql`, ya sea en el SQL Editor o con la migración.
2. **Desactivar los registros públicos.** En Authentication → Sign In / Providers, apagá "Allow new users to sign up". Las cuentas (la de Nicole y la tuya) se crean a mano desde Authentication → Users → Add user.
3. **Variables de entorno.** Copiá `.env.example` a `.env.local` y completalo con la URL y la publishable key (Project Settings → API).
4. Instalá y levantá el proyecto:
   ```bash
   npm install
   npm run dev
   ```
5. **Deploy.** Subilo a Vercel con las mismas dos variables de entorno.

## Estructura

```
supabase/migrations/0001_productos.sql   tablas, trigger, RLS y bucket de fotos
src/middleware.ts                        protege todas las páginas (manda a /login)
src/app/page.tsx                         listado de productos
src/app/productos/nuevo/page.tsx         alta
src/app/productos/[id]/page.tsx          edición y eliminación
src/components/FormularioProducto.tsx    formulario con fotos (subir, quitar, elegir la principal)
src/components/TarjetaProducto.tsx       tarjeta con el interruptor disponible/agotado
src/lib/types.ts                         tipos, formato de precio, URL pública de las fotos
```

## Datos

- `productos`: cada producto. `meta_estado` (`pendiente` / `sincronizado` / `error`) se usa en la etapa 2. Un trigger lo vuelve a `pendiente` cada vez que cambia el nombre, la descripción, el precio, los talles o la disponibilidad.
- `producto_fotos`: las fotos de cada producto. `orden = 0` es la foto principal. Si se borra el producto, se borran sus fotos en cascada.
- Bucket `productos`: es público para lectura, porque Meta necesita URLs públicas. Solo los usuarios logueados pueden subir o borrar fotos.
