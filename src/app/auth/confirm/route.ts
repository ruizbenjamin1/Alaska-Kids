import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Acá llega el link del mail de "recuperar contraseña".
 * Abre la sesión y manda a elegir la contraseña nueva.
 * Acepta los dos formatos de link de Supabase: ?code=… y ?token_hash=…&type=recovery
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const pedido = searchParams.get("next") ?? "/login/nueva";
  // Solo rutas internas (evita que el link mande a otro sitio)
  const destino = pedido.startsWith("/") && !pedido.startsWith("//") ? pedido : "/login/nueva";

  const supabase = await createClient();
  let ok = false;
  if (code) ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  else if (tokenHash && type) ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;

  if (ok) return NextResponse.redirect(new URL(destino, origin));
  return NextResponse.redirect(new URL("/login/recuperar?vencido=1", origin));
}
