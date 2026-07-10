import Image from "next/image";
import { entrarComSenha, entrarComOAuth } from "./actions";
import { PasskeyLoginButton } from "./PasskeyLoginButton";
import { CampoSenha } from "@/components/CampoSenha";
import { GoogleLogo } from "@/components/GoogleLogo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; proximo?: string }>;
}) {
  const { erro, proximo = "/" } = await searchParams;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
      <Image src="/logo-lu-fortuna.png" alt="Lu Fortuna Polesport" width={140} height={140} />

      <form action={entrarComSenha} className="flex w-full max-w-sm flex-col gap-4">
        <input type="hidden" name="proximo" value={proximo} />

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium text-terciaria">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="rounded-md border border-terciaria/30 px-3 py-2"
          />
        </div>

        <div className="flex flex-col gap-1">
          <CampoSenha name="senha" label="Senha" autoComplete="current-password" />
          <a href="/esqueci-senha" className="self-end text-xs text-terciaria underline">
            Esqueci minha senha
          </a>
        </div>

        {erro && <p className="text-sm text-secundaria">{erro}</p>}

        <button
          type="submit"
          className="rounded-full bg-primaria px-4 py-2 font-medium text-primaria-texto"
        >
          Entrar
        </button>

        <div className="flex items-center gap-2 text-xs text-terciaria/60">
          <span className="h-px flex-1 bg-terciaria/20" />
          ou
          <span className="h-px flex-1 bg-terciaria/20" />
        </div>

        <button
          type="submit"
          formNoValidate
          formAction={async () => {
            "use server";
            await entrarComOAuth("google");
          }}
          className="flex items-center justify-center gap-2 rounded-full border border-terciaria/30 px-4 py-2 font-medium text-terciaria"
        >
          <GoogleLogo />
          Entrar com Google
        </button>
      </form>

      <PasskeyLoginButton proximo={proximo} />

      <p className="max-w-sm text-center text-xs text-terciaria/60">
        Não tem uma conta? Fale com a administração da Lu Fortuna Polesport —
        o cadastro é feito por convite.
      </p>
    </div>
  );
}
