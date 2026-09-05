import { describe, expect, it } from "vitest";
import { MockCrmRepository } from "./repository";

describe("MockCrmRepository", () => {
  it("mantém relações coerentes entre oportunidades e lookup por id", async () => {
    const repository = new MockCrmRepository();
    const opportunities = await repository.listOpportunities();
    expect(opportunities.length).toBeGreaterThan(0);
    const first = opportunities[0];
    expect(first).toBeDefined();
    if (!first) throw new Error("fixture sem oportunidade");

    const found = await repository.getOpportunity(first.id);
    expect(found?.companyId).toBe(first.companyId);
    expect(found?.leadPhone).toBe(first.leadPhone);
  });

  it("devolve cópias e não compartilha mutação entre leituras", async () => {
    const repository = new MockCrmRepository();
    const firstRead = await repository.listOpportunities();
    const first = firstRead[0];
    expect(first).toBeDefined();
    if (!first) throw new Error("fixture sem oportunidade");
    first.companyName = "mutado";

    const secondRead = await repository.listOpportunities();
    expect(secondRead[0]?.companyName).not.toBe("mutado");
  });
});
