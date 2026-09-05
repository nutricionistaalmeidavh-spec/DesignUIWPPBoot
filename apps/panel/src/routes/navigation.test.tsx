import { describe, expect, it } from "vitest";
import { getNavigationGroups } from "@/components/navigation";

describe("navegação CRM", () => {
  it("esconde módulos que a API não anunciou", () => {
    const labels = getNavigationGroups({
      opportunities: false,
      companies: false,
      campaigns: false,
    }).flatMap((group) => group.items.map((item) => item.label));

    expect(labels).toContain("Visão geral");
    expect(labels).toContain("Leads");
    expect(labels).toContain("Inbox");
    expect(labels).toContain("Custos");
    expect(labels).not.toContain("Pipeline");
    expect(labels).not.toContain("Oportunidades");
    expect(labels).not.toContain("Empresas");
    expect(labels).not.toContain("Campanhas");
  });

  it("mostra somente os módulos CRM anunciados", () => {
    const labels = getNavigationGroups({
      opportunities: true,
      companies: false,
      campaigns: true,
    }).flatMap((group) => group.items.map((item) => item.label));

    expect(labels).toContain("Pipeline");
    expect(labels).toContain("Oportunidades");
    expect(labels).toContain("Campanhas");
    expect(labels).not.toContain("Empresas");
  });
});
