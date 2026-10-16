import Panel from "@/components/Panel";
import { appConfigurada, descifrar, diagnostico, graph, listarCatalogos } from "@/lib/meta";
import { createClient } from "@/lib/supabase/server";
import { actualizarLotes } from "@/lib/catalogo";
import { cambiarCatalogo, desconectar, elegirCatalogo } from "./acciones";
import { enviarPendientes, guardarAjustes } from "./sincronizar";

export const dynamic = "force-dynamic";

type Conexion = {
  token_cifrado: string;
  token_expira_en: string | null;
  usuario_meta: string | null;
  negocio_nombre: string | null;
  catalogo_id: string | null;
  catalogo_nombre: string | null;
};

const fecha = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric" });

export default async function MetaPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error: errorUrl } = await searchParams;
  const supabase = await createClient();

  const { data: conexion } = await supabase.from("meta_conexion").select("*").eq("id", 1).maybeSingle<Conexion>();

  const appOk = appConfigurada();
  let token: string | null = null;
  let problema: string | null = null;
  let catalogos: Awaited<ReturnType<typeof listarCatalogos>> = [];
  let enMeta: number | null = null;
  let diag: Awaited<ReturnType<typeof diagnostico>> | null = null;

  if (conexion && appOk) {
    try {
      token = descifrar(conexion.token_cifrado);
      if (!conexion.catalogo_id) {
        diag = await diagnostico(token);
        catalogos = await listarCatalogos(token);
      } else {
        const c = await graph<{ product_count?: number }>(conexion.catalogo_id, token, { fields: "product_count" });
        enMeta = c.product_count ?? null;
      }
    } catch (e) {
      problema = e instanceof Error ? e.message : "No se pudo verificar la conexión con Meta.";
    }
  }

  const conectado = Boolean(conexion?.catalogo_id && !problema);

  // Revisa cómo terminaron los envíos anteriores antes de contar
  if (conectado && token && conexion?.catalogo_id) {
    await actualizarLotes(supabase, { token, catalogoId: conexion.catalogo_id }).catch(() => null);
  }
  const [{ data: estados }, { data: conError }, { data: ajustes }] = await Promise.all([
    supabase.from("productos").select("meta_estado"),
    supabase.from("productos").select("id, nombre, meta_error").eq("meta_estado", "error").limit(20),
    supabase.from("ajustes").select("whatsapp, marca").eq("id", 1).maybeSingle(),
  ]);

  const venceEn = conexion?.token_expira_en ? new Date(conexion.token_expira_en) : null;
  const diasRestantes = venceEn ? Math.ceil((venceEn.getTime() - Date.now()) / 86_400_000) : null;

  const cuenta = { pendiente: 0, enviando: 0, sincronizado: 0, error: 0 };
  for (const p of estados ?? []) cuenta[p.meta_estado as keyof typeof cuenta]++;

  return (
    <Panel>
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">
        <h1 className="text-2xl font-bold tracking-tight">Meta</h1>
        <p className="mb-6 text-sm text-tinta-suave">Conexión con el catálogo de Facebook, Instagram y WhatsApp.</p>

        {errorUrl && (
          <p className="mb-4 rounded-lg bg-peligro-suave px-3 py-2 text-sm text-peligro">{errorUrl}</p>
        )}

        <section className="rounded-2xl border border-borde bg-papel p-5">
          <div className="flex items-center gap-3">
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                conectado ? "bg-ok" : problema ? "bg-peligro" : conexion ? "bg-acento" : "bg-borde"
              }`}
            />
            <h2 className="font-semibold">
              {conectado
                ? "Conectado"
                : problema
                  ? "Hay un problema con la conexión"
                  : conexion
                    ? "Elegí el catálogo"
                    : "Todavía no está conectado"}
            </h2>
          </div>

          {/* ───── 1. Falta crear/configurar la app de Meta ───── */}
          {!appOk && (
            <div className="mt-4 space-y-3 text-sm">
              <p className="text-tinta-suave">
                Antes de poder conectar, hay que crear una app de Meta para Alaska Kids (se hace una sola vez):
              </p>
              <ol className="space-y-3">
                <li className="rounded-xl bg-fondo px-4 py-3">
                  <span className="font-medium">1. Crear la app</span>
                  <span className="block text-tinta-suave">
                    developers.facebook.com → Mis apps → Crear app → tipo Empresa, vinculada al portfolio de Alaska Kids.
                  </span>
                </li>
                <li className="rounded-xl bg-fondo px-4 py-3">
                  <span className="font-medium">2. Agregar “Facebook Login for Business”</span>
                  <span className="block text-tinta-suave">
                    En Configuración, en “URI de redireccionamiento de OAuth válidos”, agregar:
                  </span>
                  <code className="mt-1 block break-all rounded bg-papel px-2 py-1 text-xs">
                    https://alaska-kids-catalogo.vercel.app/api/meta/callback
                  </code>
                </li>
                <li className="rounded-xl bg-fondo px-4 py-3">
                  <span className="font-medium">3. Cargar las claves</span>
                  <span className="block text-tinta-suave">
                    En la app: Configuración → Básica. Copiar el identificador y la clave secreta a Vercel (Settings →
                    Environment Variables) como <code className="rounded bg-papel px-1">META_APP_ID</code> y{" "}
                    <code className="rounded bg-papel px-1">META_APP_SECRET</code>, y volver a publicar.
                  </span>
                </li>
              </ol>
            </div>
          )}

          {/* ───── 2. App lista, sin conectar ───── */}
          {appOk && !conexion && (
            <div className="mt-3">
              <p className="text-sm text-tinta-suave">
                Iniciá sesión con la cuenta de Facebook que administra Alaska Kids y autorizá el acceso al catálogo.
              </p>
              <a href="/api/meta/conectar" className="boton mt-4">
                Conectar con Facebook
              </a>
            </div>
          )}

          {/* ───── 3. Conectado a Facebook, falta elegir el catálogo ───── */}
          {appOk && conexion && !conexion.catalogo_id && !problema && (
            <div className="mt-3">
              <p className="text-sm text-tinta-suave">
                Conectado como <strong className="text-tinta">{conexion.usuario_meta}</strong>. ¿Qué catálogo usamos?
              </p>
              {catalogos.length === 0 ? (
                <p className="mt-3 rounded-xl bg-fondo px-4 py-3 text-sm text-tinta-suave">
                  Meta no devolvió catálogos para esta cuenta. Si ya existe uno (por ejemplo, el de WhatsApp), ingresá
                  su ID abajo.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {catalogos.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl bg-fondo px-4 py-3">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{c.name}</span>
                        <span className="block text-xs text-tinta-suave">
                          {c.negocioNombre}
                          {c.product_count !== undefined && ` · ${c.product_count} productos`}
                        </span>
                      </span>
                      <form action={elegirCatalogo}>
                        <input type="hidden" name="catalogo_id" value={c.id} />
                        <button className="boton shrink-0 px-3 py-2">Usar este</button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}

              {diag && (
                <details className="mt-4 rounded-xl bg-fondo px-4 py-3 text-xs text-tinta-suave" open>
                  <summary className="cursor-pointer font-medium text-tinta">Diagnóstico de la conexión</summary>
                  <p className="mt-2 font-medium text-tinta">Permisos que dio Facebook:</p>
                  {"error" in diag.permisos ? (
                    <p className="text-peligro">{diag.permisos.error}</p>
                  ) : (
                    <ul className="list-inside list-disc">
                      {diag.permisos.data.map((p) => (
                        <li key={p.permission}>
                          {p.permission}: {p.status === "granted" ? "aceptado" : p.status}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-2 font-medium text-tinta">Negocios que ve la app:</p>
                  {"error" in diag.negocios ? (
                    <p className="text-peligro">{diag.negocios.error}</p>
                  ) : diag.negocios.data.length === 0 ? (
                    <p>Ninguno</p>
                  ) : (
                    <ul className="list-inside list-disc">
                      {diag.negocios.data.map((n) => (
                        <li key={n.id}>
                          {n.name} ({n.id})
                        </li>
                      ))}
                    </ul>
                  )}
                </details>
              )}

              <form action={elegirCatalogo} className="mt-4 flex flex-wrap items-end gap-2 border-t border-borde pt-4">
                <div className="min-w-0 flex-1">
                  <label htmlFor="catalogo_id" className="etiqueta">
                    ¿No aparece? ID del catálogo
                  </label>
                  <input
                    id="catalogo_id"
                    name="catalogo_id"
                    inputMode="numeric"
                    required
                    placeholder="1347729337174599"
                    className="campo"
                  />
                  <span className="mt-1 block text-xs text-tinta-suave">
                    Está en Administrador de ventas → Catálogos, debajo del nombre.
                  </span>
                </div>
                <button className="boton">Usar este ID</button>
              </form>
            </div>
          )}

          {/* ───── 4. Conectado ───── */}
          {conectado && conexion && (
            <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-tinta-suave">Catálogo</dt>
                <dd className="font-medium">{conexion.catalogo_nombre}</dd>
              </div>
              <div>
                <dt className="text-tinta-suave">Negocio</dt>
                <dd className="font-medium">{conexion.negocio_nombre ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-tinta-suave">Cuenta de Facebook</dt>
                <dd className="font-medium">{conexion.usuario_meta ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-tinta-suave">Productos en Meta</dt>
                <dd className="font-medium">{enMeta ?? "—"}</dd>
              </div>
            </dl>
          )}

          {conectado && venceEn && diasRestantes !== null && (
            <p
              className={`mt-4 rounded-lg px-3 py-2 text-xs ${
                diasRestantes <= 10 ? "bg-peligro-suave text-peligro" : "bg-fondo text-tinta-suave"
              }`}
            >
              El permiso de Facebook vence el {fecha.format(venceEn)}
              {diasRestantes <= 10 ? " — reconectá antes de esa fecha para que no se corte." : "."}
            </p>
          )}

          {problema && (
            <p className="mt-3 rounded-lg bg-peligro-suave px-3 py-2 text-sm text-peligro">
              {problema} Probá reconectar.
            </p>
          )}

          {/* ───── Acciones cuando ya hay conexión ───── */}
          {appOk && conexion && (
            <div className="mt-5 flex flex-wrap gap-2 border-t border-borde pt-4">
              {(problema || (diasRestantes !== null && diasRestantes <= 10)) && (
                <a href="/api/meta/conectar" className="boton">
                  Reconectar
                </a>
              )}
              {conectado && (
                <form action={cambiarCatalogo}>
                  <button className="boton-secundario">Cambiar catálogo</button>
                </form>
              )}
              <form action={desconectar}>
                <button className="boton-secundario text-peligro">Desconectar</button>
              </form>
            </div>
          )}

          <p className="mt-4 text-xs text-tinta-suave">
            El acceso se guarda cifrado en el servidor: nunca se muestra en la página ni queda en el código.
          </p>
        </section>

        <section className="mt-4 rounded-2xl border border-borde bg-papel p-5">
          <h2 className="font-semibold">Productos</h2>
          <p className="mb-4 text-sm text-tinta-suave">Cómo están los productos respecto del catálogo de Meta.</p>
          <dl className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            {[
              { k: "pendiente", label: "Pendientes", color: "text-tinta" },
              { k: "enviando", label: "En camino", color: "text-acento" },
              { k: "sincronizado", label: "En Meta", color: "text-ok" },
              { k: "error", label: "Con error", color: "text-peligro" },
            ].map(({ k, label, color }) => (
              <div key={k} className="rounded-xl bg-fondo px-2 py-3">
                <dd className={`text-2xl font-bold ${color}`}>{cuenta[k as keyof typeof cuenta]}</dd>
                <dt className="text-xs text-tinta-suave">{label}</dt>
              </div>
            ))}
          </dl>
          {cuenta.enviando > 0 && (
            <p className="mt-3 text-xs text-tinta-suave">
              {cuenta.enviando} en camino: Meta los está procesando. Recargá en un rato para ver el resultado.
            </p>
          )}
          {!conectado && cuenta.pendiente + cuenta.error > 0 && (
            <p className="mt-3 text-xs text-tinta-suave">
              Los pendientes se van a enviar a Meta cuando la conexión esté lista.
            </p>
          )}
          {conectado && cuenta.pendiente + cuenta.error > 0 && (
            <form action={enviarPendientes} className="mt-4">
              <button className="boton">Enviar pendientes ({cuenta.pendiente + cuenta.error})</button>
            </form>
          )}

          {(conError ?? []).length > 0 && (
            <div className="mt-5 border-t border-borde pt-4">
              <h3 className="mb-2 text-sm font-semibold">Productos con error</h3>
              <ul className="space-y-2">
                {conError!.map((p) => (
                  <li key={p.id} className="rounded-xl bg-peligro-suave px-3 py-2 text-sm">
                    <a href={`/productos/${p.id}`} className="font-medium text-tinta hover:underline">
                      {p.nombre}
                    </a>
                    <span className="block text-xs text-peligro">{p.meta_error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* ───── Datos del negocio ───── */}
        <section className="mt-4 rounded-2xl border border-borde bg-papel p-5">
          <h2 className="font-semibold">Datos del negocio</h2>
          <p className="mb-4 text-sm text-tinta-suave">
            Cada producto en Meta lleva a su página pública, que tiene un botón para consultar por WhatsApp.
          </p>
          <form action={guardarAjustes} className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="whatsapp" className="etiqueta">WhatsApp del local</label>
              <input
                id="whatsapp"
                name="whatsapp"
                inputMode="numeric"
                defaultValue={ajustes?.whatsapp ?? ""}
                placeholder="5493811234567"
                className="campo"
              />
              <span className="mt-1 block text-xs text-tinta-suave">Con 549 + característica, sin 0 ni 15.</span>
            </div>
            <div>
              <label htmlFor="marca" className="etiqueta">Marca</label>
              <input id="marca" name="marca" defaultValue={ajustes?.marca ?? "Alaska Kids"} className="campo" />
            </div>
            <div className="sm:col-span-2">
              <button className="boton-secundario">Guardar datos</button>
            </div>
          </form>
        </section>
      </main>
    </Panel>
  );
}
