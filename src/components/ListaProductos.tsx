"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import TarjetaProducto from "./TarjetaProducto";
import type { Producto } from "@/lib/types";

type Filtro = "todos" | "disponibles" | "agotados" | "error";
type Orden = "nuevos" | "viejos" | "precio-asc" | "precio-desc";

/** Quita tildes y pasa a minúsculas, para que "buzo" encuentre "Buzó" y "BUZO". */
const normalizar = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export default function ListaProductos({ productos: delServidor }: { productos: Producto[] }) {
  // Copia local para reflejar los cambios al instante (disponible/agotado) sin esperar al servidor
  const [productos, setProductos] = useState(delServidor);
  useEffect(() => setProductos(delServidor), [delServidor]);
  const cambiarDisponible = useCallback((id: string, disponible: boolean) => {
    setProductos((lista) => lista.map((p) => (p.id === id ? { ...p, disponible } : p)));
  }, []);

  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [orden, setOrden] = useState<Orden>("nuevos");

  const cuentas = useMemo(
    () => ({
      todos: productos.length,
      disponibles: productos.filter((p) => p.disponible).length,
      agotados: productos.filter((p) => !p.disponible).length,
      error: productos.filter((p) => p.meta_estado === "error").length,
    }),
    [productos],
  );

  const visibles = useMemo(() => {
    const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean);
    const filtrados = productos.filter((p) => {
      if (filtro === "disponibles" && !p.disponible) return false;
      if (filtro === "agotados" && p.disponible) return false;
      if (filtro === "error" && p.meta_estado !== "error") return false;
      if (palabras.length === 0) return true;
      const texto = normalizar(`${p.nombre} ${p.descripcion} ${p.talles ?? ""}`);
      return palabras.every((w) => texto.includes(w));
    });
    const fecha = (p: Producto) => new Date(p.creado_en).getTime();
    return filtrados.sort((a, b) =>
      orden === "nuevos"
        ? fecha(b) - fecha(a)
        : orden === "viejos"
          ? fecha(a) - fecha(b)
          : orden === "precio-asc"
            ? Number(a.precio) - Number(b.precio)
            : Number(b.precio) - Number(a.precio),
    );
  }, [productos, busqueda, filtro, orden]);

  const opciones: { id: Filtro; nombre: string }[] = [
    { id: "todos", nombre: "Todos" },
    { id: "disponibles", nombre: "Disponibles" },
    { id: "agotados", nombre: "Agotados" },
    ...(cuentas.error > 0 ? [{ id: "error" as const, nombre: "Error en Meta" }] : []),
  ];

  return (
    <>
      <div className="mb-4 space-y-3">
        <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-suave"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, descripción o talle"
            aria-label="Buscar productos"
            className="campo pl-10"
          />
        </div>
          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value as Orden)}
            aria-label="Ordenar"
            className="campo w-auto shrink-0 pr-8 text-sm"
          >
            <option value="nuevos">Más nuevos</option>
            <option value="viejos">Más viejos</option>
            <option value="precio-asc">Precio ↑</option>
            <option value="precio-desc">Precio ↓</option>
          </select>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filtrar productos">
          {opciones.map((o) => {
            const activo = filtro === o.id;
            return (
              <button
                key={o.id}
                type="button"
                role="tab"
                aria-selected={activo}
                onClick={() => setFiltro(o.id)}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition ${
                  activo
                    ? "border-acento bg-acento-suave font-medium text-acento"
                    : "border-borde bg-papel text-tinta-suave hover:text-tinta"
                } ${o.id === "error" && !activo ? "text-peligro" : ""}`}
              >
                {o.nombre} <span className="opacity-70">{cuentas[o.id]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {visibles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-borde bg-papel px-6 py-12 text-center">
          <p className="font-medium">No hay productos que coincidan</p>
          <button
            type="button"
            onClick={() => {
              setBusqueda("");
              setFiltro("todos");
            }}
            className="mt-2 text-sm font-medium text-acento hover:underline"
          >
            Ver todos
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visibles.map((p) => (
            <TarjetaProducto key={p.id} producto={p} onCambioDisponible={cambiarDisponible} />
          ))}
        </ul>
      )}
    </>
  );
}
