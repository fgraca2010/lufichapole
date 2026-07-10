import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

describe("Home", () => {
  it("mostra a marca Lu Fortuna Polesport", () => {
    render(<Home />);
    expect(
      screen.getByText(/Fichas de evolução — Lu Fortuna Polesport/i)
    ).toBeInTheDocument();
  });

  it("mostra o status de desenvolvimento", () => {
    render(<Home />);
    expect(screen.getByText(/Em desenvolvimento/i)).toBeInTheDocument();
  });
});
