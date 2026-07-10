import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { FichaPdfDocument } from "./FichaPdfDocument";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ nivel: string }> }
) {
  const { nivel } = await params;
  const nivelNumero = Number(nivel);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome_completo, persona, professor_id")
    .eq("id", user.id)
    .single();

  if (perfil?.persona !== "aluno") {
    return NextResponse.json({ erro: "Só o aluno pode baixar a própria ficha" }, { status: 403 });
  }

  const { data: professor } = perfil.professor_id
    ? await supabase
        .from("perfis")
        .select("nome_completo")
        .eq("id", perfil.professor_id)
        .single()
    : { data: null };

  const [{ data: nivelRow }, { data: config }, { data: status }, logoResp] = await Promise.all([
    supabase
      .from("niveis")
      .select("numero, blocos(numero, movimentos(id, nome, categoria, ativo, ordem))")
      .eq("numero", nivelNumero)
      .single(),
    supabase.from("configuracao_sistema").select("sucessos_necessarios").single(),
    supabase
      .from("aluno_movimento_status")
      .select("movimento_id, status, sucessos_consecutivos")
      .eq("aluno_id", user.id),
    fetch(`${new URL(request.url).origin}/logo-lu-fortuna.png`),
  ]);

  if (!nivelRow) {
    return NextResponse.json({ erro: "Nível não encontrado" }, { status: 404 });
  }

  const logoBuffer = Buffer.from(await logoResp.arrayBuffer());
  const logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  const statusPorMovimento = new Map((status ?? []).map((s) => [s.movimento_id, s]));
  const necessarios = config?.sucessos_necessarios ?? 4;

  const blocos = (nivelRow.blocos ?? [])
    .slice()
    .sort((a, b) => a.numero - b.numero)
    .map((bloco) => ({
      numero: bloco.numero,
      movimentos: (bloco.movimentos ?? [])
        .filter((m) => m.ativo)
        .sort((a, b) => a.ordem - b.ordem)
        .map((mov) => {
          const s = statusPorMovimento.get(mov.id);
          return {
            id: mov.id,
            nome: mov.nome,
            categoria: mov.categoria,
            sucessosConsecutivos: s?.sucessos_consecutivos ?? 0,
            aprovado: s?.status === "aprovado",
          };
        }),
    }));

  const pdfBuffer = await renderToBuffer(
    FichaPdfDocument({
      logoBase64,
      nivelNumero,
      nomeAluno: perfil.nome_completo,
      nomeProfessor: professor?.nome_completo ?? null,
      sucessosNecessarios: necessarios,
      blocos,
      geradoEm: new Date().toLocaleDateString("pt-BR"),
    })
  );

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ficha-nivel-${nivelNumero}.pdf"`,
    },
  });
}
