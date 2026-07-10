"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { validarComplexidadeSenha } from "@/lib/senha";

export default function RedefinirSenhaPage() {
  const supabase = createClient();
  const router = useRouter();
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [pending, startTransition] = useTransition();

  const problemas = novaSenha ? validarComplexidadeSenha(novaSenha) : [];

  function confirmar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (problemas.length > 0) {
      setErro(`A senha precisa ter: ${problemas.join(", ")}.`);
      return;
    }
    if (novaSenha !== confirmacao) {
      setErro("As duas senhas não são iguais.");
      return;
    }

    startTransition(async () => {
      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) {
        setErro(
          "Não foi possível redefinir. O link pode ter expirado — peça um novo em 'Esqueci minha senha'."
        );
        return;
      }
      setSucesso(true);
      setTimeout(() => router.replace("/login"), 3000);
    });
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
      <Image src="/logo-lu-fortuna.png" alt="Lu Fortuna Polesport" width={120} height={120} />

      {sucesso ? (
        <p className="max-w-sm text-center text-sm text-black">
          Senha alterada com sucesso! Te levando pro login...
        </p>
      ) : (
        <form onSubmit={confirmar} className="flex w-full max-w-sm flex-col gap-4">
          <h1 className="text-center text-lg font-semibold text-black">
            Crie uma senha nova
          </h1>
          <input
            type="password"
            placeholder="Nova senha"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            required
            autoComplete="new-password"
            className="rounded-md border border-terciaria/30 px-3 py-2"
          />
          <input
            type="password"
            placeholder="Confirmar nova senha"
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
            required
            autoComplete="new-password"
            className="rounded-md border border-terciaria/30 px-3 py-2"
          />
          <p className="text-xs text-terciaria/70">
            Mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo.
          </p>
          {erro && <p className="text-sm text-secundaria">{erro}</p>}
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-primaria px-4 py-2 font-medium text-primaria-texto disabled:opacity-50"
          >
            Salvar nova senha
          </button>
        </form>
      )}
    </div>
  );
}
