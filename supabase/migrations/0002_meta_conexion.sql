-- Conexión con Meta (una sola fila).
-- El token de acceso se guarda CIFRADO (AES-256-GCM) con una clave que vive solo en el
-- servidor (derivada de META_APP_SECRET). Aunque alguien leyera la fila, no puede usarlo.

create table public.meta_conexion (
  id               smallint primary key default 1 check (id = 1),
  token_cifrado    text not null,
  token_expira_en  timestamptz,
  usuario_meta     text,                 -- nombre de la cuenta de Facebook que autorizó
  negocio_id       text,
  negocio_nombre   text,
  catalogo_id      text,                 -- null hasta que se elige el catálogo
  catalogo_nombre  text,
  conectado_por    uuid default auth.uid() references auth.users (id) on delete set null,
  conectado_en     timestamptz not null default now()
);

create index meta_conexion_conectado_por_idx on public.meta_conexion (conectado_por);

alter table public.meta_conexion enable row level security;

create policy "logueados leen la conexion"     on public.meta_conexion for select to authenticated using (true);
create policy "logueados crean la conexion"    on public.meta_conexion for insert to authenticated with check (true);
create policy "logueados editan la conexion"   on public.meta_conexion for update to authenticated using (true) with check (true);
create policy "logueados borran la conexion"   on public.meta_conexion for delete to authenticated using (true);
