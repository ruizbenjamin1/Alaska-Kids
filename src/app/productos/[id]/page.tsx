import { notFound } from "next/navigation";
import { Suspense } from "react";
import FormularioProducto from "@/components/FormularioProducto";
import PublicarEnRedes, { type Publicacion } from "@/components/PublicarEnRedes";
import { appConfigurada, descifrar } from "@/lib/meta";
import { permisosFaltantes, textoSugerido } from "@/lib/redes";
import { createClient } from "@/lib/supabase/server";
import type { Producto } from "@/lib/types";

export const dynamic = "force-dynamic";
// Publicar un carrusel en Instagram puede tardar: Meta procesa cada foto antes de publicar
export const maxDuration = 60;

export default async function EditarProducto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("productos")
    .select("id, nombre, descripcion, precio, talles, disponible, meta_estado, creado_en, producto_fotos(id, storage_path, orden)")
    .eq("id", id)
    .order("orden", { referencedTable: "producto_fotos", ascending: true })
    .maybeSingle();

  if (!data) notFound();
  const producto = data as Producto;

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-6">
      <h1 className="mb-5 text-2xl font-bold tracking-tight">Editar producto</h1>
      <FormularioProducto producto={producto} />
      {/* La parte de redes consulta a Meta: se carga aparte para que el formulario aparezca al instante */}
      <Suspense
        fallback={<div className="mt-8 h-40 animate-pulse rounded-2xl border border-borde bg-papel" aria-label="Cargando" />}
      >
        <SeccionPublicar producto={producto} />
      </Suspense>
    </main>
  );
}

async function SeccionPublicar({ producto }: { producto: Producto }) {
  const supabase = await createClient();
  const [{ data: conexion }, { data: ajustes }, { data: historial }] = await Promise.all([
    supabase.from("meta_conexion").select("token_cifrado, pagina_id, pagina_nombre, ig_usuario").eq("id", 1).maybeSingle(),
    supabase.from("ajustes").select("whatsapp").eq("id", 1).maybeSingle(),
    supabase
      .from("publicaciones")
      .select("id, red, estado, link, error, creado_en")
      .eq("producto_id", producto.id)
      .order("creado_en", { ascending: false })
      .limit(10),
  ]);

  // ¿Se puede publicar? (Meta conectado, con permisos de publicación y una página elegida)
  let aviso: string | null = null;
  if (!conexion || !appConfigurada()) {
    aviso = "Para publicar, primero conectá la app con Facebook.";
  } else {
    const faltan = await permisosFaltantes(descifrar(conexion.token_cifrado)).catch(() => null);
    if (faltan === null) aviso = "No se pudo verificar la conexión con Meta.";
    else if (faltan.length) aviso = "Falta dar permiso para publicar en Instagram y Facebook: hay que reconectar.";
    else if (!conexion.pagina_id) aviso = "Elegí la página de Facebook donde publicar.";
  }

  return (
    <PublicarEnRedes
      productoId={producto.id}
      textoInicial={textoSugerido(producto, (ajustes?.whatsapp as string | null) ?? null)}
      igUsuario={(conexion?.ig_usuario as string | null) ?? null}
      paginaNombre={(conexion?.pagina_nombre as string | null) ?? null}
      cantFotos={producto.producto_fotos.length}
      aviso={aviso}
      historial={(historial ?? []) as Publicacion[]}
    />
  );
}
