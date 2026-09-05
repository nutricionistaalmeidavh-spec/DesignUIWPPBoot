import { describe, expect, it } from "vitest";
import { MockCrmRepository } from "./repository";

describe("MockCrmRepository", () => {
  it("mantém relações coerentes entre oportunidades e lookup por id", async () => {
    const repository = new MockCrmRepository();
    const opportunities = await repository.listOpportunities();
    expect(opportunities.length).toBeGreaterThan(0);

    const found = await repository.getOpportunity(opportunities[0].id);
    expect(found?.companyId).toBe(opportunities[0].companyId);
    expect(found?.leadPhone).toBe(opportunities[0].leadPhone);
  });

  it("devolve cópias e não compartilha mutação entre leituras", async () => {
    const repository = new MockCrmRepository();
    const first = await repository.listOpportunities();
    first[0].companyName = "mutado";
    const second = await repository.listOpportunities();
    expect(second[0].companyName).not.toBe("mutado");
  });
});
