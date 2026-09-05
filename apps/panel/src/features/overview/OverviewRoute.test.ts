import { describe, expect, it } from "vitest";
import { buildAttentionItems } from "./OverviewRoute";

describe("buildAttentionItems", () => {
  it("descreve respostas como mensagens recebidas, sem jargão inbound", () => {
    const items = buildAttentionItems({ awaitingHuman: 0, pendingInbound: 2 });

    expect(items).toEqual([
      { label: "2 mensagens recebidas pendentes", to: "/conversations/inbox" },
    ]);
    expect(items.some((item) => item.label.toLowerCase().includes("inbound"))).toBe(false);
  });
});
