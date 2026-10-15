import Link from "next/link";
import BotonSalir from "./BotonSalir";

export default function Encabezado() {
  return (
    <header className="sticky top-0 z-10 border-b border-borde bg-fondo/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-lg font-bold tracking-tight">Alaska Kids</span>
          <span className="text-sm text-tinta-suave">catálogo</span>
        </Link>
        <BotonSalir />
      </div>
    </header>
  );
}
