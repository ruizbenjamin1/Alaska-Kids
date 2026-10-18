"use client";

import { useFormStatus } from "react-dom";

/**
 * Botón para formularios: apenas se toca muestra una ruedita y se desactiva,
 * así se nota que está trabajando y no se aprieta dos veces.
 */
export default function BotonEnviar({
  children,
  className = "boton",
  textoCargando,
}: {
  children: React.ReactNode;
  className?: string;
  textoCargando?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={className}>
      {pending && <span className="girando" aria-hidden />}
      {pending && textoCargando ? textoCargando : children}
    </button>
  );
}
