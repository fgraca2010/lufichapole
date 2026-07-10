"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function PasskeyLoginButton({ proximo }: { proximo: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [suportado] = useState(
    () => typeof window !== "undefined" && !!window.PublicKeyCredential
  );
  const [erro, setErro] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function entrar() {
    setErro(null);
    setPending(true);
    const { error } = await supabase.auth.signInWithPasskey();
    if (error) {
      setErro("Não deu pra entrar com biometria. Use e-mail e senha.");
      setPending(false);
      return;
    }
    router.replace(proximo);
    router.refresh();
  }

  if (!suportado) return null;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={entrar}
        disabled={pending}
        className="rounded-full border border-terciaria/30 px-4 py-2 font-medium text-terciaria disabled:opacity-50"
      >
        🔒 Entrar com biometria
      </button>
      {erro && <p className="text-center text-xs text-secundaria">{erro}</p>}
    </div>
  );
}
