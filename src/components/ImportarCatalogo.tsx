"use client";

import { useActionState } from "react";
import { importarCatalogo, type ResultadoImportar } from "@/app/meta/importar";

/** El catálogo que Nicole armó a mano en WhatsApp Business. */
const CATALOGO_WHATSAPP = "1347729337174599";

export default function ImportarCatalogo() {
  const [resultado, accion, trayendo] = useActionState<ResultadoImportar, FormData>(importarCatalogo, null);

  return (
    <section className="mt-4 rounded-2xl border border-borde bg-papel p-5">
      <h2 className="font-semibold">Traer productos de otro catálogo</h2>
      <p className="mb-4 text-sm text-tinta-suave">
        Copia a la app los productos de otro catálogo de Meta (por ejemplo, el que está cargado en WhatsApp Business), con
        sus fotos y precios. Los que ya están en la app con el mismo nombre no se repiten.
      </p>
      <form action={accion} className="flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor="catalogo_origen" className="etiqueta">
            ID del catálogo
          </label>
          <input
            id="catalogo_origen"
            name="catalogo_origen"
            inputMode="numeric"
            defaultValue={CATALOGO_WHATSAPP}
            className="campo"
            disabled={trayendo}
          />
        </div>
        <button type="submit" disabled={trayendo} className="boton">
          {trayendo && <span className="girando" aria-hidden />}
          {trayendo ? "Trayendo… (puede tardar)" : "Traer productos"}
        </button>
      </form>
      {resultado && (
        <p
          className={`mt-3 rounded-lg px-3 py-2 text-sm ${resultado.ok ? "bg-ok-suave text-ok" : "bg-peligro-suave text-peligro"}`}
        >
          {resultado.mensaje}
        </p>
      )}
    </section>
  );
}
