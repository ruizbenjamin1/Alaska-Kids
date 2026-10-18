"use client";

import { useEffect, useState } from "react";

type Tema = "light" | "dark";

/** Cambia entre modo claro y oscuro. Se recuerda en este dispositivo. */
export default function BotonTema() {
  const [tema, setTema] = useState<Tema | null>(null);

  useEffect(() => {
    setTema((document.documentElement.dataset.theme as Tema) ?? "light");
  }, []);

  function cambiar() {
    const nuevo: Tema = tema === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nuevo;
    try {
      localStorage.setItem("tema", nuevo);
    } catch {
      // modo privado: igual cambia, solo que no se recuerda
    }
    setTema(nuevo);
  }

  const oscuro = tema === "dark";
  return (
    <button
      type="button"
      onClick={cambiar}
      aria-label={oscuro ? "Pasar a modo claro" : "Pasar a modo oscuro"}
      title={oscuro ? "Modo claro" : "Modo oscuro"}
      className="flex h-9 w-9 items-center justify-center rounded-xl text-tinta-suave transition hover:bg-papel hover:text-tinta"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
        {oscuro ? (
          // sol
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        ) : (
          // luna
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        )}
      </svg>
    </button>
  );
}
