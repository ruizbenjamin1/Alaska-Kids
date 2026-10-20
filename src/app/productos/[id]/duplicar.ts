"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PREFIJO_FLYER, esFlyer } from "@/lib/flyer";
import { BUCKET } from "@/lib/types";

/**
 * Crea una copia del producto (mismas fotos, descripción, precio y talles) y abre la copia para editarla.
 * La copia queda "pendiente" y no se manda a Meta hasta que se guarde, así no aparece repetida en el catálogo.
 */
export async function duplicarProducto(formData: FormData) {
  const id = String(formData.get("producto_id") ?? "");
  const supabase = await createClient();

  const { data: original } = await supabase
    .from("productos")
    .select("nombre, descripcion, precio, talles, disponible, producto_fotos(storage_path, orden)")
    .eq("id", id)
    .maybeSingle();
  if (!original) redirect("/");

  const nombre = `${original.nombre} (copia)`.slice(0, 150);
  const { data: copia, error } = await supabase
    .from("productos")
    .insert({
      nombre,
      descripcion: original.descripcion,
      precio: original.precio,
      talles: original.talles,
      disponible: original.disponible,
    })
    .select("id")
    .single();
  if (error || !copia) redirect(`/productos/${id}?error=${encodeURIComponent("No se pudo duplicar el producto.")}`);

  // Las fotos se copian a la carpeta del producto nuevo (si se borra el original, la copia conserva las suyas)
  const fotos = [...(original.producto_fotos ?? [])].sort((a, b) => a.orden - b.orden);
  const filas: { producto_id: string; storage_path: string; orden: number }[] = [];
  for (const [orden, f] of fotos.entries()) {
    const destino = `${copia.id}/${esFlyer(f.storage_path) ? PREFIJO_FLYER : ""}${crypto.randomUUID()}.jpg`;
    const { error: e } = await supabase.storage.from(BUCKET).copy(f.storage_path, destino);
    if (!e) filas.push({ producto_id: copia.id, storage_path: destino, orden });
  }
  if (filas.length) await supabase.from("producto_fotos").insert(filas);

  redirect(`/productos/${copia.id}`);
}
