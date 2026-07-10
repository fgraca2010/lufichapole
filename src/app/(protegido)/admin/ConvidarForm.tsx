"use client";

import { useRef, useState, useTransition } from "react";

export function ConvidarForm({
  action,
  professores,
}: {
  action: (formData: FormData) => Promise<{ erro: string | null }>;
  professores?: { id: string; nome_completo: string }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  function enviar(formData: FormData) {
    setErro(null);
    setSucesso(false);
    startTransition(async () => {
      const r = await action(formData);
      if (r.erro) setErro(r.erro);
      else {
        setSucesso(true);
        formRef.current?.reset();
      }
    });
  }

  return (
    <form ref={formRef} action={enviar} className="flex flex-wrap items-end gap-2 text-sm">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-terciaria">Nome completo</label>
        <input name="nome_completo" required className="rounded border border-terciaria/20 px-2 py-1" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-terciaria">E-mail</label>
        <input name="email" type="email" required className="rounded border border-terciaria/20 px-2 py-1" />
      </div>
      {professores && (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-terciaria">Professor</label>
          <select name="professor_id" className="rounded border border-terciaria/20 px-2 py-1">
            <option value="">— sem vínculo ainda —</option>
            {professores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome_completo}
              </option>
            ))}
          </select>
        </div>
      )}
      <button
        disabled={pending}
        className="rounded-full bg-primaria px-4 py-1.5 font-medium text-primaria-texto disabled:opacity-50"
      >
        Convidar
      </button>
      {erro && <span className="text-xs text-secundaria">{erro}</span>}
      {sucesso && <span className="text-xs text-primaria">Convite enviado!</span>}
    </form>
  );
}
