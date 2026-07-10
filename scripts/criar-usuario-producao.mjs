// Cria um usuário real em produção com senha temporária gerada
// aleatoriamente (não escolhida por ninguém) — pensado pra provisionamento
// pontual feito pelo Admin/consultor, com o usuário trocando a senha no
// primeiro login.
//
// Uso:
//   EMAIL=... NOME=... PERSONA=admin|professor|aluno NASCIMENTO=AAAA-MM-DD \
//     node scripts/criar-usuario-producao.mjs

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { randomInt } from "node:crypto";

function carregarEnvLocal() {
  const conteudo = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const linha of conteudo.split("\n")) {
    const m = linha.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
carregarEnvLocal();

function gerarSenhaTemporaria() {
  const minusculas = "abcdefghjkmnpqrstuvwxyz";
  const maiusculas = "ABCDEFGHJKMNPQRSTUVWXYZ";
  const numeros = "23456789";
  const simbolos = "!@#$%&*?";
  const todos = minusculas + maiusculas + numeros + simbolos;

  const pick = (alfabeto) => alfabeto[randomInt(alfabeto.length)];

  const obrigatorios = [pick(minusculas), pick(maiusculas), pick(numeros), pick(simbolos)];
  const resto = Array.from({ length: 8 }, () => pick(todos));
  const senha = [...obrigatorios, ...resto];

  // embaralha
  for (let i = senha.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [senha[i], senha[j]] = [senha[j], senha[i]];
  }
  return senha.join("");
}

const { EMAIL, NOME, PERSONA, NASCIMENTO } = process.env;
if (!EMAIL || !NOME || !PERSONA) {
  console.error("Faltam EMAIL, NOME e/ou PERSONA.");
  process.exit(1);
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const senhaTemporaria = gerarSenhaTemporaria();

const { data, error } = await admin.auth.admin.createUser({
  email: EMAIL,
  password: senhaTemporaria,
  email_confirm: true,
  user_metadata: { persona: PERSONA, nome_completo: NOME },
});

if (error) {
  console.error("Erro ao criar usuário:", error.message);
  process.exit(1);
}

if (NASCIMENTO) {
  const { error: erroUpdate } = await admin
    .from("perfis")
    .update({ data_nascimento: NASCIMENTO })
    .eq("id", data.user.id);
  if (erroUpdate) {
    console.error("Usuário criado, mas falhou ao salvar data de nascimento:", erroUpdate.message);
  }
}

console.log("RESULTADO");
console.log("email:", EMAIL);
console.log("persona:", PERSONA);
console.log("senha_temporaria:", senhaTemporaria);
