/** Piezas de los skeletons (la forma gris que se ve mientras carga una pantalla). */

/** Un bloque con brillo. Se le pasa el tamaño con clases, ej. "h-4 w-32". */
export function Bloque({ className = "" }: { className?: string }) {
  return <div className={`esqueleto ${className}`} aria-hidden />;
}

/** Igual que una TarjetaProducto, pero vacía. */
export function TarjetaEsqueleto() {
  return (
    <li className="overflow-hidden rounded-2xl border border-borde bg-papel" aria-hidden>
      <Bloque className="aspect-square rounded-none" />
      <div className="space-y-2 px-3 pb-3 pt-2.5">
        <Bloque className="h-3.5 w-3/4" />
        <Bloque className="h-5 w-1/3" />
        <Bloque className="h-3 w-1/2" />
        <div className="flex items-center justify-between pt-1.5">
          <Bloque className="h-3 w-16" />
          <Bloque className="h-5 w-9 rounded-full" />
        </div>
      </div>
    </li>
  );
}

/** Fila de "chips" (filtros redondeados) con distintos anchos. */
export function FilaChips({ anchos }: { anchos: string[] }) {
  return (
    <div className="flex gap-2 overflow-hidden pb-1" aria-hidden>
      {anchos.map((w, i) => (
        <Bloque key={i} className={`h-8 shrink-0 rounded-full ${w}`} />
      ))}
    </div>
  );
}
