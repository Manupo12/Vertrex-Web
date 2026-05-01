"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowRight,
  BadgeDollarSign,
  Building2,
  CircleAlert,
  Handshake,
  Plus,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import {
  EmptyWorkspacePanel,
  ErrorWorkspacePanel,
  LoadingWorkspacePanel,
  formatDateTime,
  formatMoney,
  formatNumber,
} from "@/components/os/workspace-ui";
import { dealPipelineGroups, getDealPipelineGroup, getDealStageLabel, type CanonicalDealStage } from "@/lib/ops/deal-stages";
import { advanceDealStage } from "@/lib/crm/crm-service";
import { postWorkspaceCommand } from "@/lib/ops/workspace-client";
import { useWorkspaceSnapshot } from "@/lib/ops/use-workspace-snapshot";
import type { WorkspaceClientRecord, WorkspaceDealRecord } from "@/lib/ops/workspace-service";
import type { UIStore } from "@/lib/store/ui";

type CRMWorkspaceScreenProps = {
  open: UIStore["open"];
};

type PipelineColumn = {
  key: string;
  title: string;
  subtitle: string;
  deals: WorkspaceDealRecord[];
};

const projectTrackOptions = [
  { value: "commercial", label: "Comercial / SaaS" },
  { value: "community", label: "Comunidad" },
  { value: "roadmap", label: "Roadmap / Futuro" },
];

