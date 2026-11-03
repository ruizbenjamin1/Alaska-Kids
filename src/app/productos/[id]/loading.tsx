import { Bloque, FilaChips } from "@/components/Esqueletos";

/** Mientras carga un producto para editar: misma forma que el formulario. */
export default function CargandoProducto() {
  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-6" aria-busy="true" aria-label="Cargando producto">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Bloque className="h-7 w-48" />
        <Bloque className="h-9 w-28 rounded-xl" />
      </div>

      <div className="space-y-6">
        {/* Fotos */}
        <section>
          <div className="mb-2 flex items-baseline justify-between">
            <Bloque className="h-4 w-12" />
            <Bloque className="h-3 w-44" />
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Bloque key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
          <Bloque className="mt-3 h-9 w-56 rounded-xl" />
        </section>

        {/* Datos */}
        <section className="space-y-4 rounded-2xl border border-borde bg-papel p-4 sm:p-5">
          <div>
            <Bloque className="mb-1.5 h-4 w-16" />
            <Bloque className="h-11 w-full rounded-xl" />
          </div>
          <div>
            <Bloque className="mb-1.5 h-4 w-24" />
            <Bloque className="h-28 w-full rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Bloque className="mb-1.5 h-4 w-14" />
              <Bloque className="h-11 w-full rounded-xl" />
            </div>
            <div>
              <Bloque className="mb-1.5 h-4 w-14" />
              <Bloque className="h-11 w-full rounded-xl" />
            </div>
          </div>
          <div>
            <Bloque className="mb-1.5 h-4 w-24" />
            <FilaChips anchos={["w-28", "w-20", "w-20", "w-28", "w-28"]} />
          </div>
          <Bloque className="h-14 w-full rounded-xl" />
        </section>

        <div className="flex justify-end gap-3">
          <Bloque className="h-10 w-28 rounded-xl" />
          <Bloque className="h-10 w-40 rounded-xl" />
        </div>
      </div>
    </main>
  );
}
