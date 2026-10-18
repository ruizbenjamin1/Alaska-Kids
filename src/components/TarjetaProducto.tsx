"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatearPrecio, urlPublica, type Producto } from "@/lib/types";
import { enviarProductos } from "@/app/meta/sincronizar";

export default function TarjetaProducto({ producto }: { producto: Producto }) {
  const router = useRouter();
  const [disponible, setDisponible] = useState(producto.disponible);
  const [guardando, setGuardando] = useState(false);

  const portada = producto.producto_fotos[0];
  const cantFotos = producto.producto_fotos.length;

  async function alternarDisponible() {
    const nuevo = !disponible;
    setDisponible(nuevo); // optimista
    setGuardando(true);
    const { error } = await createClient()
      .from("productos")
      .update({ disponible: nuevo })
      .eq("id", producto.id);
    setGuardando(false);
    if (error) {
      setDisponible(!nuevo);
      alert("No se pudo actualizar. Probá de nuevo.");
      return;
    }
    await enviarProductos([producto.id]).catch(() => null);
    router.refresh();
  }

  return (
    <li className="overflow-hidden rounded-2xl border border-borde bg-papel">
      <Link href={`/productos/${producto.id}`} className="block">
        <div className="relative aspect-square bg-fondo">
          {portada ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={urlPublica(portada.storage_path)}
              alt={producto.nombre}
              loading="lazy"
              className={`h-full w-full object-cover ${disponible ? "" : "opacity-40 grayscale"}`}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-tinta-suave">Sin foto</div>
          )}
          {cantFotos > 1 && (
            <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
              {cantFotos} fotos
            </span>
          )}
          {producto.meta_estado === "error" && (
            <span className="absolute bottom-2 left-2 rounded-full bg-peligro px-2 py-0.5 text-xs font-semibold text-sobre-acento">
              Error en Meta
            </span>
          )}
          {!disponible && (
            <span className="absolute left-2 top-2 rounded-full bg-black/75 px-2 py-0.5 text-xs font-semibold text-white">
              Agotado
            </span>
          )}
        </div>
        <div className="px-3 pb-1 pt-2.5">
          <p className="line-clamp-1 text-sm font-medium">{producto.nombre}</p>
          <p className="text-base font-bold">{formatearPrecio(producto.precio)}</p>
          {producto.talles && (
            <p className="line-clamp-1 text-xs text-tinta-suave">Talles {producto.talles}</p>
          )}
        </div>
      </Link>

      <div className="px-3 pb-3 pt-1.5">
        <button
          type="button"
          role="switch"
          aria-checked={disponible}
          onClick={alternarDisponible}
          disabled={guardando}
          className="flex w-full items-center justify-between gap-2 rounded-lg py-1 text-xs text-tinta-suave"
        >
          <span>{disponible ? "Disponible" : "Agotado"}</span>
          <span
            className={`relative h-5 w-9 rounded-full transition ${disponible ? "bg-ok" : "bg-borde"}`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${disponible ? "left-[18px]" : "left-0.5"}`}
            />
          </span>
        </button>
      </div>
    </li>
  );
}
