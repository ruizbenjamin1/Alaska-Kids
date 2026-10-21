/**
 * Marca de Alaska Kids (montañita + nombre). Provisoria hasta tener el logo real.
 * `tamano`: "chica" para el menú, "grande" para el login y la página pública.
 */
export default function Marca({ nombre = "Alaska Kids", tamano = "chica" }: { nombre?: string; tamano?: "chica" | "grande" }) {
  const grande = tamano === "grande";
  return (
    <span className={`inline-flex items-center text-acento ${grande ? "gap-2.5" : "gap-2"}`}>
      <svg viewBox="0 0 40 28" aria-hidden className={grande ? "h-8 w-auto" : "h-5 w-auto"}>
        <path d="M2 27 16 3l7 11 5-7 10 20Z" fill="currentColor" />
        <path d="M16 3l4.3 6.8h-8.6Z" fill="var(--fondo)" opacity=".85" />
      </svg>
      <span className={`font-extrabold uppercase tracking-[0.14em] ${grande ? "text-2xl" : "text-base"}`}>{nombre}</span>
    </span>
  );
}
