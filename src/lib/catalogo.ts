import "server-only";
import { GRAPH, descifrar } from "@/lib/meta";
import { CATEGORIAS, urlPublica, type Categoria } from "@/lib/types";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Dirección pública de la app (la que Meta usa como link de cada producto). */
export function urlSitio() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

export type ProductoMeta = {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  talles: string | null;
  disponible: boolean;
  categorias: Categoria[] | null;
  producto_fotos: { storage_path: string; orden: number }[];
};

/** Arma el producto en el formato que pide el catálogo de Meta. */
export function aItemDeMeta(p: ProductoMeta, marca: string) {
  const fotos = [...p.producto_fotos].sort((a, b) => a.orden - b.orden).map((f) => urlPublica(f.storage_path));
  const descripcion = [p.descripcion.trim() || p.nombre, p.talles ? `Talles: ${p.talles}` : null]
    .filter(Boolean)
    .join("\n\n");
  return {
    id: p.id, // "retailer id": así Meta reconoce el mismo producto en cada envío
    title: p.nombre.slice(0, 150),
    description: descripcion.slice(0, 9999),
    availability: p.disponible ? "in stock" : "out of stock",
    condition: "new",
    price: `${Number(p.precio).toFixed(2)} ARS`,
    link: `${urlSitio()}/p/${p.id}`,
    image_link: fotos[0],
    ...(fotos.length > 1 ? { additional_image_link: fotos.slice(1, 11) } : {}),
    brand: marca,
    // Las categorías van como claves separadas por coma ("bebes,novedades").
    // Cada colección de WhatsApp filtra por "product_type contiene <clave>" (ver armarColecciones).
    // Ninguna clave está contenida dentro de otra, así que el filtro no se confunde.
    product_type: (p.categorias ?? []).join(","),
  };
}

// ───────────── Colecciones (conjuntos de productos) ─────────────

type ConjuntoMeta = { id: string; name: string };

function filtroDeCategoria(id: Categoria) {
  return JSON.stringify({ product_type: { i_contains: id } });
}

async function postGraph(ruta: string, token: string, params: Record<string, string>) {
  const res = await fetch(`${GRAPH}/${ruta}`, {
    method: "POST",
    body: new URLSearchParams({ ...params, access_token: token }),
    signal: AbortSignal.timeout(15000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message ?? `Meta respondió ${res.status}`);
  return json as { id?: string };
}

/**
 * Crea en el catálogo un conjunto de productos por cada categoría (WhatsApp los muestra como colecciones).
 * Cada conjunto es un filtro: los productos entran y salen solos según su categoría, sin tocar nada más.
 * Se puede llamar las veces que sea: si el conjunto ya existe (mismo nombre), solo le actualiza el filtro.
 */
export async function armarColecciones(conexion: { token: string; catalogoId: string }) {
  const url = new URL(`${GRAPH}/${conexion.catalogoId}/product_sets`);
  url.searchParams.set("fields", "id,name");
  url.searchParams.set("limit", "200");
  url.searchParams.set("access_token", conexion.token);
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10000) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message ?? `Meta respondió ${res.status}`);
  const existentes = (json.data ?? []) as ConjuntoMeta[];

  let creadas = 0;
  let actualizadas = 0;
  for (const c of CATEGORIAS) {
    const filter = filtroDeCategoria(c.id);
    const actual = existentes.find((e) => e.name.trim().toLowerCase() === c.nombre.toLowerCase());
    if (actual) {
      await postGraph(actual.id, conexion.token, { filter });
      actualizadas++;
    } else {
      await postGraph(`${conexion.catalogoId}/product_sets`, conexion.token, { name: c.nombre, filter });
      creadas++;
    }
  }
  return { creadas, actualizadas };
}

/** Token y catálogo, si la conexión está completa. */
export async function conexionLista(supabase: Supabase) {
  const { data } = await supabase
    .from("meta_conexion")
    .select("token_cifrado, catalogo_id")
    .eq("id", 1)
    .maybeSingle();
  if (!data?.catalogo_id || !process.env.META_APP_SECRET) return null;
  return { token: descifrar(data.token_cifrado), catalogoId: data.catalogo_id as string };
}

type Pedido = { method: "UPDATE" | "DELETE"; data: Record<string, unknown> };

/** Manda un lote al catálogo (Meta lo procesa en segundo plano y devuelve un "handle"). */
export async function enviarLote(conexion: { token: string; catalogoId: string }, pedidos: Pedido[]) {
  const body = new URLSearchParams({
    access_token: conexion.token,
    item_type: "PRODUCT_ITEM",
    allow_upsert: "true",
    requests: JSON.stringify(pedidos),
  });
  const res = await fetch(`${GRAPH}/${conexion.catalogoId}/items_batch`, {
    method: "POST",
    body,
    signal: AbortSignal.timeout(15000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message ?? `Meta respondió ${res.status}`);
  return (json.handles?.[0] as string | undefined) ?? null;
}

export type EstadoLote = {
  terminado: boolean;
  errores: { id?: string; message?: string }[];
};

/** Pregunta a Meta cómo terminó un lote. */
export async function revisarLote(conexion: { token: string; catalogoId: string }, handle: string): Promise<EstadoLote> {
  const url = new URL(`${GRAPH}/${conexion.catalogoId}/check_batch_request_status`);
  url.searchParams.set("handle", handle);
  url.searchParams.set("access_token", conexion.token);
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10000) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message ?? `Meta respondió ${res.status}`);
  const d = json.data?.[0] ?? {};
  return { terminado: d.status === "finished", errores: d.errors ?? [] };
}

/** Revisa los lotes que quedaron "enviando" y actualiza cada producto según lo que respondió Meta. */
export async function actualizarLotes(supabase: Supabase, conexion: { token: string; catalogoId: string }) {
  const { data } = await supabase.from("productos").select("id, meta_lote").eq("meta_estado", "enviando");
  const lotes = new Map<string, string[]>();
  for (const p of data ?? []) {
    if (!p.meta_lote) continue;
    lotes.set(p.meta_lote, [...(lotes.get(p.meta_lote) ?? []), p.id]);
  }

  for (const [handle, ids] of lotes) {
    let estado: EstadoLote;
    try {
      estado = await revisarLote(conexion, handle);
    } catch {
      continue; // se vuelve a intentar la próxima vez
    }
    if (!estado.terminado) continue;

    // Solo se tocan los que siguen "enviando" con ese lote (si alguien los editó mientras tanto, quedan pendientes)
    const sinId = estado.errores.some((e) => !e.id);
    if (sinId) {
      const mensaje = estado.errores.map((e) => e.message).filter(Boolean).join(" · ").slice(0, 500);
      await supabase
        .from("productos")
        .update({ meta_estado: "error", meta_error: mensaje || "Meta rechazó el lote." })
        .eq("meta_lote", handle)
        .eq("meta_estado", "enviando");
      continue;
    }

    for (const e of estado.errores) {
      if (!ids.includes(e.id!)) continue;
      await supabase
        .from("productos")
        .update({ meta_estado: "error", meta_error: (e.message ?? "Error en Meta").slice(0, 500) })
        .eq("id", e.id!)
        .eq("meta_lote", handle)
        .eq("meta_estado", "enviando");
    }
    await supabase
      .from("productos")
      .update({ meta_estado: "sincronizado", meta_error: null })
      .eq("meta_lote", handle)
      .eq("meta_estado", "enviando");
  }
}
