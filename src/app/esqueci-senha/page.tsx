"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { enviarLinkRedefinicao } from "./actions";

export default function EsqueciSenhaPage() {
  const [enviado, setEnviado] = useState(false);
  const [pending, startTransition] = useTransition();

  function enviar(formData: FormData) {
    startTransition(async () => {
      await enviarLinkRedefinicao(formData);
      setEnviado(true);
    });
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
      <Image src="/logo-lu-fortuna.png" alt="Lu Fortuna Polesport" width={120} height={120} />

      {enviado ? (
        <div className="max-w-sm text-center text-sm text-terciaria">
          <p className="text-black">
            Se esse e-mail estiver cadastrado, você vai receber um link pra
            redefinir a senha em alguns minutos.
          </p>
          <p className="mt-2">
            Se não foi você que pediu, pode ignorar o e-mail — nada muda na
            sua conta.
          </p>
          <a href="/login" className="mt-4 inline-block text-primaria underline">
            Voltar pro login
          </a>
        </div>
      ) : (
        <form action={enviar} className="flex w-full max-w-sm flex-col gap-4">
          <h1 className="text-center text-lg font-semibold text-black">
            Esqueci minha senha
          </h1>
          <p className="text-center text-sm text-terciaria">
            Digite seu e-mail cadastrado e mandamos um link pra você criar uma
            senha nova.
          </p>
          <input
            name="email"
            type="email"
            required
            placeholder="seu@email.com"
            className="rounded-md border border-terciaria/30 px-3 py-2"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-primaria px-4 py-2 font-medium text-primaria-texto disabled:opacity-50"
          >
            Enviar link
          </button>
          <a href="/login" className="text-center text-sm text-terciaria underline">
            Voltar
          </a>
        </form>
      )}
    </div>
  );
}
