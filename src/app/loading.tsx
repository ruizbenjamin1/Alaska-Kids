import { Bloque, FilaChips, TarjetaEsqueleto } from "@/components/Esqueletos";

/** Se muestra al instante mientras carga la lista de productos (el menú queda fijo). */
export default function Cargando() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-6" aria-busy="true" aria-label="Cargando productos">
      {/* Título + botón "Nuevo producto" */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Bloque className="mb-2 h-7 w-36" />
          <Bloque className="h-4 w-48" />
        </div>
        <Bloque className="h-10 w-40 rounded-xl" />
      </div>

      {/* Buscador, orden y filtros */}
      <div className="mb-4 space-y-3">
        <div className="flex gap-2">
          <Bloque className="h-11 flex-1 rounded-xl" />
          <Bloque className="h-11 w-32 rounded-xl" />
        </div>
        <FilaChips anchos={["w-20", "w-28", "w-24"]} />
        <FilaChips anchos={["w-40", "w-28", "w-20", "w-20", "w-28", "w-28"]} />
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <TarjetaEsqueleto key={i} />
        ))}
      </ul>
    </main>
  );
}
