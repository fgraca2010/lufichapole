export function validarComplexidadeSenha(senha: string): string[] {
  const problemas: string[] = [];

  if (senha.length < 8) problemas.push("mínimo de 8 caracteres");
  if (!/[a-z]/.test(senha)) problemas.push("pelo menos uma letra minúscula");
  if (!/[A-Z]/.test(senha)) problemas.push("pelo menos uma letra maiúscula");
  if (!/[0-9]/.test(senha)) problemas.push("pelo menos um número");
  if (!/[^a-zA-Z0-9]/.test(senha)) problemas.push("pelo menos um símbolo (ex: ! @ # $ %)");

  return problemas;
}
