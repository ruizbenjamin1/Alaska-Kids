import { Bloque } from "@/components/Esqueletos";

/** Mientras carga la sección Meta (consulta a Facebook, puede tardar un poco). */
export default function CargandoMeta() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-6" aria-busy="true" aria-label="Cargando Meta">
      <Bloque className="mb-2 h-7 w-24" />
      <Bloque className="mb-6 h-4 w-72 max-w-full" />

      {[0, 1].map((i) => (
        <section key={i} className="mb-6 space-y-4 rounded-2xl border border-borde bg-papel p-5">
          <div className="flex items-center gap-3">
            <Bloque className="h-2.5 w-2.5 rounded-full" />
            <Bloque className="h-5 w-40" />
          </div>
          <div className="space-y-2">
            <Bloque className="h-3.5 w-full" />
            <Bloque className="h-3.5 w-5/6" />
            <Bloque className="h-3.5 w-2/3" />
          </div>
          <div className="flex gap-3">
            <Bloque className="h-10 w-44 rounded-xl" />
            <Bloque className="h-10 w-28 rounded-xl" />
          </div>
        </section>
      ))}
    </main>
  );
}
