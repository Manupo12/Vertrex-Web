import { readApprovalFromMetadata } from "@/lib/ops/approval-governance";
import type { WorkspaceSnapshot } from "@/lib/ops/workspace-service";

export const workspaceHealthModuleMeta = {
  projects: { label: "Proyectos", path: "/os/projects" },
  documents: { label: "Documentos", path: "/os/docs" },
  assets: { label: "Recursos", path: "/os/assets" },
  hub: { label: "Knowledge Hub", path: "/os/hub" },
  crm: { label: "CRM", path: "/os/crm" },
  finance: { label: "Finanzas", path: "/os/finance" },
  calendar: { label: "Agenda", path: "/os/calendar" },
  chat: { label: "Chat", path: "/os/chat" },
  vault: { label: "Vault", path: "/os/vault" },
  clients: { label: "Clientes", path: "/os/clients" },
  tickets: { label: "Tickets", path: "/os/tickets" },
} as const;

export type WorkspaceHealthModuleKey = keyof typeof workspaceHealthModuleMeta;
export type WorkspaceHealthStatus = "healthy" | "warning" | "critical";
export type WorkspaceHealthIssueSeverity = "warning" | "critical";

export type WorkspaceHealthIssue = {
  id: string;
  module: WorkspaceHealthModuleKey;
  severity: WorkspaceHealthIssueSeverity;
  title: string;
  message: string;
  actionLabel: string;
  actionPath: string;
  entityType?: string;
  entityId?: string;
};

export type WorkspaceHealthModuleSnapshot = {
  key: WorkspaceHealthModuleKey;
  label: string;
  path: string;
  status: WorkspaceHealthStatus;
  issueCount: number;
  criticalCount: number;
  warningCount: number;
  summary: string;
};

export type ProjectHealthScore = {
  projectId: string;
  projectName: string;
  score: number;
  maxScore: number;
  status: WorkspaceHealthStatus;
  reasons: string[];
};

export type ClientHealthScore = {
  clientId: string;
  clientName: string;
  score: number;
  maxScore: number;
  status: WorkspaceHealthStatus;
  reasons: string[];
};

export type WorkspaceHealthSnapshot = {
  generatedAt: string;
  overallStatus: WorkspaceHealthStatus;
  counts: {
    critical: number;
    warning: number;
    total: number;
  };
  modules: WorkspaceHealthModuleSnapshot[];
  issues: WorkspaceHealthIssue[];
  projectScores: ProjectHealthScore[];
  clientScores: ClientHealthScore[];
};

const inactiveProjectStatuses = new Set(["completed", "done", "archived", "cancelled", "canceled", "paused"]);
const executionTaskStatuses = new Set(["in_progress", "review", "blocked"]);
const openTicketStatuses = new Set(["open", "in_progress"]);
const requestedCredentialStatuses = new Set(["requested", "pending"]);

export const emptyWorkspaceHealthSnapshot: WorkspaceHealthSnapshot = {
  generatedAt: new Date(0).toISOString(),
  overallStatus: "healthy",
  counts: {
    critical: 0,
    warning: 0,
    total: 0,
  },
  modules: Object.entries(workspaceHealthModuleMeta).map(([key, meta]) => ({
    key: key as WorkspaceHealthModuleKey,
    label: meta.label,
    path: meta.path,
    status: "healthy",
    issueCount: 0,
    criticalCount: 0,
    warningCount: 0,
    summary: "Sin alertas activas.",
  })),
  issues: [],
  projectScores: [],
  clientScores: [],
};

