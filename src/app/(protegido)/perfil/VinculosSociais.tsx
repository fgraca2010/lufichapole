"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Identidade = { id: string; provider: string; identity_id: string };

const ROTULOS: Record<string, string> = {
  email: "E-mail e senha",
  google: "Google",
  azure: "Microsoft",
};

export function VinculosSociais() {
  const supabase = createClient();
  const [identidades, setIdentidades] = useState<Identidade[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState<string | null>(null);

  async function carregar() {
    const { data, error } = await supabase.auth.getUserIdentities();
    if (error) {
      setErro(error.message);
      return;
    }
    setIdentidades(data?.identities ?? []);
  }

  useEffect(() => {
    // Falso positivo: o setState acontece depois de um await (async), não
    // sincronamente no efeito.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function conectar(provider: "google" | "azure") {
    setErro(null);
    setCarregando(provider);
    const { data, error } = await supabase.auth.linkIdentity({
      provider,
      options: {
        redirectTo: `${window.location.origin}/perfil`,
      },
    });
    if (error) {
      setErro(error.message);
      setCarregando(null);
      return;
    }
    if (data?.url) {
      // eslint-disable-next-line react-hooks/immutability -- navegação real de página, não é estado do React.
      window.location.href = data.url;
    }
  }

  async function desconectar(identidade: Identidade) {
    setErro(null);
    setCarregando(identidade.provider);
    // @ts-expect-error - a tipagem do supabase-js pede o objeto completo de UserIdentity
    const { error } = await supabase.auth.unlinkIdentity(identidade);
    if (error) {
      setErro(error.message);
    } else {
      await carregar();
    }
    setCarregando(null);
  }

  if (!identidades) return null;

  const conectados = new Map(identidades.map((i) => [i.provider, i]));
  const podeDesconectar = identidades.length > 1;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-terciaria/10 p-4">
      <h2 className="text-sm font-semibold text-terciaria">Login vinculado</h2>

      {(["email", "google", "azure"] as const).map((provider) => {
        const identidade = conectados.get(provider);
        return (
          <div key={provider} className="flex items-center justify-between text-sm">
            <span className="text-black">{ROTULOS[provider]}</span>
            {identidade ? (
              provider === "email" ? (
                <span className="text-xs text-primaria">Conectado</span>
              ) : (
                <button
                  disabled={!podeDesconectar || carregando === provider}
                  onClick={() => desconectar(identidade)}
                  title={!podeDesconectar ? "Precisa manter pelo menos um jeito de entrar" : undefined}
                  className="text-xs text-secundaria underline disabled:opacity-40"
                >
                  Desconectar
                </button>
              )
            ) : (
              <button
                disabled={carregando === provider}
                onClick={() => conectar(provider as "google" | "azure")}
                className="text-xs text-primaria underline disabled:opacity-40"
              >
                Conectar
              </button>
            )}
          </div>
        );
      })}

      {erro && <p className="text-xs text-secundaria">{erro}</p>}
    </div>
  );
}
