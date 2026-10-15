import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { formatearPrecio, urlPublica } from "@/lib/types";

export const dynamic = "force-dynamic";

type ProductoPublico = {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  talles: string | null;
  disponible: boolean;
  producto_fotos: { storage_path: string; orden: number }[];
};

const cargar = cache(async (id: string) => {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const [{ data: producto }, { data: ajustes }] = await Promise.all([
    supabase
      .from("productos")
      .select("id, nombre, descripcion, precio, talles, disponible, producto_fotos(storage_path, orden)")
      .eq("id", id)
      .order("orden", { referencedTable: "producto_fotos", ascending: true })
      .maybeSingle<ProductoPublico>(),
    supabase.from("ajustes").select("whatsapp, marca").eq("id", 1).maybeSingle(),
  ]);
  if (!producto) return null;
  return { producto, whatsapp: ajustes?.whatsapp as string | null, marca: (ajustes?.marca as string) ?? "Alaska Kids" };
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const datos = await cargar((await params).id);
  if (!datos) return { title: "Producto no encontrado" };
  const { producto, marca } = datos;
  const foto = producto.producto_fotos[0];
  return {
    title: `${producto.nombre} · ${marca}`,
    description: producto.descripcion || `${producto.nombre} — ${formatearPrecio(producto.precio)}`,
    openGraph: { title: producto.nombre, images: foto ? [urlPublica(foto.storage_path)] : [] },
  };
}

export default async function ProductoPublicoPage({ params }: { params: Promise<{ id: string }> }) {
  const datos = await cargar((await params).id);
  if (!datos) notFound();
  const { producto, whatsapp, marca } = datos;
  const fotos = producto.producto_fotos.map((f) => urlPublica(f.storage_path));
  const mensaje = `Hola! Me interesa "${producto.nombre}" (${formatearPrecio(producto.precio)})`;

  return (
    <main className="mx-auto min-h-dvh max-w-lg pb-28">
      <header className="px-4 py-4">
        <span className="text-lg font-bold tracking-tight">{marca}</span>
      </header>

      {/* Fotos: se deslizan de costado */}
      <div className="flex snap-x snap-mandatory overflow-x-auto">
        {fotos.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt={i === 0 ? producto.nombre : ""}
            className="aspect-square w-full shrink-0 snap-center object-cover"
          />
        ))}
      </div>
      {fotos.length > 1 && (
        <p className="mt-2 text-center text-xs text-tinta-suave">{fotos.length} fotos · deslizá para ver más</p>
      )}

      <section className="px-4 pt-5">
        <h1 className="text-2xl font-bold tracking-tight">{producto.nombre}</h1>
        <p className="mt-1 text-2xl font-bold">{formatearPrecio(producto.precio)}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          {producto.talles && <span className="rounded-full bg-papel px-3 py-1">Talles {producto.talles}</span>}
          <span
            className={`rounded-full px-3 py-1 ${producto.disponible ? "bg-ok-suave text-ok" : "bg-peligro-suave text-peligro"}`}
          >
            {producto.disponible ? "Disponible" : "Agotado"}
          </span>
        </div>
        {producto.descripcion && (
          <p className="mt-4 whitespace-pre-line text-tinta-suave">{producto.descripcion}</p>
        )}
      </section>

      {whatsapp && (
        <div className="fixed inset-x-0 bottom-0 border-t border-borde bg-fondo/95 p-4 backdrop-blur">
          <a
            href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(mensaje)}`}
            className="mx-auto flex max-w-lg items-center justify-center gap-2 rounded-xl bg-[#1f8f4e] px-4 py-3.5 font-semibold text-white"
          >
            Consultar por WhatsApp
          </a>
        </div>
      )}
    </main>
  );
}
