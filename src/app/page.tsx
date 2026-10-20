import Link from "next/link";
import ListaProductos from "@/components/ListaProductos";
import { actualizarLotes, conexionLista } from "@/lib/catalogo";
import { createClient } from "@/lib/supabase/server";
import type { Producto } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Inicio() {
  const supabase = await createClient();

  // Si hay productos "enviando", se le pregunta a Meta si ya los procesó (como máximo 4 segundos, para no demorar la lista)
  const { count: enviando } = await supabase
    .from("productos")
    .select("id", { count: "exact", head: true })
    .eq("meta_estado", "enviando");
  if (enviando) {
    const revisar = conexionLista(supabase).then((c) => (c ? actualizarLotes(supabase, c) : null));
    await Promise.race([revisar.catch(() => null), new Promise((ok) => setTimeout(ok, 4000))]);
  }

  const { data, error } = await supabase
    .from("productos")
    .select("id, nombre, descripcion, precio, talles, disponible, meta_estado, creado_en, producto_fotos(id, storage_path, orden), publicaciones(red, estado)")
    .order("creado_en", { ascending: false })
    .order("orden", { referencedTable: "producto_fotos", ascending: true });

  const productos = (data ?? []) as Producto[];
  const disponibles = productos.filter((p) => p.disponible).length;

  return (
    <>
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
            <p className="text-sm text-tinta-suave">
              {productos.length === 0
                ? "Todavía no hay productos cargados."
                : `${productos.length} en total · ${disponibles} disponibles`}
            </p>
          </div>
          <Link href="/productos/nuevo" className="boton">
            + Nuevo producto
          </Link>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-peligro-suave px-3 py-2 text-sm text-peligro">
            No se pudieron cargar los productos: {error.message}
          </p>
        )}

        {productos.length === 0 && !error ? (
          <div className="rounded-2xl border border-dashed border-borde bg-papel px-6 py-16 text-center">
            <p className="font-medium">Cargá el primer producto</p>
            <p className="mx-auto mt-1 max-w-xs text-sm text-tinta-suave">
              Tocá “+ Nuevo producto” para subir las fotos y poner nombre, descripción y precio.
            </p>
          </div>
        ) : (
          <ListaProductos productos={productos} />
        )}
      </main>
    </>
  );
}
