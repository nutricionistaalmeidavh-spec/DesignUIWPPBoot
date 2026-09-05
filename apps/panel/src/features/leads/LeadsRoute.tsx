import { useMemo, useState } from "react";
import { PROSPECTING_STATES } from "@/api/contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useActionAvailability } from "@/features/actions/useActionAvailability";
import { Dialog } from "./Dialog";
import { ImportDialog } from "./ImportDialog";
import { LeadsTable } from "./LeadsTable";
import { PROSPECTING_STATE_LABEL, isSelectable } from "./lead-display";
import { ProspectConfirmDialog } from "./ProspectConfirmDialog";
import { useLeadList, type LeadFilters } from "./useLeadList";
import { useResetLead } from "./useResetLead";

export function LeadsRoute() {
  const [filters, setFilters] = useState<LeadFilters>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importOpen, setImportOpen] = useState(false);
  const [prospectOpen, setProspectOpen] = useState(false);
  const [resetPhone, setResetPhone] = useState<string | null>(null);

  const { prospecting } = useActionAvailability();
  const query = useLeadList(filters);
  const resetLead = useResetLead();

  const items = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data]);

  // Mantém a seleção coerente com o que ainda está listado e selecionável.
  const selectablePhones = useMemo(
    () => new Set(items.filter((l) => isSelectable(l.prospectingState)).map((l) => l.phone)),
    [items],
  );
  const effectiveSelected = useMemo(
    () => new Set([...selected].filter((p) => selectablePhones.has(p))),
    [selected, selectablePhones],
  );

  function patch(next: Partial<LeadFilters>) {
    setFilters((current) => {
      const merged = { ...current, ...next };
      for (const key of Object.keys(merged) as (keyof LeadFilters)[]) {
        if (merged[key] === "" || merged[key] === undefined) delete merged[key];
      }
      return merged;
    });
  }

  function toggle(phone: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(phone)) next.delete(phone);
      else next.add(phone);
      return next;
    });
  }

  function toggleAllSelectable() {
    setSelected((current) => {
      const allChecked =
        selectablePhones.size > 0 && [...selectablePhones].every((p) => current.has(p));
      return allChecked ? new Set() : new Set(selectablePhones);
    });
  }

  const showEmpty = !query.isLoading && !query.isError && items.length === 0;
  const selectedPhones = [...effectiveSelected];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Leads</h1>
        <Button size="sm" onClick={() => setImportOpen(true)}>
          Importar planilha
        </Button>
      </div>

      <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="f-state">Estado</Label>
          <Select
            id="f-state"
            value={filters.state ?? ""}
            onChange={(event) => patch({ state: event.target.value || undefined })}
          >
            <option value="">Todos</option>
            {PROSPECTING_STATES.map((value) => (
              <option key={value} value={value}>
                {PROSPECTING_STATE_LABEL[value] ?? value}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="f-phone">Telefone contém</Label>
          <Input
            id="f-phone"
            value={filters.phone ?? ""}
            onChange={(event) => patch({ phone: event.target.value })}
            placeholder="5516…"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="f-segment">Segmento</Label>
          <Input
            id="f-segment"
            value={filters.segment ?? ""}
            onChange={(event) => patch({ segment: event.target.value })}
            placeholder="construção"
          />
        </div>
      </div>

      {selectedPhones.length > 0 ? (
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-2 text-sm">
          <span>{selectedPhones.length} selecionado(s)</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              Limpar
            </Button>
            {prospecting ? (
              <Button size="sm" onClick={() => setProspectOpen(true)}>
                Disparar mensagem de abertura ({selectedPhones.length})
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">
                disparo indisponível neste servidor
              </span>
            )}
          </div>
        </div>
      ) : null}

      {query.isError ? (
        <div className="rounded-lg border border-destructive/40 p-6 text-sm">
          <p className="text-destructive">Erro ao carregar os leads.</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => query.refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : null}

      {query.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      ) : null}

      {showEmpty ? (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          <p>Nenhum lead por aqui ainda.</p>
          <p className="mt-1">
            Importe uma planilha para começar a prospectar.
          </p>
          <Button size="sm" className="mt-3" onClick={() => setImportOpen(true)}>
            Importar planilha
          </Button>
        </div>
      ) : null}

      {!query.isLoading && !query.isError && items.length > 0 ? (
        <>
          <LeadsTable
            items={items}
            selected={effectiveSelected}
            onToggle={toggle}
            onToggleAllSelectable={toggleAllSelectable}
            onRequestReset={setResetPhone}
            prospectingAvailable={prospecting}
          />
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              disabled={!query.hasNextPage || query.isFetchingNextPage}
              onClick={() => query.fetchNextPage()}
            >
              {query.isFetchingNextPage
                ? "Carregando…"
                : query.hasNextPage
                  ? "Carregar próxima página"
                  : "Fim da lista"}
            </Button>
          </div>
        </>
      ) : null}

      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />

      <ProspectConfirmDialog
        open={prospectOpen}
        phones={selectedPhones}
        onClose={() => setProspectOpen(false)}
        onCompleted={() => setSelected(new Set())}
      />

      <Dialog
        open={resetPhone !== null}
        onClose={() => {
          setResetPhone(null);
          resetLead.reset();
        }}
        title="Resetar prospecção"
      >
        <p>
          O lead <strong>{resetPhone}</strong> volta para <em>pendente</em> e fica selecionável
          para um novo disparo. A conversa e o histórico são mantidos.
        </p>
        {resetLead.isError ? (
          <p role="alert" className="text-sm text-destructive">
            {resetLead.error instanceof Error ? resetLead.error.message : "Falha ao resetar."}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setResetPhone(null);
              resetLead.reset();
            }}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            disabled={resetLead.isPending}
            onClick={() => {
              if (!resetPhone) return;
              resetLead.mutate(resetPhone, { onSuccess: () => setResetPhone(null) });
            }}
          >
            {resetLead.isPending ? "Resetando…" : "Resetar"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
