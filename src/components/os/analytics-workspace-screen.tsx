"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  CalendarDays,
  DollarSign,
  Layers,
  ShieldAlert,
  Target,
  TrendingUp,
  Users,
  Workflow,
} from "lucide-react";

import {
  EmptyWorkspacePanel,
  ErrorWorkspacePanel,
  LoadingWorkspacePanel,
  formatDateTime,
  formatMoney,
  formatNumber,
} from "@/components/os/workspace-ui";
import { dealPipelineGroups, getDealPipelineGroup } from "@/lib/ops/deal-stages";
import { isOutstandingInvoiceStatus, isDocumentInTransitStatus } from "@/lib/ops/status-catalog";
import { buildWorkspaceHealthSnapshot } from "@/lib/ops/workspace-health";
import type { WorkspaceClientRecord, WorkspaceProjectRecord, WorkspaceSnapshot } from "@/lib/ops/workspace-service";
import { useWorkspaceSnapshot } from "@/lib/ops/use-workspace-snapshot";

type ScoreStatus = "healthy" | "warning" | "critical";

type ClientHealthRow = {
  id: string;
  name: string;
  phaseLabel: string;
  projectCount: number;
  openTicketCount: number;
  lastActivityAt: string | null;
  portalLabel: string;
  billingLabel: string;
  totalInvestmentCents: number;
  pendingCents: number;
  score: number;
  status: ScoreStatus;
  signals: string[];
};

type ProjectHealthRow = {
  id: string;
  name: string;
  clientName: string | null;
  progress: number;
  openTasks: number;
  milestoneLabel: string;
  nextEventAt: string | null;
  updatedAt: string;
  score: number;
  status: ScoreStatus;
  signals: string[];
};

type FunnelRow = {
  key: string;
  title: string;
  subtitle: string;
  count: number;
  valueCents: number;
  weightedValueCents: number;
  share: number;
};

const inactiveProjectStatuses = new Set(["completed", "done", "archived", "cancelled", "canceled", "paused"]);
const executionTaskStatuses = new Set(["in_progress", "review", "blocked"]);

