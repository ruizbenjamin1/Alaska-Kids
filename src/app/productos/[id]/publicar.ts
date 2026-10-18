"use server";

import { revalidatePath } from "next/cache";
import { descifrar } from "@/lib/meta";
import { listarCuentas, publicarEnFacebook, publicarEnInstagram } from "@/lib/redes";
import { createClient } from "@/lib/supabase/server";
import { urlPublica } from "@/lib/types";

export type ResultadoPublicar = { ok: boolean; mensajes: string[] } | null;

const NOMBRE_RED = { instagram: "Instagram", facebook: "Facebook" } as const;

/** Publica el producto (sus fotos + el texto) en Instagram y/o en la página de Facebook. */
export async function publicarProducto(_previo: ResultadoPublicar, formData: FormData): Promise<ResultadoPublicar> {
  const productoId = String(formData.get("producto_id") ?? "");
  const texto = String(formData.get("texto") ?? "").trim().slice(0, 2200); // límite de Instagram
  const redes = formData.getAll("red").map(String).filter((r): r is "instagram" | "facebook" =>
    r === "instagram" || r === "facebook",
  );
  if (!productoId) return { ok: false, mensajes: ["Falta el producto."] };
  if (redes.length === 0) return { ok: false, mensajes: ["Elegí al menos una red."] };

  const supabase = await createClient();
  const [{ data: conexion }, { data: producto }] = await Promise.all([
    supabase.from("meta_conexion").select("token_cifrado, pagina_id").eq("id", 1).maybeSingle(),
    supabase
      .from("productos")
      .select("id, producto_fotos(storage_path, orden)")
      .eq("id", productoId)
      .order("orden", { referencedTable: "producto_fotos", ascending: true })
      .maybeSingle(),
  ]);
  if (!conexion) return { ok: false, mensajes: ["Meta no está conectado."] };
  if (!producto?.producto_fotos?.length) return { ok: false, mensajes: ["El producto no tiene fotos."] };

  let cuenta;
  try {
    const cuentas = await listarCuentas(descifrar(conexion.token_cifrado));
    cuenta = cuentas.find((c) => c.paginaId === conexion.pagina_id) ?? cuentas.find((c) => c.igId) ?? cuentas[0];
  } catch (e) {
    return { ok: false, mensajes: [`No se pudieron leer las páginas: ${e instanceof Error ? e.message : e}`] };
  }
  if (!cuenta) return { ok: false, mensajes: ["La cuenta conectada no administra ninguna página de Facebook."] };

  const fotos = producto.producto_fotos.map((f: { storage_path: string }) => urlPublica(f.storage_path));
  const mensajes: string[] = [];
  let ok = true;

  for (const red of redes) {
    const { data: fila } = await supabase
      .from("publicaciones")
      .insert({ producto_id: productoId, red, texto, estado: "publicando" })
      .select("id")
      .single();
    try {
      const r =
        red === "instagram"
          ? await publicarEnInstagram(cuenta, fotos, texto)
          : await publicarEnFacebook(cuenta, fotos, texto);
      if (fila) {
        await supabase
          .from("publicaciones")
          .update({ estado: "publicado", post_id: r.postId, link: r.link })
          .eq("id", fila.id);
      }
      mensajes.push(`✓ Publicado en ${NOMBRE_RED[red]}.`);
    } catch (e) {
      ok = false;
      const error = e instanceof Error ? e.message : String(e);
      if (fila) await supabase.from("publicaciones").update({ estado: "error", error }).eq("id", fila.id);
      mensajes.push(`✗ ${NOMBRE_RED[red]}: ${error}`);
    }
  }

  revalidatePath(`/productos/${productoId}`);
  return { ok, mensajes };
}
