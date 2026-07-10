"use client";

import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { enviarCodigoEmail, confirmarCodigoEmail } from "./actions";

export default function VerificarMfaPage() {
  return (
    <Suspense>
      <VerificarMfaConteudo />
    </Suspense>
  );
}

function VerificarMfaConteudo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const proximo = searchParams.get("proximo") ?? "/";

  const [enviado, setEnviado] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function enviar() {
    setErro(null);
    startTransition(async () => {
      const r = await enviarCodigoEmail();
      if (r.erro) setErro(r.erro);
      else setEnviado(true);
    });
  }

  function confirmar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    startTransition(async () => {
      const r = await confirmarCodigoEmail(codigo);
      if (r.erro) setErro(r.erro);
      else {
        router.replace(proximo);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <h1 className="text-xl font-semibold text-black">
        Verificação em duas etapas
      </h1>

      {!enviado ? (
        <>
          <p className="max-w-sm text-sm text-terciaria">
            Por segurança, vamos mandar um código de 6 dígitos pro seu e-mail
            cadastrado.
          </p>
          <button
            onClick={enviar}
            disabled={pending}
            className="rounded-full bg-primaria px-4 py-2 font-medium text-primaria-texto disabled:opacity-50"
          >
            Enviar código
          </button>
        </>
      ) : (
        <>
          <p className="max-w-sm text-sm text-terciaria">
            Digite o código que chegou no seu e-mail.
          </p>
          <form onSubmit={confirmar} className="flex w-full max-w-xs flex-col gap-3">
            <input
              type="text"
              inputMode="numeric"
              placeholder="Código de 6 dígitos"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              required
              autoFocus
              className="rounded-md border border-terciaria/30 px-3 py-2 text-center"
            />
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-primaria px-4 py-2 font-medium text-primaria-texto disabled:opacity-50"
            >
              Confirmar
            </button>
          </form>
          <button onClick={enviar} disabled={pending} className="text-xs text-terciaria underline">
            Reenviar código
          </button>
        </>
      )}

      {erro && <p className="text-sm text-secundaria">{erro}</p>}
    </div>
  );
}
