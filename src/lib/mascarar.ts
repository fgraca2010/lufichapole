/**
 * Máscaras LGPD para dados sensíveis exibidos a Professor/Admin sobre OUTRO
 * usuário (nunca aplicar quando o próprio dono do dado está vendo o próprio
 * cadastro — ver AGENTS.md / vault/_index.md, regra de LGPD).
 *
 * Uso: `mascararCpf(perfilDeOutraPessoa.cpf)`, não `mascararCpf(meuProprioCpf)`.
 */

export function mascararCpf(cpf: string | null): string {
  if (!cpf) return "—";
  const digitos = cpf.replace(/\D/g, "");
  if (digitos.length !== 11) return "•••.•••.•••-••";
  return `${digitos.slice(0, 3)}.***.***-${digitos.slice(-2)}`;
}

export function mascararTelefone(telefone: string | null): string {
  if (!telefone) return "—";
  const digitos = telefone.replace(/\D/g, "");
  if (digitos.length < 4) return "••••";
  return `(••) •••••-${digitos.slice(-4)}`;
}

export function mascararEndereco(endereco: string | null): string {
  if (!endereco) return "—";
  // Mostra só a primeira palavra (geralmente o tipo/nome da rua), esconde o resto.
  const primeiraPalavra = endereco.trim().split(/\s+/)[0];
  return `${primeiraPalavra} ••••••••`;
}

export function mascararDataNascimento(data: string | null): string {
  if (!data) return "—";
  // Mostra só o mês (relevante pra aniversariantes), esconde dia e ano.
  const partes = data.split("-");
  if (partes.length !== 3) return "••/••/••••";
  return `••/${partes[1]}/••••`;
}
