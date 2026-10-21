"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Acá llega el link del mail de "recuperar contraseña".
 * Supabase manda la sesión en la parte "#..." del link; se guarda y se pasa a elegir la contraseña nueva.
 * Funciona aunque el mail se abra en otro aparato o navegador del que se pidió.
 */
export default function LinkRecuperar() {
  const router = useRouter();
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    const datos = new URLSearchParams(window.location.hash.slice(1));
    const access_token = datos.get("access_token");
    const refresh_token = datos.get("refresh_token");
    if (!access_token || !refresh_token) {
      setFallo(true);
      return;
    }
    createClient()
      .auth.setSession({ access_token, refresh_token })
      .then(({ error }) => {
        if (error) setFallo(true);
        else router.replace("/login/nueva");
      });
  }, [router]);

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-borde bg-papel p-6 text-center shadow-sm">
        {fallo ? (
          <>
            <h1 className="text-xl font-bold tracking-tight">El link venció</h1>
            <p className="mb-5 mt-2 text-sm text-tinta-suave">El link ya se usó o pasó mucho tiempo. Pedí uno nuevo.</p>
            <Link href="/login/recuperar" className="boton w-full">
              Pedir otro link
            </Link>
          </>
        ) : (
          <p className="flex items-center justify-center gap-2 text-sm text-tinta-suave">
            <span className="girando" aria-hidden /> Abriendo…
          </p>
        )}
      </div>
    </main>
  );
}
