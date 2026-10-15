"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function BotonSalir() {
  const router = useRouter();

  async function salir() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button onClick={salir} className="text-sm text-tinta-suave hover:text-tinta">
      Salir
    </button>
  );
}
