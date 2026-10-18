import Link from "next/link";

export const metadata = { title: "Guía · Alaska Kids" };

type Tema = { id: string; titulo: string; contenido: React.ReactNode };

const temas: Tema[] = [
  {
    id: "instalar",
    titulo: "Tener la app en el iPhone o el iPad",
    contenido: (
      <>
        <Pasos>
          <li>Abrí la página del panel en <strong>Safari</strong>. Tiene que ser Safari, no Chrome.</li>
          <li>Tocá el botón <strong>Compartir</strong>: el cuadradito con la flecha para arriba.</li>
          <li>Elegí <strong>“Agregar a inicio”</strong> y después <strong>Agregar</strong>.</li>
        </Pasos>
        <p>Te queda el ícono de Alaska Kids en la pantalla de inicio y se abre como una app más, a pantalla completa. Hacelo una vez en cada aparato.</p>
      </>
    ),
  },
  {
    id: "cargar",
    titulo: "Cargar un producto nuevo",
    contenido: (
      <>
        <Pasos>
          <li>En <strong>Productos</strong>, tocá <strong>“+ Nuevo producto”</strong>.</li>
          <li>Subí las fotos: tocá <strong>“Subir fotos”</strong> y elegilas de la galería. Podés elegir varias juntas.</li>
          <li>Completá el <strong>nombre</strong>, la <strong>descripción</strong>, el <strong>precio</strong> y los <strong>talles</strong>.</li>
          <li>Tocá <strong>“Guardar producto”</strong>.</li>
        </Pasos>
        <p>Al guardar, el producto se manda solo al catálogo de Meta. No hace falta hacer nada más.</p>
        <Consejo>El precio se escribe solo con números: si ponés 12500 se ve “12.500”. No pongas el signo $.</Consejo>
      </>
    ),
  },
  {
    id: "fotos",
    titulo: "Las fotos",
    contenido: (
      <>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Hasta <strong>10 fotos</strong> por producto.</li>
          <li>La <strong>primera</strong> es la principal: es la que se ve en la lista, en el catálogo y la primera del carrusel.</li>
          <li>Para cambiar el orden, <strong>mantené apretada una foto</strong> un segundo y arrastrala a otro lugar. También podés tocar <strong>“Hacer principal”</strong>.</li>
          <li>Para sacar una foto, tocá la <strong>×</strong> de arriba a la derecha.</li>
        </ul>
        <Consejo>Las fotos salen mejor cuadradas, con buena luz y fondo liso. La app las achica sola para que suban rápido.</Consejo>
      </>
    ),
  },
  {
    id: "agotado",
    titulo: "Marcar disponible o agotado",
    contenido: (
      <>
        <p>En la lista, cada producto tiene un botón <strong>Disponible / Agotado</strong>. Tocalo y cambia al instante. El catálogo de Meta se actualiza solo.</p>
        <p>Un producto agotado sigue apareciendo en el catálogo, pero marcado como sin stock. Cuando vuelva a entrar, tocás de nuevo y listo.</p>
      </>
    ),
  },
  {
    id: "buscar",
    titulo: "Buscar, filtrar y ordenar",
    contenido: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li><strong>Buscador:</strong> escribí parte del nombre, la descripción o un talle (por ejemplo “buzo 4”).</li>
        <li><strong>Filtros:</strong> Todos, Disponibles, Agotados y, si hay alguno con problemas, “Error en Meta”.</li>
        <li><strong>Orden:</strong> el menú al lado del buscador ordena por más nuevos, más viejos o por precio.</li>
      </ul>
    ),
  },
  {
    id: "editar",
    titulo: "Editar, duplicar o eliminar",
    contenido: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li><strong>Editar:</strong> tocá el producto, cambiá lo que quieras y tocá <strong>“Guardar cambios”</strong>. Meta se actualiza solo.</li>
        <li>
          <strong>Duplicar:</strong> arriba a la derecha, <strong>“Duplicar”</strong> hace una copia con las mismas fotos y datos. Sirve para
          cargar el mismo modelo en otro color: cambiás lo que haga falta y guardás.
        </li>
        <li><strong>Eliminar:</strong> abajo de todo, <strong>“Eliminar producto”</strong>. Lo saca también del catálogo de Meta. No se puede deshacer.</li>
      </ul>
    ),
  },
  {
    id: "catalogo",
    titulo: "Qué significa cada etiqueta",
    contenido: (
      <>
        <ul className="space-y-2">
          <li><Chip clase="bg-ok-suave text-ok">✓ Catálogo</Chip> Ya está en el catálogo de Meta (Facebook, Instagram y WhatsApp).</li>
          <li><Chip clase="bg-fondo text-tinta-suave">Catálogo pendiente</Chip> Todavía no se mandó, o se está mandando.</li>
          <li><Chip clase="bg-acento-suave text-acento">✓ IG</Chip> <Chip clase="bg-acento-suave text-acento">✓ FB</Chip> Ya se publicó en Instagram o en Facebook.</li>
        </ul>
        <p>Si ves productos pendientes o con error, andá a <Link href="/meta" className="font-medium text-acento hover:underline">Meta</Link> y tocá <strong>“Enviar pendientes”</strong>.</p>
      </>
    ),
  },
  {
    id: "publicar",
    titulo: "Publicar en Instagram y Facebook",
    contenido: (
      <>
        <Pasos>
          <li>Entrá al producto y guardá los cambios si tocaste algo.</li>
          <li>Abajo, en <strong>“Publicar en redes”</strong>, revisá el texto. Ya viene armado con el nombre, el precio y los talles, y lo podés cambiar.</li>
          <li>Elegí <strong>Instagram</strong>, <strong>Facebook</strong> o los dos.</li>
          <li>Tocá <strong>“Publicar”</strong> y esperá: puede tardar hasta un minuto.</li>
        </Pasos>
        <p>Si el producto tiene varias fotos, sale como <strong>carrusel</strong>. Abajo queda la lista de publicaciones con el link para verlas.</p>
        <Consejo>
          Una vez publicado, no se puede borrar desde acá. Si te equivocaste, borrá la publicación desde la app de Instagram o de Facebook.
        </Consejo>
      </>
    ),
  },
  {
    id: "whatsapp",
    titulo: "Cómo llegan los clientes a WhatsApp",
    contenido: (
      <p>
        Cada producto tiene su propia página pública con las fotos, el precio y un botón <strong>“Consultar por WhatsApp”</strong>. Es la
        página a la que lleva el catálogo de Meta. El número que usa se cambia en <Link href="/meta" className="font-medium text-acento hover:underline">Meta</Link>, en
        <strong> “WhatsApp del local”</strong>.
      </p>
    ),
  },
  {
    id: "reconectar",
    titulo: "Cada tanto: reconectar con Facebook",
    contenido: (
      <>
        <p>
          Facebook da permiso a la app por unos <strong>60 días</strong>. En la pantalla <Link href="/meta" className="font-medium text-acento hover:underline">Meta</Link> se ve
          hasta qué fecha dura. Cuando se acerque, tocá <strong>“Reconectar”</strong> y aceptá todo lo que pida Facebook.
        </p>
        <p>Si se vence, los productos no se pierden: se guardan igual en la app y se mandan cuando vuelvas a conectar.</p>
      </>
    ),
  },
  {
    id: "contrasena",
    titulo: "Me olvidé la contraseña",
    contenido: (
      <Pasos>
        <li>En la pantalla de entrar, tocá <strong>“¿Olvidaste tu contraseña?”</strong>.</li>
        <li>Escribí tu email y tocá <strong>“Enviar link”</strong>.</li>
        <li>Abrí el mail (si no está, mirá en spam) y tocá el link.</li>
        <li>Elegí la contraseña nueva, de al menos 8 caracteres, y tocá <strong>“Guardar y entrar”</strong>.</li>
      </Pasos>
    ),
  },
  {
    id: "problemas",
    titulo: "Si algo no anda",
    contenido: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li><strong>Aparece el filtro “Error en Meta”:</strong> entrá al producto, revisá que tenga foto, nombre y precio, guardá de nuevo y después tocá “Enviar pendientes” en Meta.</li>
        <li><strong>No deja publicar en redes:</strong> casi siempre es que hay que reconectar con Facebook desde Meta.</li>
        <li><strong>La pantalla no se actualiza:</strong> cerrá la app y abrila de nuevo.</li>
        <li>Si sigue sin andar, sacale una captura a la pantalla y mandásela a Benjamin.</li>
      </ul>
    ),
  },
];

