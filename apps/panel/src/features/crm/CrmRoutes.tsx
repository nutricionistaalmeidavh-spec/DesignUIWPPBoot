import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, CalendarClock, ChevronRight, CircleDollarSign, Search, UserRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { FeatureAvailability } from "@/components/FeatureAvailability";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/SectionState";
import { StatusPill } from "@/components/StatusPill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { crmRepository } from "./repository";
import { isCrmPreviewEnabled } from "./preview";
import { OPPORTUNITY_STAGES, OPPORTUNITY_STAGE_LABEL, type Opportunity, type OpportunityStage } from "./types";

function formatBrl(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
}

function stageTone(stage: OpportunityStage): "neutral" | "info" | "success" | "warning" | "danger" {
  if (stage === "won") return "success";
  if (stage === "lost") return "danger";
  if (stage === "proposal" || stage === "negotiation") return "warning";
  if (stage === "qualified" || stage === "meeting") return "info";
  return "neutral";
}

function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  return (
    <Link to={`/crm/opportunities/${opportunity.id}`} className="block rounded-xl border bg-card p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0"><p className="truncate text-sm font-semibold">{opportunity.companyName}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{opportunity.title}</p></div>
        {opportunity.awaitingHuman ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-500" title="Aguardando humano" /> : null}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs"><span className="font-semibold">{formatBrl(opportunity.estimatedValue)}</span><span className="text-muted-foreground">{opportunity.owner}</span></div>
      <div className="mt-3 border-t pt-2.5 text-[11px] text-muted-foreground"><span className="line-clamp-1">Próxima: {opportunity.nextAction}</span></div>
    </Link>
  );
}

export function PipelineRoute() {
  const preview = isCrmPreviewEnabled();
  const query = useQuery({ queryKey: ["crm-preview", "opportunities"], queryFn: () => crmRepository.listOpportunities(), enabled: preview, staleTime: Infinity });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="CRM" title="Pipeline" description="Acompanhe oportunidades por etapa do processo comercial." />
      <FeatureAvailability feature="Pipeline" supported={false} preview={preview}>
        {query.isLoading ? <Skeleton className="h-96" /> : (
          <div className="app-scrollbar overflow-x-auto pb-2">
            <div className="flex min-w-max gap-3">
              {OPPORTUNITY_STAGES.map((stage) => {
                const items = (query.data ?? []).filter((item) => item.stage === stage);
                const total = items.reduce((sum, item) => sum + item.estimatedValue, 0);
                return (
                  <section key={stage} className="w-72 shrink-0 rounded-xl border bg-muted/25 p-2.5">
                    <div className="mb-2.5 flex items-start justify-between gap-2 px-1">
                      <div><div className="flex items-center gap-2"><h2 className="text-xs font-semibold">{OPPORTUNITY_STAGE_LABEL[stage]}</h2><span className="rounded-full bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">{items.length}</span></div><p className="mt-1 text-[11px] text-muted-foreground">{formatBrl(total)}</p></div>
                    </div>
                    <div className="space-y-2">{items.length > 0 ? items.map((item) => <OpportunityCard key={item.id} opportunity={item} />) : <div className="rounded-lg border border-dashed bg-background/60 px-3 py-6 text-center text-[11px] text-muted-foreground">Sem oportunidades</div>}</div>
                  </section>
                );
              })}
            </div>
          </div>
        )}
      </FeatureAvailability>
    </div>
  );
}

export function OpportunitiesRoute() {
  const preview = isCrmPreviewEnabled();
  const [search, setSearch] = useState("");
  const query = useQuery({ queryKey: ["crm-preview", "opportunities"], queryFn: () => crmRepository.listOpportunities(), enabled: preview, staleTime: Infinity });
  const items = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return query.data ?? [];
    return (query.data ?? []).filter((item) => `${item.companyName} ${item.leadName} ${item.title}`.toLowerCase().includes(needle));
  }, [query.data, search]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="CRM" title="Oportunidades" description="Lista comercial pronta para receber o contrato real de oportunidades." />
      <FeatureAvailability feature="Oportunidades" supported={false} preview={preview}>
        <div className="surface-panel p-3 sm:p-4"><div className="relative max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Buscar empresa, lead ou oportunidade" value={search} onChange={(event) => setSearch(event.target.value)} /></div></div>
        {query.isLoading ? <Skeleton className="h-72" /> : items.length === 0 ? <EmptyState title="Nenhuma oportunidade" description="A busca não encontrou oportunidades no conjunto de preview." /> : (
          <div className="surface-panel divide-y overflow-hidden">
            {items.map((item) => (
              <Link key={item.id} to={`/crm/opportunities/${item.id}`} className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{item.companyName}</p><StatusPill tone={stageTone(item.stage)}>{OPPORTUNITY_STAGE_LABEL[item.stage]}</StatusPill></div><p className="mt-1 text-sm text-muted-foreground">{item.title} · {item.leadName}</p></div>
                <div className="flex items-center gap-6 text-sm"><div className="text-right"><p className="font-semibold">{formatBrl(item.estimatedValue)}</p><p className="text-xs text-muted-foreground">{item.owner}</p></div><ChevronRight className="h-4 w-4 text-muted-foreground" /></div>
              </Link>
            ))}
          </div>
        )}
      </FeatureAvailability>
    </div>
  );
}

