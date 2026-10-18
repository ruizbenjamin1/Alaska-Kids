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
  meta_estado: "pendiente" | "enviando" | "sincronizado" | "error";
  creado_en: string;
  producto_fotos: Foto[];
  /** Solo en la lista: dónde se publicó */
  publicaciones?: { red: "instagram" | "facebook"; estado: "publicando" | "publicado" | "error" }[];
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

/**
 * Formatea el precio mientras se escribe: "12500" → "12.500", "12500,5" → "12.500,5".
 * Solo deja números y una coma para los centavos (hasta 2).
 */
export function formatearEntradaPrecio(texto: string) {
  const limpio = texto.replace(/[^\d,]/g, "");
  const [entero = "", ...resto] = limpio.split(",");
  const enteroSinCeros = entero.replace(/^0+(?=\d)/, "");
  const conPuntos = enteroSinCeros.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return resto.length ? `${conPuntos},${resto.join("").slice(0, 2)}` : conPuntos;
}

export function urlPublica(storagePath: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
}
