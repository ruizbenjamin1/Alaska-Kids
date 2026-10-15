"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
    <main className="flex min-h-dvh items-center justify-center px-4">
      <form
        onSubmit={entrar}
        className="w-full max-w-sm rounded-2xl border border-borde bg-papel p-6 shadow-sm"
      >
        <h1 className="text-2xl font-bold tracking-tight">Alaska Kids</h1>
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

        <label className="etiqueta" htmlFor="password">Contraseña</label>
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
    </main>
  );
}
