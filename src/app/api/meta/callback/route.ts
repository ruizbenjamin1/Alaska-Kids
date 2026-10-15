import { NextResponse, type NextRequest } from "next/server";
import { GRAPH, cifrar, graph, listarCatalogos } from "@/lib/meta";
import { createClient } from "@/lib/supabase/server";

type RespuestaToken = { access_token: string; expires_in?: number };

async function pedirToken(params: Record<string, string>) {
  const url = new URL(`${GRAPH}/oauth/access_token`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10000) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message ?? "Meta no entregó el token");
  return json as RespuestaToken;
}

/** Paso 2: Facebook vuelve acá con un código; lo cambiamos por un token y lo guardamos cifrado. */
export async function GET(req: NextRequest) {
  const volver = new URL("/meta", req.nextUrl.origin);
  const fallar = (mensaje: string) => {
    volver.searchParams.set("error", mensaje);
    const res = NextResponse.redirect(volver);
    res.cookies.delete({ name: "meta_oauth_state", path: "/api/meta" });
    return res;
  };

  const p = req.nextUrl.searchParams;
  if (p.get("error")) return fallar("Se canceló la conexión con Facebook.");
  const code = p.get("code");
  const state = p.get("state");
  if (!code || !state || state !== req.cookies.get("meta_oauth_state")?.value) {
    return fallar("La conexión expiró o no es válida. Probá conectar de nuevo.");
  }

  try {
    const base = {
      client_id: process.env.META_APP_ID!,
      client_secret: process.env.META_APP_SECRET!,
    };
    // Código → token corto → token largo (dura unos 60 días)
    const corto = await pedirToken({ ...base, redirect_uri: `${req.nextUrl.origin}/api/meta/callback`, code });
    const largo = await pedirToken({ ...base, grant_type: "fb_exchange_token", fb_exchange_token: corto.access_token });
    const token = largo.access_token;
    const expiraEn = largo.expires_in ? new Date(Date.now() + largo.expires_in * 1000).toISOString() : null;

    const yo = await graph<{ name: string }>("me", token, { fields: "name" });
    const catalogos = await listarCatalogos(token);
    // Si hay un solo catálogo, lo elegimos directamente
    const unico = catalogos.length === 1 ? catalogos[0] : null;

    const supabase = await createClient();
    const { error } = await supabase.from("meta_conexion").upsert({
      id: 1,
      token_cifrado: cifrar(token),
      token_expira_en: expiraEn,
      usuario_meta: yo.name,
      negocio_id: unico?.negocioId ?? null,
      negocio_nombre: unico?.negocioNombre ?? null,
      catalogo_id: unico?.id ?? null,
      catalogo_nombre: unico?.name ?? null,
      conectado_en: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
  } catch (e) {
    return fallar(e instanceof Error ? e.message : "No se pudo completar la conexión.");
  }

  const res = NextResponse.redirect(volver);
  res.cookies.delete({ name: "meta_oauth_state", path: "/api/meta" });
  return res;
}
