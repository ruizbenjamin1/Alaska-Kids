import "server-only";
import type { Contacto } from "@/lib/flyer";
import { createClient } from "@/lib/supabase/server";

/** Datos de contacto que van en la imagen con precio (WhatsApp, Instagram y página de Facebook conectados). */
export async function obtenerContacto(): Promise<Contacto> {
  const supabase = await createClient();
  const [{ data: ajustes }, { data: conexion }] = await Promise.all([
    supabase.from("ajustes").select("marca, whatsapp").eq("id", 1).maybeSingle(),
    supabase.from("meta_conexion").select("ig_usuario, pagina_nombre").eq("id", 1).maybeSingle(),
  ]);
  return {
    marca: (ajustes?.marca as string | null) || "Alaska Kids",
    whatsapp: (ajustes?.whatsapp as string | null) ?? null,
    instagram: (conexion?.ig_usuario as string | null) ?? null,
    facebook: (conexion?.pagina_nombre as string | null) ?? null,
  };
}
