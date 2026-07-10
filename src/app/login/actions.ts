"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function entrarComSenha(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const senha = String(formData.get("senha") ?? "");
  const proximo = String(formData.get("proximo") ?? "/");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error) {
    redirect(`/login?erro=${encodeURIComponent(error.message)}&proximo=${encodeURIComponent(proximo)}`);
  }

  redirect(proximo);
}

export async function entrarComOAuth(provider: "google") {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error || !data?.url) {
    redirect(`/login?erro=${encodeURIComponent(error?.message ?? "Falha ao iniciar login social")}`);
  }

  redirect(data.url);
}
