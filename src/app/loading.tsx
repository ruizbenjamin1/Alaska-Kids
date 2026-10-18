/** Se muestra al instante mientras carga cualquier pantalla (el menú queda fijo). */
export default function Cargando() {
  return (
    <main className="mx-auto max-w-5xl animate-pulse px-4 pb-16 pt-6" aria-busy="true" aria-label="Cargando">
      <div className="mb-2 h-7 w-40 rounded-lg bg-borde/70" />
      <div className="mb-6 h-4 w-56 rounded bg-borde/50" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-borde bg-papel">
            <div className="aspect-square bg-borde/40" />
            <div className="space-y-2 p-3">
              <div className="h-3.5 w-3/4 rounded bg-borde/60" />
              <div className="h-4 w-1/3 rounded bg-borde/60" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
