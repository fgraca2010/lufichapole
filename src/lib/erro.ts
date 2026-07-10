/**
 * Extrai uma mensagem de erro segura pra mostrar ao usuário. Alguns erros do
 * Supabase Auth (principalmente os das APIs experimentais de Passkey/WebAuthn)
 * podem ter `.message` vazio, "{}" ou um objeto — nunca mostrar isso direto
 * na tela.
 */
export function mensagemErro(
  erro: unknown,
  fallback = "Ocorreu um erro. Tente de novo."
): string {
  if (!erro) return fallback;

  const mensagem =
    typeof erro === "string"
      ? erro
      : erro instanceof Error
        ? erro.message
        : typeof erro === "object" && "message" in erro
          ? String((erro as { message?: unknown }).message ?? "")
          : "";

  const invalida =
    !mensagem ||
    mensagem.trim() === "" ||
    mensagem.trim() === "{}" ||
    mensagem.trim() === "[object Object]";

  return invalida ? fallback : mensagem;
}
