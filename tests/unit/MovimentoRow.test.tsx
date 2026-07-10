import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MovimentoRow } from "@/app/(protegido)/aluno/MovimentoRow";

vi.mock("@/app/(protegido)/aluno/actions", () => ({
  registrarTentativa: vi.fn(async () => ({ erro: null })),
}));

describe("MovimentoRow", () => {
  it("mostra o nome e a categoria do movimento", () => {
    render(
      <MovimentoRow
        movimentoId={1}
        nome="Body Position"
        categoria="A"
        status="em_andamento"
        sucessosConsecutivos={2}
        sucessosNecessarios={4}
      />
    );
    expect(screen.getByText("Body Position")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText(/Em andamento/)).toBeInTheDocument();
    expect(screen.getByText(/2\/4/)).toBeInTheDocument();
  });

  it("mostra botões de sucesso/erro quando não está aprovado", () => {
    render(
      <MovimentoRow
        movimentoId={1}
        nome="Body Position"
        categoria="A"
        status="pendente_avaliacao"
        sucessosConsecutivos={4}
        sucessosNecessarios={4}
      />
    );
    expect(screen.getByTitle("Registrar sucesso")).toBeInTheDocument();
    expect(screen.getByTitle("Registrar erro")).toBeInTheDocument();
    expect(screen.getByText(/Aguardando avaliação do professor/)).toBeInTheDocument();
  });

  it("esconde os botões quando o movimento já está aprovado", () => {
    render(
      <MovimentoRow
        movimentoId={1}
        nome="Body Position"
        categoria="A"
        status="aprovado"
        sucessosConsecutivos={4}
        sucessosNecessarios={4}
      />
    );
    expect(screen.queryByTitle("Registrar sucesso")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Registrar erro")).not.toBeInTheDocument();
    expect(screen.getByText("Aprovado")).toBeInTheDocument();
  });
});
