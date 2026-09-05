import { describe, expect, it } from "vitest";
import { getNavigationGroups } from "@/components/navigation";

describe("navegação CRM", () => {
  it("esconde módulos futuros quando preview está desligado", () => {
    const labels = getNavigationGroups(false).flatMap((group) => group.items.map((item) => item.label));
    expect(labels).toContain("Visão geral");
    expect(labels).toContain("Leads");
    expect(labels).toContain("Inbox");
    expect(labels).toContain("Custos");
    expect(labels).not.toContain("Pipeline");
    expect(labels).not.toContain("Oportunidades");
  });

  it("mostra arquitetura completa em preview", () => {
    const labels = getNavigationGroups(true).flatMap((group) => group.items.map((item) => item.label));
    expect(labels).toContain("Pipeline");
    expect(labels).toContain("Oportunidades");
    expect(labels).toContain("Empresas");
    expect(labels).toContain("Funil");
  });
});
