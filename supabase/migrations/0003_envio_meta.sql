-- Envío de productos al catálogo de Meta + página pública de cada producto.

-- ───────────── Estado del envío ─────────────
-- 'enviando' = se mandó a Meta y estamos esperando que lo procese (Meta trabaja por lotes).
alter table public.productos drop constraint productos_meta_estado_check;
alter table public.productos add constraint productos_meta_estado_check
  check (meta_estado in ('pendiente', 'enviando', 'sincronizado', 'error'));

alter table public.productos add column meta_lote text;   -- "handle" del lote en Meta

-- ───────────── Ajustes del negocio (una sola fila) ─────────────
create table public.ajustes (
  id        smallint primary key default 1 check (id = 1),
  whatsapp  text check (whatsapp ~ '^[0-9]{8,15}$'),     -- solo números, con código de país (549...)
  marca     text not null default 'Alaska Kids'
);
insert into public.ajustes (id) values (1);

alter table public.ajustes enable row level security;
create policy "logueados editan ajustes" on public.ajustes for update to authenticated using (true) with check (true);
create policy "todos leen ajustes"       on public.ajustes for select to anon, authenticated using (true);

-- ───────────── Lectura pública (página /p/[id] que Meta usa como link) ─────────────
-- Los visitantes solo pueden LEER estas columnas; nada de escribir ni ver datos internos.
create policy "todos ven productos" on public.productos      for select to anon using (true);
create policy "todos ven fotos"     on public.producto_fotos for select to anon using (true);

revoke select on public.productos from anon;
grant select (id, nombre, descripcion, precio, talles, disponible) on public.productos to anon;
revoke select on public.producto_fotos from anon;
grant select (id, producto_id, storage_path, orden) on public.producto_fotos to anon;
revoke select on public.ajustes from anon;
grant select (id, whatsapp, marca) on public.ajustes to anon;
