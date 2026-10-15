import { notFound } from "next/navigation";
import Panel from "@/components/Panel";
import FormularioProducto from "@/components/FormularioProducto";
import { createClient } from "@/lib/supabase/server";
import type { Producto } from "@/lib/types";

export const dynamic = "force-dynamic";

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

  return (
    <Panel>
      <main className="mx-auto max-w-2xl px-4 pb-16 pt-6">
        <h1 className="mb-5 text-2xl font-bold tracking-tight">Editar producto</h1>
        <FormularioProducto producto={data as Producto} />
      </main>
    </Panel>
  );
}
