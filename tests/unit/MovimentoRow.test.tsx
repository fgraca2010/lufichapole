import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MovimentoRow } from "@/app/(protegido)/MovimentoRow";

vi.mock("@/app/(protegido)/professor/actions", () => ({
  registrarTentativaProfessor: vi.fn(async () => ({ erro: null })),
  reiniciarMovimentoProfessor: vi.fn(async () => ({ erro: null })),
  avaliarMovimento: vi.fn(async () => ({ erro: null })),
}));

vi.mock("@/app/(protegido)/actions", () => ({
  listarSucessosMovimento: vi.fn(async () => ({ erro: null, datas: ["2026-08-01T10:00:00Z"] })),
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

  it("sem controlesProfessor (visão do aluno): não mostra nenhum botão de ação, mesmo sem estar aprovado", () => {
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
    expect(screen.queryByTitle("Registrar sucesso")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Registrar erro")).not.toBeInTheDocument();
    expect(screen.queryByText("Confirmar")).not.toBeInTheDocument();
    expect(screen.queryByText("Recomeçar")).not.toBeInTheDocument();
    expect(screen.getByText(/Aguardando avaliação/)).toBeInTheDocument();
  });

  it("com controlesProfessor: mostra botões de sucesso/erro quando não está aprovado", () => {
    render(
      <MovimentoRow
        movimentoId={1}
        nome="Body Position"
        categoria="A"
        status="em_andamento"
        sucessosConsecutivos={2}
        sucessosNecessarios={4}
        controlesProfessor={{ alunoId: "aluno-1" }}
      />
    );
    expect(screen.getByTitle("Registrar sucesso")).toBeInTheDocument();
    expect(screen.getByTitle("Registrar erro")).toBeInTheDocument();
  });

  it("com controlesProfessor e pendente_avaliacao: mostra sucesso/erro E confirmar/treinar de novo", () => {
    render(
      <MovimentoRow
        movimentoId={1}
        nome="Body Position"
        categoria="A"
        status="pendente_avaliacao"
        sucessosConsecutivos={4}
        sucessosNecessarios={4}
        controlesProfessor={{ alunoId: "aluno-1" }}
      />
    );
    expect(screen.getByTitle("Registrar sucesso")).toBeInTheDocument();
    expect(screen.getByTitle("Registrar erro")).toBeInTheDocument();
    expect(screen.getByText("Confirmar")).toBeInTheDocument();
    expect(screen.getByText("Treinar de novo")).toBeInTheDocument();
  });

  it("esconde os botões de marcar quando o movimento já está aprovado (com ou sem controlesProfessor)", () => {
    render(
      <MovimentoRow
        movimentoId={1}
        nome="Body Position"
        categoria="A"
        status="aprovado"
        sucessosConsecutivos={4}
        sucessosNecessarios={4}
        controlesProfessor={{ alunoId: "aluno-1" }}
      />
    );
    expect(screen.queryByTitle("Registrar sucesso")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Registrar erro")).not.toBeInTheDocument();
    expect(screen.getByText("Aprovado")).toBeInTheDocument();
  });

  it("com controlesProfessor: mostra aviso de perda de aprovação antes de confirmar o reinício", async () => {
    const user = userEvent.setup();
    render(
      <MovimentoRow
        movimentoId={1}
        nome="Body Position"
        categoria="A"
        status="aprovado"
        sucessosConsecutivos={4}
        sucessosNecessarios={4}
        controlesProfessor={{ alunoId: "aluno-1" }}
      />
    );

    await user.click(screen.getByText("Recomeçar"));

    expect(screen.getByText(/perde a aprovação/)).toBeInTheDocument();
    expect(screen.getByText("Sim, recomeçar")).toBeInTheDocument();
    expect(screen.getByText("Cancelar")).toBeInTheDocument();
  });

  it("sem controlesProfessor: não mostra o botão de Recomeçar mesmo aprovado", () => {
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
    expect(screen.queryByText("Recomeçar")).not.toBeInTheDocument();
  });

  it("aprovado com aprovadoEm: mostra a data logo abaixo do texto Aprovado", () => {
    render(
      <MovimentoRow
        movimentoId={1}
        nome="Body Position"
        categoria="A"
        status="aprovado"
        sucessosConsecutivos={4}
        sucessosNecessarios={4}
        aprovadoEm="2026-08-01T10:00:00Z"
      />
    );
    expect(screen.getByText("Aprovado")).toBeInTheDocument();
    expect(screen.getByText(/^em /)).toBeInTheDocument();
  });

  it("clicar no badge amarelo expande e mostra as datas dos sucessos da sequência atual", async () => {
    const user = userEvent.setup();
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

    expect(screen.queryByText(/✓ /)).not.toBeInTheDocument();

    await user.click(screen.getByTitle("Ver as datas dos sucessos desta sequência"));

    expect(await screen.findByText(/✓ /)).toBeInTheDocument();
  });
});
