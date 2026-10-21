import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import Marca from "@/components/Marca";
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
  const mensaje = producto.disponible
    ? `Hola! Me interesa "${producto.nombre}" (${formatearPrecio(producto.precio)})`
    : `Hola! ¿Cuándo vuelve a entrar "${producto.nombre}"?`;

  return (
    <main className="min-h-dvh bg-gradient-to-b from-acento-suave via-fondo to-fondo pb-32">
      <div className="mx-auto max-w-lg">
        <header className="flex justify-center px-4 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))]">
          <Marca nombre={marca} />
        </header>

        {/* Fotos: se deslizan de costado */}
        <div className="px-4">
          <div className="relative overflow-hidden rounded-3xl bg-papel shadow-xl shadow-acento/10">
            <div className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
            {!producto.disponible && (
              <span className="absolute left-3 top-3 rounded-full bg-tinta/80 px-3 py-1 text-xs font-bold uppercase tracking-wide text-papel">
                Agotado
              </span>
            )}
            {fotos.length > 1 && (
              <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white">
                {fotos.length} fotos · deslizá
              </span>
            )}
          </div>
        </div>

        <section className="mx-4 mt-4 rounded-3xl border border-borde bg-papel p-5">
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight">{producto.nombre}</h1>
          <p className="mt-2 text-3xl font-extrabold text-acento">{formatearPrecio(producto.precio)}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
            {producto.talles && (
              <span className="rounded-full bg-acento-suave px-3 py-1 text-acento">Talles {producto.talles}</span>
            )}
            <span
              className={`rounded-full px-3 py-1 ${producto.disponible ? "bg-ok-suave text-ok" : "bg-peligro-suave text-peligro"}`}
            >
              {producto.disponible ? "Disponible" : "Agotado"}
            </span>
          </div>
          {producto.descripcion && (
            <p className="mt-4 whitespace-pre-line border-t border-borde pt-4 leading-relaxed text-tinta-suave">
              {producto.descripcion}
            </p>
          )}
        </section>

        <p className="mt-6 text-center text-xs text-tinta-suave">{marca} · Venta mayorista de indumentaria infantil</p>
      </div>

      {whatsapp && (
        <div className="fixed inset-x-0 bottom-0 border-t border-borde bg-papel/90 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
          <a
            href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(mensaje)}`}
            className="mx-auto flex max-w-lg items-center justify-center gap-2 rounded-2xl bg-[#1f8f4e] px-4 py-4 text-base font-bold text-white shadow-lg shadow-[#1f8f4e]/25 transition active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
              <path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.5L3 21l2-5.6A8.4 8.4 0 1 1 21 11.5Z" />
            </svg>
            {producto.disponible ? "Consultar por WhatsApp" : "Preguntar cuándo vuelve"}
          </a>
        </div>
      )}
    </main>
  );
}