export default function CRMWorkspaceScreen({ open }: CRMWorkspaceScreenProps) {
  const { snapshot, loading, error, refresh } = useWorkspaceSnapshot();
  const [showClientForm, setShowClientForm] = useState(false);
  const [submittingClient, setSubmittingClient] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [draggingDealId, setDraggingDealId] = useState<string | null>(null);
  const [dropTargetColumn, setDropTargetColumn] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const totalPipelineValue = snapshot.deals.reduce((total, deal) => total + deal.valueCents, 0);
  const weightedPipelineValue = snapshot.deals.reduce((total, deal) => total + Math.round((deal.valueCents * deal.probability) / 100), 0);
  const topClients = [...snapshot.clients]
    .sort((left, right) => right.progress - left.progress || right.projectCount - left.projectCount)
    .slice(0, 4);
  const followUps = [...snapshot.deals]
    .filter((deal) => deal.probability >= 55)
    .sort(
      (left, right) =>
        new Date(left.expectedCloseAt ?? left.updatedAt).getTime() - new Date(right.expectedCloseAt ?? right.updatedAt).getTime(),
    )
    .slice(0, 3);

  const pipeline = useMemo<PipelineColumn[]>(() => {
    return dealPipelineGroups.map((column) => ({
      ...column,
      deals: snapshot.deals.filter((deal) => getDealPipelineGroup(deal.stage).key === column.key),
    }));
  }, [snapshot.deals]);

  async function handleClientSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittingClient(true);
    setSubmitError(null);

    const formData = new FormData(event.currentTarget);
    const name = readFormText(formData, "name");
    const email = readFormText(formData, "email");
    const provisionPortalAccess = readFormCheckbox(formData, "provisionPortalAccess");
    const createInitialProject = readFormCheckbox(formData, "createInitialProject");

    if (!name) {
      setSubmitError("Debes indicar el nombre del cliente.");
      setSubmittingClient(false);
      return;
    }

    try {
      await postWorkspaceCommand(
        "client",
        {
          name,
          slug: readFormText(formData, "slug"),
          brand: readFormText(formData, "brand"),
          email,
          company: readFormText(formData, "company"),
          phase: readFormText(formData, "phase") || "Onboarding",
          progress: readFormNumber(formData, "progress") ?? 0,
          totalInvestmentCents: readFormAmountCents(formData, "totalInvestment"),
          paidCents: readFormAmountCents(formData, "paidAmount"),
          pendingCents: readFormAmountCents(formData, "pendingAmount"),
          nextAction: readFormText(formData, "nextAction"),
          nextActionContext: readFormText(formData, "nextActionContext"),
          nextActionCta: readFormText(formData, "nextActionCta"),
          provisionPortalAccess,
          portalUserName: readFormText(formData, "portalUserName"),
          portalUserEmail: readFormText(formData, "portalUserEmail"),
          portalUserPassword: readFormText(formData, "portalUserPassword"),
          createInitialProject,
          initialProjectName: readFormText(formData, "initialProjectName"),
          initialProjectDescription: readFormText(formData, "initialProjectDescription"),
          initialProjectStatus: readFormText(formData, "initialProjectStatus"),
          initialProjectTrack: readFormText(formData, "initialProjectTrack") || "commercial",
          initialProjectProgress: readFormNumber(formData, "initialProjectProgress"),
          initialProjectStartDate: toIsoDate(readFormText(formData, "initialProjectStartDate")),
          initialProjectEndDate: toIsoDate(readFormText(formData, "initialProjectEndDate")),
        },
        "No fue posible crear el cliente.",
      );
      event.currentTarget.reset();
      setShowClientForm(false);
      await refresh();
    } catch (submissionError) {
      setSubmitError(submissionError instanceof Error ? submissionError.message : "No fue posible crear el cliente.");
    } finally {
      setSubmittingClient(false);
    }
  }

  if (loading) {
    return <LoadingWorkspacePanel label="Cargando CRM operativo real..." />;
  }

  if (error) {
    return <ErrorWorkspacePanel message={error} onRetry={refresh} />;
  }

  if (snapshot.deals.length === 0 && snapshot.clients.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyWorkspacePanel
          title="Tu CRM todavía no tiene deals ni clientes reales"
          description="Crea tu primer cliente o registra una oportunidad para activar el pipeline comercial operativo."
        />
        <div className="flex gap-3">
          <button className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground" onClick={() => setShowClientForm((value) => !value)}>
            Nuevo cliente
          </button>
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" onClick={() => open("createDeal")}>
            Nuevo trato
          </button>
        </div>
        {showClientForm ? <ClientForm onSubmit={handleClientSubmit} submitting={submittingClient} error={submitError} /> : null}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">CRM</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pipeline real conectado al workspace con {formatNumber(snapshot.deals.length)} oportunidades y {formatNumber(snapshot.clients.length)} clientes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/api/admin/export/clients"
            className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
            download
          >
            Exportar clientes
          </a>
          <a
            href="/api/admin/export/deals"
            className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
            download
          >
            Exportar deals
          </a>
          <button
            className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
            onClick={() => open("omniCreator")}
          >
            Actualizar
          </button>
          <button className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:text-primary" onClick={() => setShowClientForm((value) => !value)}>
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nuevo cliente
            </span>
          </button>
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_0_15px_rgba(0,255,135,0.2)] transition-all hover:shadow-[0_0_25px_rgba(0,255,135,0.35)]" onClick={() => open("createDeal")}>
            Nuevo trato
          </button>
        </div>
      </div>

      {showClientForm ? <ClientForm onSubmit={handleClientSubmit} submitting={submittingClient} error={submitError} /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Pipeline total" value={formatMoney(totalPipelineValue)} subtitle={`${formatNumber(snapshot.deals.length)} deals activos`} icon={BadgeDollarSign} />
        <MetricCard title="Pipeline ponderado" value={formatMoney(weightedPipelineValue)} subtitle="Valor ajustado por probabilidad" icon={Target} />
        <MetricCard title="Clientes activos" value={String(snapshot.summary.activeClients)} subtitle={`${formatNumber(snapshot.summary.clients)} clientes registrados`} icon={Users} />
        <MetricCard title="Próximos follow-ups" value={String(followUps.length)} subtitle={followUps[0] ? followUps[0].title : "Sin alertas críticas"} icon={Handshake} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-4">
            {pipeline.map((column) => {
              const columnStageMap: Record<string, CanonicalDealStage> = {
                contacto: "contactado",
                calificado: "interesado",
                propuesta: "propuesta_enviada",
                activacion: "pendiente_anticipo_50",
                activo: "cliente_activo",
                cerrado: "perdido",
              };

              const handleDragOver = (e: React.DragEvent) => {
                e.preventDefault();
                setDropTargetColumn(column.key);
              };

              const handleDragLeave = () => {
                setDropTargetColumn(null);
              };

              const handleDrop = async (e: React.DragEvent) => {
                e.preventDefault();
                const dealId = e.dataTransfer.getData("dealId");
                setDropTargetColumn(null);
                setDraggingDealId(null);

                if (!dealId) return;

                const deal = snapshot.deals.find((d) => d.id === dealId);
                if (!deal) return;

                const currentGroup = getDealPipelineGroup(deal.stage).key;
                if (currentGroup === column.key) return;

                const newStage = columnStageMap[column.key];
                if (!newStage) return;

                setIsUpdating(true);
                try {
                  await advanceDealStage(dealId, newStage);
                  await refresh();
                } finally {
                  setIsUpdating(false);
                }
              };

              const isDropTarget = dropTargetColumn === column.key;

              return (
                <section
                  key={column.key}
                  className={`rounded-2xl border bg-card shadow-sm transition-colors ${
                    isDropTarget ? "border-primary bg-primary/5" : "border-border"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="border-b border-border px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{column.title}</h2>
                        <p className="mt-1 text-xs text-muted-foreground">{column.subtitle}</p>
                      </div>
                      <span className="rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-foreground">
                        {column.deals.length}
                      </span>
                    </div>
                  </div>
                  <div className={`space-y-3 p-4 min-h-[200px] ${isUpdating ? "opacity-50" : ""}`}>
                    {column.deals.length > 0 ? (
                      column.deals.map((deal) => (
                        <DealCard
                          key={deal.id}
                          deal={deal}
                          onOpen={open}
                          isDragging={draggingDealId === deal.id}
                          onDragStart={() => setDraggingDealId(deal.id)}
                          onDragEnd={() => setDraggingDealId(null)}
                        />
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-border bg-secondary/20 px-4 py-8 text-center text-sm text-muted-foreground">
                        {isDropTarget ? "Suelta aquí para mover" : "Sin oportunidades en esta etapa."}
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <aside className="rounded-2xl border border-primary/20 bg-card shadow-[0_0_30px_rgba(0,255,135,0.04)]">
            <div className="border-b border-border px-5 py-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <Sparkles className="h-5 w-5 text-primary" /> IA comercial
              </h2>
            </div>
            <div className="space-y-4 p-5">
              {followUps.length > 0 ? (
                followUps.map((deal) => (
                  <button key={deal.id} className="w-full rounded-xl border border-border/60 bg-secondary/20 p-4 text-left transition-colors hover:border-primary/30 hover:bg-primary/5" onClick={() => open("dealDetail", deal.id)}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{deal.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{deal.clientName ?? "Sin cliente"}</p>
                      </div>
                      <span className="rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {deal.probability}%
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      Priorizar seguimiento antes de {formatDateTime(deal.expectedCloseAt ?? deal.updatedAt)}.
                    </p>
                  </button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No hay follow-ups críticos detectados por ahora.</p>
              )}
            </div>
          </aside>

          <aside className="rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <Building2 className="h-5 w-5 text-muted-foreground" /> Clientes foco
              </h2>
            </div>
            <div className="space-y-3 p-4">
              {topClients.length > 0 ? (
                topClients.map((client) => <ClientCard key={client.id} client={client} onOpen={open} />)
              ) : (
                <p className="text-sm text-muted-foreground">No hay clientes registrados todavía.</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() || null : null;
}

function readFormNumber(formData: FormData, key: string) {
  const value = readFormText(formData, key);

  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function readFormAmountCents(formData: FormData, key: string) {
  const value = readFormText(formData, key);

  if (!value) {
    return null;
  }

  const normalized = value.replace(/[^0-9.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : null;
}

function readFormCheckbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function toIsoDate(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function MetricCard({ title, value, subtitle, icon: Icon }: { title: string; value: string; subtitle: string; icon: typeof BadgeDollarSign }) {
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

function DealCard({ deal, onOpen, isDragging, onDragStart, onDragEnd }: { deal: WorkspaceDealRecord; onOpen: UIStore["open"]; isDragging?: boolean; onDragStart?: () => void; onDragEnd?: () => void }) {
  return (
    <button
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("dealId", deal.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.();
      }}
      onDragEnd={() => onDragEnd?.()}
      className={`w-full rounded-xl border border-border/60 bg-secondary/20 p-4 text-left transition-all hover:border-primary/30 hover:bg-primary/5 ${isDragging ? "opacity-50 rotate-2" : ""}`}
      onClick={() => onOpen("dealDetail", deal.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{deal.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{deal.clientName ?? "Sin cliente"}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="rounded-full border border-primary/20 bg-primary/5 px-2 py-1 font-medium text-primary">{getDealStageLabel(deal.stage)}</span>
          </div>
        </div>
        <span className="rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
          {deal.probability}%
        </span>
      </div>
      <p className="mt-3 text-lg font-semibold text-primary">{formatMoney(deal.valueCents)}</p>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{deal.owner ?? "Sin owner"}</span>
        <span>{formatDateTime(deal.expectedCloseAt ?? deal.updatedAt)}</span>
      </div>
    </button>
  );
}

function ClientCard({ client, onOpen }: { client: WorkspaceClientRecord; onOpen: UIStore["open"] }) {
  return (
    <button className="w-full rounded-xl border border-border/60 bg-secondary/20 p-4 text-left transition-colors hover:border-primary/30 hover:bg-primary/5" onClick={() => onOpen("clientDetail", client.id)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{client.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{client.company ?? client.phase ?? client.status}</p>
        </div>
        <span className="rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
          {client.progress}%
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{client.projectCount} proyectos</span>
        <span>·</span>
        <span>{client.taskCount} tareas</span>
        <span>·</span>
        <span>{client.openTicketCount} tickets</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <span className={`rounded-full border px-2 py-1 font-medium ${client.portalUserId ? client.portalAccessActive ? "border-primary/30 bg-primary/10 text-primary" : "border-amber-500/30 bg-amber-500/10 text-amber-500" : "border-border bg-background text-muted-foreground"}`}>
          {client.portalUserId ? client.portalAccessActive ? "Portal activo" : "Portal inactivo" : "Sin portal"}
        </span>
        {client.portalUserEmail ? <span>{client.portalUserEmail}</span> : null}
        {client.activePortalSessions > 0 ? <span>· {client.activePortalSessions} sesiones activas</span> : null}
      </div>
    </button>
  );
}

function ClientForm({ onSubmit, submitting, error }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void; submitting: boolean; error: string | null }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <Plus className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Alta rápida de cliente</h2>
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Input name="name" label="Nombre" placeholder="Budaphone" required disabled={submitting} />
          <Input name="slug" label="Slug" placeholder="budaphone" disabled={submitting} />
          <Input name="brand" label="Marca" placeholder="Budaphone Retail" disabled={submitting} />
          <Input name="email" label="Email" placeholder="equipo@cliente.com" type="email" disabled={submitting} />
          <Input name="company" label="Empresa" placeholder="Budaphone SAS" disabled={submitting} />
          <Input name="phase" label="Fase" placeholder="Onboarding" disabled={submitting} />
          <Input name="progress" label="Progreso" placeholder="35" type="number" disabled={submitting} />
          <Input name="totalInvestment" label="Inversión total (USD)" placeholder="15000" disabled={submitting} />
          <Input name="paidAmount" label="Pagado (USD)" placeholder="7500" disabled={submitting} />
          <Input name="pendingAmount" label="Pendiente (USD)" placeholder="7500" disabled={submitting} />
          <Input name="nextAction" label="Siguiente acción" placeholder="Enviar propuesta" disabled={submitting} />
          <Input name="nextActionCta" label="CTA" placeholder="Abrir propuesta" disabled={submitting} />
        </div>
        <Input name="nextActionContext" label="Contexto" placeholder="Cliente pidió ajustes antes del cierre" disabled={submitting} />
        <section className="rounded-2xl border border-border/70 bg-secondary/10 p-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">Provisionar acceso portal</h3>
            <p className="text-xs text-muted-foreground">Crea o actualiza el usuario cliente para login y portal. El acceso queda activo cuando el cliente ya cumple el anticipo del 50%.</p>
          </div>
          <div className="mt-4 space-y-4">
            <CheckboxField name="provisionPortalAccess" label="Provisionar acceso de portal" disabled={submitting} />
            <div className="grid gap-4 md:grid-cols-3">
              <Input name="portalUserName" label="Nombre usuario portal" placeholder="Equipo Budaphone" disabled={submitting} />
              <Input name="portalUserEmail" label="Email portal" placeholder="portal@cliente.com" type="email" disabled={submitting} />
              <Input name="portalUserPassword" label="Contraseña portal" placeholder="Temporal segura" type="password" disabled={submitting} />
            </div>
          </div>
        </section>
        <section className="rounded-2xl border border-border/70 bg-secondary/10 p-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">Proyecto inicial</h3>
            <p className="text-xs text-muted-foreground">Opcionalmente deja creado el primer proyecto operativo del cliente.</p>
          </div>
          <div className="mt-4 space-y-4">
            <CheckboxField name="createInitialProject" label="Crear proyecto inicial" disabled={submitting} />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Input name="initialProjectName" label="Nombre del proyecto" placeholder="Portal Cliente Budaphone" disabled={submitting} />
              <Input name="initialProjectStatus" label="Estado" placeholder="active" disabled={submitting} />
              <Select name="initialProjectTrack" label="Track" disabled={submitting} options={projectTrackOptions} />
              <Input name="initialProjectProgress" label="Progreso inicial" placeholder="0" type="number" disabled={submitting} />
              <Input name="initialProjectStartDate" label="Inicio" type="date" disabled={submitting} />
              <Input name="initialProjectEndDate" label="Fin" type="date" disabled={submitting} />
            </div>
            <Input name="initialProjectDescription" label="Descripción del proyecto" placeholder="Onboarding, portal, agenda, soporte y operación inicial." disabled={submitting} />
          </div>
        </section>
        {error ? (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        ) : null}
        <div className="flex justify-end gap-3">
          <button type="submit" disabled={submitting} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? "Creando..." : "Crear cliente"}
          </button>
        </div>
      </form>
    </section>
  );
}

function Input({ label, name, placeholder, type = "text", required = false, disabled = false }: { label: string; name: string; placeholder?: string; type?: string; required?: boolean; disabled?: boolean }) {
  return (
    <label className="space-y-2 text-sm text-muted-foreground">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary/40"
      />
    </label>
  );
}

function Select({ label, name, options, disabled = false }: { label: string; name: string; options: Array<{ value: string; label: string }>; disabled?: boolean }) {
  return (
    <label className="space-y-2 text-sm text-muted-foreground">
      <span>{label}</span>
      <select name={name} disabled={disabled} defaultValue="commercial" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary/40">
        {options.map((option) => (
          <option key={`${name}-${option.value || option.label}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckboxField({ name, label, disabled = false }: { name: string; label: string; disabled?: boolean }) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground">
      <input name={name} type="checkbox" disabled={disabled} className="h-4 w-4 rounded border-border bg-background text-primary" />
      <span>{label}</span>
    </label>
  );
}
