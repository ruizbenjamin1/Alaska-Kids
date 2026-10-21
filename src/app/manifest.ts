import type { MetadataRoute } from "next";

/** Permite instalar la app en el celular o la tablet ("Agregar a pantalla de inicio"). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Alaska Kids · Catálogo",
    short_name: "Alaska Kids",
    description: "Carga de productos para el catálogo y las redes de Alaska Kids",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f3fc",
    theme_color: "#6a4cb0",
    lang: "es-AR",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
