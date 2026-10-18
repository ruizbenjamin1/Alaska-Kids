"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Se llega desde el link del mail de recuperación (ya con la sesión abierta). */
export default function NuevaContrasenaPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [repetida, setRepetida] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setError("Tiene que tener al menos 8 caracteres.");
    if (password !== repetida) return setError("Las dos contraseñas no coinciden.");
    setCargando(true);
    setError(null);
    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      setCargando(false);
      setError(
        error.code === "same_password"
          ? "Es la misma contraseña que tenías. Elegí otra."
          : error.code === "weak_password"
            ? "Es muy fácil de adivinar. Probá con una más larga o con números."
            : "No se pudo guardar. Pedí un link nuevo y probá otra vez.",
      );
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <form onSubmit={guardar} className="w-full max-w-sm rounded-2xl border border-borde bg-papel p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">Contraseña nueva</h1>
        <p className="mb-6 mt-1 text-sm text-tinta-suave">Elegí la contraseña que vas a usar para entrar.</p>

        <label className="etiqueta" htmlFor="password">
          Contraseña nueva
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="campo mb-4"
        />
        <label className="etiqueta" htmlFor="repetida">
          Repetila
        </label>
        <input
          id="repetida"
          type="password"
          autoComplete="new-password"
          required
          value={repetida}
          onChange={(e) => setRepetida(e.target.value)}
          className="campo mb-5"
        />

        {error && <p className="mb-4 rounded-lg bg-peligro-suave px-3 py-2 text-sm text-peligro">{error}</p>}

        <button type="submit" disabled={cargando} className="boton w-full">
          {cargando && <span className="girando" aria-hidden />}
          {cargando ? "Guardando…" : "Guardar y entrar"}
        </button>
      </form>
    </main>
  );
}