export function buildWorkspaceHealthSnapshot(snapshot: WorkspaceSnapshot): WorkspaceHealthSnapshot {
  const now = new Date();
  const issues: WorkspaceHealthIssue[] = [];

  const addIssue = (issue: WorkspaceHealthIssue) => {
    issues.push(issue);
  };

  const isSystemClient = (email: string | null) => Boolean(email && email.trim().toLowerCase().endsWith("@client.vertrex.co"));

  const operationalProjects = snapshot.projects.filter((project) => !inactiveProjectStatuses.has(normalize(project.status)));
  const overdueInvoices = snapshot.invoices.filter((invoice) => normalize(invoice.status) === "overdue");
  const invoicesWithoutDocument = snapshot.invoices.filter((invoice) => !invoice.documentId);
  const breachedTickets = snapshot.tickets.filter(
    (ticket) => openTicketStatuses.has(normalize(ticket.status)) && ticket.slaStatus === "breached",
  );
  const atRiskTickets = snapshot.tickets.filter(
    (ticket) => openTicketStatuses.has(normalize(ticket.status)) && ticket.slaStatus === "at_risk",
  );
  const ticketsWithoutProject = snapshot.tickets.filter(
    (ticket) => openTicketStatuses.has(normalize(ticket.status)) && !ticket.projectId,
  );
  const executionTasksWithoutOwner = snapshot.tasks.filter(
    (task) => executionTaskStatuses.has(normalize(task.status)) && !task.owner,
  );
  const hotDealsWithoutFollowup = snapshot.deals.filter((deal) => deal.probability >= 60 && !deal.lastContactAt);
  const hotDealsPastCloseDate = snapshot.deals.filter((deal) => {
    if (deal.probability < 60 || !deal.expectedCloseAt) {
      return false;
    }

    const expectedCloseAt = new Date(deal.expectedCloseAt);
    return !Number.isNaN(expectedCloseAt.getTime()) && expectedCloseAt.getTime() < now.getTime();
  });
  const upcomingEvents = snapshot.events.filter((event) => {
    const startsAt = new Date(event.startsAt);

    if (Number.isNaN(startsAt.getTime())) {
      return false;
    }

    const diff = startsAt.getTime() - now.getTime();
    return diff >= 0 && diff <= 7 * 86_400_000;
  });
  const orphanDocuments = snapshot.documents.filter((document) => !document.clientId && !document.projectId);
  if (orphanDocuments.length > 0) {
    addIssue({
      id: "documents-without-context",
      module: "documents",
      severity: "warning",
      title: "Documentos sin contexto",
      message: `${orphanDocuments.length} documento(s) no están asociados a cliente ni proyecto.`,
      actionLabel: "Revisar documentos",
      actionPath: "/os/docs",
      entityType: "document",
      entityId: orphanDocuments[0]?.id,
    });
  }

  const staleDraftDocuments = snapshot.documents.filter((document) => normalize(document.status) === "draft" && getDaysSince(document.updatedAt, now) !== null && getDaysSince(document.updatedAt, now)! >= 7);
  if (staleDraftDocuments.length > 0) {
    addIssue({
      id: "documents-stale-draft",
      module: "documents",
      severity: "warning",
      title: "Documentos en borrador prolongado",
      message: `${staleDraftDocuments.length} documento(s) llevan más de 7 días en borrador sin avance.`,
      actionLabel: "Revisar documentos",
      actionPath: "/os/docs",
      entityType: "document",
      entityId: staleDraftDocuments[0]?.id,
    });
  }

  const stalePortalClients = snapshot.clients.filter(
    (client) => !isSystemClient(client.email) && client.portalAccessActive && getDaysSince(client.portalLastLoginAt, now) !== null && getDaysSince(client.portalLastLoginAt, now)! >= 90,
  );
  if (stalePortalClients.length > 0) {
    addIssue({
      id: "clients-stale-portal-access",
      module: "clients",
      severity: "warning",
      title: "Acceso al portal inactivo",
      message: `${stalePortalClients.length} clientes no han accedido al portal en los últimos 90 días.`,
      actionLabel: "Revisar clientes",
      actionPath: "/os/clients",
      entityType: "client",
      entityId: stalePortalClients[0]?.id,
    });
  }
  const unsecuredCredentials = snapshot.credentials.filter(
    (credential) => !credential.hasSecret && !requestedCredentialStatuses.has(normalize(credential.status)),
  );
  const orphanCredentials = snapshot.credentials.filter((credential) => !credential.clientId && !credential.projectId);

  if (overdueInvoices.length > 0) {
    addIssue({
      id: "finance-overdue-invoices",
      module: "finance",
      severity: "critical",
      title: "Cobros vencidos",
      message: `${overdueInvoices.length} invoices siguen vencidas y requieren seguimiento inmediato.`,
      actionLabel: "Abrir finanzas",
      actionPath: "/os/finance",
      entityType: "invoice",
      entityId: overdueInvoices[0]?.id,
    });
  }

  if (invoicesWithoutDocument.length > 0) {
    addIssue({
      id: "documents-invoice-support-gap",
      module: "documents",
      severity: "warning",
      title: "Invoices sin soporte documental",
      message: `${invoicesWithoutDocument.length} invoices no tienen documento vinculado.`,
      actionLabel: "Revisar documentos",
      actionPath: "/os/docs",
      entityType: "invoice",
      entityId: invoicesWithoutDocument[0]?.id,
    });
  }

  if (breachedTickets.length > 0) {
    addIssue({
      id: "chat-sla-breached",
      module: "chat",
      severity: "critical",
      title: "SLA incumplido en soporte",
      message: `${breachedTickets.length} requests abiertas ya están fuera de SLA.`,
      actionLabel: "Abrir chat operativo",
      actionPath: "/os/chat",
      entityType: "ticket",
      entityId: breachedTickets[0]?.id,
    });
  }

  if (atRiskTickets.length > 0) {
    addIssue({
      id: "chat-sla-at-risk",
      module: "chat",
      severity: "warning",
      title: "Requests en riesgo de SLA",
      message: `${atRiskTickets.length} requests abiertas están entrando en zona de riesgo.`,
      actionLabel: "Priorizar requests",
      actionPath: "/os/chat",
      entityType: "ticket",
      entityId: atRiskTickets[0]?.id,
    });
  }

  if (ticketsWithoutProject.length > 0) {
    addIssue({
      id: "projects-tickets-without-project",
      module: "projects",
      severity: "warning",
      title: "Tickets sin proyecto vinculado",
      message: `${ticketsWithoutProject.length} tickets siguen abiertos sin contexto de proyecto.`,
      actionLabel: "Revisar tickets",
      actionPath: "/os/chat",
      entityType: "ticket",
      entityId: ticketsWithoutProject[0]?.id,
    });
  }

  if (executionTasksWithoutOwner.length > 0) {
    addIssue({
      id: "projects-tasks-without-owner",
      module: "projects",
      severity: "warning",
      title: "Tareas activas sin owner",
      message: `${executionTasksWithoutOwner.length} tareas en ejecución o review no tienen responsable asignado.`,
      actionLabel: "Abrir proyectos",
      actionPath: "/os/projects",
      entityType: "task",
      entityId: executionTasksWithoutOwner[0]?.id,
    });
  }

  if (hotDealsWithoutFollowup.length > 0) {
    addIssue({
      id: "crm-hot-deals-without-followup",
      module: "crm",
      severity: "warning",
      title: "Deals calientes sin seguimiento",
      message: `${hotDealsWithoutFollowup.length} deals con alta probabilidad no tienen último contacto registrado.`,
      actionLabel: "Abrir CRM",
      actionPath: "/os/crm",
      entityType: "deal",
      entityId: hotDealsWithoutFollowup[0]?.id,
    });
  }

  if (hotDealsPastCloseDate.length > 0) {
    addIssue({
      id: "crm-past-close-date",
      module: "crm",
      severity: "warning",
      title: "Deals fuera de fecha esperada",
      message: `${hotDealsPastCloseDate.length} deals de alta probabilidad ya pasaron su fecha estimada de cierre.`,
      actionLabel: "Actualizar pipeline",
      actionPath: "/os/crm",
      entityType: "deal",
      entityId: hotDealsPastCloseDate[0]?.id,
    });
  }

  if (operationalProjects.length > 0 && upcomingEvents.length === 0) {
    addIssue({
      id: "calendar-no-upcoming-events",
      module: "calendar",
      severity: "warning",
      title: "Agenda sin próximos hitos",
      message: `No hay eventos programados para los próximos 7 días sobre ${operationalProjects.length} proyectos operativos.`,
      actionLabel: "Abrir agenda",
      actionPath: "/os/calendar",
    });
  }

  if (!snapshot.storage.googleDriveConfigured) {
    addIssue({
      id: "assets-storage-not-configured",
      module: "assets",
      severity: "warning",
      title: "Storage híbrido incompleto",
      message: "Google Drive todavía no está configurado para la operación híbrida de archivos.",
      actionLabel: "Abrir assets",
      actionPath: "/os/assets",
    });
  }

  const requestedCredentials = snapshot.credentials.filter(
    (credential) => requestedCredentialStatuses.has(normalize(credential.status)),
  );

  if (requestedCredentials.length > 0) {
    addIssue({
      id: "vault-requested-credentials",
      module: "vault",
      severity: "warning",
      title: "Accesos pendientes",
      message: `${requestedCredentials.length} credenciales siguen en estado solicitado o pendiente.`,
      actionLabel: "Abrir vault",
      actionPath: "/os/vault",
      entityType: "credential",
      entityId: requestedCredentials[0]?.id,
    });
  }

  const plaintextCredentials = snapshot.credentials.filter(
    (credential) => credential.hasSecret === false && !requestedCredentialStatuses.has(normalize(credential.status)),
  );

  if (plaintextCredentials.length > 0) {
    addIssue({
      id: "vault-plaintext-secrets",
      module: "vault",
      severity: "critical",
      title: "Secretos sin cifrado server-side",
      message: `${plaintextCredentials.length} credenciales siguen con secreto legacy en texto plano dentro del vault operativo.`,
      actionLabel: "Abrir vault",
      actionPath: "/os/vault",
      entityType: "credential",
      entityId: plaintextCredentials[0]?.id,
    });
  }

  if (unsecuredCredentials.length > 0) {
    addIssue({
      id: "vault-unsecured-credentials",
      module: "vault",
      severity: unsecuredCredentials.length >= 3 ? "critical" : "warning",
      title: "Cobertura de secretos incompleta",
      message: `${unsecuredCredentials.length} credenciales activas no tienen secreto persistido en el vault.`,
      actionLabel: "Completar vault",
      actionPath: "/os/vault",
      entityType: "credential",
      entityId: unsecuredCredentials[0]?.id,
    });
  }

  if (orphanCredentials.length > 0) {
    addIssue({
      id: "vault-credentials-without-context",
      module: "vault",
      severity: "warning",
      title: "Credenciales sin contexto operativo",
      message: `${orphanCredentials.length} credenciales no están ligadas a cliente ni proyecto.`,
      actionLabel: "Ordenar vault",
      actionPath: "/os/vault",
      entityType: "credential",
      entityId: orphanCredentials[0]?.id,
    });
  }

  if (stalePortalClients.length > 0) {
    addIssue({
      id: "chat-portal-inactive-clients",
      module: "chat",
      severity: "warning",
      title: "Portal con baja actividad",
      message: `${stalePortalClients.length} clientes con portal activo no registran acceso reciente.`,
      actionLabel: "Revisar comunicación",
      actionPath: "/os/chat",
      entityType: "client",
      entityId: stalePortalClients[0]?.id,
    });
  }

  const clientsWithoutProjects = snapshot.clients.filter(
    (client) => !isSystemClient(client.email) && snapshot.projects.every((project) => project.clientId !== client.id),
  );
  if (clientsWithoutProjects.length > 0) {
    addIssue({
      id: "crm-clients-without-projects",
      module: "crm",
      severity: "warning",
      title: "Clientes sin proyectos",
      message: `${clientsWithoutProjects.length} clientes activos no tienen proyectos asignados.`,
      actionLabel: "Revisar CRM",
      actionPath: "/os/crm",
      entityType: "client",
      entityId: clientsWithoutProjects[0]?.id,
    });
  }

  const operationalProjectsWithoutTasks = operationalProjects.filter(
    (project) => !snapshot.tasks.some((task) => task.projectId === project.id),
  );
  if (operationalProjectsWithoutTasks.length > 0) {
    addIssue({
      id: "projects-without-tasks",
      module: "projects",
      severity: "warning",
      title: "Proyectos operativos sin tareas",
      message: `${operationalProjectsWithoutTasks.length} proyectos activos no tienen tareas registradas.`,
      actionLabel: "Revisar proyectos",
      actionPath: "/os/projects",
      entityType: "project",
      entityId: operationalProjectsWithoutTasks[0]?.id,
    });
  }

  const operationalProjectsWithoutLinks = operationalProjects.filter(
    (project) => !snapshot.links.some((link) => link.projectId === project.id),
  );
  if (operationalProjectsWithoutLinks.length > 0) {
    addIssue({
      id: "projects-without-links",
      module: "hub",
      severity: "warning",
      title: "Proyectos operativos sin links",
      message: `${operationalProjectsWithoutLinks.length} proyectos activos no tienen links asociados.`,
      actionLabel: "Revisar Hub",
      actionPath: "/os/hub",
      entityType: "project",
      entityId: operationalProjectsWithoutLinks[0]?.id,
    });
  }

  const linksWithoutContext = snapshot.links.filter((link) => !link.clientId && !link.projectId);
  if (linksWithoutContext.length > 0) {
    addIssue({
      id: "hub-links-without-context",
      module: "hub",
      severity: "warning",
      title: "Links sin contexto",
      message: `${linksWithoutContext.length} link(s) no están asociados a cliente ni proyecto.`,
      actionLabel: "Revisar Hub",
      actionPath: "/os/hub",
      entityType: "link",
      entityId: linksWithoutContext[0]?.id,
    });
  }

  const pendingApprovals = [
    ...snapshot.milestones
      .map((milestone) => ({ record: milestone, approval: readApprovalFromMetadata(milestone.metadata) }))
      .filter((item) => item.approval?.status === "pending")
      .map((item) => ({ type: "milestone" as const, name: item.record.title, id: item.record.id })),
    ...snapshot.tickets
      .map((ticket) => ({ record: ticket, approval: readApprovalFromMetadata(ticket.metadata) }))
      .filter((item) => item.approval?.status === "pending")
      .map((item) => ({ type: "ticket" as const, name: item.record.title, id: item.record.id })),
  ];

  if (pendingApprovals.length > 0) {
    addIssue({
      id: "projects-pending-approvals",
      module: "projects",
      severity: pendingApprovals.length >= 5 ? "critical" : "warning",
      title: "Aprobaciones pendientes",
      message: `${pendingApprovals.length} elementos requieren aprobación (${pendingApprovals.filter((item) => item.type === "milestone").length} milestones, ${pendingApprovals.filter((item) => item.type === "ticket").length} tickets).`,
      actionLabel: "Revisar aprobaciones",
      actionPath: "/os/projects",
    });
  }

  const orderedIssues = issues.sort((left, right) => {
    if (left.severity === right.severity) {
      return left.title.localeCompare(right.title, "es");
    }

    return left.severity === "critical" ? -1 : 1;
  });

  const modules = Object.entries(workspaceHealthModuleMeta).map(([key, meta]) => {
    const moduleIssues = orderedIssues.filter((issue) => issue.module === key);
    const criticalCount = moduleIssues.filter((issue) => issue.severity === "critical").length;
    const warningCount = moduleIssues.length - criticalCount;
    const status: WorkspaceHealthStatus = criticalCount > 0 ? "critical" : warningCount > 0 ? "warning" : "healthy";

    return {
      key: key as WorkspaceHealthModuleKey,
      label: meta.label,
      path: meta.path,
      status,
      issueCount: moduleIssues.length,
      criticalCount,
      warningCount,
      summary:
        moduleIssues[0]?.message
        ?? (status === "healthy" ? "Sin alertas activas." : "Hay señales que requieren revisión."),
    } satisfies WorkspaceHealthModuleSnapshot;
  });

  const criticalCount = orderedIssues.filter((issue) => issue.severity === "critical").length;
  const warningCount = orderedIssues.length - criticalCount;
  const overallStatus: WorkspaceHealthStatus = criticalCount > 0 ? "critical" : warningCount > 0 ? "warning" : "healthy";

  const projectScores = computeProjectHealthScores(snapshot, now);
  const clientScores = computeClientHealthScores(snapshot, now);

  return {
    generatedAt: new Date().toISOString(),
    overallStatus,
    counts: {
      critical: criticalCount,
      warning: warningCount,
      total: orderedIssues.length,
    },
    modules,
    issues: orderedIssues,
    projectScores,
    clientScores,
  };
}

