/**
 * Arma la imagen "flyer" de un producto en el navegador (sin servidor):
 * foto del producto + nombre + precio + talles + datos de contacto, con los colores de Alaska Kids.
 * Sale un JPEG cuadrado de 1080 × 1080, el formato que mejor se ve en el catálogo, Instagram y WhatsApp.
 *
 * Logo: si existe /public/logo-flyer.png se usa ese; si no, se dibuja el nombre de la marca.
 */

export type Contacto = {
  marca: string;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
};

export type DatosFlyer = {
  foto: string; // URL de la foto (blob: o pública de Supabase)
  nombre: string;
  precio: number;
  talles: string;
  contacto: Contacto;
};

const LADO = 1080;
const COLOR = {
  fondoArriba: "#f4eefc",
  fondoAbajo: "#e4d6f7",
  violeta: "#6a4cb0",
  violetaOscuro: "#3f2a75",
  burbuja: "#7c5cc4",
  blanco: "#ffffff",
};
const FUENTE = 'ui-rounded, "SF Pro Rounded", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

/** Prefijo con el que se guardan los flyers en Storage, para reconocerlos después. */
export const PREFIJO_FLYER = "flyer-";
export const esFlyer = (storagePath: string) => storagePath.split("/").pop()!.startsWith(PREFIJO_FLYER);

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, mal) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => mal(new Error("No se pudo cargar la imagen"));
    img.src = src;
  });
}

/** Las fotos ya guardadas se bajan como blob para que el canvas no quede "bloqueado" por CORS. */
async function cargarFoto(url: string) {
  if (url.startsWith("blob:")) return cargarImagen(url);
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo bajar la foto principal");
  const local = URL.createObjectURL(await res.blob());
  try {
    return await cargarImagen(local);
  } finally {
    URL.revokeObjectURL(local);
  }
}

