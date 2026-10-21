# Alaska Kids · Catálogo

Una app web para que Alaska Kids cargue sus productos (fotos, nombre, descripción, precio, talles y si hay stock) en un solo lugar. Desde la app, cada producto:

- se sincroniza solo con el **catálogo de Meta**, que está conectado al catálogo de **WhatsApp Business** del local;
- se puede **publicar en Instagram y Facebook** con un botón (como post o carrusel);
- tiene su **página pública** con un botón para consultar por WhatsApp (es el link que usa el catálogo).

La usa Nicole desde el iPhone, el iPad y la compu, instalada como app web.

## Qué hace

**Productos**
- Alta, edición, duplicado y eliminación, con hasta 10 fotos por producto.
- Las fotos se comprimen en el navegador (JPEG de hasta 1600 px) antes de subirse.
- Se ordenan arrastrando, también en el celular (con dnd-kit).
- Botón opcional **"Generar imagen con precio"**: arma en el navegador un flyer de 1080 × 1080 con la foto, el nombre, el precio, los talles y los datos de contacto, y lo pone como foto principal.
- El precio se formatea con puntos mientras se escribe (12500 → 12.500).
- Interruptor disponible/agotado en la lista. Cambia al instante y se sincroniza en segundo plano.
- La lista tiene buscador (ignora tildes y mayúsculas), filtros (todos, disponibles, agotados, error en Meta) y orden (nuevos, viejos, precio).
- Cada tarjeta muestra si está en el catálogo, si se está enviando y si ya se publicó en IG o FB.

**Meta**
- Conexión con Facebook Login for Business. El token de larga duración (unos 60 días) se guarda cifrado con AES-256-GCM.
- Envío al catálogo por lotes (`items_batch`). La app revisa sola el resultado del lote y la lista se recarga mientras haya productos enviándose.
- Publicación en Instagram (foto o carrusel) y en la página de Facebook, con historial por producto.
- Pantalla **Meta**: estado de la conexión y su vencimiento, elección de catálogo y de página, conteo de productos, "Enviar pendientes" y los datos del negocio (WhatsApp, marca).

**Cuenta y uso**
- Login con email y contraseña, y "¿Olvidaste tu contraseña?". El link del mail funciona aunque se abra en otro aparato.
- App instalable (manifest, íconos y safe areas del iPhone), con modo claro y oscuro.
- **Guía** dentro de la app (`/ayuda`), escrita para Nicole.

## Stack

- Next.js 15 (App Router, server actions) + React 19 + Tailwind 4
- Supabase: Postgres con RLS, Auth y Storage (bucket público `productos`)
- Meta Graph API v23.0
- Vercel, con deploy automático desde `main`
- Letra Nunito (`@fontsource-variable/nunito`, incluida en la app)

## Puesta en marcha

1. **Supabase.** Corré las migraciones de `supabase/migrations/` en orden (`0001` a `0004`).
2. **Auth en Supabase:**
   - En Sign In / Providers, apagá "Allow new users to sign up". Las cuentas se crean a mano en Authentication → Users.
   - En URL Configuration, poné como **Site URL** la dirección de producción y agregá en **Redirect URLs** `https://<tu-dominio>/**` y `http://localhost:3000/**`.
3. **App de Meta** (developers.facebook.com, tipo Negocios):
   - Agregá Facebook Login for Business y creá una **configuración** con estos permisos: `catalog_management`, `business_management`, `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `instagram_basic` e `instagram_content_publish`.
   - Cargá el dominio de la app y la URL de redirección `https://<tu-dominio>/api/meta/callback`.
4. **Variables de entorno.** Copiá `.env.example` a `.env.local` y cargá las mismas variables en Vercel:
   | Variable | Para qué |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto de Supabase |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave publicable de Supabase |
   | `META_APP_ID` | ID de la app de Meta |
   | `META_APP_SECRET` | Clave secreta de la app (solo en el servidor; también se usa para cifrar el token) |
   | `META_CONFIG_ID` | ID de la configuración de Facebook Login for Business |
   | `NEXT_PUBLIC_SITE_URL` | Opcional: dirección pública. Si no está, en Vercel se usa la de producción |
5. **Levantar el proyecto:**
   ```bash
   npm install
   npm run dev
   ```
   En Windows con PowerShell, usá `npm.cmd install` y `npm.cmd run dev`.
6. **Conectar Meta:** en la app, entrá a **Meta** → "Conectar con Facebook". Elegí el catálogo y la página. En el WhatsApp Business del local, conectá ese mismo catálogo desde Ajustes → Catálogo → Ajustes del catálogo.

Lo que se carga desde `localhost` se manda a Meta con links a `localhost`. Para cargar productos reales, usá la versión publicada.

## Estructura

```
supabase/migrations/
  0001_productos.sql        productos, fotos, trigger de "pendiente", RLS y bucket
  0002_meta_conexion.sql    conexión con Meta (token cifrado, catálogo, negocio)
  0003_envio_meta.sql       estado "enviando", lotes y ajustes (WhatsApp, marca)
  0004_publicaciones.sql    página e Instagram elegidos e historial de publicaciones

src/app/
  page.tsx                  lista de productos (revisa los lotes enviados a Meta)
  productos/nuevo/          alta
  productos/[id]/           edición, duplicar, publicar en redes
  p/[id]/                   página pública del producto (sin login)
  meta/                     pantalla Meta y acciones de conexión y sincronización
  api/meta/                 inicio y vuelta del login con Facebook
  login/                    entrar, pedir recuperación, contraseña nueva
  auth/                     recibe el link del mail de recuperación
  ayuda/                    guía de uso
  manifest.ts, layout.tsx   app instalable, tema, letra

src/components/             formulario, lista, tarjeta, publicar en redes, menú, marca
src/lib/
  meta.ts                   Graph API, permisos, cifrado del token
  catalogo.ts               armado de items, envío y revisión de lotes
  redes.ts                  publicación en Instagram y Facebook
  flyer.ts                  generación de la imagen con precio (canvas)
  contacto.ts               datos de contacto para el flyer
  types.ts                  tipos y formato de precios
  supabase/                 clientes de Supabase y protección de rutas
src/middleware.ts           todo pide login salvo /login, /p/ y /auth/
```

## Datos

- `productos`: `meta_estado` puede ser `pendiente`, `enviando`, `sincronizado` o `error`. Un trigger lo vuelve a `pendiente` cuando cambia un dato que se ve en el catálogo.
- `producto_fotos`: `orden = 0` es la foto principal. Los flyers generados se guardan con el prefijo `flyer-` en el nombre del archivo.
- `meta_conexion`: una sola fila con el token cifrado, el catálogo, la página y el Instagram elegidos.
- `publicaciones`: historial de lo publicado en cada red (estado, link, error).
- `ajustes`: WhatsApp del local y marca.
- El bucket `productos` es de lectura pública, porque Meta necesita URLs públicas. Solo usuarios logueados suben o borran fotos.

## Limitaciones conocidas

- En Argentina no hay Tiendas de Meta: el catálogo se ve en WhatsApp, pero no se pueden etiquetar productos en Instagram.
- Los catálogos creados desde la app de WhatsApp Business no se pueden leer por API. Por eso se usa un catálogo creado en el Administrador de ventas.
- Lo que se publica en Instagram no se puede borrar desde la app; hay que borrarlo desde Instagram.
- La conexión con Facebook vence cada unos 60 días y hay que reconectar desde la pantalla Meta.
