export type Foto = {
  id: string;
  storage_path: string;
  orden: number;
};

export type Producto = {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  talles: string | null;
  disponible: boolean;
  meta_estado: "pendiente" | "sincronizado" | "error";
  creado_en: string;
  producto_fotos: Foto[];
};

export const BUCKET = "productos";

const formatoPesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function formatearPrecio(n: number) {
  return formatoPesos.format(n);
}

/** Acepta "12.500", "$ 12500", "12500,50" → 12500 / 12500.5. Devuelve null si no es válido. */
export function parsearPrecio(texto: string): number | null {
  const limpio = texto.replace(/[$\s]/g, "").replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(limpio)) return null;
  return Number(limpio);
}

export function urlPublica(storagePath: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
}
