"use server";

import { revalidatePath } from "next/cache";
import { conexionLista } from "@/lib/catalogo";
import { ErrorMeta, graph } from "@/lib/meta";
import { createClient } from "@/lib/supabase/server";
import { BUCKET } from "@/lib/types";
import { enviarProductos } from "./sincronizar";

export type ResultadoImportar = { ok: boolean; mensaje: string; quedan?: number } | null;

type ItemMeta = {
  id: string;
  retailer_id?: string;
  name?: string;
  description?: string;
  price?: string;
  availability?: string;
  size?: string;
  image_url?: string;
  additional_image_urls?: string[];
};

/** Por tanda: así cada clic termina antes del límite de tiempo de Vercel. Se vuelve a tocar para seguir. */
const POR_TANDA = 12;

/** "ARS7,500.00" / "$7.500,00" / "7500" → 7500 */
function leerPrecio(texto: string | undefined): number | null {
  if (!texto) return null;
  const limpio = texto.replace(/[^\d.,]/g, "");
  if (!limpio) return null;
  // El último separador seguido de 1 o 2 dígitos son los centavos; el resto son separadores de miles
  const m = limpio.match(/^(.*?)[.,](\d{1,2})$/);
  const entero = (m ? m[1] : limpio).replace(/[.,]/g, "");
  const valor = Number(`${entero}.${m ? m[2] : "0"}`);
  return Number.isFinite(valor) ? valor : null;
}

const normalizar = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

/**
 * Trae los productos de otro catálogo de Meta (por ejemplo, el que se armó a mano en WhatsApp Business)
 * y los crea en la app con sus fotos. Los que ya existen con el mismo nombre se saltean,
 * así se puede tocar varias veces sin duplicar nada.
 */
export async function importarCatalogo(_prev: ResultadoImportar, formData: FormData): Promise<ResultadoImportar> {
  const origen = String(formData.get("catalogo_origen") ?? "").replace(/\D/g, "");
  if (!origen) return { ok: false, mensaje: "Poné el ID del catálogo del que querés traer los productos." };

  const supabase = await createClient();
  const conexion = await conexionLista(supabase).catch(() => null);
  if (!conexion) return { ok: false, mensaje: "Primero conectá la app con Facebook." };
  if (origen === conexion.catalogoId) {
    return { ok: false, mensaje: "Ese es el catálogo que ya usa la app. Poné el ID del catálogo de WhatsApp." };
  }

  // 1. Leer todos los productos del catálogo de origen
  const items: ItemMeta[] = [];
  try {
    let siguiente: string | undefined;
    do {
      const pagina = await graph<{ data: ItemMeta[]; paging?: { cursors?: { after?: string }; next?: string } }>(
        `${origen}/products`,
        conexion.token,
        {
          fields: "id,retailer_id,name,description,price,availability,size,image_url,additional_image_urls",
          limit: "100",
          ...(siguiente ? { after: siguiente } : {}),
        },
      );
      items.push(...pagina.data);
      siguiente = pagina.paging?.next ? pagina.paging.cursors?.after : undefined;
    } while (siguiente && items.length < 2000);
  } catch (e) {
    const motivo = e instanceof ErrorMeta ? e.message : String(e);
    return {
      ok: false,
      mensaje: `Meta no dejó leer ese catálogo. ${motivo} Puede ser que el catálogo de WhatsApp no se pueda leer desde afuera o que falte darle acceso al reconectar.`,
    };
  }
  if (items.length === 0) return { ok: true, mensaje: "Ese catálogo no tiene productos." };

  // 2. Saltear los que ya están en la app (mismo nombre)
  const { data: existentes } = await supabase.from("productos").select("nombre");
  const yaEstan = new Set((existentes ?? []).map((p) => normalizar(p.nombre as string)));
  const faltan = items.filter((i) => i.name && !yaEstan.has(normalizar(i.name)));
  if (faltan.length === 0) {
    return { ok: true, mensaje: `Listo: los ${items.length} productos de ese catálogo ya están en la app.`, quedan: 0 };
  }

  // 3. Crear una tanda
  const tanda = faltan.slice(0, POR_TANDA);
  const creados: string[] = [];
  const fallidos: string[] = [];
  for (const item of tanda) {
    const precio = leerPrecio(item.price);
    const urls = [item.image_url, ...(item.additional_image_urls ?? [])].filter((u): u is string => Boolean(u)).slice(0, 10);
    if (precio === null || urls.length === 0) {
      fallidos.push(item.name!);
      continue;
    }
    const { data: nuevo, error } = await supabase
      .from("productos")
      .insert({
        nombre: item.name!.slice(0, 150),
        descripcion: (item.description ?? "").trim() === item.name ? "" : (item.description ?? "").trim(),
        precio,
        talles: item.size?.trim() || null,
        disponible: item.availability !== "out of stock",
      })
      .select("id")
      .single();
    if (error || !nuevo) {
      fallidos.push(item.name!);
      continue;
    }

    const filas: { producto_id: string; storage_path: string; orden: number }[] = [];
    for (const url of urls) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
        if (!res.ok) continue;
        const tipo = res.headers.get("content-type") ?? "image/jpeg";
        const ruta = `${nuevo.id}/${crypto.randomUUID()}.jpg`;
        const { error: e } = await supabase.storage
          .from(BUCKET)
          .upload(ruta, await res.arrayBuffer(), { contentType: tipo, cacheControl: "31536000" });
        if (!e) filas.push({ producto_id: nuevo.id, storage_path: ruta, orden: filas.length });
      } catch {
        // Si una foto no baja, se sigue con las demás
      }
    }
    if (filas.length === 0) {
      await supabase.from("productos").delete().eq("id", nuevo.id);
      fallidos.push(item.name!);
      continue;
    }
    await supabase.from("producto_fotos").insert(filas);
    creados.push(nuevo.id as string);
  }

  // 4. Mandar los nuevos al catálogo de la app
  if (creados.length) await enviarProductos(creados).catch(() => null);
  revalidatePath("/");
  revalidatePath("/meta");

  const quedan = faltan.length - tanda.length;
  const partes = [`Se trajeron ${creados.length} producto(s).`];
  if (fallidos.length) partes.push(`No se pudieron traer: ${fallidos.join(", ")}.`);
  if (quedan > 0) partes.push(`Faltan ${quedan}: tocá "Traer productos" otra vez para seguir.`);
  else partes.push("Ya están todos.");
  return { ok: fallidos.length === 0, mensaje: partes.join(" "), quedan };
}
