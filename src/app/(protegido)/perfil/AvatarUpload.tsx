"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

const TAMANHO_MAXIMO_BYTES = 2 * 1024 * 1024; // 2MB — "não muito grande"

export function AvatarUpload({
  userId,
  avatarUrlInicial,
}: {
  userId: string;
  avatarUrlInicial: string | null;
}) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(avatarUrlInicial);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function selecionarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    if (!arquivo.type.startsWith("image/")) {
      setErro("Só imagens (jpg, png, etc).");
      return;
    }
    if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
      setErro("Imagem muito grande — máximo 2MB.");
      return;
    }

    setErro(null);
    setEnviando(true);

    const extensao = arquivo.name.split(".").pop();
    const caminho = `${userId}/avatar.${extensao}`;

    const { error: erroUpload } = await supabase.storage
      .from("avatars")
      .upload(caminho, arquivo, { upsert: true });

    if (erroUpload) {
      setErro(erroUpload.message);
      setEnviando(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(caminho);
    // cache-bust pra não continuar mostrando a foto antiga em cache do navegador
    const urlComVersao = `${data.publicUrl}?v=${Date.now()}`;

    const { error: erroUpdate } = await supabase
      .from("perfis")
      .update({ avatar_url: urlComVersao })
      .eq("id", userId);

    if (erroUpdate) {
      setErro(erroUpdate.message);
      setEnviando(false);
      return;
    }

    setAvatarUrl(urlComVersao);
    setEnviando(false);
  }

  return (
    <div className="flex items-center gap-4">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-terciaria/10">
        {avatarUrl ? (
          <Image src={avatarUrl} alt="Foto de perfil" width={80} height={80} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-terciaria/50">
            sem foto
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={enviando}
          className="rounded-full border border-terciaria/30 px-3 py-1.5 text-xs font-medium text-terciaria disabled:opacity-50"
        >
          {enviando ? "Enviando..." : "Trocar foto"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={selecionarArquivo}
          className="hidden"
        />
        {erro && <span className="text-xs text-secundaria">{erro}</span>}
      </div>
    </div>
  );
}
