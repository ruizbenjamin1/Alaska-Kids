-- Categorías de los productos. Un producto puede estar en más de una (por ejemplo "Bebés" y "Novedades").
-- Se guardan como claves fijas; los nombres que se muestran están en src/lib/types.ts (CATEGORIAS).

alter table public.productos
  add column categorias text[] not null default '{}'
  check (categorias <@ array['accesorios', 'bebes', 'ninos', 'adolescentes', 'novedades']::text[]);

-- Para filtrar rápido por categoría (where categorias @> '{bebes}')
create index productos_categorias_idx on public.productos using gin (categorias);
