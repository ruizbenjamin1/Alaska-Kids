"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { GRAPH, buscarCatalogo, descifrar, listarCatalogos } from "@/lib/meta";
import { listarCuentas } from "@/lib/redes";
import { createClient } from "@/lib/supabase/server";

async function conexionActual() {
  const supabase = await createClient();
  const { data } = await supabase.from("meta_conexion").select("token_cifrado").eq("id", 1).maybeSingle();
  return { supabase, token: data ? descifrar(data.token_cifrado) : null };
}

export async function elegirCatalogo(formData: FormData) {
  const id = String(formData.get("catalogo_id") ?? "").replace(/\D/g, "");
  const { supabase, token } = await conexionActual();
  if (!token || !id) return;
  // Se verifica con Meta (no se confía en lo que manda el formulario): primero en la lista,
  // y si no aparece (por ejemplo, un catálogo creado desde WhatsApp), consultándolo por su ID.
  let elegido: { id: string; name: string; negocioId: string | null; negocioNombre: string | null } | undefined =
    (await listarCatalogos(token).catch(() => [])).find((c) => c.id === id);
  if (!elegido) {
    try {
      elegido = await buscarCatalogo(token, id);
    } catch (e) {
      const motivo = e instanceof Error ? e.message : "";
      redirect(
        "/meta?error=" +
          encodeURIComponent(`No se pudo usar el catálogo ${id}: la cuenta conectada no tiene acceso. ${motivo}`),
      );
    }
  }
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

/** Elige la página de Facebook (y su Instagram) donde se publican los productos. */
export async function elegirPagina(formData: FormData) {
  const id = String(formData.get("pagina_id") ?? "");
  const { supabase, token } = await conexionActual();
  if (!token || !id) return;
  const cuenta = (await listarCuentas(token).catch(() => [])).find((c) => c.paginaId === id);
  if (!cuenta) return;
  await supabase
    .from("meta_conexion")
    .update({
      pagina_id: cuenta.paginaId,
      pagina_nombre: cuenta.paginaNombre,
      ig_id: cuenta.igId,
      ig_usuario: cuenta.igUsuario,
    })
    .eq("id", 1);
  revalidatePath("/meta");
}
