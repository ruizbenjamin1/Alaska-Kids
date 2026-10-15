import "server-only";
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

/**
 * Todo lo que habla con Meta corre en el servidor. El token nunca llega al navegador.
 *
 * Variables de entorno (Vercel → Settings → Environment Variables, y .env.local para probar):
 *   META_APP_ID       ID de la app en developers.facebook.com
 *   META_APP_SECRET   Clave secreta de esa app (también se usa para cifrar el token guardado)
 *   META_CONFIG_ID    (opcional) ID de configuración de "Facebook Login for Business"
 *   META_API_VERSION  (opcional) versión de la Graph API, por defecto v23.0
 */

export const META_API_VERSION = process.env.META_API_VERSION ?? "v23.0";
export const GRAPH = `https://graph.facebook.com/${META_API_VERSION}`;

/** Permisos que se piden al conectar (solo catálogo por ahora). */
export const PERMISOS = ["catalog_management", "business_management"];

export function appConfigurada() {
  return Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET);
}

// ───────────── Cifrado del token (AES-256-GCM) ─────────────

function clave() {
  const secreto = process.env.META_APP_SECRET;
  if (!secreto) throw new Error("Falta META_APP_SECRET");
  return Buffer.from(hkdfSync("sha256", secreto, "alaska-kids", "meta-token", 32));
}

export function cifrar(texto: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", clave(), iv);
  const datos = Buffer.concat([c.update(texto, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), datos].map((b) => b.toString("base64url")).join(".");
}

export function descifrar(guardado: string) {
  const [iv, tag, datos] = guardado.split(".").map((p) => Buffer.from(p, "base64url"));
  const d = createDecipheriv("aes-256-gcm", clave(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(datos), d.final()]).toString("utf8");
}

// ───────────── Graph API ─────────────

export class ErrorMeta extends Error {}

export async function graph<T>(ruta: string, token: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${GRAPH}/${ruta.replace(/^\//, "")}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", token);
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10000) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ErrorMeta(json?.error?.message ?? `Meta respondió ${res.status}`);
  return json as T;
}

export type Catalogo = { id: string; name: string; product_count?: number };
export type Negocio = { id: string; name: string; owned_product_catalogs?: { data: Catalogo[] } };

/** Negocios a los que el usuario dio acceso, con sus catálogos. */
export async function listarCatalogos(token: string) {
  const r = await graph<{ data: Negocio[] }>("me/businesses", token, {
    fields: "id,name,owned_product_catalogs{id,name,product_count}",
    limit: "50",
  });
  return r.data.flatMap((n) =>
    (n.owned_product_catalogs?.data ?? []).map((c) => ({ ...c, negocioId: n.id, negocioNombre: n.name })),
  );
}
