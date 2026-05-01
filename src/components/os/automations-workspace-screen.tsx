"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Play, Plus, Sparkles, Workflow, Zap } from "lucide-react";

import {
  EmptyWorkspacePanel,
  ErrorWorkspacePanel,
  LoadingWorkspacePanel,
  formatMoney,
  formatNumber,
} from "@/components/os/workspace-ui";
import { isActiveClientDealStage } from "@/lib/ops/deal-stages";
import { useWorkspaceSnapshot } from "@/lib/ops/use-workspace-snapshot";
import { useUIStore } from "@/lib/store/ui";

export default function AutomationsWorkspaceScreen() {
  const open = useUIStore((store) => store.open);
  const { snapshot, loading, error, refresh } = useWorkspaceSnapshot();
  const [runningPlaybookId, setRunningPlaybookId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderForm, setBuilderForm] = useState({
    title: "",
    trigger: "deal_created" as "deal_created" | "ticket_created" | "invoice_issued" | "project_started" | "event_scheduled",
    action: "create_task" as "create_task" | "send_email" | "create_event" | "update_deal",
    condition: "",
  });
  const [savingPlaybook, setSavingPlaybook] = useState(false);

  const activeDealsWithoutProject = snapshot.deals.filter((deal) => isActiveClientDealStage(deal.stage) && !deal.projectId);
  const clientsWithoutPortal = snapshot.clients.filter((client) => client.projectCount > 0 && !client.portalUserId);
  const projectsWithoutKickoff = snapshot.projects.filter(
    (project) => !snapshot.events.some((event) => event.projectId === project.id && new Date(event.startsAt).getTime() >= Date.now()),
  );
  const invoicesWithoutDocument = snapshot.invoices.filter((invoice) => !invoice.documentId);
  const ticketsWithoutProject = snapshot.tickets.filter((ticket) => !ticket.projectId);
  const persistedPlaybooks = snapshot.automationPlaybooks;
  const recentRuns = snapshot.automationRuns.slice(0, 6);
  const suggestions = [
    {
      key: "deal-to-project",
      title: "Cliente activo → crear proyecto operativo",
      count: activeDealsWithoutProject.length,
      description: "Convierte activación comercial en delivery real sin dejar huecos entre CRM y Proyectos.",
      sample: activeDealsWithoutProject[0]?.title ?? null,
    },
    {
      key: "client-portal",
      title: "Cliente con proyectos → provisionar portal",
      count: clientsWithoutPortal.length,
      description: "Activa login, portal y autoservicio apenas la cuenta entra en operación.",
      sample: clientsWithoutPortal[0]?.name ?? null,
    },
    {
      key: "project-kickoff",
      title: "Proyecto nuevo → agendar kickoff",
      count: projectsWithoutKickoff.length,
      description: "Asegura agenda, contexto y ownership desde el inicio de cada proyecto.",
      sample: projectsWithoutKickoff[0]?.name ?? null,
    },
    {
      key: "invoice-document",
      title: "Factura abierta → validar documento soporte",
      count: invoicesWithoutDocument.length,
      description: "Mantiene finanzas y legal sincronizados sobre el mismo expediente.",
      sample: invoicesWithoutDocument[0]?.label ?? null,
    },
    {
      key: "ticket-routing",
      title: "Ticket sin proyecto → enrutar a delivery",
      count: ticketsWithoutProject.length,
      description: "Evita soporte huérfano y fuerza trazabilidad con cliente/proyecto.",
      sample: ticketsWithoutProject[0]?.title ?? null,
    },
  ].sort((left, right) => right.count - left.count);

  const handleRegisterRun = async (playbookId: string) => {
    setRunningPlaybookId(playbookId);
    setActionError(null);

    try {
      await requestWorkspaceMutation(
        {
          kind: "automationRun",
          payload: {
            playbookId,
            status: "completed",
          },
        },
        "No fue posible registrar la ejecución del playbook.",
      );

      await refresh();
    } catch (runError) {
      setActionError(runError instanceof Error ? runError.message : "No fue posible registrar la ejecución del playbook.");
    } finally {
      setRunningPlaybookId(null);
    }
  };

  if (loading) {
    return <LoadingWorkspacePanel label="Cargando automatizaciones basadas en operación real..." />;
  }

  if (error) {
    return <ErrorWorkspacePanel message={error} onRetry={refresh} />;
  }

  if (snapshot.clients.length === 0 && snapshot.projects.length === 0 && snapshot.deals.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyWorkspacePanel
          title="Automations aún no tiene señales del negocio"
          description="Crea deals, clientes y proyectos reales para que el motor de automatización pueda disparar flujos relacionales."
        />
        <div className="flex gap-3">
          <button className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground" onClick={refresh}>
            Actualizar
          </button>
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" onClick={() => open("createAutomation")}>
            Nueva automatización
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Automations</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Recomendaciones y disparadores basados en gaps reales entre CRM, portal, proyectos, finanzas y soporte.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80" onClick={refresh}>
            Actualizar
          </button>
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" onClick={() => setShowBuilder(true)}>
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nueva automatización
            </span>
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Activaciones por operacionalizar" value={String(activeDealsWithoutProject.length)} subtitle="Cliente activo aún sin proyecto" icon={Workflow} />
        <MetricCard title="Portales por activar" value={String(clientsWithoutPortal.length)} subtitle="Clientes con delivery activo" icon={Zap} />
        <MetricCard title="Kickoffs pendientes" value={String(projectsWithoutKickoff.length)} subtitle="Proyectos sin evento futuro" icon={Play} />
        <MetricCard title="Cobro sin respaldo" value={String(invoicesWithoutDocument.length)} subtitle={formatMoney(invoicesWithoutDocument.reduce((total, invoice) => total + invoice.amountCents, 0))} icon={Sparkles} />
      </div>

      {actionError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-lg font-semibold text-foreground">Flujos recomendados por el OS</h2>
          </div>
          <div className="space-y-3 p-4">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.key}
                className="w-full rounded-xl border border-border/60 bg-secondary/20 p-4 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
                onClick={() => open("createAutomation")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{suggestion.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{suggestion.description}</p>
                  </div>
                  <span className="rounded-full border border-border bg-background px-2 py-1 text-xs font-semibold text-primary">
                    {formatNumber(suggestion.count)}
                  </span>
                </div>
                {suggestion.sample ? (
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <ArrowRight className="h-3.5 w-3.5" />
                    <span>Ejemplo vivo: {suggestion.sample}</span>
                  </div>
                ) : null}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-foreground">Playbooks persistidos</h2>
              <span className="rounded-full border border-border bg-background px-2 py-1 text-xs font-semibold text-muted-foreground">
                {formatNumber(persistedPlaybooks.length)} activos
              </span>
            </div>
          </div>
          <div className="space-y-3 p-4">
            {persistedPlaybooks.length > 0 ? persistedPlaybooks.map((playbook) => (
              <PlaybookCard
                key={playbook.id}
                title={playbook.title}
                description={playbook.summary ?? `${playbook.trigger} → ${playbook.action}`}
                status={playbook.status}
                meta={`${formatNumber(playbook.recentRunCount)} ejecuciones auditadas`}
                lastRunAt={playbook.lastRunAt}
                lastRunStatus={playbook.lastRunStatus}
                onRun={() => handleRegisterRun(playbook.id)}
                running={runningPlaybookId === playbook.id}
                onToggle={async () => {
                  try {
                    await requestWorkspaceMutation(
                      {
                        kind: "automationPlaybook",
                        payload: {
                          id: playbook.id,
                          status: playbook.status === "active" ? "paused" : "active",
                          title: playbook.title,
                          trigger: playbook.trigger,
                          action: playbook.action,
                        },
                      },
                      "Error al actualizar playbook"
                    );
                    refresh();
                  } catch (err) {
                    setActionError(err instanceof Error ? err.message : "Error al actualizar playbook");
                  }
                }}
              />
            )) : (
              <div className="rounded-xl border border-dashed border-border bg-secondary/10 p-4 text-sm text-muted-foreground">
                Publica tu primer playbook desde el botón <span className="font-semibold text-foreground">Nueva automatización</span> y aparecerá aquí con historial auditable.
              </div>
            )}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="font-semibold">Base relacional disponible</span>
              </div>
              <p className="mt-2">
                El motor ya puede trabajar sobre clientes, proyectos, documentos, tickets, credenciales, finanzas y portal con contexto compartido.
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-secondary/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Logs auditables recientes</p>
                  <p className="mt-1 text-xs text-muted-foreground">Cada ejecución queda persistida y luego se recicla también en el AI control center.</p>
                </div>
                <span className="rounded-full border border-border bg-background px-2 py-1 text-xs font-semibold text-muted-foreground">
                  {formatNumber(recentRuns.length)} logs
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {recentRuns.length > 0 ? recentRuns.map((automationRun) => (
                  <AutomationRunRow
                    key={automationRun.id}
                    title={automationRun.playbookTitle ?? automationRun.title}
                    status={automationRun.status}
                    summary={automationRun.summary}
                    timestamp={automationRun.finishedAt ?? automationRun.startedAt}
                  />
                )) : (
                  <p className="text-sm text-muted-foreground">Todavía no hay ejecuciones registradas.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {showBuilder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground">Nueva automatización</h3>
            <p className="mt-1 text-sm text-muted-foreground">Configura un trigger y una acción</p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Título</label>
                <input
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  value={builderForm.title}
                  onChange={(e) => setBuilderForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Ej: Crear tarea cuando se active deal"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Trigger (Cuando)</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                    value={builderForm.trigger}
                    onChange={(e) => setBuilderForm((prev) => ({ ...prev, trigger: e.target.value as typeof builderForm.trigger }))}
                  >
                    <option value="deal_created">Deal creado</option>
                    <option value="ticket_created">Ticket creado</option>
                    <option value="invoice_issued">Factura emitida</option>
                    <option value="project_started">Proyecto iniciado</option>
                    <option value="event_scheduled">Evento agendado</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Acción (Entonces)</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                    value={builderForm.action}
                    onChange={(e) => setBuilderForm((prev) => ({ ...prev, action: e.target.value as typeof builderForm.action }))}
                  >
                    <option value="create_task">Crear tarea</option>
                    <option value="send_email">Enviar email</option>
                    <option value="create_event">Crear evento</option>
                    <option value="update_deal">Actualizar deal</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Condición (opcional)</label>
                <input
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  value={builderForm.condition}
                  onChange={(e) => setBuilderForm((prev) => ({ ...prev, condition: e.target.value }))}
                  placeholder="Ej: deal.valueCents > 1000000"
                />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
                onClick={() => setShowBuilder(false)}
              >
                Cancelar
              </button>
              <button
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                disabled={!builderForm.title || savingPlaybook}
                onClick={async () => {
                  setSavingPlaybook(true);
                  try {
                    await requestWorkspaceMutation(
                      {
                        kind: "automationPlaybook",
                        payload: {
                          title: builderForm.title,
                          trigger: builderForm.trigger,
                          action: builderForm.action,
                          condition: builderForm.condition || undefined,
                          status: "active",
                        },
                      },
                      "Error al guardar playbook"
                    );
                    setShowBuilder(false);
                    setBuilderForm({ title: "", trigger: "deal_created", action: "create_task", condition: "" });
                    refresh();
                  } catch (err) {
                    setActionError(err instanceof Error ? err.message : "Error al guardar");
                  } finally {
                    setSavingPlaybook(false);
                  }
                }}
              >
                {savingPlaybook ? "Guardando..." : "Guardar playbook"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon: Icon }: { title: string; value: string; subtitle: string; icon: typeof Workflow }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</h3>
        </div>
        <div className="rounded-xl bg-secondary/60 p-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function PlaybookCard({
  title,
  description,
  status,
  meta,
  lastRunAt,
  lastRunStatus,
  onRun,
  running,
  onToggle,
}: {
  title: string;
  description: string;
  status: string;
  meta: string;
  lastRunAt: string | null;
  lastRunStatus: string | null;
  onRun: () => void;
  running: boolean;
  onToggle?: () => void;
}) {
  const badge = getStatusBadge(status);

  return (
    <div className="rounded-xl border border-border/60 bg-secondary/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
        <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${badge.className}`}>
          {badge.label}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>{meta}</span>
        <span>Última ejecución: {formatAutomationTimestamp(lastRunAt) ?? "Sin ejecuciones"}</span>
        {lastRunStatus ? <span>Estado último run: {getStatusBadge(lastRunStatus).label}</span> : null}
      </div>
      <div className="mt-4 flex items-center justify-end gap-2">
        {onToggle && (
          <button
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5"
            onClick={onToggle}
          >
            {status === "active" ? "Pausar" : "Activar"}
          </button>
        )}
        <button
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onRun}
          disabled={running || status !== "active"}
        >
          <Play className="h-3.5 w-3.5" />
          {running ? "Registrando..." : "Registrar ejecución"}
        </button>
      </div>
    </div>
  );
}

function AutomationRunRow({ title, status, summary, timestamp }: { title: string; status: string; summary: string; timestamp: string | null }) {
  const badge = getStatusBadge(status);

  return (
    <div className="rounded-xl border border-border/60 bg-background/70 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{summary}</p>
        </div>
        <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${badge.className}`}>
          {badge.label}
        </span>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">{formatAutomationTimestamp(timestamp) ?? "Sin fecha"}</p>
    </div>
  );
}

async function requestWorkspaceMutation(body: Record<string, unknown>, fallbackMessage: string) {
  const response = await fetch("/api/admin/workspace", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error ?? fallbackMessage);
  }

  return payload;
}

function formatAutomationTimestamp(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
    case "completed":
      return {
        label: status === "active" ? "Activo" : "Completado",
        className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      };
    case "draft":
    case "queued":
      return {
        label: status === "draft" ? "Draft" : "En cola",
        className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      };
    case "paused":
      return {
        label: "Pausado",
        className: "border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300",
      };
    case "running":
      return {
        label: "En ejecución",
        className: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
      };
    case "needs_review":
      return {
        label: "Revisión",
        className: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
      };
    case "failed":
      return {
        label: "Fallido",
        className: "border-destructive/30 bg-destructive/10 text-destructive",
      };
    default:
      return {
        label: status,
        className: "border-border bg-background text-muted-foreground",
      };
  }
}
