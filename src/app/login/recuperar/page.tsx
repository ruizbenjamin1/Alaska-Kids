"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@supabase/supabase-js";

export default function RecuperarPage() {
  return (
    <Suspense>
      <Recuperar />
    </Suspense>
  );
}

function Recuperar() {
  const vencido = useSearchParams().get("vencido");
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    // Cliente "implícito": el link del mail trae la sesión en sí mismo, así funciona aunque se abra
    // en otro aparato o fuera de la app instalada (con el modo normal solo anda en el mismo navegador)
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
      auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/recuperar`,
    });
    setCargando(false);
    if (error) {
      setError(
        error.status === 429
          ? "Se pidieron muchos mails seguidos. Esperá unos minutos y probá de nuevo."
          : "No se pudo enviar el mail. Revisá el email y probá de nuevo.",
      );
      return;
    }
    setEnviado(true);
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-borde bg-papel p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">Recuperar contraseña</h1>

        {enviado ? (
          <>
            <p className="mb-6 mt-3 rounded-lg bg-ok-suave px-3 py-2 text-sm text-ok">
              Listo. Si <strong>{email}</strong> tiene cuenta, te llega un mail con un link para elegir una contraseña
              nueva. Revisá también la carpeta de spam.
            </p>
            <Link href="/login" className="boton-secundario w-full">
              Volver a entrar
            </Link>
          </>
        ) : (
          <form onSubmit={enviar}>
            <p className="mb-6 mt-1 text-sm text-tinta-suave">
              Escribí tu email y te mandamos un link para elegir una contraseña nueva.
            </p>
            {vencido && (
              <p className="mb-4 rounded-lg bg-peligro-suave px-3 py-2 text-sm text-peligro">
                El link venció o ya se usó. Pedí uno nuevo.
              </p>
            )}
            <label className="etiqueta" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="campo mb-5"
            />
            {error && <p className="mb-4 rounded-lg bg-peligro-suave px-3 py-2 text-sm text-peligro">{error}</p>}
            <button type="submit" disabled={cargando} className="boton w-full">
              {cargando && <span className="girando" aria-hidden />}
              {cargando ? "Enviando…" : "Enviar link"}
            </button>
            <Link href="/login" className="mt-4 block text-center text-sm text-acento hover:underline">
              Volver
            </Link>
          </form>
        )}
      </div>
    </main>
  );
}
