"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PasskeyItem = {
  id: string;
  friendly_name?: string;
  created_at: string;
  last_used_at?: string;
};

export function PasskeyManager() {
  const supabase = createClient();
  const [suportado] = useState(
    () => typeof window !== "undefined" && !!window.PublicKeyCredential
  );
  const [passkeys, setPasskeys] = useState<PasskeyItem[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function carregar() {
    const { data, error } = await supabase.auth.passkey.list();
    if (error) {
      setErro(error.message);
      return;
    }
    setPasskeys(data ?? []);
  }

  useEffect(() => {
    if (!suportado) return;
    // Falso positivo: o setState (dentro de carregar()) acontece depois de
    // um await, não sincronamente no efeito.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cadastrar() {
    setErro(null);
    setPending(true);
    const { error } = await supabase.auth.registerPasskey();
    if (error) {
      setErro(error.message);
    } else {
      await carregar();
    }
    setPending(false);
  }

  async function remover(id: string) {
    setErro(null);
    setPending(true);
    const { error } = await supabase.auth.passkey.delete({ passkeyId: id });
    if (error) {
      setErro(error.message);
    } else {
      await carregar();
    }
    setPending(false);
  }

  if (!suportado) return null;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-terciaria/10 p-4">
      <h2 className="text-sm font-semibold text-terciaria">
        Login por biometria (Face ID / Touch ID / Windows Hello)
      </h2>
      <p className="text-xs text-terciaria/70">
        Ative pra entrar neste dispositivo sem digitar a senha, usando sua
        digital ou reconhecimento facial.
      </p>

      {(passkeys ?? []).map((p) => (
        <div key={p.id} className="flex items-center justify-between text-sm">
          <span className="text-black">
            {p.friendly_name || "Dispositivo"} — cadastrado em{" "}
            {new Date(p.created_at).toLocaleDateString("pt-BR")}
          </span>
          <button
            disabled={pending}
            onClick={() => remover(p.id)}
            className="text-xs text-secundaria underline disabled:opacity-40"
          >
            Remover
          </button>
        </div>
      ))}

      <button
        onClick={cadastrar}
        disabled={pending}
        className="self-start rounded-full bg-primaria px-4 py-1.5 text-xs font-medium text-primaria-texto disabled:opacity-50"
      >
        Ativar biometria neste dispositivo
      </button>

      {erro && <p className="text-xs text-secundaria">{erro}</p>}
    </div>
  );
}