export function OpportunityDetailRoute() {
  const preview = isCrmPreviewEnabled();
  const { id = "" } = useParams();
  const query = useQuery({ queryKey: ["crm-preview", "opportunity", id], queryFn: () => crmRepository.getOpportunity(id), enabled: preview && Boolean(id), staleTime: Infinity });

  return (
    <FeatureAvailability feature="Detalhe da oportunidade" supported={false} preview={preview}>
      {query.isLoading ? <Skeleton className="h-96" /> : !query.data ? <EmptyState title="Oportunidade não encontrada" description="O registro não existe no conjunto de preview." action={<Link to="/crm/opportunities" className="text-sm font-medium text-primary">Voltar para oportunidades</Link>} /> : <OpportunityDetail opportunity={query.data} />}
    </FeatureAvailability>
  );
}

function OpportunityDetail({ opportunity }: { opportunity: Opportunity }) {
  const timeline = [
    { label: "Lead importado", detail: opportunity.source ?? "Origem comercial" },
    { label: "Primeiro contato realizado", detail: opportunity.campaignName ?? "Prospecção" },
    { label: "Oportunidade criada", detail: opportunity.title },
    { label: "Etapa atual", detail: OPPORTUNITY_STAGE_LABEL[opportunity.stage] },
  ];
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Oportunidade" title={opportunity.companyName} description={`${opportunity.title} · ${opportunity.leadName}`} actions={<StatusPill tone={stageTone(opportunity.stage)}>{OPPORTUNITY_STAGE_LABEL[opportunity.stage]}</StatusPill>} />
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <Card className="shadow-sm"><CardHeader><CardTitle className="text-base">Histórico comercial</CardTitle></CardHeader><CardContent><div className="relative space-y-5 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-border">{timeline.map((event) => <div key={event.label} className="relative flex gap-4"><span className="relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-primary bg-background" /><div><p className="text-sm font-medium">{event.label}</p><p className="mt-0.5 text-sm text-muted-foreground">{event.detail}</p></div></div>)}</div></CardContent></Card>
        <Card className="h-fit shadow-sm"><CardHeader><CardTitle className="text-base">Contexto</CardTitle></CardHeader><CardContent className="space-y-4 text-sm"><DetailRow icon={CircleDollarSign} label="Valor estimado" value={formatBrl(opportunity.estimatedValue)} /><DetailRow icon={UserRound} label="Responsável" value={opportunity.owner} /><DetailRow icon={CalendarClock} label="Próxima ação" value={opportunity.nextAction} /><DetailRow icon={Building2} label="Empresa" value={opportunity.companyName} />{opportunity.campaignName ? <DetailRow icon={ArrowRight} label="Campanha" value={opportunity.campaignName} /> : null}<div className="pt-2"><Link to={`/conversations/${encodeURIComponent(opportunity.leadPhone)}`} className="inline-flex w-full items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Abrir conversa</Link></div></CardContent></Card>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) {
  return <div className="flex gap-3"><Icon className="mt-0.5 h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-0.5 font-medium">{value}</p></div></div>;
}

export function CompaniesRoute() {
  const preview = isCrmPreviewEnabled();
  const query = useQuery({ queryKey: ["crm-preview", "companies"], queryFn: () => crmRepository.listCompanies(), enabled: preview, staleTime: Infinity });
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="CRM" title="Empresas" description="Contas relacionadas aos leads e às oportunidades." />
      <FeatureAvailability feature="Empresas" supported={false} preview={preview}>
        {query.isLoading ? <Skeleton className="h-72" /> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{(query.data ?? []).map((company) => <Card key={company.id} className="shadow-sm"><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{company.name}</p><p className="mt-1 text-sm text-muted-foreground">{company.segment} · {company.city}</p></div><Building2 className="h-5 w-5 text-muted-foreground" /></div><div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded-lg bg-muted/50 p-2"><p className="font-semibold">{company.leadCount}</p><p className="text-muted-foreground">leads</p></div><div className="rounded-lg bg-muted/50 p-2"><p className="font-semibold">{company.opportunityCount}</p><p className="text-muted-foreground">opps</p></div><div className="rounded-lg bg-muted/50 p-2"><p className="font-semibold">{formatBrl(company.pipelineValue)}</p><p className="text-muted-foreground">pipeline</p></div></div></CardContent></Card>)}</div>}
      </FeatureAvailability>
    </div>
  );
}