export default function AnalyticsWorkspaceScreen() {
  const { snapshot, loading, error, refresh } = useWorkspaceSnapshot();
  const analytics = useMemo(() => buildAnalyticsModel(snapshot), [snapshot]);

  if (loading) {
    return <LoadingWorkspacePanel label="Cargando inteligencia empresarial real..." />;
  }

  if (error) {
    return <ErrorWorkspacePanel message={error} onRetry={refresh} />;
  }

  if (snapshot.clients.length === 0 && snapshot.projects.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyWorkspacePanel
          title="Analytics todavía no tiene base operacional"
          description="Registra clientes, proyectos, deals, transacciones y documentos para construir BI sobre datos reales del OS."
        />
        <button
          className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground"
          onClick={refresh}
        >
          Actualizar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Inteligencia de Negocio</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Dashboard ejecutivo sobre salud de clientes/proyectos, adopción portal, funnel comercial y cobertura operacional del mismo workspace.
          </p>
        </div>
        <button
          className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
          onClick={refresh}
        >
          Actualizar
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          title="Health score clientes"
          value={`${analytics.averageClientScore}/100`}
          subtitle={`${formatNumber(analytics.clientRows.length)} cuentas con lectura operativa activa`}
          icon={Users}
        />
        <MetricCard
          title="Health score proyectos"
          value={`${analytics.averageProjectScore}/100`}
          subtitle={`${formatNumber(analytics.projectRows.length)} proyectos con score derivado`}
          icon={Target}
        />
        <MetricCard
          title="Adopción portal"
          value={`${analytics.portalAdoptionRate}%`}
          subtitle={analytics.portalAdoptionSubtitle}
          icon={Activity}
        />
        <MetricCard
          title="Cobertura invoice-documento"
          value={`${analytics.invoiceDocumentCoverageRate}%`}
          subtitle={analytics.invoiceCoverageSubtitle}
          icon={Workflow}
        />
        <MetricCard
          title="Pipeline ponderado"
          value={formatMoney(analytics.weightedPipeline)}
          subtitle={`${formatMoney(analytics.pipelineValue)} pipeline bruto`}
          icon={TrendingUp}
        />
        <MetricCard
          title="Caja neta"
          value={formatMoney(analytics.netCash)}
          subtitle={`${formatMoney(analytics.income)} ingresos · ${formatMoney(analytics.expenses)} gastos`}
          icon={DollarSign}
        />
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Ingresos vs Gastos</h2>
        <div className="mt-4 space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Ingresos</span>
              <span className="font-medium text-emerald-600">{formatMoney(analytics.income)}</span>
            </div>
            <div className="mt-1 h-4 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-4 rounded-full bg-emerald-500"
                style={{ width: `${Math.min(100, (analytics.income / Math.max(analytics.income + analytics.expenses, 1)) * 100)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Gastos</span>
              <span className="font-medium text-red-500">{formatMoney(analytics.expenses)}</span>
            </div>
            <div className="mt-1 h-4 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-4 rounded-full bg-red-500"
                style={{ width: `${Math.min(100, (analytics.expenses / Math.max(analytics.income + analytics.expenses, 1)) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Pipeline por etapa</h2>
        <div className="mt-4 space-y-3">
          {analytics.funnelRows.map((row) => (
            <div key={row.key}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{row.title}</span>
                <span className="font-medium">{formatMoney(row.valueCents)} ({row.count})</span>
              </div>
              <div className="mt-1 h-3 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-3 rounded-full bg-primary"
                  style={{ width: `${Math.min(100, (row.valueCents / Math.max(analytics.pipelineValue, 1)) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <BrainCircuit className="h-5 w-5 text-primary" /> Funnel comercial canónico
            </h2>
          </div>
          <div className="space-y-3 p-4">
            {analytics.funnelRows.map((row) => (
              <FunnelStageCard key={row.key} row={row} />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Layers className="h-5 w-5 text-primary" /> Radar ejecutivo
            </h2>
          </div>
          <div className="space-y-4 p-4">
            <InsightCard
              title="Cobro comprometido"
              value={formatMoney(analytics.pendingInvoiceAmount)}
              description={`${analytics.pendingInvoiceCount} invoices siguen abiertas o vencidas.`}
            />
            <InsightCard
              title="Riesgos críticos"
              value={String(analytics.healthSnapshot.counts.critical)}
              description={`${analytics.healthSnapshot.counts.warning} alertas warning adicionales en el workspace.`}
            />
            <InsightCard
              title="Requests bajo presión"
              value={String(analytics.breachedTicketCount + analytics.atRiskTicketCount)}
              description={`${analytics.breachedTicketCount} breached · ${analytics.atRiskTicketCount} en riesgo de SLA.`}
            />
            <InsightCard
              title="Documentos en tránsito"
              value={String(analytics.documentsInTransit)}
              description="Contratos, propuestas y entregables todavía abiertos en el circuito documental."
            />
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Users className="h-5 w-5 text-primary" /> Portafolio por cliente
            </h2>
          </div>
          <div className="space-y-3 p-4">
            {analytics.clientRows.slice(0, 6).map((client) => (
              <ClientHealthCard key={client.id} row={client} />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <CalendarDays className="h-5 w-5 text-primary" /> Salud por proyecto
            </h2>
          </div>
          <div className="space-y-3 p-4">
            {analytics.projectRows.slice(0, 6).map((project) => (
              <ProjectHealthCard key={project.id} row={project} />
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <AlertTriangle className="h-5 w-5 text-primary" /> Riesgos accionables
            </h2>
          </div>
          <div className="space-y-3 p-4">
            {analytics.healthSnapshot.issues.length > 0 ? analytics.healthSnapshot.issues.slice(0, 6).map((issue) => (
              <RiskIssueCard
                key={issue.id}
                severity={issue.severity}
                title={issue.title}
                message={issue.message}
                actionLabel={issue.actionLabel}
                actionPath={issue.actionPath}
              />
            )) : (
              <div className="rounded-xl border border-dashed border-border bg-secondary/10 p-4 text-sm text-muted-foreground">
                No hay riesgos accionables activos en este momento.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <ShieldAlert className="h-5 w-5 text-primary" /> Salud modular
            </h2>
          </div>
          <div className="space-y-3 p-4">
            {analytics.healthSnapshot.modules.map((module) => (
              <ModuleHealthCard
                key={module.key}
                label={module.label}
                path={module.path}
                status={module.status}
                issueCount={module.issueCount}
                summary={module.summary}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon: Icon }: { title: string; value: string; subtitle: string; icon: typeof DollarSign }) {
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

function InsightCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <span className="text-sm font-semibold text-primary">{value}</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function FunnelStageCard({ row }: { row: FunnelRow }) {
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{row.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{row.subtitle}</p>
        </div>
        <span className="rounded-full border border-border bg-background px-2 py-1 text-xs font-semibold text-primary">
          {formatNumber(row.count)}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(6, row.share)}%` }}></div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>Bruto {formatMoney(row.valueCents)}</span>
        <span>Ponderado {formatMoney(row.weightedValueCents)}</span>
        <span>{row.share}% del funnel</span>
      </div>
    </div>
  );
}

function ClientHealthCard({ row }: { row: ClientHealthRow }) {
  const tone = getScoreToneMeta(row.status);

  return (
    <div className="rounded-xl border border-border/60 bg-secondary/20 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{row.name}</p>
            <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${tone.className}`}>
              {tone.label}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {row.phaseLabel} · {formatNumber(row.projectCount)} proyectos · {formatNumber(row.openTicketCount)} tickets abiertos
          </p>
        </div>
        <div className="text-left md:text-right">
          <p className="text-xl font-semibold tracking-tight text-foreground">{row.score}/100</p>
          <p className="text-[11px] text-muted-foreground">TCV {formatMoney(row.totalInvestmentCents)}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>{row.portalLabel}</span>
        <span>{row.billingLabel}</span>
        <span>Última actividad {formatDateTime(row.lastActivityAt)}</span>
      </div>
      {row.signals.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {row.signals.map((signal) => (
            <span key={signal} className="rounded-full border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground">
              {signal}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ProjectHealthCard({ row }: { row: ProjectHealthRow }) {
  const tone = getScoreToneMeta(row.status);

  return (
    <div className="rounded-xl border border-border/60 bg-secondary/20 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{row.name}</p>
            <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${tone.className}`}>
              {tone.label}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {row.clientName ?? "Sin cliente"} · {row.progress}% avance · {formatNumber(row.openTasks)} tareas abiertas
          </p>
        </div>
        <div className="text-left md:text-right">
          <p className="text-xl font-semibold tracking-tight text-foreground">{row.score}/100</p>
          <p className="text-[11px] text-muted-foreground">{row.milestoneLabel}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>Próximo hito {formatDateTime(row.nextEventAt)}</span>
        <span>Actualizado {formatDateTime(row.updatedAt)}</span>
      </div>
      {row.signals.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {row.signals.map((signal) => (
            <span key={signal} className="rounded-full border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground">
              {signal}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function RiskIssueCard({
  severity,
  title,
  message,
  actionLabel,
  actionPath,
}: {
  severity: "warning" | "critical";
  title: string;
  message: string;
  actionLabel: string;
  actionPath: string;
}) {
  const tone = severity === "critical"
    ? "border-destructive/30 bg-destructive/5 text-destructive"
    : "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300";

  return (
    <div className={`rounded-xl border p-4 ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
        </div>
        <span className="rounded-full border border-current/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide">
          {severity === "critical" ? "Critical" : "Warning"}
        </span>
      </div>
      <div className="mt-3">
        <Link className="text-xs font-semibold uppercase tracking-wide underline-offset-4 hover:underline" href={actionPath}>
          {actionLabel}
        </Link>
      </div>
    </div>
  );
}

function ModuleHealthCard({
  label,
  path,
  status,
  issueCount,
  summary,
}: {
  label: string;
  path: string;
  status: ScoreStatus;
  issueCount: number;
  summary: string;
}) {
  const tone = getScoreToneMeta(status);

  return (
    <Link href={path} className="block rounded-xl border border-border/60 bg-secondary/20 p-4 transition-colors hover:border-primary/30 hover:bg-primary/5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="mt-1 text-sm text-muted-foreground">{summary}</p>
        </div>
        <div className="text-right">
          <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${tone.className}`}>
            {tone.label}
          </span>
          <p className="mt-2 text-xs text-muted-foreground">{formatNumber(issueCount)} issues</p>
        </div>
      </div>
    </Link>
  );
}

function buildAnalyticsModel(snapshot: WorkspaceSnapshot) {
  const healthSnapshot = buildWorkspaceHealthSnapshot(snapshot);
  const income = snapshot.transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amountCents, 0);
  const expenses = snapshot.transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amountCents, 0);
  const netCash = income - expenses;
  const pipelineValue = snapshot.deals.reduce((total, deal) => total + deal.valueCents, 0);
  const weightedPipeline = snapshot.deals.reduce((total, deal) => total + Math.round((deal.valueCents * deal.probability) / 100), 0);
  const pendingInvoices = snapshot.invoices.filter((invoice) => isOutstandingInvoiceStatus(invoice.status));
  const breachedTicketCount = snapshot.tickets.filter((ticket) => ticket.slaStatus === "breached").length;
  const atRiskTicketCount = snapshot.tickets.filter((ticket) => ticket.slaStatus === "at_risk").length;
  const documentsInTransit = snapshot.documents.filter((document) => isDocumentInTransitStatus(document.status)).length;
  const operationalClients = getOperationalClients(snapshot);
  const operationalProjects = getOperationalProjects(snapshot);
  const clientRows = buildClientHealthRows(snapshot, operationalClients);
  const projectRows = buildProjectHealthRows(snapshot, operationalProjects);
  const activePortalClients = operationalClients.filter((client) => client.portalAccessActive).length;
  const recentPortalClients = operationalClients.filter((client) => isRecentDate(client.portalLastLoginAt, 14)).length;
  const invoiceDocumentCoverageCount = snapshot.invoices.filter((invoice) => Boolean(invoice.documentId)).length;
  const portalAdoptionRate = ratioPercent(activePortalClients, operationalClients.length);
  const invoiceDocumentCoverageRate = ratioPercent(invoiceDocumentCoverageCount, snapshot.invoices.length);

  return {
    healthSnapshot,
    income,
    expenses,
    netCash,
    pipelineValue,
    weightedPipeline,
    pendingInvoiceAmount: pendingInvoices.reduce((total, invoice) => total + invoice.amountCents, 0),
    pendingInvoiceCount: pendingInvoices.length,
    breachedTicketCount,
    atRiskTicketCount,
    documentsInTransit,
    clientRows,
    projectRows,
    averageClientScore: averageScore(clientRows),
    averageProjectScore: averageScore(projectRows),
    portalAdoptionRate,
    portalAdoptionSubtitle: operationalClients.length > 0
      ? `${formatNumber(activePortalClients)} de ${formatNumber(operationalClients.length)} cuentas operativas con portal activo · ${formatNumber(recentPortalClients)} con uso reciente`
      : "Sin cuentas operativas con delivery todavía.",
    invoiceDocumentCoverageRate,
    invoiceCoverageSubtitle: snapshot.invoices.length > 0
      ? `${formatNumber(invoiceDocumentCoverageCount)} de ${formatNumber(snapshot.invoices.length)} invoices con documento vinculado`
      : "Sin invoices registradas todavía.",
    funnelRows: buildFunnelRows(snapshot),
  };
}

function buildClientHealthRows(snapshot: WorkspaceSnapshot, clients: WorkspaceClientRecord[]): ClientHealthRow[] {
  const overdueInvoicesByClient = buildCountMap(snapshot.invoices.filter((invoice) => normalize(invoice.status) === "overdue"), (invoice) => invoice.clientId);
  const invoicesWithoutDocumentByClient = buildCountMap(snapshot.invoices.filter((invoice) => !invoice.documentId), (invoice) => invoice.clientId);

  return [...clients]
    .map((client) => {
      const paymentDenominator = Math.max(client.paidCents + client.pendingCents, client.totalInvestmentCents, 0);
      let billingScore = paymentDenominator === 0 ? 25 : Math.max(5, Math.round((client.paidCents / Math.max(paymentDenominator, 1)) * 25));
      const overdueCount = overdueInvoicesByClient.get(client.id) ?? 0;
      const invoiceGapCount = invoicesWithoutDocumentByClient.get(client.id) ?? 0;

      if (overdueCount > 0) {
        billingScore = Math.max(5, billingScore - 10);
      }

      if (invoiceGapCount > 0) {
        billingScore = Math.max(5, billingScore - 4);
      }

      const portalScore = client.projectCount === 0
        ? 15
        : !client.portalUserId
          ? 5
          : !client.portalAccessActive
            ? 10
            : isRecentDate(client.portalLastLoginAt, 14)
              ? 25
              : 18;
      const supportScore = client.openTicketCount === 0 ? 25 : client.openTicketCount === 1 ? 20 : client.openTicketCount === 2 ? 15 : client.openTicketCount >= 4 ? 5 : 10;
      const activityDays = getDaysSince(client.lastActivityAt);
      const activityScore = client.projectCount === 0 && client.taskCount === 0
        ? 15
        : activityDays === null
          ? 10
          : activityDays <= 7
            ? 25
            : activityDays <= 21
              ? 18
              : activityDays <= 45
                ? 12
                : 6;
      const score = clampScore(billingScore + portalScore + supportScore + activityScore);
      const signals = [
        overdueCount > 0 ? `${formatNumber(overdueCount)} cobros vencidos` : null,
        invoiceGapCount > 0 ? `${formatNumber(invoiceGapCount)} invoices sin documento` : null,
        client.projectCount > 0 && !client.portalUserId ? "Portal pendiente" : null,
        client.portalAccessActive && !isRecentDate(client.portalLastLoginAt, 14) ? "Portal sin uso reciente" : null,
        client.openTicketCount >= 2 ? `${formatNumber(client.openTicketCount)} tickets abiertos` : null,
        activityDays !== null && activityDays > 21 ? "Actividad baja" : null,
      ].filter((signal): signal is string => Boolean(signal));

      return {
        id: client.id,
        name: client.name,
        phaseLabel: client.company ?? client.phase ?? client.status,
        projectCount: client.projectCount,
        openTicketCount: client.openTicketCount,
        lastActivityAt: client.lastActivityAt,
        portalLabel: client.portalUserId
          ? client.portalAccessActive
            ? isRecentDate(client.portalLastLoginAt, 14)
              ? "Portal activo con uso reciente"
              : "Portal activo con baja adopción"
            : "Portal provisionado sin acceso activo"
          : "Portal todavía no provisionado",
        billingLabel: client.pendingCents > 0
          ? `Pendiente ${formatMoney(client.pendingCents)}`
          : `Pagado ${formatMoney(client.paidCents)}`,
        totalInvestmentCents: client.totalInvestmentCents,
        pendingCents: client.pendingCents,
        score,
        status: getScoreStatus(score),
        signals: signals.slice(0, 3),
      };
    })
    .sort((left, right) => left.score - right.score || right.pendingCents - left.pendingCents || right.openTicketCount - left.openTicketCount);
}

function buildProjectHealthRows(snapshot: WorkspaceSnapshot, projects: WorkspaceProjectRecord[]): ProjectHealthRow[] {
  const unownedExecutionTasksByProject = buildCountMap(
    snapshot.tasks.filter((task) => executionTaskStatuses.has(normalize(task.status)) && !task.owner),
    (task) => task.projectId,
  );
  const overdueInvoicesByProject = buildCountMap(snapshot.invoices.filter((invoice) => normalize(invoice.status) === "overdue"), (invoice) => invoice.projectId);
  const invoicesWithoutDocumentByProject = buildCountMap(snapshot.invoices.filter((invoice) => !invoice.documentId), (invoice) => invoice.projectId);
  const nextEventByProject = buildUpcomingEventMap(snapshot);

  return [...projects]
    .map((project) => {
      const unownedExecutionTasks = unownedExecutionTasksByProject.get(project.id) ?? 0;
      const overdueInvoices = overdueInvoicesByProject.get(project.id) ?? 0;
      const invoiceGapCount = invoicesWithoutDocumentByProject.get(project.id) ?? 0;
      const nextEventAt = nextEventByProject.get(project.id) ?? null;
      const progressScore = Math.round(project.progress / 5);
      const executionScore = project.openTasks === 0 ? 18 : unownedExecutionTasks === 0 ? 20 : unownedExecutionTasks === 1 ? 14 : unownedExecutionTasks >= 3 ? 6 : 10;
      const milestoneScore = project.milestoneCount === 0 ? 12 : Math.round((project.completedMilestones / Math.max(project.milestoneCount, 1)) * 20);
      const coordinationScore = nextEventAt ? 20 : isRecentDate(project.updatedAt, 14) ? 14 : 8;
      let financeScore = 20;

      if (overdueInvoices > 0) {
        financeScore -= 10;
      }

      if (invoiceGapCount > 0) {
        financeScore -= 5;
      }

      financeScore = Math.max(5, financeScore);

      const score = clampScore(progressScore + executionScore + milestoneScore + coordinationScore + financeScore);
      const signals = [
        unownedExecutionTasks > 0 ? `${formatNumber(unownedExecutionTasks)} tareas activas sin owner` : null,
        overdueInvoices > 0 ? `${formatNumber(overdueInvoices)} cobros vencidos` : null,
        invoiceGapCount > 0 ? `${formatNumber(invoiceGapCount)} invoices sin soporte` : null,
        !nextEventAt ? "Sin próximo hito agendado" : null,
        project.openTasks >= 5 ? `${formatNumber(project.openTasks)} tareas abiertas` : null,
      ].filter((signal): signal is string => Boolean(signal));

      return {
        id: project.id,
        name: project.name,
        clientName: project.clientName,
        progress: project.progress,
        openTasks: project.openTasks,
        milestoneLabel: project.milestoneCount > 0
          ? `${formatNumber(project.completedMilestones)}/${formatNumber(project.milestoneCount)} milestones cerrados`
          : "Sin milestones persistidos",
        nextEventAt,
        updatedAt: project.updatedAt,
        score,
        status: getScoreStatus(score),
        signals: signals.slice(0, 3),
      };
    })
    .sort((left, right) => left.score - right.score || right.openTasks - left.openTasks);
}

function buildFunnelRows(snapshot: WorkspaceSnapshot): FunnelRow[] {
  const totalDeals = snapshot.deals.length;

  return dealPipelineGroups.map((group) => {
    const deals = snapshot.deals.filter((deal) => getDealPipelineGroup(deal.stage).key === group.key);
    const valueCents = deals.reduce((total, deal) => total + deal.valueCents, 0);
    const weightedValueCents = deals.reduce((total, deal) => total + Math.round((deal.valueCents * deal.probability) / 100), 0);

    return {
      key: group.key,
      title: group.title,
      subtitle: group.subtitle,
      count: deals.length,
      valueCents,
      weightedValueCents,
      share: ratioPercent(deals.length, totalDeals),
    };
  });
}

function getOperationalClients(snapshot: WorkspaceSnapshot) {
  const candidates = snapshot.clients.filter(
    (client) => client.projectCount > 0 || client.totalInvestmentCents > 0 || client.openTicketCount > 0 || Boolean(client.portalUserId),
  );

  return candidates.length > 0 ? candidates : snapshot.clients;
}

function getOperationalProjects(snapshot: WorkspaceSnapshot) {
  const candidates = snapshot.projects.filter((project) => !inactiveProjectStatuses.has(normalize(project.status)));
  return candidates.length > 0 ? candidates : snapshot.projects;
}

function buildCountMap<T>(items: T[], getKey: (item: T) => string | null | undefined) {
  const map = new Map<string, number>();

  for (const item of items) {
    const key = getKey(item);

    if (!key) {
      continue;
    }

    map.set(key, (map.get(key) ?? 0) + 1);
  }

  return map;
}

function buildUpcomingEventMap(snapshot: WorkspaceSnapshot) {
  const now = Date.now();
  const nextEventByProject = new Map<string, string>();

  for (const event of snapshot.events) {
    if (!event.projectId) {
      continue;
    }

    const timestamp = new Date(event.startsAt).getTime();

    if (Number.isNaN(timestamp) || timestamp < now) {
      continue;
    }

    const current = nextEventByProject.get(event.projectId);

    if (!current || timestamp < new Date(current).getTime()) {
      nextEventByProject.set(event.projectId, event.startsAt);
    }
  }

  return nextEventByProject;
}

function averageScore(rows: Array<{ score: number }>) {
  if (rows.length === 0) {
    return 0;
  }

  return Math.round(rows.reduce((total, row) => total + row.score, 0) / rows.length);
}

function ratioPercent(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getScoreStatus(score: number): ScoreStatus {
  if (score >= 80) {
    return "healthy";
  }

  if (score >= 60) {
    return "warning";
  }

  return "critical";
}

function getScoreToneMeta(status: ScoreStatus) {
  if (status === "healthy") {
    return {
      label: "Healthy",
      className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    };
  }

  if (status === "warning") {
    return {
      label: "Warning",
      className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    };
  }

  return {
    label: "Critical",
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  };
}

function isRecentDate(value: string | null, days: number) {
  const diff = getDaysSince(value);
  return diff !== null && diff <= days;
}

function getDaysSince(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return Math.floor((Date.now() - parsed.getTime()) / 86_400_000);
}

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}
