import type { Metadata, Viewport } from "next";
import Marco from "@/components/Marco";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alaska Kids · Catálogo",
  description: "Carga de productos para el catálogo y las redes de Alaska Kids",
  applicationName: "Alaska Kids",
  // iPhone / iPad: "Agregar a pantalla de inicio" la abre como una app, a pantalla completa
  appleWebApp: { capable: true, title: "Alaska Kids", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f4ef" },
    { media: "(prefers-color-scheme: dark)", color: "#11161c" },
  ],
};

// Se ejecuta antes de pintar la página: aplica el tema guardado (o el del dispositivo) sin parpadeo
const scriptTema = `try{var t=localStorage.getItem("tema");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="light"}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
      </head>
      <body className="min-h-dvh antialiased">
        <Marco>{children}</Marco>
      </body>
    </html>
  );
}
