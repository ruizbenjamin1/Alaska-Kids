/** Fondo lila con formas suaves, para el login y las pantallas de contraseña. */
export default function FondoMarca({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-acento-suave to-fondo px-4 py-10">
      <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-acento/10 blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-acento/15 blur-3xl" />
      <div className="relative flex w-full flex-col items-center">{children}</div>
    </main>
  );
}
