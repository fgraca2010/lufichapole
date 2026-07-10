"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function PasskeyLoginButton({ proximo }: { proximo: string }) {
  const supabase = createClient();
  const router = useRouter();
  // Começa false (igual no servidor e no 1º render do cliente, evita
  // mismatch de hidratação) e só liga depois de montado, se o navegador
  // suportar — o botão aparece com um leve atraso, o que é esperado aqui.
  const [suportado, setSuportado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    // Detecção de recurso do navegador só pode rodar no cliente — precisa
    // ser um efeito mesmo (não dá pra calcular na primeira renderização sem
    // causar mismatch de hidratação entre servidor e cliente).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSuportado(typeof window !== "undefined" && !!window.PublicKeyCredential);
  }, []);

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
