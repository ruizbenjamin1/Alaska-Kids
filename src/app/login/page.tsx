"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Fondo from "@/components/FondoMarca";
import Marca from "@/components/Marca";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    if (error) {
      setError("Email o contraseña incorrectos.");
      setCargando(false);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <Fondo>
      <div className="mb-6 flex justify-center">
        <Marca tamano="grande" />
      </div>
      <form
        onSubmit={entrar}
        className="w-full max-w-sm rounded-3xl border border-borde bg-papel p-6 shadow-xl shadow-acento/10 sm:p-7"
      >
        <h1 className="text-xl font-extrabold tracking-tight">Hola de nuevo</h1>
        <p className="mb-6 mt-1 text-sm text-tinta-suave">Entrá para cargar productos al catálogo.</p>

        <label className="etiqueta" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="campo mb-4"
        />

        <div className="mb-1.5 flex items-baseline justify-between">
          <label className="etiqueta mb-0" htmlFor="password">Contraseña</label>
          <Link href="/login/recuperar" className="text-xs text-acento hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="campo mb-5"
        />

        {error && (
          <p className="mb-4 rounded-lg bg-peligro-suave px-3 py-2 text-sm text-peligro">{error}</p>
        )}

        <button type="submit" disabled={cargando} className="boton w-full">
          {cargando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </Fondo>
  );
}
