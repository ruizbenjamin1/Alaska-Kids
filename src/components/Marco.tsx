"use client";

import { usePathname } from "next/navigation";
import Panel from "./Panel";

/**
 * Pone el panel (menú) alrededor de todas las pantallas, menos el login y las páginas públicas.
 * Como vive en el layout, el menú no se vuelve a cargar al cambiar de sección.
 */
export default function Marco({ children }: { children: React.ReactNode }) {
  const ruta = usePathname();
  if (ruta.startsWith("/login") || ruta.startsWith("/p/") || ruta.startsWith("/auth/")) return <>{children}</>;
  return <Panel>{children}</Panel>;
}
