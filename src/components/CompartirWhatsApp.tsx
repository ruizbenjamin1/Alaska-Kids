"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Arma el mensaje del producto para mandarlo a una difusión, grupo o contacto de WhatsApp.
 * WhatsApp no deja que una app envíe sola a las difusiones: esto abre WhatsApp con todo listo
 * y Nicole elige a quién mandarlo y toca enviar.
 *
 * Para que llegue todo en UN mensaje (foto con el texto como pie) se comparte solo la foto y el texto
 * queda copiado: en WhatsApp se pega en "Añadir comentario". Si se mandan foto y texto juntos por
 * "Compartir", WhatsApp los separa en dos mensajes (o descarta el texto), y eso no se puede evitar desde la web.
 * Si el aparato no deja compartir fotos, se abre WhatsApp solo con el texto.
 */
export default function CompartirWhatsApp({
  textoInicial,
  fotoUrl,
  nombre,
}: {
  textoInicial: string;
  fotoUrl: string | null;
  nombre: string;
}) {
  const [texto, setTexto] = useState(textoInicial);
  const [aviso, setAviso] = useState<string | null>(null);
  const foto = useRef<File | null>(null);
  const [puedeFoto, setPuedeFoto] = useState(false);

  // La foto se baja antes: el teléfono solo deja abrir "Compartir" justo después del toque
  useEffect(() => {
    if (!fotoUrl || typeof navigator === "undefined" || !navigator.canShare) return;
    let cancelado = false;
    fetch(fotoUrl)
      .then((r) => (r.ok ? r.blob() : Promise.reject()))
      .then((blob) => {
        if (cancelado) return;
        const archivo = new File([blob], `${nombre.replace(/[^\w\s-]/g, "").trim() || "producto"}.jpg`, {
          type: blob.type || "image/jpeg",
        });
        if (navigator.canShare({ files: [archivo] })) {
          foto.current = archivo;
          setPuedeFoto(true);
        }
      })
      .catch(() => null);
    return () => {
      cancelado = true;
    };
  }, [fotoUrl, nombre]);

  async function compartir() {
    setAviso(null);
    const copiado = navigator.clipboard?.writeText(texto).then(
      () => true,
      () => false,
    );

    if (foto.current && navigator.share) {
      try {
        await navigator.share({ files: [foto.current] });
        setAviso(
          (await copiado)
            ? "El texto quedó copiado. En WhatsApp, antes de enviar la foto, tocá “Añadir un comentario”, mantené apretado y elegí Pegar."
            : "No se pudo copiar el texto: copialo del cuadro de arriba y pegalo como comentario de la foto.",
        );
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return; // cerró el menú sin compartir
        // Si falla compartir con foto, se sigue con el texto solo
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
    if (await copiado) setAviso("El texto también quedó copiado. La foto la podés adjuntar desde WhatsApp.");
  }

  return (
    <section className="mt-4 rounded-2xl border border-borde bg-papel p-4 sm:p-5">
      <h2 className="font-semibold">Enviar al canal o difusión de WhatsApp</h2>
      <p className="mb-4 text-sm text-tinta-suave">
        Para mandar el producto al canal, a una difusión o a un grupo, en un solo mensaje con la foto y el texto abajo.
        {puedeFoto
          ? " Al tocar el botón se copia el texto y se abre Compartir con la foto: elegís WhatsApp y a quién, pegás el texto como comentario de la foto y enviás."
          : " Al tocar el botón se abre WhatsApp con el texto listo."}
      </p>
      <label htmlFor="texto-wa" className="etiqueta">
        Mensaje
      </label>
      <textarea
        id="texto-wa"
        rows={8}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        className="campo resize-y"
      />
      <span className="mt-1 block text-xs text-tinta-suave">Lo que va entre *asteriscos* sale en negrita en WhatsApp.</span>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={compartir}
          disabled={!texto.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1f8f4e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1a7a43] active:scale-[0.98] disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
            <path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.5L3 21l2-5.6A8.4 8.4 0 1 1 21 11.5Z" />
          </svg>
          Enviar por WhatsApp
        </button>
        {texto !== textoInicial && (
          <button type="button" onClick={() => setTexto(textoInicial)} className="text-sm text-acento hover:underline">
            Volver al texto original
          </button>
        )}
      </div>
      {aviso && <p className="mt-3 rounded-lg bg-acento-suave px-3 py-2 text-sm text-acento">{aviso}</p>}
    </section>
  );
}
