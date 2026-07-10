import { describe, expect, it } from "vitest";
import { loginUsouMetodoForte } from "@/lib/auth-2fa";

describe("loginUsouMetodoForte", () => {
  it("retorna false quando não há metodos (undefined/null)", () => {
    expect(loginUsouMetodoForte(undefined)).toBe(false);
    expect(loginUsouMetodoForte(null)).toBe(false);
  });

  it("retorna false quando o login foi só por senha", () => {
    expect(loginUsouMetodoForte([{ method: "password" }])).toBe(false);
  });

  it("retorna true quando o login foi por Google OAuth (amr 'oauth')", () => {
    expect(loginUsouMetodoForte([{ method: "oauth" }])).toBe(true);
  });

  it("retorna true quando o login foi por Passkey (amr 'passkey')", () => {
    expect(loginUsouMetodoForte([{ method: "passkey" }])).toBe(true);
  });

  it("retorna true se QUALQUER entrada da lista for um metodo forte", () => {
    expect(loginUsouMetodoForte([{ method: "password" }, { method: "oauth" }])).toBe(true);
  });

  it("retorna false pra lista vazia", () => {
    expect(loginUsouMetodoForte([])).toBe(false);
  });

  it("não confunde 'mfa/webauthn' (fator MFA nativo) com 'passkey' (login primario)", () => {
    expect(loginUsouMetodoForte([{ method: "mfa/webauthn" }])).toBe(false);
  });

  it("aceita tambem o formato RFC-8176 (array de strings, sem objeto)", () => {
    expect(loginUsouMetodoForte(["password"])).toBe(false);
    expect(loginUsouMetodoForte(["oauth"])).toBe(true);
    expect(loginUsouMetodoForte(["passkey"])).toBe(true);
  });
});
