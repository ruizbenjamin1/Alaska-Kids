import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const ruta = request.nextUrl.pathname;

  // Páginas públicas de producto (es el link que usa Meta) y el link del mail de recuperar contraseña
  if (ruta.startsWith("/p/") || ruta.startsWith("/auth/")) return response;

  // getClaims verifica la sesión sin ir hasta el servidor de Supabase en cada clic (más rápido que getUser)
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims ?? null;

  // Sin sesión se puede ver: entrar y pedir el mail de recuperación
  const paginaSinSesion = ruta === "/login" || ruta === "/login/recuperar";

  if (!user && !paginaSinSesion) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (user && paginaSinSesion) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}
