"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatearPrecio, urlPublica, type Producto } from "@/lib/types";
import { enviarProductos } from "@/app/meta/sincronizar";

export default function TarjetaProducto({
  producto,
  onCambioDisponible,
}: {
  producto: Producto;
  /** Avisa a la lista apenas cambia, para que los filtros se actualicen al instante */
  onCambioDisponible: (id: string, disponible: boolean) => void;
}) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const disponible = producto.disponible;

  const portada = producto.producto_fotos[0];
  const cantFotos = producto.producto_fotos.length;

  async function alternarDisponible() {
    const nuevo = !disponible;
    onCambioDisponible(producto.id, nuevo); // se ve el cambio enseguida; lo de abajo sigue en segundo plano
    setGuardando(true);
    const { error } = await createClient()
      .from("productos")
      .update({ disponible: nuevo })
      .eq("id", producto.id);
    setGuardando(false);
    if (error) {
      onCambioDisponible(producto.id, !nuevo);
      alert("No se pudo actualizar. Probá de nuevo.");
      return;
    }
    // Meta y la recarga de datos no frenan la pantalla
    enviarProductos([producto.id])
      .catch(() => null)
      .finally(() => router.refresh());
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
          <Indicadores producto={producto} />
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

/** Dónde está el producto: catálogo de Meta, Instagram, Facebook. */
function Indicadores({ producto }: { producto: Producto }) {
  const publicado = (red: "instagram" | "facebook") =>
    (producto.publicaciones ?? []).some((p) => p.red === red && p.estado === "publicado");
  const enCatalogo = producto.meta_estado === "sincronizado";
  const pendiente = producto.meta_estado === "pendiente";
  const enviando = producto.meta_estado === "enviando";

  const chip = "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none";
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {enCatalogo && (
        <span className={`${chip} bg-ok-suave text-ok`} title="Está en el catálogo de Meta">
          ✓ Catálogo
        </span>
      )}
      {pendiente && (
        <span className={`${chip} bg-fondo text-tinta-suave`} title="Todavía no se envió al catálogo de Meta">
          Catálogo pendiente
        </span>
      )}
      {enviando && (
        <span className={`${chip} bg-acento-suave text-acento`} title="Meta lo está procesando: tarda unos minutos">
          Enviando al catálogo…
        </span>
      )}
      {publicado("instagram") && (
        <span className={`${chip} bg-acento-suave text-acento`} title="Publicado en Instagram">
          ✓ IG
        </span>
      )}
      {publicado("facebook") && (
        <span className={`${chip} bg-acento-suave text-acento`} title="Publicado en Facebook">
          ✓ FB
        </span>
      )}
    </div>
  );
}
