-- Alaska Kids · catálogo de productos
-- Tablas de productos y fotos, bucket público para las imágenes (Meta necesita URLs públicas)
-- y políticas RLS: solo usuarios logueados (Nicole y el admin) pueden leer y escribir.

-- ───────────── Productos ─────────────
create table public.productos (
  id              uuid primary key default gen_random_uuid(),
  nombre          text not null check (char_length(nombre) between 1 and 150),
  descripcion     text not null default '' check (char_length(descripcion) <= 5000),
  precio          numeric(12, 2) not null check (precio >= 0),
  talles          text,                                   -- ej: "2 al 8" (texto libre por ahora)
  disponible      boolean not null default true,
  -- Estado de sincronización con el catálogo de Meta (se usa en la etapa 2)
  meta_estado     text not null default 'pendiente'
                  check (meta_estado in ('pendiente', 'sincronizado', 'error')),
  meta_error      text,
  meta_sync_en    timestamptz,
  creado_por      uuid default auth.uid() references auth.users (id) on delete set null,
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now()
);

create index productos_creado_en_idx on public.productos (creado_en desc);
create index productos_creado_por_idx on public.productos (creado_por);

-- ───────────── Fotos (varias por producto, ordenadas) ─────────────
create table public.producto_fotos (
  id            uuid primary key default gen_random_uuid(),
  producto_id   uuid not null references public.productos (id) on delete cascade,
  storage_path  text not null unique,                     -- ruta dentro del bucket "productos"
  orden         smallint not null default 0,              -- 0 = foto principal
  creado_en     timestamptz not null default now()
);

create index producto_fotos_producto_idx on public.producto_fotos (producto_id, orden);

-- ───────────── actualizado_en automático ─────────────
create or replace function public.set_actualizado_en()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizado_en := now();
  -- si cambia algo que Meta muestra, hay que volver a sincronizar
  if (new.nombre, new.descripcion, new.precio, new.talles, new.disponible)
     is distinct from (old.nombre, old.descripcion, old.precio, old.talles, old.disponible) then
    new.meta_estado := 'pendiente';
  end if;
  return new;
end;
$$;

create trigger productos_set_actualizado_en
before update on public.productos
for each row execute function public.set_actualizado_en();

-- ───────────── RLS ─────────────
alter table public.productos      enable row level security;
alter table public.producto_fotos enable row level security;

create policy "logueados leen productos"      on public.productos      for select to authenticated using (true);
create policy "logueados crean productos"     on public.productos      for insert to authenticated with check (true);
create policy "logueados editan productos"    on public.productos      for update to authenticated using (true) with check (true);
create policy "logueados borran productos"    on public.productos      for delete to authenticated using (true);

create policy "logueados leen fotos"          on public.producto_fotos for select to authenticated using (true);
create policy "logueados crean fotos"         on public.producto_fotos for insert to authenticated with check (true);
create policy "logueados editan fotos"        on public.producto_fotos for update to authenticated using (true) with check (true);
create policy "logueados borran fotos"        on public.producto_fotos for delete to authenticated using (true);

-- ───────────── Storage: bucket público de fotos ─────────────
-- Público = cualquiera con la URL puede VER la foto (lo necesita Meta).
-- Subir, reemplazar y borrar queda solo para usuarios logueados.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('productos', 'productos', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- (borrar desde la API también necesita poder "ver" el objeto)
create policy "logueados ven fotos"
  on storage.objects for select to authenticated
  using (bucket_id = 'productos');

create policy "logueados suben fotos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'productos');

create policy "logueados actualizan fotos"
  on storage.objects for update to authenticated
  using (bucket_id = 'productos');

create policy "logueados borran fotos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'productos');
