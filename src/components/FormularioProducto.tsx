"use client";

import imageCompression from "browser-image-compression";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BUCKET, parsearPrecio, urlPublica, type Producto } from "@/lib/types";

const MAX_FOTOS = 10; // límite de un carrusel de Instagram

type FotoItem =
  | { tipo: "existente"; key: string; id: string; storage_path: string }
  | { tipo: "nueva"; key: string; file: File; preview: string };

function fotosIniciales(producto?: Producto): FotoItem[] {
  return (producto?.producto_fotos ?? []).map((f) => ({
    tipo: "existente",
    key: f.id,
    id: f.id,
    storage_path: f.storage_path,
  }));
}

/** Achica la foto a máx. 1600 px y la pasa a JPEG (formato que acepta Meta sin problemas). */
async function prepararFoto(file: File): Promise<File> {
  const comprimida = await imageCompression(file, {
    maxWidthOrHeight: 1600,
    maxSizeMB: 1.5,
    fileType: "image/jpeg",
    initialQuality: 0.85,
    useWebWorker: true,
  });
  return new File([comprimida], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}

export default function FormularioProducto({ producto }: { producto?: Producto }) {
  const router = useRouter();
  const editando = Boolean(producto);
  const inputFotos = useRef<HTMLInputElement>(null);

  const [fotos, setFotos] = useState<FotoItem[]>(() => fotosIniciales(producto));
  const [borradas, setBorradas] = useState<{ id: string; storage_path: string }[]>([]);
  const [procesando, setProcesando] = useState(0);
  const [arrastrando, setArrastrando] = useState(false);

  const [nombre, setNombre] = useState(producto?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(producto?.descripcion ?? "");
  const [precio, setPrecio] = useState(producto ? String(producto.precio).replace(".", ",") : "");
  const [talles, setTalles] = useState(producto?.talles ?? "");
  const [disponible, setDisponible] = useState(producto?.disponible ?? true);

  const [estado, setEstado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const guardando = estado !== null;

  // Liberar las vistas previas al salir
  const fotosRef = useRef(fotos);
  fotosRef.current = fotos;
  useEffect(
    () => () => {
      fotosRef.current.forEach((f) => f.tipo === "nueva" && URL.revokeObjectURL(f.preview));
    },
    [],
  );

  async function agregarArchivos(lista: FileList | File[]) {
    setError(null);
    const imagenes = Array.from(lista).filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name));
    const lugar = MAX_FOTOS - fotos.length - procesando;
    if (imagenes.length > lugar) {
      setError(`Máximo ${MAX_FOTOS} fotos por producto. Se agregaron las primeras ${Math.max(lugar, 0)}.`);
    }
    const aProcesar = imagenes.slice(0, Math.max(lugar, 0));
    if (aProcesar.length === 0) return;

    setProcesando((n) => n + aProcesar.length);
    const fallidas: string[] = [];
    await Promise.all(
      aProcesar.map(async (archivo) => {
        try {
          const file = await prepararFoto(archivo);
          const item: FotoItem = {
            tipo: "nueva",
            key: crypto.randomUUID(),
            file,
            preview: URL.createObjectURL(file),
          };
          setFotos((prev) => [...prev, item]);
        } catch {
          fallidas.push(archivo.name);
        } finally {
          setProcesando((n) => n - 1);
        }
      }),
    );
    if (fallidas.length) {
      setError(`No se pudo leer: ${fallidas.join(", ")}. Probá con fotos JPG o PNG.`);
    }
  }

  function quitarFoto(key: string) {
    const foto = fotos.find((f) => f.key === key);
    if (!foto) return;
    if (foto.tipo === "nueva") URL.revokeObjectURL(foto.preview);
    if (foto.tipo === "existente") setBorradas((b) => [...b, { id: foto.id, storage_path: foto.storage_path }]);
    setFotos((prev) => prev.filter((f) => f.key !== key));
  }

  function hacerPrincipal(key: string) {
    setFotos((prev) => {
      const foto = prev.find((f) => f.key === key)!;
      return [foto, ...prev.filter((f) => f.key !== key)];
    });
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const precioNum = parsearPrecio(precio);
    if (fotos.length === 0) return setError("Agregá al menos una foto.");
    if (!nombre.trim()) return setError("Poné un nombre al producto.");
    if (precioNum === null) return setError("El precio no es válido. Ejemplo: 12500");
    if (procesando > 0) return setError("Esperá a que terminen de procesarse las fotos.");

    const supabase = createClient();
    const datos = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      precio: precioNum,
      talles: talles.trim() || null,
      disponible,
    };
    const subidas: string[] = [];
    let productoId = producto?.id;
    let creadoAhora = false;

    try {
      // 1. Guardar los datos del producto
      setEstado("Guardando datos…");
      if (productoId) {
        const { error } = await supabase.from("productos").update(datos).eq("id", productoId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("productos").insert(datos).select("id").single();
        if (error) throw error;
        productoId = data.id as string;
        creadoAhora = true;
      }

      // 2. Subir las fotos nuevas
      const nuevas = fotos.filter((f): f is Extract<FotoItem, { tipo: "nueva" }> => f.tipo === "nueva");
      const rutas = new Map<string, string>();
      let hechas = 0;
      for (const foto of nuevas) {
        setEstado(`Subiendo fotos… ${hechas + 1} de ${nuevas.length}`);
        const ruta = `${productoId}/${crypto.randomUUID()}.jpg`;
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(ruta, foto.file, { contentType: "image/jpeg", cacheControl: "31536000" });
        if (error) throw error;
        subidas.push(ruta);
        rutas.set(foto.key, ruta);
        hechas++;
      }

      // 3. Registrar fotos nuevas y actualizar el orden de las existentes
      setEstado("Ordenando fotos…");
      const filasNuevas = fotos.flatMap((f, orden) =>
        f.tipo === "nueva" ? [{ producto_id: productoId!, storage_path: rutas.get(f.key)!, orden }] : [],
      );
      if (filasNuevas.length) {
        const { error } = await supabase.from("producto_fotos").insert(filasNuevas);
        if (error) throw error;
      }
      for (const [orden, f] of fotos.entries()) {
        if (f.tipo !== "existente") continue;
        const { error } = await supabase.from("producto_fotos").update({ orden }).eq("id", f.id);
        if (error) throw error;
      }

      // 4. Borrar las fotos que se quitaron
      if (borradas.length) {
        const { error } = await supabase.from("producto_fotos").delete().in("id", borradas.map((b) => b.id));
        if (error) throw error;
        await supabase.storage.from(BUCKET).remove(borradas.map((b) => b.storage_path));
      }

      router.replace("/");
      router.refresh();
    } catch (err) {
      // Si era un producto nuevo, no dejar nada a medias
      if (creadoAhora && productoId) {
        if (subidas.length) await supabase.storage.from(BUCKET).remove(subidas);
        await supabase.from("productos").delete().eq("id", productoId);
      }
      const mensaje = err instanceof Error ? err.message : String(err);
      setError(`No se pudo guardar. ${mensaje}`);
      setEstado(null);
    }
  }

  async function eliminar() {
    if (!producto) return;
    if (!confirm(`¿Eliminar "${producto.nombre}"? No se puede deshacer.`)) return;
    setEstado("Eliminando…");
    const supabase = createClient();
    const rutas = producto.producto_fotos.map((f) => f.storage_path);
    const { error } = await supabase.from("productos").delete().eq("id", producto.id);
    if (error) {
      setError(`No se pudo eliminar. ${error.message}`);
      setEstado(null);
      return;
    }
    if (rutas.length) await supabase.storage.from(BUCKET).remove(rutas);
    router.replace("/");
    router.refresh();
  }

  const lugarLibre = fotos.length + procesando < MAX_FOTOS;

  return (
    <form onSubmit={guardar} className="space-y-6">
      {/* ───── Fotos ───── */}
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="etiqueta mb-0">Fotos</span>
          <span className="text-xs text-tinta-suave">
            {fotos.length}/{MAX_FOTOS} · la primera es la principal
          </span>
        </div>

        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {fotos.map((f, i) => (
            <li key={f.key} className="group relative aspect-square overflow-hidden rounded-xl border border-borde bg-papel">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.tipo === "nueva" ? f.preview : urlPublica(f.storage_path)}
                alt=""
                className="h-full w-full object-cover"
              />
              {i === 0 ? (
                <span className="absolute bottom-1 left-1 rounded-md bg-acento px-1.5 py-0.5 text-[11px] font-semibold text-white">
                  Principal
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => hacerPrincipal(f.key)}
                  disabled={guardando}
                  className="absolute bottom-1 left-1 rounded-md bg-white/90 px-1.5 py-0.5 text-[11px] font-medium text-tinta"
                >
                  Hacer principal
                </button>
              )}
              <button
                type="button"
                onClick={() => quitarFoto(f.key)}
                disabled={guardando}
                aria-label="Quitar foto"
                className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-lg leading-none text-white"
              >
                ×
              </button>
            </li>
          ))}

          {Array.from({ length: procesando }).map((_, i) => (
            <li
              key={`proc-${i}`}
              className="flex aspect-square animate-pulse items-center justify-center rounded-xl border border-borde bg-acento-suave text-xs text-acento"
            >
              Procesando…
            </li>
          ))}

          {lugarLibre && (
            <li className="aspect-square">
              <button
                type="button"
                onClick={() => inputFotos.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setArrastrando(true);
                }}
                onDragLeave={() => setArrastrando(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setArrastrando(false);
                  agregarArchivos(e.dataTransfer.files);
                }}
                disabled={guardando}
                className={`flex h-full w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-sm transition ${
                  arrastrando ? "border-acento bg-acento-suave text-acento" : "border-borde text-tinta-suave hover:border-acento hover:text-acento"
                }`}
              >
                <span className="text-2xl leading-none">+</span>
                <span>{fotos.length ? "Agregar" : "Subir fotos"}</span>
              </button>
            </li>
          )}
        </ul>

        <input
          ref={inputFotos}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) agregarArchivos(e.target.files);
            e.target.value = "";
          }}
        />
      </section>

      {/* ───── Datos ───── */}
      <section className="space-y-4 rounded-2xl border border-borde bg-papel p-4 sm:p-5">
        <div>
          <label htmlFor="nombre" className="etiqueta">Nombre</label>
          <input
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={150}
            placeholder="Buzo frisa oso"
            className="campo"
            disabled={guardando}
          />
        </div>

        <div>
          <label htmlFor="descripcion" className="etiqueta">Descripción</label>
          <textarea
            id="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={4}
            maxLength={5000}
            placeholder="Buzo de frisa con capucha y bolsillo canguro. Algodón."
            className="campo resize-y"
            disabled={guardando}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="precio" className="etiqueta">Precio</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-tinta-suave">$</span>
              <input
                id="precio"
                inputMode="decimal"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="12500"
                className="campo pl-7"
                disabled={guardando}
              />
            </div>
          </div>
          <div>
            <label htmlFor="talles" className="etiqueta">
              Talles <span className="font-normal text-tinta-suave">(opcional)</span>
            </label>
            <input
              id="talles"
              value={talles}
              onChange={(e) => setTalles(e.target.value)}
              placeholder="2 al 8"
              className="campo"
              disabled={guardando}
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-center justify-between rounded-xl bg-fondo px-3.5 py-3">
          <span>
            <span className="block text-sm font-medium">Disponible</span>
            <span className="block text-xs text-tinta-suave">Si se agota, apagalo y deja de mostrarse como disponible.</span>
          </span>
          <input
            type="checkbox"
            checked={disponible}
            onChange={(e) => setDisponible(e.target.checked)}
            className="h-5 w-5 accent-[var(--ok)]"
            disabled={guardando}
          />
        </label>
      </section>

      {error && <p className="rounded-lg bg-peligro-suave px-3 py-2 text-sm text-peligro">{error}</p>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {editando ? (
          <button type="button" onClick={eliminar} disabled={guardando} className="text-sm font-medium text-peligro hover:underline">
            Eliminar producto
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} disabled={guardando} className="boton-secundario flex-1 sm:flex-none">
            Cancelar
          </button>
          <button type="submit" disabled={guardando || procesando > 0} className="boton flex-1 sm:flex-none sm:min-w-40">
            {estado ?? (editando ? "Guardar cambios" : "Guardar producto")}
          </button>
        </div>
      </div>
    </form>
  );
}
