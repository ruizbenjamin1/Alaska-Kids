"use server";

import { revalidatePath } from "next/cache";
import { GRAPH, descifrar, listarCatalogos } from "@/lib/meta";
import { createClient } from "@/lib/supabase/server";

async function conexionActual() {
  const supabase = await createClient();
  const { data } = await supabase.from("meta_conexion").select("token_cifrado").eq("id", 1).maybeSingle();
  return { supabase, token: data ? descifrar(data.token_cifrado) : null };
}

export async function elegirCatalogo(formData: FormData) {
  const id = String(formData.get("catalogo_id") ?? "");
  const { supabase, token } = await conexionActual();
  if (!token || !id) return;
  // Se vuelve a pedir la lista a Meta para no confiar en lo que manda el formulario
  const elegido = (await listarCatalogos(token)).find((c) => c.id === id);
  if (!elegido) return;
  await supabase
    .from("meta_conexion")
    .update({
      catalogo_id: elegido.id,
      catalogo_nombre: elegido.name,
      negocio_id: elegido.negocioId,
      negocio_nombre: elegido.negocioNombre,
    })
    .eq("id", 1);
  revalidatePath("/meta");
}

export async function cambiarCatalogo() {
  const supabase = await createClient();
  await supabase.from("meta_conexion").update({ catalogo_id: null, catalogo_nombre: null }).eq("id", 1);
  revalidatePath("/meta");
}

export async function desconectar() {
  const { supabase, token } = await conexionActual();
  if (token) {
    // Quita los permisos en Facebook también (si falla, igual se borra la conexión de acá)
    await fetch(`${GRAPH}/me/permissions?access_token=${encodeURIComponent(token)}`, {
      method: "DELETE",
      signal: AbortSignal.timeout(8000),
    }).catch(() => null);
  }
  await supabase.from("meta_conexion").delete().eq("id", 1);
  revalidatePath("/meta");
}
