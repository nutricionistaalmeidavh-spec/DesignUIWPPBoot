import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FeatureAvailability } from "./FeatureAvailability";

describe("FeatureAvailability", () => {
  it("bloqueia recurso sem backend fora do preview", () => {
    render(
      <FeatureAvailability feature="Pipeline" supported={false} preview={false}>
        <button>ação falsa</button>
      </FeatureAvailability>,
    );

    expect(screen.getByText("Pipeline está pronta para integração")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "ação falsa" })).not.toBeInTheDocument();
  });

  it("permite visualizar fixtures quando preview está ativo", () => {
    render(
      <FeatureAvailability feature="Pipeline" supported={false} preview>
        <button>abrir pipeline</button>
      </FeatureAvailability>,
    );

    expect(screen.getByRole("button", { name: "abrir pipeline" })).toBeInTheDocument();
    expect(screen.getByText("Preview com dados de desenvolvimento")).toBeInTheDocument();
  });
});
