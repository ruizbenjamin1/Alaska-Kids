import "server-only";
import { GRAPH, ErrorMeta, graph } from "@/lib/meta";
import { formatearPrecio } from "@/lib/types";

/** Permisos que hacen falta para publicar (además de los del catálogo). */
export const PERMISOS_PUBLICAR = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "instagram_basic",
  "instagram_content_publish",
];

export type CuentaRedes = {
  paginaId: string;
  paginaNombre: string;
  paginaToken: string;
  igId: string | null;
  igUsuario: string | null;
};

/** Páginas de Facebook que administra la cuenta conectada, con su Instagram vinculado. */
export async function listarCuentas(token: string): Promise<CuentaRedes[]> {
  const r = await graph<{
    data: {
      id: string;
      name: string;
      access_token: string;
      instagram_business_account?: { id: string; username?: string };
    }[];
  }>("me/accounts", token, { fields: "id,name,access_token,instagram_business_account{id,username}", limit: "50" });
  return r.data.map((p) => ({
    paginaId: p.id,
    paginaNombre: p.name,
    paginaToken: p.access_token,
    igId: p.instagram_business_account?.id ?? null,
    igUsuario: p.instagram_business_account?.username ?? null,
  }));
}

/** Permisos de publicación que todavía no se aceptaron. */
export async function permisosFaltantes(token: string) {
  const r = await graph<{ data: { permission: string; status: string }[] }>("me/permissions", token);
  const ok = new Set(r.data.filter((p) => p.status === "granted").map((p) => p.permission));
  return PERMISOS_PUBLICAR.filter((p) => !ok.has(p));
}

/** Texto sugerido para la publicación. */
export function textoSugerido(
  p: { nombre: string; descripcion: string; talles: string | null; precio: number },
  whatsapp: string | null,
) {
  return [
    p.nombre,
    p.descripcion.trim() || null,
    [p.talles ? `📏 Talles: ${p.talles}` : null, `💲 ${formatearPrecio(p.precio)}`].filter(Boolean).join("\n"),
    whatsapp ? `📲 Consultas por WhatsApp: wa.me/${whatsapp}` : "📲 Consultas por mensaje privado",
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function post<T>(ruta: string, token: string, params: Record<string, string>): Promise<T> {
  const body = new URLSearchParams({ ...params, access_token: token });
  const res = await fetch(`${GRAPH}/${ruta.replace(/^\//, "")}`, {
    method: "POST",
    body,
    signal: AbortSignal.timeout(20000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ErrorMeta(json?.error?.error_user_msg ?? json?.error?.message ?? `Meta respondió ${res.status}`);
  return json as T;
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Instagram procesa cada contenedor antes de poder publicarlo. */
async function esperarContenedor(id: string, token: string) {
  for (let i = 0; i < 15; i++) {
    const r = await graph<{ status_code?: string; status?: string }>(id, token, { fields: "status_code,status" });
    if (r.status_code === "FINISHED") return;
    if (r.status_code === "ERROR" || r.status_code === "EXPIRED") {
      throw new ErrorMeta(`Instagram no pudo procesar la imagen (${r.status ?? r.status_code}).`);
    }
    await esperar(2000);
  }
  throw new ErrorMeta("Instagram tardó demasiado en procesar las fotos. Probá de nuevo en un rato.");
}

/** Publica una foto o un carrusel (hasta 10 fotos) en Instagram. */
export async function publicarEnInstagram(cuenta: CuentaRedes, fotos: string[], texto: string) {
  if (!cuenta.igId) throw new ErrorMeta("La página no tiene una cuenta de Instagram profesional vinculada.");
  const t = cuenta.paginaToken;
  const urls = fotos.slice(0, 10);
  let contenedor: string;

  if (urls.length === 1) {
    ({ id: contenedor } = await post<{ id: string }>(`${cuenta.igId}/media`, t, { image_url: urls[0], caption: texto }));
  } else {
    const hijos: string[] = [];
    for (const url of urls) {
      const { id } = await post<{ id: string }>(`${cuenta.igId}/media`, t, { image_url: url, is_carousel_item: "true" });
      hijos.push(id);
    }
    for (const h of hijos) await esperarContenedor(h, t);
    ({ id: contenedor } = await post<{ id: string }>(`${cuenta.igId}/media`, t, {
      media_type: "CAROUSEL",
      children: hijos.join(","),
      caption: texto,
    }));
  }

  await esperarContenedor(contenedor, t);
  const { id } = await post<{ id: string }>(`${cuenta.igId}/media_publish`, t, { creation_id: contenedor });
  const { permalink } = await graph<{ permalink?: string }>(id, t, { fields: "permalink" }).catch(() => ({
    permalink: undefined,
  }));
  return { postId: id, link: permalink ?? null };
}

/** Publica una o varias fotos en la página de Facebook. */
export async function publicarEnFacebook(cuenta: CuentaRedes, fotos: string[], texto: string) {
  const t = cuenta.paginaToken;
  let postId: string;

  if (fotos.length === 1) {
    const r = await post<{ id: string; post_id?: string }>(`${cuenta.paginaId}/photos`, t, {
      url: fotos[0],
      message: texto,
    });
    postId = r.post_id ?? r.id;
  } else {
    const ids: string[] = [];
    for (const url of fotos.slice(0, 10)) {
      const { id } = await post<{ id: string }>(`${cuenta.paginaId}/photos`, t, { url, published: "false" });
      ids.push(id);
    }
    const r = await post<{ id: string }>(`${cuenta.paginaId}/feed`, t, {
      message: texto,
      attached_media: JSON.stringify(ids.map((media_fbid) => ({ media_fbid }))),
    });
    postId = r.id;
  }

  return { postId, link: `https://www.facebook.com/${postId}` };
}
