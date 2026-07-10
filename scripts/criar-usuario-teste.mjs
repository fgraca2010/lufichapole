// Cria um usuário de teste diretamente (sem enviar e-mail de convite) — útil
// pra QA manual. NÃO usar em produção real além de dados de teste explícitos.
//
// Uso:
//   PERSONA=aluno EMAIL=... PASSWORD=... NOME=... [PROFESSOR_ID=...] \
//     node scripts/criar-usuario-teste.mjs

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

function carregarEnvLocal() {
  const conteudo = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const linha of conteudo.split("\n")) {
    const m = linha.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
carregarEnvLocal();

const { PERSONA, EMAIL, PASSWORD, NOME, PROFESSOR_ID } = process.env;
if (!PERSONA || !EMAIL || !PASSWORD || !NOME) {
  console.error("Faltam PERSONA, EMAIL, PASSWORD e/ou NOME.");
  process.exit(1);
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const metadata = { persona: PERSONA, nome_completo: NOME };
if (PROFESSOR_ID) metadata.professor_id = PROFESSOR_ID;

const { data, error } = await admin.auth.admin.createUser({
  email: EMAIL,
  password: PASSWORD,
  email_confirm: true,
  user_metadata: metadata,
});

if (error) {
  console.error("Erro:", error.message);
  process.exit(1);
}

console.log("Criado. id:", data.user.id, "email:", data.user.email, "persona:", PERSONA);
