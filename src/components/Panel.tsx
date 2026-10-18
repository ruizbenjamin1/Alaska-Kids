import Link from "next/link";
import BotonSalir from "./BotonSalir";
import BotonTema from "./BotonTema";
import Menu from "./Menu";

/** Estructura común de todas las pantallas (menos el login): menú + contenido. */
export default function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh md:flex">
      {/* Celular: barra arriba con el menú abajo del logo · Compu/tablet: columna a la izquierda */}
      <aside className="sticky top-0 z-10 border-b border-borde bg-fondo/95 pt-[env(safe-area-inset-top)] backdrop-blur md:h-dvh md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex h-full flex-col gap-3 px-4 py-3 md:px-3 md:py-5">
          <div className="flex items-center justify-between md:px-2">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="text-lg font-bold tracking-tight">Alaska Kids</span>
              <span className="text-sm text-tinta-suave">panel</span>
            </Link>
            <span className="flex items-center gap-2 md:hidden">
              <BotonTema />
              <BotonSalir />
            </span>
          </div>

          <div className="md:mt-4 md:flex-1">
            <Menu />
          </div>

          <div className="hidden items-center justify-between px-2 md:flex">
            <BotonSalir />
            <BotonTema />
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 pb-[env(safe-area-inset-bottom)]">{children}</div>
    </div>
  );
}
