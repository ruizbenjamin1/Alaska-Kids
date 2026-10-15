import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { META_API_VERSION, PERMISOS, appConfigurada } from "@/lib/meta";

/** Paso 1: manda al usuario a Facebook para que autorice el acceso al catálogo. */
export async function GET(req: NextRequest) {
  const volver = new URL("/meta", req.nextUrl.origin);
  if (!appConfigurada()) {
    volver.searchParams.set("error", "Falta configurar la app de Meta (META_APP_ID y META_APP_SECRET).");
    return NextResponse.redirect(volver);
  }

  const state = randomBytes(16).toString("hex");
  const url = new URL(`https://www.facebook.com/${META_API_VERSION}/dialog/oauth`);
  url.searchParams.set("client_id", process.env.META_APP_ID!);
  url.searchParams.set("redirect_uri", `${req.nextUrl.origin}/api/meta/callback`);
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");
  if (process.env.META_CONFIG_ID) url.searchParams.set("config_id", process.env.META_CONFIG_ID);
  else url.searchParams.set("scope", PERMISOS.join(","));

  const res = NextResponse.redirect(url);
  // Protección CSRF: el callback solo acepta la respuesta si trae este mismo valor
  res.cookies.set("meta_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/meta",
    maxAge: 600,
  });
  return res;
}