export default function Ayuda() {
  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-6">
      <h1 className="text-2xl font-bold tracking-tight">Guía</h1>
      <p className="mb-6 mt-1 text-sm text-tinta-suave">Cómo usar el panel. Tocá un tema para abrirlo.</p>

      <div className="space-y-2">
        {temas.map((t, i) => (
          <details
            key={t.id}
            id={t.id}
            className="group rounded-2xl border border-borde bg-papel open:shadow-sm"
          >
            <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 font-medium [&::-webkit-details-marker]:hidden">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-acento-suave text-xs font-semibold text-acento">
                {i + 1}
              </span>
              <span className="flex-1">{t.titulo}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-tinta-suave transition group-open:rotate-180" aria-hidden>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            <div className="space-y-3 border-t border-borde px-4 pb-4 pt-3 text-sm leading-relaxed text-tinta">{t.contenido}</div>
          </details>
        ))}
      </div>
    </main>
  );
}

function Pasos({ children }: { children: React.ReactNode }) {
  return <ol className="list-decimal space-y-1.5 pl-5 marker:font-semibold marker:text-acento">{children}</ol>;
}

function Consejo({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl bg-fondo px-3.5 py-2.5 text-tinta-suave">{children}</p>;
}

function Chip({ clase, children }: { clase: string; children: React.ReactNode }) {
  return <span className={`mr-1 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${clase}`}>{children}</span>;
}
