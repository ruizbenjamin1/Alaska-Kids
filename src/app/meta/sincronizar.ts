"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { aItemDeMeta, conexionLista, enviarLote, type ProductoMeta } from "@/lib/catalogo";
import { createClient } from "@/lib/supabase/server";

export type ResultadoEnvio = { ok: boolean; mensaje: string };

/**
 * Manda productos al catálogo de Meta.
 * Sin `ids`, manda todos los pendientes y los que dieron error.
 * Si Meta no está conectado, no hace nada: los productos quedan "pendientes" para más adelante.
 */
export async function enviarProductos(ids?: string[]): Promise<ResultadoEnvio> {
  const supabase = await createClient();
  const conexion = await conexionLista(supabase).catch(() => null);
  if (!conexion) return { ok: false, mensaje: "Meta no está conectado: los cambios quedan pendientes." };

  let consulta = supabase
    .from("productos")
    .select("id, nombre, descripcion, precio, talles, disponible, categorias, producto_fotos(storage_path, orden)");
  consulta = ids?.length ? consulta.in("id", ids) : consulta.in("meta_estado", ["pendiente", "error"]);
  const { data, error } = await consulta;
  if (error) return { ok: false, mensaje: error.message };

  const productos = ((data ?? []) as ProductoMeta[]).filter((p) => p.producto_fotos.length > 0);
  if (productos.length === 0) return { ok: true, mensaje: "No hay productos para enviar." };

  const { data: ajustes } = await supabase.from("ajustes").select("marca").eq("id", 1).maybeSingle();
  const marca = ajustes?.marca ?? "Alaska Kids";
  const enviados = productos.map((p) => p.id);

  try {
    // Meta acepta hasta 5000 por lote; para una tienda alcanza con uno
    const handle = await enviarLote(
      conexion,
      productos.map((p) => ({ method: "UPDATE", data: aItemDeMeta(p, marca) })),
    );
    await supabase
      .from("productos")
      .update({ meta_estado: "enviando", meta_lote: handle, meta_error: null, meta_sync_en: new Date().toISOString() })
      .in("id", enviados);
    return { ok: true, mensaje: `${enviados.length} producto(s) enviado(s) a Meta.` };
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : "No se pudo enviar a Meta.";
    await supabase.from("productos").update({ meta_estado: "error", meta_error: mensaje }).in("id", enviados);
    return { ok: false, mensaje };
  } finally {
    revalidatePath("/meta");
    revalidatePath("/");
  }
}

/** Botón "Enviar pendientes" de la pantalla Meta. */
export async function enviarPendientes() {
  await enviarProductos();
}

/**
 * Botón "Actualizar colecciones" de la pantalla Meta.
 * 1. Reenvía todos los productos, para que Meta tenga la categoría de cada uno
 *    (los cargados antes de este cambio no la tenían).
 * 2. Meta procesa el lote en unos minutos; cuando termina, las colecciones que falten se crean solas
 *    la próxima vez que se abra la app (ver actualizarLotes).
 */
export async function sincronizarColecciones() {
  const supabase = await createClient();
  const conexion = await conexionLista(supabase).catch(() => null);
  if (!conexion) redirect("/meta?error=" + encodeURIComponent("Primero conectá Meta y elegí el catálogo."));

  // Primero se reenvían todos: los productos que Meta ya tenía de antes no tienen la categoría cargada,
  // y Meta no deja crear una colección que quedaría vacía.
  const { data } = await supabase.from("productos").select("id");
  const ids = (data ?? []).map((p) => p.id as string);
  const envio = ids.length ? await enviarProductos(ids) : { ok: true, mensaje: "" };
  if (!envio.ok) redirect("/meta?error=" + encodeURIComponent(`Falló el reenvío a Meta: ${envio.mensaje}`));

  // Las colecciones se crean solas cuando Meta termina de procesar el lote (ver actualizarLotes).
  const aviso =
    `${envio.mensaje} Cuando Meta termine de procesarlos (unos minutos), ` +
    "las colecciones se crean solas: volvé a entrar a esta pantalla para verlas.";
  redirect("/meta?aviso=" + encodeURIComponent(aviso.trim()));
}

/** Borra un producto del catálogo de Meta (se llama antes de eliminarlo de la app). */
export async function quitarDeMeta(id: string) {
  const supabase = await createClient();
  const conexion = await conexionLista(supabase).catch(() => null);
  if (!conexion) return;
  await enviarLote(conexion, [{ method: "DELETE", data: { id } }]).catch(() => null);
}

/** Datos del negocio que se usan en el catálogo y en la página pública. */
export async function guardarAjustes(formData: FormData) {
  const whatsapp = String(formData.get("whatsapp") ?? "").replace(/\D/g, "");
  const marca = String(formData.get("marca") ?? "").trim() || "Alaska Kids";
  if (whatsapp && !/^\d{8,15}$/.test(whatsapp)) {
    redirect("/meta?error=" + encodeURIComponent("El número de WhatsApp no es válido. Ejemplo: 5493811234567"));
  }
  const supabase = await createClient();
  await supabase
    .from("ajustes")
    .update({ whatsapp: whatsapp || null, marca })
    .eq("id", 1);
  revalidatePath("/meta");
}
