import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, Bot, MessageSquareWarning, Target, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState } from "@/components/SectionState";
import { StatusPill } from "@/components/StatusPill";
import { useOverview } from "@/features/consumption/useOverview";
import { crmRepository } from "@/features/crm/repository";
import { isCrmPreviewEnabled } from "@/features/crm/preview";

export function buildAttentionItems(data: {
  awaitingHuman: number;
  pendingInbound: number;
  failedProspecting?: number;
}) {
  return [
    data.awaitingHuman > 0
      ? { label: `${data.awaitingHuman} conversa(s) aguardando humano`, to: "/conversations/handoff" }
      : null,
    data.pendingInbound > 0
      ? { label: `${data.pendingInbound} inbound(s) pendente(s)`, to: "/conversations/inbox" }
      : null,
    data.failedProspecting && data.failedProspecting > 0
      ? { label: `${data.failedProspecting} falha(s) de prospecção`, to: "/crm/leads" }
      : null,
  ].filter(Boolean) as Array<{ label: string; to: string }>;
}

export function OverviewRoute() {
  const overview = useOverview();
  const preview = isCrmPreviewEnabled();
  const opportunities = useQuery({
    queryKey: ["crm-preview", "opportunities"],
    queryFn: () => crmRepository.listOpportunities(),
    enabled: preview,
    staleTime: Infinity,
  });
  const campaigns = useQuery({
    queryKey: ["crm-preview", "campaigns"],
    queryFn: () => crmRepository.listCampaigns(),
    enabled: preview,
    staleTime: Infinity,
  });

  if (overview.isError) {
    return <ErrorState onRetry={() => overview.refetch()} description="Não foi possível carregar a visão operacional." />;
  }

  if (overview.isLoading || !overview.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Visão geral" description="Saúde da operação e prioridades comerciais." />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28" />)}
        </div>
      </div>
    );
  }

  const data = overview.data;
  const attention = buildAttentionItems({
    awaitingHuman: data.conversationsByState.awaitingHuman,
    pendingInbound: data.pendingInbound,
  });
  const previewOpportunities = opportunities.data ?? [];
  const previewCampaigns = campaigns.data ?? [];
  const activePipeline = previewOpportunities
    .filter((item) => item.stage !== "won" && item.stage !== "lost")
    .reduce((total, item) => total + item.estimatedValue, 0);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Operação"
        title="Visão geral"
        description="Acompanhe o que exige atenção agora e entre direto no próximo trabalho."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Bot} label="Conversas ativas" value={data.conversationsByState.active} helper="bot operando" />
        <MetricCard icon={MessageSquareWarning} label="Aguardando humano" value={data.conversationsByState.awaitingHuman} helper="prioridade operacional" />
        <MetricCard icon={Users} label="Leads" value={data.totalLeads} helper="base disponível" />
        <MetricCard icon={AlertTriangle} label="Inbound pendente" value={data.pendingInbound} helper="novas respostas" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="shadow-sm">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Fila de trabalho</p>
              <CardTitle className="mt-1 text-base">Precisa de atenção</CardTitle>
            </div>
            <StatusPill tone={attention.length > 0 ? "warning" : "success"}>
              {attention.length > 0 ? `${attention.length} prioridade(s)` : "Tudo em dia"}
            </StatusPill>
          </CardHeader>
          <CardContent className="space-y-2">
            {attention.length === 0 ? (
              <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                Nenhuma exceção operacional encontrada no overview atual.
              </div>
            ) : (
              attention.map((item) => (
                <Link key={item.label} to={item.to} className="group flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors hover:bg-muted/50">
                  <span className="font-medium">{item.label}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Comercial</p>
                <CardTitle className="mt-1 text-base">Pipeline</CardTitle>
              </div>
              {preview ? <StatusPill tone="info">Preview</StatusPill> : null}
            </div>
          </CardHeader>
          <CardContent>
            {preview ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Oportunidades</p>
                    <p className="mt-1 text-2xl font-semibold">{previewOpportunities.length}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Valor em aberto</p>
                    <p className="mt-1 text-lg font-semibold">R$ {activePipeline.toLocaleString("pt-BR")}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Campanhas ativas</span>
                  <span className="font-medium">{previewCampaigns.filter((item) => item.status === "running").length}</span>
                </div>
                <Link to="/crm/pipeline" className="inline-flex h-8 w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground">
                  <Target className="h-4 w-4" />Abrir pipeline
                </Link>
              </div>
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                Pipeline, oportunidades e campanhas aparecem aqui automaticamente quando o backend expuser essas capabilities.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: typeof Bot;
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
          </div>
          <span className="rounded-lg bg-accent p-2.5 text-accent-foreground"><Icon className="h-4 w-4" /></span>
        </div>
      </CardContent>
    </Card>
  );
}
