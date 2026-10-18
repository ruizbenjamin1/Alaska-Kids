"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const opciones = [
  {
    href: "/",
    nombre: "Productos",
    activo: (ruta: string) => ruta === "/" || ruta.startsWith("/productos"),
    icono: (
      <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Zm0 0 8 4.5m0 0 8-4.5M12 12v9" />
    ),
  },
  {
    href: "/meta",
    nombre: "Meta",
    activo: (ruta: string) => ruta.startsWith("/meta"),
    icono: (
      <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
    ),
  },
  {
    href: "/ayuda",
    nombre: "Guía",
    activo: (ruta: string) => ruta.startsWith("/ayuda"),
    icono: (
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-2.5-11.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6m0 3h.01" />
    ),
  },
];

export default function Menu() {
  const ruta = usePathname();

  return (
    <nav className="flex gap-1 md:flex-col">
      {opciones.map((o) => {
        const activo = o.activo(ruta);
        return (
          <Link
            key={o.href}
            href={o.href}
            aria-current={activo ? "page" : undefined}
            className={`flex flex-1 items-center justify-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition md:flex-none md:justify-start ${
              activo ? "bg-acento-suave text-acento" : "text-tinta-suave hover:bg-papel hover:text-tinta"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 shrink-0"
              aria-hidden
            >
              {o.icono}
            </svg>
            {o.nombre}
          </Link>
        );
      })}
    </nav>
  );
}
