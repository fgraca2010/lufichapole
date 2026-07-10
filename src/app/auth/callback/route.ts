import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Callback do OAuth (Google/Microsoft) — troca o código pela sessão.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const proximo = searchParams.get("proximo") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${proximo}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?erro=Falha+no+login+social`);
}