function computeClientHealthScores(
  snapshot: WorkspaceSnapshot,
  now: Date,
): ClientHealthScore[] {
  const isSystemClient = (email: string | null) => Boolean(email && email.trim().toLowerCase().endsWith("@client.vertrex.co"));

  return snapshot.clients
    .filter((client) => !isSystemClient(client.email))
    .map((client) => {
      const reasons: string[] = [];
      let score = 100;
      const maxScore = 100;

      const clientProjects = snapshot.projects.filter((project) => project.clientId === client.id);
      const activeProjects = clientProjects.filter((project) => {
        const status = normalize(project.status);
        return status !== "completed" && status !== "done" && status !== "archived" && status !== "cancelled" && status !== "paused";
      });

      if (clientProjects.length === 0) {
        score -= 25;
        reasons.push("Sin proyectos asignados");
      }

      if (activeProjects.length === 0 && clientProjects.length > 0) {
        score -= 15;
        reasons.push("Sin proyectos activos");
      }

      const clientTickets = snapshot.tickets.filter((ticket) => ticket.clientId === client.id);
      const openBreachedTickets = clientTickets.filter(
        (ticket) => openTicketStatuses.has(normalize(ticket.status)) && ticket.slaStatus === "breached",
      );
      if (openBreachedTickets.length > 0) {
        score -= 20;
        reasons.push(`${openBreachedTickets.length} ticket(s) con SLA incumplido`);
      }

      const clientInvoices = snapshot.invoices.filter((invoice) => invoice.clientId === client.id);
      const overdueInvoices = clientInvoices.filter((invoice) => normalize(invoice.status) === "overdue");
      if (overdueInvoices.length > 0) {
        score -= 15;
        reasons.push(`${overdueInvoices.length} invoice(s) vencida(s)`);
      }

      const clientLinks = snapshot.links.filter((link) => link.clientId === client.id);
      if (clientLinks.length === 0) {
        score -= 5;
        reasons.push("Sin links asociados");
      }

      if (client.portalAccessActive) {
        const inactiveDays = getDaysSince(client.portalLastLoginAt, now);
        if (inactiveDays === null || inactiveDays >= 30) {
          score -= 10;
          reasons.push("Portal sin actividad reciente");
        }
      } else {
        score -= 5;
        reasons.push("Portal no activado");
      }

      if (score < 60) {
        return { clientId: client.id, clientName: client.name, score: Math.max(0, score), maxScore, status: "critical" as WorkspaceHealthStatus, reasons };
      }

      if (score < 80) {
        return { clientId: client.id, clientName: client.name, score: Math.max(0, score), maxScore, status: "warning" as WorkspaceHealthStatus, reasons };
      }

      return { clientId: client.id, clientName: client.name, score: Math.max(0, score), maxScore, status: "healthy" as WorkspaceHealthStatus, reasons: reasons.length > 0 ? reasons : ["En buen estado"] };
    });
}