function rectRedondeado(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Corta el texto en renglones que entren en `ancho`. */
function renglones(ctx: CanvasRenderingContext2D, texto: string, ancho: number) {
  const palabras = texto.split(/\s+/).filter(Boolean);
  const lineas: string[] = [];
  let actual = "";
  for (const p of palabras) {
    const prueba = actual ? `${actual} ${p}` : p;
    if (ctx.measureText(prueba).width <= ancho || !actual) actual = prueba;
    else {
      lineas.push(actual);
      actual = p;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

/** Elige el tamaño de letra más grande con el que el texto entra en `maxLineas` renglones. */
function ajustarTexto(ctx: CanvasRenderingContext2D, texto: string, ancho: number, maxLineas: number, desde: number, hasta: number) {
  for (let t = desde; t >= hasta; t -= 2) {
    ctx.font = `800 ${t}px ${FUENTE}`;
    const l = renglones(ctx, texto, ancho);
    if (l.length <= maxLineas) return { tam: t, lineas: l };
  }
  ctx.font = `800 ${hasta}px ${FUENTE}`;
  const l = renglones(ctx, texto, ancho);
  const cortadas = l.slice(0, maxLineas);
  if (l.length > maxLineas) cortadas[maxLineas - 1] = cortadas[maxLineas - 1].replace(/\s*\S*$/, "") + "…";
  return { tam: hasta, lineas: cortadas };
}

function dibujarMontana(ctx: CanvasRenderingContext2D, x: number, y: number, alto: number) {
  const a = alto;
  ctx.save();
  ctx.fillStyle = COLOR.violeta;
  ctx.beginPath();
  ctx.moveTo(x, y + a);
  ctx.lineTo(x + a * 0.45, y + a * 0.05);
  ctx.lineTo(x + a * 0.68, y + a * 0.42);
  ctx.lineTo(x + a * 0.85, y + a * 0.22);
  ctx.lineTo(x + a * 1.25, y + a);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = COLOR.fondoArriba;
  ctx.beginPath();
  ctx.moveTo(x + a * 0.45, y + a * 0.05);
  ctx.lineTo(x + a * 0.6, y + a * 0.3);
  ctx.lineTo(x + a * 0.3, y + a * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function numeroLocal(whatsapp: string) {
  // 5493813595488 → 3813595488 (como lo escribe la gente en Argentina)
  return whatsapp.replace(/^54(9)?/, "");
}

export function precioFlyer(precio: number) {
  return "$" + new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Math.round(precio));
}

export async function generarFlyer(d: DatosFlyer): Promise<File> {
  const lienzo = document.createElement("canvas");
  lienzo.width = LADO;
  lienzo.height = LADO;
  const ctx = lienzo.getContext("2d")!;
  ctx.textBaseline = "alphabetic";

  const [foto, logo] = await Promise.all([cargarFoto(d.foto), cargarImagen("/logo-flyer.png").catch(() => null)]);

  // ── Fondo ──
  const grad = ctx.createLinearGradient(0, 0, 0, LADO);
  grad.addColorStop(0, COLOR.fondoArriba);
  grad.addColorStop(1, COLOR.fondoAbajo);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, LADO, LADO);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  for (const [cx, cy, r] of [
    [90, 260, 120],
    [1010, 640, 150],
    [140, 880, 70],
  ]) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Marca arriba ──
  if (logo) {
    const proporcion = logo.width / logo.height;
    let alto = 110;
    let ancho = proporcion * alto;
    if (ancho > 520) {
      ancho = 520;
      alto = ancho / proporcion;
    }
    ctx.drawImage(logo, (LADO - ancho) / 2, 30 + (110 - alto) / 2, ancho, alto);
  } else {
    const marca = d.contacto.marca.toUpperCase();
    ctx.font = `800 58px ${FUENTE}`;
    ctx.letterSpacing = "8px";
    const anchoTexto = ctx.measureText(marca).width;
    const montana = 54;
    const total = montana * 1.25 + 22 + anchoTexto;
    const x0 = (LADO - total) / 2;
    dibujarMontana(ctx, x0, 62, montana);
    ctx.fillStyle = COLOR.violeta;
    ctx.textAlign = "left";
    ctx.fillText(marca, x0 + montana * 1.25 + 22, 114);
    ctx.letterSpacing = "0px";
  }

  // ── Foto ──
  const fx = 120,
    fy = 170,
    fw = LADO - 240,
    fh = 560,
    radio = 40;
  ctx.save();
  ctx.shadowColor = "rgba(63,42,117,0.25)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 14;
  ctx.fillStyle = COLOR.blanco;
  rectRedondeado(ctx, fx - 12, fy - 12, fw + 24, fh + 24, radio + 10);
  ctx.fill();
  ctx.restore();
  ctx.save();
  rectRedondeado(ctx, fx, fy, fw, fh, radio);
  ctx.clip();
  const escala = Math.max(fw / foto.width, fh / foto.height);
  const dw = foto.width * escala,
    dh = foto.height * escala;
  ctx.drawImage(foto, fx + (fw - dw) / 2, fy + (fh - dh) / 2, dw, dh);
  ctx.restore();

  // ── Burbuja de precio ──
  const precio = precioFlyer(d.precio);
  ctx.font = `900 64px ${FUENTE}`;
  let tamPrecio = 64;
  while (ctx.measureText(precio).width > 300 && tamPrecio > 36) {
    tamPrecio -= 2;
    ctx.font = `900 ${tamPrecio}px ${FUENTE}`;
  }
  const anchoBurbuja = Math.max(ctx.measureText(precio).width + 70, 200);
  ctx.save();
  // Arriba a la derecha de la foto, sin salirse de la imagen
  ctx.translate(Math.min(fx + fw - 40, LADO - 40 - anchoBurbuja / 2), fy + 30);
  ctx.rotate((-8 * Math.PI) / 180);
  ctx.shadowColor = "rgba(63,42,117,0.35)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = COLOR.burbuja;
  rectRedondeado(ctx, -anchoBurbuja / 2, -62, anchoBurbuja, 124, 62);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = COLOR.blanco;
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.fillStyle = COLOR.blanco;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(precio, 0, 4);
  ctx.restore();
  ctx.textBaseline = "alphabetic";

  // ── Nombre y talles ──
  const zonaArriba = fy + fh + 30;
  const zonaAbajo = 940;
  const { tam, lineas } = ajustarTexto(ctx, d.nombre.trim(), LADO - 180, 2, 76, 46);
  const altoLinea = tam * 1.12;
  const tieneTalles = Boolean(d.talles.trim());
  const altoTalles = tieneTalles ? 64 : 0;
  const altoBloque = lineas.length * altoLinea + (tieneTalles ? 22 + altoTalles : 0);
  let y = zonaArriba + (zonaAbajo - zonaArriba - altoBloque) / 2 + tam * 0.9;
  ctx.fillStyle = COLOR.violetaOscuro;
  ctx.textAlign = "center";
  ctx.font = `800 ${tam}px ${FUENTE}`;
  for (const l of lineas) {
    ctx.fillText(l, LADO / 2, y);
    y += altoLinea;
  }
  if (tieneTalles) {
    const texto = `Talles ${d.talles.trim()}`;
    ctx.font = `700 34px ${FUENTE}`;
    const w = Math.min(ctx.measureText(texto).width + 56, LADO - 200);
    const top = y - tam * 0.9 + 22 - (altoLinea - tam);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    rectRedondeado(ctx, (LADO - w) / 2, top, w, altoTalles, 32);
    ctx.fill();
    ctx.fillStyle = COLOR.violeta;
    ctx.textBaseline = "middle";
    ctx.fillText(texto, LADO / 2, top + altoTalles / 2 + 2, LADO - 240);
    ctx.textBaseline = "alphabetic";
  }

  // ── Franja de contacto ──
  const datos = [
    d.contacto.whatsapp && { etiqueta: "WhatsApp", valor: numeroLocal(d.contacto.whatsapp) },
    d.contacto.instagram && { etiqueta: "Instagram", valor: `@${d.contacto.instagram}` },
    d.contacto.facebook && { etiqueta: "Facebook", valor: d.contacto.facebook },
  ].filter(Boolean) as { etiqueta: string; valor: string }[];

  ctx.fillStyle = COLOR.violeta;
  ctx.fillRect(0, 960, LADO, 120);
  if (datos.length) {
    const ancho = LADO / datos.length;
    datos.forEach((dato, i) => {
      const cx = ancho * i + ancho / 2;
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.font = `600 24px ${FUENTE}`;
      ctx.fillText(dato.etiqueta.toUpperCase(), cx, 1004, ancho - 30);
      ctx.fillStyle = COLOR.blanco;
      ctx.font = `700 32px ${FUENTE}`;
      ctx.fillText(dato.valor, cx, 1046, ancho - 30);
    });
  }

  const blob = await new Promise<Blob>((ok, mal) =>
    lienzo.toBlob((b) => (b ? ok(b) : mal(new Error("No se pudo crear la imagen"))), "image/jpeg", 0.9),
  );
  return new File([blob], "flyer.jpg", { type: "image/jpeg" });
}
