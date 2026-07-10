// Cria (ou atualiza) o primeiro usuário Admin do sistema — só deve ser
// necessário uma vez, pra sair do problema do "ovo e a galinha" (Admin é quem
// convida todo mundo, mas precisa existir um primeiro Admin).
//
// Uso (nenhum valor fica salvo em arquivo):
//   ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_NOME=... ADMIN_NASCIMENTO=AAAA-MM-DD \
//     node scripts/bootstrap-admin.mjs
//
// Lê NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY do .env.local.

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

const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NOME, ADMIN_NASCIMENTO } = process.env;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_NOME) {
  console.error("Faltam ADMIN_EMAIL, ADMIN_PASSWORD e/ou ADMIN_NOME.");
  process.exit(1);
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const { data, error } = await admin.auth.admin.createUser({
  email: ADMIN_EMAIL,
  password: ADMIN_PASSWORD,
  email_confirm: true,
  user_metadata: { persona: "admin", nome_completo: ADMIN_NOME },
});

if (error) {
  console.error("Erro ao criar usuário:", error.message);
  process.exit(1);
}

if (ADMIN_NASCIMENTO) {
  const { error: erroUpdate } = await admin
    .from("perfis")
    .update({ data_nascimento: ADMIN_NASCIMENTO })
    .eq("id", data.user.id);
  if (erroUpdate) {
    console.error("Usuário criado, mas falhou ao salvar data de nascimento:", erroUpdate.message);
  }
}

console.log("Admin criado com sucesso. id:", data.user.id, "email:", data.user.email);
console.log("A senha NÃO será exibida de novo — faça login e configure o autenticador (2FA) já na primeira vez.");
