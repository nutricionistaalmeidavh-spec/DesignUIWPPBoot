import type { ReactNode } from "react";
import { IntegrationPendingState } from "@/components/SectionState";
import { StatusPill } from "@/components/StatusPill";

export function FeatureAvailability({
  feature,
  supported,
  preview = false,
  children,
}: {
  feature: string;
  supported: boolean;
  preview?: boolean;
  children: ReactNode;
}) {
  if (!supported && !preview) return <IntegrationPendingState feature={feature} />;

  return (
    <div className="space-y-4">
      {!supported && preview ? (
        <div className="flex justify-end">
          <StatusPill tone="info">Preview com dados de desenvolvimento</StatusPill>
        </div>
      ) : null}
      {children}
    </div>
  );
}
