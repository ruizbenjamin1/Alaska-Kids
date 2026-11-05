-- Las categorías ahora viajan al catálogo de Meta (campo product_type) y arman las colecciones de WhatsApp.
-- Por eso, cambiar las categorías de un producto también lo deja "pendiente" para volver a enviarlo.

create or replace function public.set_actualizado_en()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizado_en := now();
  -- si cambia algo que Meta muestra (o que define en qué colección aparece), hay que volver a sincronizar
  if (new.nombre, new.descripcion, new.precio, new.talles, new.disponible, new.categorias)
     is distinct from (old.nombre, old.descripcion, old.precio, old.talles, old.disponible, old.categorias) then
    new.meta_estado := 'pendiente';
  end if;
  return new;
end;
$$;
