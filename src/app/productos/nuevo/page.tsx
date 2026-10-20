import FormularioProducto from "@/components/FormularioProducto";
import { obtenerContacto } from "@/lib/contacto";

export const dynamic = "force-dynamic";

export default async function NuevoProducto() {
  const contacto = await obtenerContacto();
  return (
    <>
      <main className="mx-auto max-w-2xl px-4 pb-16 pt-6">
        <h1 className="mb-5 text-2xl font-bold tracking-tight">Nuevo producto</h1>
        <FormularioProducto contacto={contacto} />
      </main>
    </>
  );
}
