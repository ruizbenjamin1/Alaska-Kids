-- Publicación de productos en Instagram y en la página de Facebook.

-- Página e Instagram elegidos para publicar (se detectan al conectar con Facebook)
alter table public.meta_conexion
  add column pagina_id     text,
  add column pagina_nombre text,
  add column ig_id         text,
  add column ig_usuario    text;

-- Historial de publicaciones de cada producto
create table public.publicaciones (
  id           uuid primary key default gen_random_uuid(),
  producto_id  uuid references public.productos (id) on delete set null,
  red          text not null check (red in ('instagram', 'facebook')),
  estado       text not null default 'publicando' check (estado in ('publicando', 'publicado', 'error')),
  texto        text not null default '',
  post_id      text,
  link         text,
  error        text,
  creado_por   uuid default auth.uid() references auth.users (id) on delete set null,
  creado_en    timestamptz not null default now()
);

create index publicaciones_producto_idx on public.publicaciones (producto_id, creado_en desc);
create index publicaciones_creado_por_idx on public.publicaciones (creado_por);

alter table public.publicaciones enable row level security;

create policy "logueados leen publicaciones"   on public.publicaciones for select to authenticated using (true);
create policy "logueados crean publicaciones"  on public.publicaciones for insert to authenticated with check (true);
create policy "logueados editan publicaciones" on public.publicaciones for update to authenticated using (true) with check (true);