function computeProjectHealthScores(
  snapshot: WorkspaceSnapshot,
  now: Date,
): ProjectHealthScore[] {
  const inactiveProjectStatuses = new Set(["completed", "done", "archived", "cancelled", "canceled", "paused"]);

  return snapshot.projects
    .filter((project) => !inactiveProjectStatuses.has(normalize(project.status)))
    .map((project) => {
      const reasons: string[] = [];
      let score = 100;
      const maxScore = 100;

      const projectTasks = snapshot.tasks.filter((task) => task.projectId === project.id);
      const openTasks = projectTasks.filter((task) => normalize(task.status) !== "done" && normalize(task.status) !== "completed");
      const tasksWithoutOwner = openTasks.filter((task) => !task.owner);

      if (openTasks.length === 0) {
        score -= 15;
        reasons.push("Sin tareas abiertas");
      }

      if (tasksWithoutOwner.length > 0) {
        score -= 20;
        reasons.push(`${tasksWithoutOwner.length} tarea(s) sin responsable`);
      }

      const projectMilestones = snapshot.milestones.filter((milestone) => milestone.projectId === project.id);
      if (projectMilestones.length === 0) {
        score -= 10;
        reasons.push("Sin milestones definidos");
      }

      const projectEvents = snapshot.events.filter((event) => event.projectId === project.id);
      const hasUpcomingEvent = projectEvents.some((event) => {
        const startsAt = new Date(event.startsAt);
        return !Number.isNaN(startsAt.getTime()) && startsAt.getTime() > now.getTime();
      });
      if (!hasUpcomingEvent) {
        score -= 5;
        reasons.push("Sin eventos próximos");
      }

      const projectLinks = snapshot.links.filter((link) => link.projectId === project.id);
      if (projectLinks.length === 0) {
        score -= 5;
        reasons.push("Sin links asociados");
      }

      if (score < 60) {
        return { projectId: project.id, projectName: project.name, score: Math.max(0, score), maxScore, status: "critical" as WorkspaceHealthStatus, reasons };
      }

      if (score < 80) {
        return { projectId: project.id, projectName: project.name, score: Math.max(0, score), maxScore, status: "warning" as WorkspaceHealthStatus, reasons };
      }

      return { projectId: project.id, projectName: project.name, score: Math.max(0, score), maxScore, status: "healthy" as WorkspaceHealthStatus, reasons: reasons.length > 0 ? reasons : ["En buen estado"] };
    });
}

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function getDaysSince(value: string | null | undefined, now: Date) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return (now.getTime() - parsed.getTime()) / 86_400_000;
}
