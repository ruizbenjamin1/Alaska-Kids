"use client";

import { useActionState, useState } from "react";
import { publicarProducto, type ResultadoPublicar } from "@/app/productos/[id]/publicar";

export type Publicacion = {
  id: string;
  red: "instagram" | "facebook";
  estado: "publicando" | "publicado" | "error";
  link: string | null;
  error: string | null;
  creado_en: string;
};

const fecha = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function PublicarEnRedes({
  productoId,
  textoInicial,
  igUsuario,
  paginaNombre,
  cantFotos,
  aviso,
  historial,
}: {
  productoId: string;
  textoInicial: string;
  igUsuario: string | null;
  paginaNombre: string | null;
  cantFotos: number;
  /** Si hay algo que impide publicar (Meta sin conectar, permisos faltantes…) */
  aviso: string | null;
  historial: Publicacion[];
}) {
  const [resultado, accion, publicando] = useActionState<ResultadoPublicar, FormData>(publicarProducto, null);
  const [texto, setTexto] = useState(textoInicial);

  return (
    <section className="mt-8 rounded-2xl border border-borde bg-papel p-4 sm:p-5">
      <h2 className="font-semibold">Publicar en redes</h2>
      <p className="mb-4 text-sm text-tinta-suave">
        {cantFotos > 1
          ? `Se publica como carrusel con ${Math.min(cantFotos, 10)} fotos.`
          : "Se publica con la foto del producto."}{" "}
        Guardá los cambios del producto antes de publicar.
      </p>

      {aviso ? (
        <p className="rounded-xl bg-fondo px-4 py-3 text-sm text-tinta-suave">
          {aviso}{" "}
          <a href="/meta" className="font-medium text-acento hover:underline">
            Ir a Meta
          </a>
        </p>
      ) : (
        <form action={accion} className="space-y-4">
          <input type="hidden" name="producto_id" value={productoId} />
          <div>
            <label htmlFor="texto" className="etiqueta">
              Texto de la publicación
            </label>
            <textarea
              id="texto"
              name="texto"
              rows={8}
              maxLength={2200}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              className="campo resize-y"
              disabled={publicando}
            />
            <span className="mt-1 block text-right text-xs text-tinta-suave">{texto.length}/2200</span>
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-fondo px-3.5 py-2.5 text-sm">
              <input type="checkbox" name="red" value="instagram" defaultChecked={Boolean(igUsuario)} disabled={!igUsuario || publicando} className="h-4 w-4" />
              Instagram {igUsuario ? <span className="text-tinta-suave">@{igUsuario}</span> : <span className="text-tinta-suave">(sin vincular)</span>}
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-fondo px-3.5 py-2.5 text-sm">
              <input type="checkbox" name="red" value="facebook" defaultChecked disabled={publicando} className="h-4 w-4" />
              Facebook {paginaNombre && <span className="text-tinta-suave">{paginaNombre}</span>}
            </label>
          </div>

          {resultado && (
            <ul
              className={`rounded-lg px-3 py-2 text-sm ${resultado.ok ? "bg-ok-suave text-ok" : "bg-peligro-suave text-peligro"}`}
            >
              {resultado.mensajes.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          )}

          <button type="submit" disabled={publicando || !texto.trim()} className="boton">
            {publicando ? "Publicando… (puede tardar un minuto)" : "Publicar"}
          </button>
        </form>
      )}

      {historial.length > 0 && (
        <div className="mt-5 border-t border-borde pt-4">
          <h3 className="mb-2 text-sm font-semibold">Publicaciones anteriores</h3>
          <ul className="space-y-1.5 text-sm">
            {historial.map((p) => (
              <li key={p.id} className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-medium">{p.red === "instagram" ? "Instagram" : "Facebook"}</span>
                <span className="text-xs text-tinta-suave">{fecha.format(new Date(p.creado_en))}</span>
                {p.estado === "publicado" && p.link && (
                  <a href={p.link} target="_blank" rel="noreferrer" className="text-acento hover:underline">
                    Ver publicación
                  </a>
                )}
                {p.estado === "publicando" && <span className="text-tinta-suave">publicando…</span>}
                {p.estado === "error" && <span className="text-xs text-peligro">Error: {p.error}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
