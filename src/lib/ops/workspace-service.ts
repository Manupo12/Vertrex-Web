import bcrypt from "bcryptjs";
import { and, desc, eq, gt } from "drizzle-orm";

import { buildOsAgentReply } from "@/lib/ai/os-agent";
import { recordAuditEvent, type AuditActorInput } from "@/lib/audit/audit-service";
import { getDb, isDatabaseConfigured, schema } from "@/lib/db";
import { recordBusinessEvent } from "@/lib/ops/business-event-service";
import { normalizeDealStage } from "@/lib/ops/deal-stages";
import {
  evaluateWorkspaceTicketSla,
  getWorkspaceRequestTypeLabel,
  inferWorkspaceRequestType,
  type WorkspaceRequestType,
  type WorkspaceSlaStatus,
} from "@/lib/ops/request-governance";
import {
  hasVaultSecret,
  resolveVaultSecretStorageMode,
  writeVaultSecretMetadata,
} from "@/lib/security/vault-secret";
import {
  getStorageConnectionSummary,
  resolveStoredAssetHref,
  storeAssetFile,
  type AssetStorageTarget,
} from "@/lib/storage/asset-storage";
import {
  isOpenTaskStatus,
  isOutstandingInvoiceStatus,
  type WorkspaceInvoiceStatusValue,
  type WorkspaceTaskStatusValue,
} from "@/lib/ops/status-catalog";

export type WorkspaceClientRecord = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  email: string | null;
  company: string | null;
  status: string;
  phase: string | null;
  progress: number;
  totalInvestmentCents: number;
  paidCents: number;
  pendingCents: number;
  projectCount: number;
  taskCount: number;
  openTicketCount: number;
  lastActivityAt: string | null;
  portalUserId: string | null;
  portalUserName: string | null;
  portalUserEmail: string | null;
  portalAccessActive: boolean;
  portalLastLoginAt: string | null;
  activePortalSessions: number;
  metadata?: Record<string, unknown>;
};

export type WorkspaceProjectTrack = "commercial" | "community" | "roadmap";

export type WorkspaceProjectRecord = {
  id: string;
  clientId: string | null;
  clientName: string | null;
  clientSlug: string | null;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  startDate: string | null;
  endDate: string | null;
  openTasks: number;
  milestoneCount: number;
  completedMilestones: number;
  updatedAt: string;
};

export type WorkspaceTaskRecord = {
  id: string;
  clientId: string | null;
  clientName: string | null;
  projectId: string | null;
  projectName: string | null;
  title: string;
  owner: string | null;
  status: string;
  dueLabel: string | null;
  updatedAt: string;
};

export type WorkspaceMilestoneStatus = "pending" | "in_progress" | "under_review" | "approved" | "completed" | "blocked" | "skipped";

export type WorkspaceMilestoneRecord = {
  id: string;
  clientId: string | null;
  clientName: string | null;
  projectId: string;
  projectName: string | null;
  title: string;
  description: string | null;
  status: WorkspaceMilestoneStatus;
  targetDate: string | null;
  completedAt: string | null;
  clientVisible: boolean;
  weight: number;
  orderIndex: number;
  updatedAt: string;
  metadata: Record<string, unknown>;
};

export type WorkspaceDealRecord = {
  id: string;
  clientId: string | null;
  clientName: string | null;
  projectId: string | null;
  projectName: string | null;
  title: string;
  stage: string;
  billingModel: string;
  valueCents: number;
  probability: number;
  owner: string | null;
  summary: string | null;
  lastContactAt: string | null;
  expectedCloseAt: string | null;
  updatedAt: string;
};

export type WorkspaceEventRecord = {
  id: string;
  clientId: string | null;
  clientName: string | null;
  projectId: string | null;
  projectName: string | null;
  title: string;
  description: string | null;
  kind: string;
  location: string | null;
  meetUrl: string | null;
  startsAt: string;
  endsAt: string;
  attendees: string[];
};

export type WorkspaceFileRecord = {
  id: string;
  clientId: string | null;
  clientName: string | null;
  clientSlug: string | null;
  projectId: string | null;
  projectName: string | null;
  name: string;
  category: string | null;
  source: "client" | "vertrex";
  provider: string;
  sizeLabel: string | null;
  uploadedAt: string;
  href: string | null;
  storageKey: string | null;
};

export type WorkspaceLinkRecord = {
  id: string;
  clientId: string | null;
  clientName: string | null;
  projectId: string | null;
  projectName: string | null;
  title: string;
  url: string;
  kind: string;
  description: string | null;
  imageUrl: string | null;
  domain: string | null;
  updatedAt: string;
};

export type WorkspaceTicketRecord = {
  id: string;
  clientId: string | null;
  clientName: string | null;
  projectId: string | null;
  projectName: string | null;
  title: string;
  summary: string | null;
  status: string;
  requestType: WorkspaceRequestType;
  requestTypeLabel: string;
  slaStatus: WorkspaceSlaStatus;
  slaLabel: string;
  slaWindowLabel: string;
  priority: string | null;
  assignedTo: string | null;
  channel: string | null;
  updatedAt: string;
  metadata: Record<string, unknown>;
};

export type WorkspaceInvoiceRecord = {
  id: string;
  clientId: string | null;
  clientName: string | null;
  projectId: string | null;
  projectName: string | null;
  documentId: string | null;
  label: string;
  invoiceNumber: string;
  amountCents: number;
  dueDate: string | null;
  dueLabel: string | null;
  status: string;
  updatedAt: string;
};

export type WorkspaceCredentialRecord = {
  id: string;
  clientId: string | null;
  clientName: string | null;
  projectId: string | null;
  projectName: string | null;
  title: string;
  scope: string | null;
  status: string;
  linkUrl: string | null;
  hasSecret: boolean;
  secretStorage: "none" | "plaintext" | "encrypted";
  updatedAt: string;
};

export type WorkspaceDocumentRecord = {
  id: string;
  clientId: string | null;
  clientName: string | null;
  projectId: string | null;
  projectName: string | null;
  code: string;
  title: string;
  status: string;
  category: string;
  origin: string;
  summary: string | null;
  currentVersion: number;
  createdAt: string;
  sentAt: string | null;
  updatedAt: string;
  href: string;
  pdfHref: string;
};

export type WorkspaceTransactionRecord = {
  id: string;
  clientId: string | null;
  clientName: string | null;
  projectId: string | null;
  projectName: string | null;
  type: string;
  amountCents: number;
  category: string | null;
  description: string | null;
  occurredAt: string;
};

export type WorkspaceMessageRecord = {
  id: string;
  clientId: string | null;
  clientName: string | null;
  senderRole: string;
  senderName: string;
  channel: string;
  message: string;
  createdAt: string;
};

export type WorkspaceAutomationPlaybookStatus = "draft" | "active" | "paused";

export type WorkspaceAutomationRunStatus = "queued" | "running" | "completed" | "needs_review" | "failed";

export type WorkspaceAutomationPlaybookRecord = {
  id: string;
  clientId: string | null;
  clientName: string | null;
  projectId: string | null;
  projectName: string | null;
  title: string;
  trigger: string;
  action: string;
  result: string | null;
  summary: string | null;
  status: WorkspaceAutomationPlaybookStatus;
  lastRunAt: string | null;
  lastRunStatus: WorkspaceAutomationRunStatus | null;
  recentRunCount: number;
  updatedAt: string;
};

export type WorkspaceAutomationRunRecord = {
  id: string;
  playbookId: string | null;
  playbookTitle: string | null;
  clientId: string | null;
  clientName: string | null;
  projectId: string | null;
  projectName: string | null;
  title: string;
  status: WorkspaceAutomationRunStatus;
  triggerSource: string | null;
  summary: string;
  startedAt: string;
  finishedAt: string | null;
  updatedAt: string;
};

export type WorkspaceSnapshot = {
  databaseConfigured: boolean;
  storage: ReturnType<typeof getStorageConnectionSummary>;
  summary: {
    clients: number;
    activeClients: number;
    projects: number;
    openTasks: number;
    deals: number;
    upcomingEvents: number;
    pendingInvoices: number;
    tickets: number;
    files: number;
  };
  clients: WorkspaceClientRecord[];
  projects: WorkspaceProjectRecord[];
  tasks: WorkspaceTaskRecord[];
  milestones: WorkspaceMilestoneRecord[];
  deals: WorkspaceDealRecord[];
  events: WorkspaceEventRecord[];
  files: WorkspaceFileRecord[];
  credentials: WorkspaceCredentialRecord[];
  tickets: WorkspaceTicketRecord[];
  invoices: WorkspaceInvoiceRecord[];
  documents: WorkspaceDocumentRecord[];
  transactions: WorkspaceTransactionRecord[];
  messages: WorkspaceMessageRecord[];
  automationPlaybooks: WorkspaceAutomationPlaybookRecord[];
  automationRuns: WorkspaceAutomationRunRecord[];
  links: WorkspaceLinkRecord[];
  users: WorkspaceUserRecord[];
};

export type WorkspaceUserRecord = {
  id: string;
  name: string;
  email: string;
  role: string;
  clientId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateWorkspaceClientInput = {
  slug?: string | null;
  name: string;
  brand?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  phase?: string | null;
  progress?: number | null;
  totalInvestmentCents?: number | null;
  paidCents?: number | null;
  pendingCents?: number | null;
  nextAction?: string | null;
  nextActionContext?: string | null;
  nextActionCta?: string | null;
  provisionPortalAccess?: boolean | null;
  portalUserName?: string | null;
  portalUserEmail?: string | null;
  portalUserPassword?: string | null;
  createInitialProject?: boolean | null;
  initialProjectName?: string | null;
  initialProjectDescription?: string | null;
  initialProjectStatus?: string | null;
  initialProjectTrack?: string | null;
  initialProjectProgress?: number | null;
  initialProjectStartDate?: string | null;
  initialProjectEndDate?: string | null;
};

export type CreateWorkspaceProjectInput = {
  clientId?: string | null;
  clientSlug?: string | null;
  clientName?: string | null;
  clientBrand?: string | null;
  clientEmail?: string | null;
  clientCompany?: string | null;
  clientTotalInvestmentCents?: number | null;
  clientPaidCents?: number | null;
  clientPendingCents?: number | null;
  createClient?: boolean | null;
  provisionPortalAccess?: boolean | null;
  portalUserName?: string | null;
  portalUserEmail?: string | null;
  portalUserPassword?: string | null;
  name: string;
  description?: string | null;
  status?: string | null;
  progress?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  track?: string | null;
};

export type CreateWorkspaceTaskInput = {
  clientId?: string | null;
  clientSlug?: string | null;
  projectId?: string | null;
  title: string;
  owner?: string | null;
  status?: WorkspaceTaskStatusValue | null;
  dueLabel?: string | null;
};

export type CreateWorkspaceMilestoneInput = {
  clientId?: string | null;
  clientSlug?: string | null;
  projectId: string;
  title: string;
  description?: string | null;
  status?: WorkspaceMilestoneStatus | null;
  targetDate?: string | null;
  clientVisible?: boolean | null;
  weight?: number | null;
  orderIndex?: number | null;
};

export type CreateWorkspaceDealInput = {
  clientId?: string | null;
  clientSlug?: string | null;
  projectId?: string | null;
  title: string;
  stage?: string | null;
  billingModel?: string | null;
  valueCents?: number | null;
  probability?: number | null;
  owner?: string | null;
  summary?: string | null;
  lastContactAt?: string | null;
  expectedCloseAt?: string | null;
};

export type CreateWorkspaceEventInput = {
  clientId?: string | null;
  clientSlug?: string | null;
  projectId?: string | null;
  title: string;
  description?: string | null;
  kind?: string | null;
  location?: string | null;
  meetUrl?: string | null;
  startsAt: string;
  endsAt: string;
  attendees?: string[] | null;
};

export type CreateWorkspaceTransactionInput = {
  clientId?: string | null;
  clientSlug?: string | null;
  projectId?: string | null;
  type: "income" | "expense";
  amountCents: number;
  category?: string | null;
  description?: string | null;
  occurredAt?: string | null;
};

export type CreateWorkspaceInvoiceInput = {
  clientId?: string | null;
  clientSlug?: string | null;
  projectId?: string | null;
  documentId?: string | null;
  label: string;
  invoiceNumber?: string | null;
  amountCents: number;
  dueDate?: string | null;
  dueLabel?: string | null;
  status?: WorkspaceInvoiceStatusValue | null;
};

export type CreateWorkspaceCredentialInput = {
  clientId?: string | null;
  clientSlug?: string | null;
  projectId?: string | null;
  title: string;
  scope?: string | null;
  status?: "requested" | "shared" | "updated" | null;
  secret?: string | null;
  linkUrl?: string | null;
};

export type CreateWorkspaceTicketInput = {
  clientId?: string | null;
  clientSlug?: string | null;
  title: string;
  summary?: string | null;
  status?: "open" | "in_progress" | "resolved" | "closed" | null;
  requestType?: WorkspaceRequestType | null;
  priority?: string | null;
  assignedTo?: string | null;
  channel?: string | null;
  projectId?: string | null;
};

export type CreateWorkspaceMessageInput = {
  clientId: string;
  userId?: string | null;
  senderRole: "team" | "client" | "assistant";
  senderName: string;
  channel?: string | null;
  message: string;
  autoReply?: boolean | null;
};

export type CreateWorkspaceFileInput = {
  clientId?: string | null;
  clientSlug?: string | null;
  projectId?: string | null;
  file: File;
  category?: string | null;
  source: "client" | "vertrex";
  target?: AssetStorageTarget | null;
};

export type CreateWorkspaceAutomationPlaybookInput = {
  clientId?: string | null;
  clientSlug?: string | null;
  projectId?: string | null;
  title: string;
  trigger: string;
  action: string;
  result?: string | null;
  summary?: string | null;
  status?: WorkspaceAutomationPlaybookStatus | null;
};

export type CreateWorkspaceAutomationRunInput = {
  playbookId?: string | null;
  clientId?: string | null;
  clientSlug?: string | null;
  projectId?: string | null;
  title?: string | null;
  status?: WorkspaceAutomationRunStatus | null;
  triggerSource?: string | null;
  summary?: string | null;
};

export type CreateWorkspaceLinkInput = {
  clientId?: string | null;
  clientSlug?: string | null;
  projectId?: string | null;
  title: string;
  url: string;
  kind?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  domain?: string | null;
};

type WorkspaceMutationOptions = {
  actor?: AuditActorInput | null;
};

export async function getWorkspaceSnapshot(): Promise<WorkspaceSnapshot> {
  if (!isDatabaseConfigured()) {
    return createEmptyWorkspaceSnapshot();
  }

  const db = getDb();
  const now = new Date();
  const [clients, projects, tasks, milestones, deals, events, files, credentials, tickets, invoices, documents, transactions, messages, portalUsers, teamUsers, activeSessions, automationPlaybooks, automationRuns, links] = await Promise.all([
    readOptionalWorkspaceDataset(() => db.select().from(schema.clients).orderBy(desc(schema.clients.updatedAt))),
    readOptionalWorkspaceDataset(() => db.select().from(schema.projects).orderBy(desc(schema.projects.updatedAt))),
    readOptionalWorkspaceDataset(() => db.select().from(schema.tasks).orderBy(desc(schema.tasks.updatedAt))),
    readOptionalWorkspaceDataset(() => db.select().from(schema.milestones).orderBy(desc(schema.milestones.updatedAt))),
    readOptionalWorkspaceDataset(() => db.select().from(schema.deals).orderBy(desc(schema.deals.updatedAt))),
    readOptionalWorkspaceDataset(() => db.select().from(schema.calendarEvents).orderBy(desc(schema.calendarEvents.startsAt))),
    readOptionalWorkspaceDataset(() => db.select().from(schema.portalFiles).orderBy(desc(schema.portalFiles.updatedAt))),
    readOptionalWorkspaceDataset(() => db.select().from(schema.portalCredentials).orderBy(desc(schema.portalCredentials.updatedAt))),
    readOptionalWorkspaceDataset(() => db.select().from(schema.tickets).orderBy(desc(schema.tickets.updatedAt))),
    readOptionalWorkspaceDataset(() => db.select().from(schema.invoices).orderBy(desc(schema.invoices.updatedAt))),
    readOptionalWorkspaceDataset(() => db.select().from(schema.documents).orderBy(desc(schema.documents.updatedAt))),
    readOptionalWorkspaceDataset(() => db.select().from(schema.transactions).orderBy(desc(schema.transactions.occurredAt))),
    readOptionalWorkspaceDataset(() => db.select().from(schema.conversationMessages).orderBy(desc(schema.conversationMessages.createdAt))),
    readOptionalWorkspaceDataset(() => db.select().from(schema.users).where(eq(schema.users.role, "client")).orderBy(desc(schema.users.updatedAt))),
    readOptionalWorkspaceDataset(() => db.select().from(schema.users).where(eq(schema.users.role, "team")).orderBy(desc(schema.users.updatedAt))),
    readOptionalWorkspaceDataset(() => db.select().from(schema.sessions).where(gt(schema.sessions.expiresAt, now)).orderBy(desc(schema.sessions.createdAt))),
    readOptionalWorkspaceDataset(() => db.select().from(schema.automationPlaybooks).orderBy(desc(schema.automationPlaybooks.updatedAt))),
    readOptionalWorkspaceDataset(() => db.select().from(schema.automationRuns).orderBy(desc(schema.automationRuns.startedAt))),
    readOptionalWorkspaceDataset(() => db.select().from(schema.links).orderBy(desc(schema.links.updatedAt))),
  ]);

  const clientMap = new Map(clients.map((client) => [client.id, client]));
  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const documentMap = new Map(documents.map((document) => [document.id, document]));
  const automationPlaybookMap = new Map(automationPlaybooks.map((playbook) => [playbook.id, playbook]));
  const latestRunByPlaybook = new Map<string, (typeof automationRuns)[number]>();

  for (const automationRun of automationRuns) {
    if (!automationRun.playbookId) {
      continue;
    }

    const current = latestRunByPlaybook.get(automationRun.playbookId);

    if (!current || automationRun.startedAt.getTime() > current.startedAt.getTime()) {
      latestRunByPlaybook.set(automationRun.playbookId, automationRun);
    }
  }

  const projectCountByClient = countBy(projects, (project) => project.clientId);
  const taskCountByClient = countBy(tasks, (task) => task.clientId ?? (task.projectId ? projectMap.get(task.projectId)?.clientId ?? null : null));
  const openTaskCountByProject = countBy(tasks.filter((task) => isOpenTaskStatus(task.status)), (task) => task.projectId);
  const milestoneCountByProject = countBy(milestones, (milestone) => milestone.projectId);
  const completedMilestoneCountByProject = countBy(milestones.filter((milestone) => isClosedMilestoneStatus(milestone.status)), (milestone) => milestone.projectId);
  const milestoneWeightByProject = sumNumberBy(milestones, (milestone) => milestone.projectId, (milestone) => normalizePositiveInteger(milestone.weight, 1));
  const completedMilestoneWeightByProject = sumNumberBy(milestones.filter((milestone) => isClosedMilestoneStatus(milestone.status)), (milestone) => milestone.projectId, (milestone) => normalizePositiveInteger(milestone.weight, 1));
  const openTicketCountByClient = countBy(tickets.filter((ticket) => ticket.status !== "resolved" && ticket.status !== "closed"), (ticket) => ticket.clientId);
  const activeSessionsByUserId = countBy(activeSessions, (session) => session.userId);
  const runCountByPlaybook = countBy(automationRuns, (automationRun) => automationRun.playbookId);
  const portalUserByClientId = new Map<string, (typeof portalUsers)[number]>();
  const activityTimesByClient = new Map<string, Date>();

  const registerClientActivity = (clientId: string | null | undefined, value: Date | null | undefined) => {
    if (!clientId || !value) {
      return;
    }

    const current = activityTimesByClient.get(clientId);

    if (!current || value.getTime() > current.getTime()) {
      activityTimesByClient.set(clientId, value);
    }
  };

  for (const client of clients) {
    registerClientActivity(client.id, client.updatedAt);
  }

  for (const portalUser of portalUsers) {
    if (portalUser.clientId && !portalUserByClientId.has(portalUser.clientId)) {
      portalUserByClientId.set(portalUser.clientId, portalUser);
    }

    registerClientActivity(portalUser.clientId, portalUser.updatedAt);
    registerClientActivity(portalUser.clientId, portalUser.lastLoginAt);
  }

  for (const project of projects) {
    registerClientActivity(project.clientId, project.updatedAt);
  }

  for (const task of tasks) {
    registerClientActivity(task.clientId ?? (task.projectId ? projectMap.get(task.projectId)?.clientId ?? null : null), task.updatedAt);
  }

  for (const milestone of milestones) {
    const project = projectMap.get(milestone.projectId);
    const clientId = project?.clientId ?? null;

    registerClientActivity(clientId, milestone.updatedAt);
    registerClientActivity(clientId, milestone.targetDate);
    registerClientActivity(clientId, milestone.completedAt);
  }

  for (const deal of deals) {
    registerClientActivity(deal.clientId ?? (deal.projectId ? projectMap.get(deal.projectId)?.clientId ?? null : null), deal.updatedAt);
  }

  for (const event of events) {
    registerClientActivity(event.clientId ?? (event.projectId ? projectMap.get(event.projectId)?.clientId ?? null : null), event.startsAt);
  }

  for (const file of files) {
    registerClientActivity(file.clientId, file.updatedAt);
  }

  for (const credential of credentials) {
    registerClientActivity(credential.clientId, credential.updatedAt);
  }

  for (const ticket of tickets) {
    registerClientActivity(ticket.clientId, ticket.updatedAt ?? ticket.createdAt);
  }

  for (const invoice of invoices) {
    registerClientActivity(invoice.clientId, invoice.updatedAt ?? invoice.createdAt);
  }

  for (const document of documents) {
    registerClientActivity(document.clientId, document.updatedAt);
  }

  for (const transaction of transactions) {
    registerClientActivity(transaction.clientId ?? (transaction.projectId ? projectMap.get(transaction.projectId)?.clientId ?? null : null), transaction.occurredAt);
  }

  for (const message of messages) {
    registerClientActivity(message.clientId, message.createdAt);
  }

  for (const playbook of automationPlaybooks) {
    const projectId = playbook.projectId ?? null;
    const clientId = playbook.clientId ?? (projectId ? projectMap.get(projectId)?.clientId ?? null : null);

    registerClientActivity(clientId, playbook.updatedAt);
    registerClientActivity(clientId, playbook.lastRunAt);
  }

  for (const automationRun of automationRuns) {
    const playbook = automationRun.playbookId ? automationPlaybookMap.get(automationRun.playbookId) ?? null : null;
    const projectId = automationRun.projectId ?? playbook?.projectId ?? null;
    const clientId = automationRun.clientId ?? playbook?.clientId ?? (projectId ? projectMap.get(projectId)?.clientId ?? null : null);

    registerClientActivity(clientId, automationRun.startedAt);
    registerClientActivity(clientId, automationRun.finishedAt);
  }

  const mappedClients: WorkspaceClientRecord[] = clients.map((client) => {
    const portalUser = portalUserByClientId.get(client.id) ?? null;

    return {
      id: client.id,
      slug: client.slug,
      name: client.name,
      brand: client.brand,
      email: client.email,
      company: client.company,
      status: client.status,
      phase: client.phase,
      progress: client.progress,
      totalInvestmentCents: client.totalInvestmentCents,
      paidCents: client.paidCents,
      pendingCents: client.pendingCents,
      projectCount: projectCountByClient.get(client.id) ?? 0,
      taskCount: taskCountByClient.get(client.id) ?? 0,
      openTicketCount: openTicketCountByClient.get(client.id) ?? 0,
      lastActivityAt: toIsoString(activityTimesByClient.get(client.id) ?? null),
      portalUserId: portalUser?.id ?? null,
      portalUserName: portalUser?.name ?? null,
      portalUserEmail: portalUser?.email ?? null,
      portalAccessActive: portalUser?.isActive ?? false,
      portalLastLoginAt: toIsoString(portalUser?.lastLoginAt ?? null),
      activePortalSessions: portalUser ? activeSessionsByUserId.get(portalUser.id) ?? 0 : 0,
    };
  });

  const mappedProjects: WorkspaceProjectRecord[] = projects.map((project) => {
    const totalMilestoneWeight = milestoneWeightByProject.get(project.id) ?? 0;
    const completedMilestoneWeight = completedMilestoneWeightByProject.get(project.id) ?? 0;

    return {
      id: project.id,
      clientId: project.clientId,
      clientName: project.clientId ? clientMap.get(project.clientId)?.name ?? null : null,
      clientSlug: project.clientId ? clientMap.get(project.clientId)?.slug ?? null : null,
      name: project.name,
      description: project.description,
      status: project.status,
      progress: totalMilestoneWeight > 0 ? normalizePercent((completedMilestoneWeight / totalMilestoneWeight) * 100) : project.progress,
      startDate: toIsoString(project.startDate),
      endDate: toIsoString(project.endDate),
      openTasks: openTaskCountByProject.get(project.id) ?? 0,
      milestoneCount: milestoneCountByProject.get(project.id) ?? 0,
      completedMilestones: completedMilestoneCountByProject.get(project.id) ?? 0,
      updatedAt: toIsoString(project.updatedAt) ?? new Date().toISOString(),
    };
  });

  const mappedTasks: WorkspaceTaskRecord[] = tasks.map((task) => {
    const project = task.projectId ? projectMap.get(task.projectId) : null;
    const clientId = task.clientId ?? project?.clientId ?? null;

    return {
      id: task.id,
      clientId,
      clientName: clientId ? clientMap.get(clientId)?.name ?? null : null,
      projectId: task.projectId,
      projectName: project?.name ?? null,
      title: task.title,
      owner: task.owner,
      status: task.status,
      dueLabel: task.dueLabel,
      updatedAt: toIsoString(task.updatedAt) ?? new Date().toISOString(),
    };
  });

  const mappedMilestones: WorkspaceMilestoneRecord[] = [...milestones]
    .sort((left, right) => left.orderIndex - right.orderIndex || left.createdAt.getTime() - right.createdAt.getTime())
    .map((milestone) => {
      const project = projectMap.get(milestone.projectId) ?? null;
      const clientId = project?.clientId ?? null;

      return {
        id: milestone.id,
        clientId,
        clientName: clientId ? clientMap.get(clientId)?.name ?? null : null,
        projectId: milestone.projectId,
        projectName: project?.name ?? null,
        title: milestone.title,
        description: milestone.description,
        status: milestone.status,
        targetDate: toIsoString(milestone.targetDate),
        completedAt: toIsoString(milestone.completedAt),
        clientVisible: milestone.clientVisible,
        weight: milestone.weight,
        orderIndex: milestone.orderIndex,
        updatedAt: toIsoString(milestone.updatedAt) ?? new Date().toISOString(),
        metadata: (milestone.metadata as Record<string, unknown>) ?? {},
      };
    });

  const mappedDeals: WorkspaceDealRecord[] = deals.map((deal) => ({
    id: deal.id,
    clientId: deal.clientId,
    clientName: deal.clientId ? clientMap.get(deal.clientId)?.name ?? null : null,
    projectId: deal.projectId,
    projectName: deal.projectId ? projectMap.get(deal.projectId)?.name ?? null : null,
    title: deal.title,
    stage: normalizeDealStage(deal.stage),
    billingModel: deal.billingModel,
    valueCents: deal.valueCents,
    probability: deal.probability,
    owner: deal.owner,
    summary: deal.summary,
    lastContactAt: toIsoString(deal.lastContactAt),
    expectedCloseAt: toIsoString(deal.expectedCloseAt),
    updatedAt: toIsoString(deal.updatedAt) ?? new Date().toISOString(),
  }));

  const mappedEvents: WorkspaceEventRecord[] = events.map((event) => ({
    id: event.id,
    clientId: event.clientId,
    clientName: event.clientId ? clientMap.get(event.clientId)?.name ?? null : null,
    projectId: event.projectId,
    projectName: event.projectId ? projectMap.get(event.projectId)?.name ?? null : null,
    title: event.title,
    description: event.description,
    kind: event.kind,
    location: event.location,
    meetUrl: event.meetUrl,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt.toISOString(),
    attendees: event.attendees,
  }));

  const mappedFiles: WorkspaceFileRecord[] = files.map((file) => {
    const projectId = getStringMetadata(file.metadata, "projectId");
    const project = projectId ? projectMap.get(projectId) : null;
    const clientId = file.clientId ?? project?.clientId ?? null;
    const client = clientId ? clientMap.get(clientId) : null;

    return {
      id: file.id,
      clientId,
      clientName: client?.name ?? null,
      clientSlug: client?.slug ?? null,
      projectId: projectId ?? null,
      projectName: project?.name ?? getStringMetadata(file.metadata, "projectName"),
      name: file.name,
      category: file.category,
      source: file.source,
      provider: typeof file.metadata.provider === "string" ? file.metadata.provider : "local",
      sizeLabel: file.sizeLabel,
      uploadedAt: file.uploadedAtLabel ?? formatDateTime(file.updatedAt),
      href: resolveStoredAssetHref(file.metadata, file.storageKey),
      storageKey: file.storageKey,
    };
  });

  const mappedCredentials: WorkspaceCredentialRecord[] = credentials.map((credential) => {
    const projectId = getStringMetadata(credential.metadata, "projectId");
    const project = projectId ? projectMap.get(projectId) : null;
    const clientId = credential.clientId ?? project?.clientId ?? null;
    const secretStorage = resolveVaultSecretStorageMode(credential.metadata);

    return {
      id: credential.id,
      clientId,
      clientName: clientId ? clientMap.get(clientId)?.name ?? null : null,
      projectId: projectId ?? null,
      projectName: project?.name ?? getStringMetadata(credential.metadata, "projectName"),
      title: credential.title,
      scope: credential.scope,
      status: credential.status,
      linkUrl: getStringMetadata(credential.metadata, "linkUrl"),
      hasSecret: hasVaultSecret(credential.metadata),
      secretStorage,
      updatedAt: credential.updatedLabel ?? formatDateTime(credential.updatedAt),
    };
  });

  const mappedTickets: WorkspaceTicketRecord[] = tickets.map((ticket) => {
    const projectId = getStringMetadata(ticket.metadata, "projectId");
    const project = projectId ? projectMap.get(projectId) : null;
    const requestType = inferWorkspaceRequestType({
      requestType: getStringMetadata(ticket.metadata, "requestType"),
      title: ticket.title,
      summary: ticket.summary,
      channel: getStringMetadata(ticket.metadata, "channel"),
    });
    const sla = evaluateWorkspaceTicketSla({
      requestType,
      status: ticket.status,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    });

    return {
      id: ticket.id,
      clientId: ticket.clientId,
      clientName: ticket.clientId ? clientMap.get(ticket.clientId)?.name ?? null : null,
      projectId: projectId ?? null,
      projectName: project?.name ?? getStringMetadata(ticket.metadata, "projectName"),
      title: ticket.title,
      summary: ticket.summary,
      status: ticket.status,
      requestType,
      requestTypeLabel: getWorkspaceRequestTypeLabel(requestType),
      slaStatus: sla.status,
      slaLabel: sla.label,
      slaWindowLabel: sla.windowLabel,
      priority: getStringMetadata(ticket.metadata, "priority"),
      assignedTo: getStringMetadata(ticket.metadata, "assignedTo"),
      channel: getStringMetadata(ticket.metadata, "channel"),
      updatedAt: ticket.updatedLabel ?? formatDateTime(ticket.updatedAt ?? ticket.createdAt),
      metadata: (ticket.metadata as Record<string, unknown>) ?? {},
    };
  });

  const mappedInvoices: WorkspaceInvoiceRecord[] = invoices.map((invoice) => {
    const linkedDocument = invoice.documentId ? documentMap.get(invoice.documentId) : null;
    const projectId = getStringMetadata(invoice.metadata, "projectId") ?? linkedDocument?.projectId ?? null;
    const project = projectId ? projectMap.get(projectId) : null;

    return {
      id: invoice.id,
      clientId: invoice.clientId,
      clientName: invoice.clientId ? clientMap.get(invoice.clientId)?.name ?? null : null,
      projectId,
      projectName: project?.name ?? getStringMetadata(invoice.metadata, "projectName"),
      documentId: invoice.documentId,
      label: invoice.label,
      invoiceNumber: invoice.invoiceNumber,
      amountCents: invoice.amountCents,
      dueDate: toIsoString(invoice.dueDate),
      dueLabel: invoice.dueLabel,
      status: invoice.status,
      updatedAt: formatDateTime(invoice.updatedAt ?? invoice.createdAt),
    };
  });

  const mappedDocuments: WorkspaceDocumentRecord[] = documents.map((document) => ({
    id: document.id,
    clientId: document.clientId,
    clientName: document.clientId ? clientMap.get(document.clientId)?.name ?? null : null,
    projectId: document.projectId,
    projectName: document.projectId ? projectMap.get(document.projectId)?.name ?? null : null,
    code: document.code,
    title: document.title,
    status: document.status,
    category: document.category,
    origin: document.origin,
    summary: document.summary,
    currentVersion: document.currentVersion,
    createdAt: toIsoString(document.createdAt) ?? new Date().toISOString(),
    sentAt: toIsoString(document.sentAt),
    updatedAt: toIsoString(document.updatedAt) ?? new Date().toISOString(),
    href: `/os/docs/${document.id}`,
    pdfHref: `/api/docs/documents/${document.id}/pdf`,
  }));

  const mappedTransactions: WorkspaceTransactionRecord[] = transactions.map((transaction) => ({
    id: transaction.id,
    clientId: transaction.clientId,
    clientName: transaction.clientId ? clientMap.get(transaction.clientId)?.name ?? null : null,
    projectId: transaction.projectId,
    projectName: transaction.projectId ? projectMap.get(transaction.projectId)?.name ?? null : null,
    type: transaction.type,
    amountCents: transaction.amountCents,
    category: transaction.category,
    description: transaction.description,
    occurredAt: transaction.occurredAt.toISOString(),
  }));

  const mappedMessages: WorkspaceMessageRecord[] = messages.map((message) => ({
    id: message.id,
    clientId: message.clientId,
    clientName: message.clientId ? clientMap.get(message.clientId)?.name ?? null : null,
    senderRole: message.senderRole,
    senderName: message.senderName,
    channel: message.channel,
    message: message.message,
    createdAt: formatDateTime(message.createdAt),
  }));

  const mappedAutomationPlaybooks: WorkspaceAutomationPlaybookRecord[] = automationPlaybooks.map((playbook) => {
    const project = playbook.projectId ? projectMap.get(playbook.projectId) ?? null : null;
    const clientId = playbook.clientId ?? project?.clientId ?? null;
    const latestRun = latestRunByPlaybook.get(playbook.id) ?? null;

    return {
      id: playbook.id,
      clientId,
      clientName: clientId ? clientMap.get(clientId)?.name ?? null : null,
      projectId: playbook.projectId,
      projectName: project?.name ?? null,
      title: playbook.title,
      trigger: playbook.trigger,
      action: playbook.action,
      result: playbook.result,
      summary: playbook.summary,
      status: playbook.status,
      lastRunAt: toIsoString(playbook.lastRunAt),
      lastRunStatus: latestRun?.status ?? null,
      recentRunCount: runCountByPlaybook.get(playbook.id) ?? 0,
      updatedAt: toIsoString(playbook.updatedAt) ?? new Date().toISOString(),
    };
  });

  const mappedAutomationRuns: WorkspaceAutomationRunRecord[] = automationRuns.map((automationRun) => {
    const playbook = automationRun.playbookId ? automationPlaybookMap.get(automationRun.playbookId) ?? null : null;
    const projectId = automationRun.projectId ?? playbook?.projectId ?? null;
    const project = projectId ? projectMap.get(projectId) ?? null : null;
    const clientId = automationRun.clientId ?? project?.clientId ?? null;

    return {
      id: automationRun.id,
      playbookId: automationRun.playbookId,
      playbookTitle: playbook?.title ?? null,
      clientId,
      clientName: clientId ? clientMap.get(clientId)?.name ?? null : null,
      projectId,
      projectName: project?.name ?? null,
      title: automationRun.title,
      status: automationRun.status,
      triggerSource: automationRun.triggerSource,
      summary: automationRun.summary,
      startedAt: toIsoString(automationRun.startedAt) ?? new Date().toISOString(),
      finishedAt: toIsoString(automationRun.finishedAt),
      updatedAt: toIsoString(automationRun.updatedAt) ?? new Date().toISOString(),
    };
  });

  const mappedLinks: WorkspaceLinkRecord[] = links.map((link) => {
    const client = link.clientId ? clientMap.get(link.clientId) ?? null : null;
    const project = link.projectId ? projectMap.get(link.projectId) ?? null : null;

    return {
      id: link.id,
      clientId: link.clientId ?? null,
      clientName: client?.name ?? null,
      projectId: link.projectId ?? null,
      projectName: project?.name ?? null,
      title: link.title,
      url: link.url,
      kind: link.kind,
      description: link.description ?? null,
      imageUrl: link.imageUrl ?? null,
      domain: link.domain ?? null,
      updatedAt: toIsoString(link.updatedAt) ?? new Date().toISOString(),
    };
  });

  return {
    databaseConfigured: true,
    storage: getStorageConnectionSummary(),
    summary: {
      clients: clients.length,
      activeClients: clients.filter((client) => client.status === "active").length,
      projects: projects.length,
      openTasks: tasks.filter((task) => isOpenTaskStatus(task.status)).length,
      deals: deals.length,
      upcomingEvents: events.filter((event) => event.startsAt >= now).length,
      pendingInvoices: invoices.filter((invoice) => isOutstandingInvoiceStatus(invoice.status)).length,
      tickets: tickets.filter((ticket) => ticket.status !== "resolved" && ticket.status !== "closed").length,
      files: files.length,
    },
    clients: mappedClients,
    projects: mappedProjects,
    tasks: mappedTasks,
    milestones: mappedMilestones,
    deals: mappedDeals,
    events: mappedEvents,
    files: mappedFiles,
    credentials: mappedCredentials,
    tickets: mappedTickets,
    invoices: mappedInvoices,
    documents: mappedDocuments,
    transactions: mappedTransactions,
    messages: mappedMessages,
    automationPlaybooks: mappedAutomationPlaybooks,
    automationRuns: mappedAutomationRuns,
    links: mappedLinks,
    users: teamUsers,
  };
}

export async function createWorkspaceClient(input: CreateWorkspaceClientInput, options: WorkspaceMutationOptions = {}) {
  const name = input.name.trim();
  
  if (!name) {
    throw new Error("El nombre del cliente es obligatorio.");
  }

  const client = await ensureWorkspaceClient(input, { reuseExisting: false });

  if (input.provisionPortalAccess) {
    await ensurePortalAccessUser({
      client,
      userName: input.portalUserName ?? name,
      userEmail: input.portalUserEmail ?? input.email,
      password: input.portalUserPassword,
      activateNow: hasReachedPortalActivationThreshold(client.totalInvestmentCents, client.paidCents),
      actor: options.actor,
    });
  }

  if (input.createInitialProject) {
    await createWorkspaceProject({
      clientId: client.id,
      name: normalizeOptionalString(input.initialProjectName) ?? `${client.brand} · Operación`,
      description:
        normalizeOptionalString(input.initialProjectDescription)
        ?? `Proyecto operativo inicial de ${client.name} dentro de Vertrex OS.`,
      status: normalizeOptionalString(input.initialProjectStatus) ?? "active",
      track: normalizeOptionalString(input.initialProjectTrack),
      progress: input.initialProjectProgress ?? input.progress ?? 0,
      startDate: input.initialProjectStartDate,
      endDate: input.initialProjectEndDate,
    }, options);
  }

  await recordWorkspaceAuditEvent({
    actor: options.actor,
    client,
    module: "crm",
    action: "create-client",
    entityType: "client",
    entityId: client.id,
    summary: `Creó el cliente ${client.name}.`,
    metadata: {
      phase: client.phase,
      provisionPortalAccess: Boolean(input.provisionPortalAccess),
      createInitialProject: Boolean(input.createInitialProject),
      totalInvestmentCents: client.totalInvestmentCents,
      paidCents: client.paidCents,
    },
  });

  return client;
}

export async function createWorkspaceProject(input: CreateWorkspaceProjectInput, options: WorkspaceMutationOptions = {}) {
  const db = requireDb();
  const name = input.name.trim();

  if (!name) {
    throw new Error("El nombre del proyecto es obligatorio.");
  }

  const client = await resolveClientForProjectCreation(input);

  if (input.provisionPortalAccess && !client) {
    throw new Error("Debes vincular o crear un cliente para provisionar acceso al portal.");
  }

  if (input.provisionPortalAccess && client) {
    await ensurePortalAccessUser({
      client,
      userName: input.portalUserName ?? input.clientName ?? client.name,
      userEmail: input.portalUserEmail ?? input.clientEmail ?? client.email,
      password: input.portalUserPassword,
      activateNow: hasReachedPortalActivationThreshold(client.totalInvestmentCents, client.paidCents),
      actor: options.actor,
    });
  }

  const status = normalizeOptionalString(input.status) ?? "active";
  const track = normalizeProjectTrack(input.track, isRoadmapProjectStatus(status) ? "roadmap" : "commercial");

  const [project] = await db
    .insert(schema.projects)
    .values({
      clientId: client?.id ?? null,
      name,
      description: normalizeOptionalString(input.description),
      status,
      progress: normalizePercent(input.progress ?? 0),
      startDate: parseDate(input.startDate),
      endDate: parseDate(input.endDate),
      metadata: {
        source: "workspace",
        track,
      },
      updatedAt: new Date(),
    })
    .returning();

  await recordWorkspaceAuditEvent({
    actor: options.actor,
    client,
    project,
    module: "projects",
    action: "create-project",
    entityType: "project",
    entityId: project.id,
    summary: `Creó el proyecto ${project.name}.`,
    metadata: {
      status: project.status,
      progress: project.progress,
      track,
      provisionPortalAccess: Boolean(input.provisionPortalAccess),
    },
  });

  return project;
}

export async function createWorkspaceTask(input: CreateWorkspaceTaskInput, options: WorkspaceMutationOptions = {}) {
  const db = requireDb();
  const context = await resolveOperationalContext(input);
  const [task] = await db
    .insert(schema.tasks)
    .values({
      clientId: context.clientId,
      projectId: context.project?.id ?? input.projectId ?? null,
      title: input.title.trim(),
      owner: normalizeOptionalString(input.owner),
      status: input.status ?? "todo",
      dueLabel: normalizeOptionalString(input.dueLabel),
      metadata: {
        source: "workspace",
      },
      updatedAt: new Date(),
    })
    .returning();

  await recordWorkspaceAuditEvent({
    actor: options.actor,
    client: context.client,
    project: context.project,
    module: "projects",
    action: "create-task",
    entityType: "task",
    entityId: task.id,
    summary: `Creó la tarea ${task.title}.`,
    metadata: {
      status: task.status,
      owner: task.owner,
      dueLabel: task.dueLabel,
    },
  });

  return task;
}

export async function createWorkspaceMilestone(input: CreateWorkspaceMilestoneInput, options: WorkspaceMutationOptions = {}) {
  const db = requireDb();
  const context = await resolveOperationalContext(input);
  const title = input.title.trim();

  if (!title) {
    throw new Error("El título del milestone es obligatorio.");
  }

  if (!context.project) {
    throw new Error("Debes indicar un proyecto válido para crear el milestone.");
  }

  const status = input.status ?? "pending";
  let milestone;

  try {
    [milestone] = await db
      .insert(schema.milestones)
      .values({
        projectId: context.project.id,
        title,
        description: normalizeOptionalString(input.description),
        status,
        targetDate: parseDate(input.targetDate),
        completedAt: status === "completed" ? new Date() : null,
        approvedById: null,
        clientVisible: input.clientVisible ?? true,
        weight: normalizePositiveInteger(input.weight, 1),
        orderIndex: normalizeNonNegativeInteger(input.orderIndex, 0),
        metadata: {
          source: "workspace",
        },
        updatedAt: new Date(),
      })
      .returning();
  } catch (error) {
    if (isMissingWorkspaceRelationError(error)) {
      throw new Error("Los milestones todavía no están disponibles en Neon porque falta sincronizar la tabla `milestones`.");
    }

    throw error;
  }

  await recordWorkspaceAuditEvent({
    actor: options.actor,
    client: context.client,
    project: context.project,
    module: "projects",
    action: "create-milestone",
    entityType: "milestone",
    entityId: milestone.id,
    summary: `Creó el milestone ${milestone.title}.`,
    metadata: {
      status: milestone.status,
      clientVisible: milestone.clientVisible,
      weight: milestone.weight,
      orderIndex: milestone.orderIndex,
      targetDate: toIsoString(milestone.targetDate),
    },
  });

  return milestone;
}

export async function createWorkspaceDeal(input: CreateWorkspaceDealInput, options: WorkspaceMutationOptions = {}) {
  const db = requireDb();
  const context = await resolveOperationalContext(input);
  const [deal] = await db
    .insert(schema.deals)
    .values({
      clientId: context.clientId,
      projectId: context.project?.id ?? input.projectId ?? null,
      title: input.title.trim(),
      stage: normalizeDealStage(input.stage),
      billingModel: normalizeOptionalString(input.billingModel) ?? "one-time",
      valueCents: normalizeAmount(input.valueCents),
      probability: normalizePercent(input.probability ?? 0),
      owner: normalizeOptionalString(input.owner),
      summary: normalizeOptionalString(input.summary),
      lastContactAt: parseDate(input.lastContactAt),
      expectedCloseAt: parseDate(input.expectedCloseAt),
      metadata: {
        source: "workspace",
      },
      updatedAt: new Date(),
    })
    .returning();

  await recordWorkspaceAuditEvent({
    actor: options.actor,
    client: context.client,
    project: context.project,
    module: "crm",
    action: "create-deal",
    entityType: "deal",
    entityId: deal.id,
    summary: `Creó el deal ${deal.title}.`,
    metadata: {
      stage: deal.stage,
      billingModel: deal.billingModel,
      valueCents: deal.valueCents,
      probability: deal.probability,
    },
  });

  return deal;
}

export async function createWorkspaceEvent(input: CreateWorkspaceEventInput, options: WorkspaceMutationOptions = {}) {
  const db = requireDb();
  const context = await resolveOperationalContext(input);
  const startsAt = parseDate(input.startsAt);
  const endsAt = parseDate(input.endsAt);

  if (!startsAt || !endsAt) {
    throw new Error("Debes definir inicio y fin válidos para el evento.");
  }

  const [event] = await db
    .insert(schema.calendarEvents)
    .values({
      clientId: context.clientId,
      projectId: context.project?.id ?? input.projectId ?? null,
      title: input.title.trim(),
      description: normalizeOptionalString(input.description),
      kind: normalizeOptionalString(input.kind) ?? "meeting",
      location: normalizeOptionalString(input.location),
      meetUrl: normalizeOptionalString(input.meetUrl),
      startsAt,
      endsAt,
      attendees: input.attendees?.filter(Boolean) ?? [],
      metadata: {
        source: "workspace",
      },
      updatedAt: new Date(),
    })
    .returning();

  await recordWorkspaceAuditEvent({
    actor: options.actor,
    client: context.client,
    project: context.project,
    module: "calendar",
    action: "create-event",
    entityType: "event",
    entityId: event.id,
    summary: `Creó el evento ${event.title}.`,
    metadata: {
      kind: event.kind,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt.toISOString(),
      attendeeCount: Array.isArray(event.attendees) ? event.attendees.length : 0,
    },
  });

  return event;
}

export async function createWorkspaceTransaction(input: CreateWorkspaceTransactionInput, options: WorkspaceMutationOptions = {}) {
  const db = requireDb();
  const context = await resolveOperationalContext(input);
  const [transaction] = await db
    .insert(schema.transactions)
    .values({
      clientId: context.clientId,
      projectId: context.project?.id ?? input.projectId ?? null,
      type: input.type,
      amountCents: normalizeAmount(input.amountCents),
      category: normalizeOptionalString(input.category),
      description: normalizeOptionalString(input.description),
      occurredAt: parseDate(input.occurredAt) ?? new Date(),
      metadata: {
        source: "workspace",
      },
      updatedAt: new Date(),
    })
    .returning();

  await recordWorkspaceAuditEvent({
    actor: options.actor,
    client: context.client,
    project: context.project,
    module: "finance",
    action: "create-transaction",
    entityType: "transaction",
    entityId: transaction.id,
    summary: `Registró un movimiento ${transaction.type} por ${transaction.amountCents} centavos.`,
    metadata: {
      type: transaction.type,
      amountCents: transaction.amountCents,
      category: transaction.category,
    },
  });

  return transaction;
}

export async function createWorkspaceInvoice(input: CreateWorkspaceInvoiceInput, options: WorkspaceMutationOptions = {}) {
  const db = requireDb();
  const context = await resolveOperationalContext(input);
  const [invoice] = await db
    .insert(schema.invoices)
    .values({
      clientId: context.clientId,
      documentId: input.documentId ?? null,
      label: input.label.trim(),
      invoiceNumber: normalizeOptionalString(input.invoiceNumber) ?? `INV-${Date.now()}`,
      amountCents: normalizeAmount(input.amountCents),
      dueDate: parseDate(input.dueDate),
      dueLabel: normalizeOptionalString(input.dueLabel),
      status: input.status ?? "pending",
      metadata: {
        source: "workspace",
        projectId: context.project?.id ?? input.projectId ?? null,
        projectName: context.project?.name ?? null,
      },
      updatedAt: new Date(),
    })
    .returning();

  await recordWorkspaceAuditEvent({
    actor: options.actor,
    client: context.client,
    project: context.project,
    module: "finance",
    action: "create-invoice",
    entityType: "invoice",
    entityId: invoice.id,
    summary: `Creó la factura ${invoice.invoiceNumber}.`,
    metadata: {
      status: invoice.status,
      amountCents: invoice.amountCents,
      documentId: invoice.documentId,
    },
  });

  return invoice;
}

export async function createWorkspaceCredential(input: CreateWorkspaceCredentialInput, options: WorkspaceMutationOptions = {}) {
  const db = requireDb();
  const context = await resolveOperationalContext(input);

  if (!context.clientId) {
    throw new Error("Debes indicar un cliente válido para guardar la credencial.");
  }

  const credentialMetadata = writeVaultSecretMetadata({
    source: "workspace",
    linkUrl: normalizeOptionalString(input.linkUrl),
    projectId: context.project?.id ?? input.projectId ?? null,
    projectName: context.project?.name ?? null,
  }, normalizeOptionalString(input.secret));

  const [credential] = await db
    .insert(schema.portalCredentials)
    .values({
      clientId: context.clientId,
      title: input.title.trim(),
      scope: normalizeOptionalString(input.scope),
      status: input.status ?? "requested",
      updatedLabel: formatDateTime(new Date()),
      metadata: credentialMetadata,
      updatedAt: new Date(),
    })
    .returning();

  await recordWorkspaceAuditEvent({
    actor: options.actor,
    client: context.client,
    project: context.project,
    module: "vault",
    action: "create-credential",
    entityType: "credential",
    entityId: credential.id,
    summary: `Registró la credencial ${credential.title}.`,
    metadata: {
      status: credential.status,
      scope: credential.scope,
      hasSecret: hasVaultSecret(credential.metadata),
      secretStorage: resolveVaultSecretStorageMode(credential.metadata),
      hasLinkUrl: Boolean(getStringMetadata(credential.metadata, "linkUrl")),
    },
  });

  return credential;
}

export async function createWorkspaceTicket(input: CreateWorkspaceTicketInput, options: WorkspaceMutationOptions = {}) {
  const db = requireDb();
  const context = await resolveOperationalContext(input);
  const requestType = inferWorkspaceRequestType({
    requestType: input.requestType,
    title: input.title,
    summary: input.summary,
    channel: input.channel,
  });
  const [ticket] = await db
    .insert(schema.tickets)
    .values({
      clientId: context.clientId,
      title: input.title.trim(),
      summary: normalizeOptionalString(input.summary),
      status: input.status ?? "open",
      updatedLabel: formatDateTime(new Date()),
      metadata: {
        source: "workspace",
        requestType,
        priority: normalizeOptionalString(input.priority),
        assignedTo: normalizeOptionalString(input.assignedTo),
        channel: normalizeOptionalString(input.channel),
        projectId: context.project?.id ?? input.projectId ?? null,
        projectName: context.project?.name ?? null,
      },
      updatedAt: new Date(),
    })
    .returning();

  await recordWorkspaceAuditEvent({
    actor: options.actor,
    client: context.client,
    project: context.project,
    module: "support",
    action: "create-ticket",
    entityType: "ticket",
    entityId: ticket.id,
    summary: `Creó el ticket ${ticket.title}.`,
    metadata: {
      status: ticket.status,
      requestType,
      channel: getStringMetadata(ticket.metadata, "channel"),
      priority: getStringMetadata(ticket.metadata, "priority"),
    },
  });

  return ticket;
}

export async function createWorkspaceMessage(input: CreateWorkspaceMessageInput, options: WorkspaceMutationOptions = {}) {
  const db = requireDb();
  let message;

  try {
    [message] = await db
      .insert(schema.conversationMessages)
      .values({
        clientId: input.clientId,
        userId: input.userId ?? null,
        senderRole: input.senderRole,
        senderName: input.senderName,
        channel: normalizeOptionalString(input.channel) ?? "portal",
        message: input.message.trim(),
        metadata: {
          source: "workspace",
        },
        updatedAt: new Date(),
      })
      .returning();
  } catch (error) {
    if (isMissingWorkspaceRelationError(error)) {
      throw new Error("La mensajería del portal todavía no está disponible en Neon porque falta la tabla `conversation_messages`.");
    }

    throw error;
  }

  if (!input.autoReply) {
    await recordWorkspaceAuditEvent({
      actor: options.actor,
      client: input.clientId ? { id: input.clientId, name: null } : null,
      module: "portal",
      action: "create-message",
      entityType: "message",
      entityId: message.id,
      summary: `${input.senderName} envió un mensaje en el portal.`,
      metadata: {
        senderRole: input.senderRole,
        channel: message.channel,
        autoReply: false,
      },
    });

    return { message, reply: null };
  }

  const snapshot = await getWorkspaceSnapshot();
  const replyPayload = buildOsAgentReply(input.message, {
    userName: input.senderName,
    generatedAt: formatDateTime(new Date()),
    clientCount: snapshot.summary.clients,
    projectCount: snapshot.summary.projects,
    openTaskCount: snapshot.summary.openTasks,
    pendingInvoiceCount: snapshot.summary.pendingInvoices,
    pendingInvoiceCents: snapshot.invoices
      .filter((invoice) => invoice.status === "pending" || invoice.status === "overdue")
      .reduce((total, invoice) => total + invoice.amountCents, 0),
    openTicketCount: snapshot.summary.tickets,
    recentMemory: [],
  });
  let reply;

  try {
    [reply] = await db
      .insert(schema.conversationMessages)
      .values({
        clientId: input.clientId,
        userId: null,
        senderRole: "assistant",
        senderName: "Vertrex IA",
        channel: normalizeOptionalString(input.channel) ?? "portal",
        message: replyPayload.reply,
        metadata: {
          source: "workspace",
          toolsUsed: replyPayload.toolsUsed,
        },
        updatedAt: new Date(),
      })
      .returning();
  } catch (error) {
    if (isMissingWorkspaceRelationError(error)) {
      throw new Error("La mensajería del portal todavía no está disponible en Neon porque falta la tabla `conversation_messages`.");
    }

    throw error;
  }

  await recordWorkspaceAuditEvent({
    actor: options.actor,
    client: input.clientId ? { id: input.clientId, name: null } : null,
    module: "portal",
    action: "create-message",
    entityType: "message",
    entityId: message.id,
    summary: `${input.senderName} envió un mensaje en el portal y disparó respuesta asistida.`,
    metadata: {
      senderRole: input.senderRole,
      channel: message.channel,
      autoReply: true,
      replyId: reply.id,
      toolsUsed: replyPayload.toolsUsed,
    },
  });

  return { message, reply };
}

export async function createWorkspaceFile(input: CreateWorkspaceFileInput, options: WorkspaceMutationOptions = {}) {
  const db = requireDb();
  const context = await resolveOperationalContext(input);
  const storedAsset = await storeAssetFile(input.file, {
    category: input.category,
    clientSlug: context.client?.slug ?? null,
    projectSlug: context.project ? normalizeSlug(context.project.name) : null,
    target: input.target ?? undefined,
  });
  const [record] = await db
    .insert(schema.portalFiles)
    .values({
      clientId: context.clientId,
      name: input.file.name,
      sizeLabel: storedAsset.sizeLabel,
      uploadedAtLabel: formatDateTime(new Date()),
      category: normalizeOptionalString(input.category) ?? "General",
      source: input.source,
      storageKey: storedAsset.storageKey,
      metadata: {
        ...storedAsset.metadata,
        href: storedAsset.href,
        provider: storedAsset.provider,
        projectId: context.project?.id ?? input.projectId ?? null,
        projectName: context.project?.name ?? null,
      },
      updatedAt: new Date(),
    })
    .returning();

  await recordWorkspaceAuditEvent({
    actor: options.actor,
    client: context.client,
    project: context.project,
    module: "assets",
    action: "upload-file",
    entityType: "file",
    entityId: record.id,
    summary: `Subió el archivo ${record.name}.`,
    metadata: {
      source: record.source,
      category: record.category,
      provider: storedAsset.provider,
      storageKey: storedAsset.storageKey,
    },
  });

  return record;
}

export async function createWorkspaceAutomationPlaybook(input: CreateWorkspaceAutomationPlaybookInput, options: WorkspaceMutationOptions = {}) {
  const db = requireDb();
  const context = await resolveOperationalContext(input);
  const title = input.title.trim();
  const trigger = input.trigger.trim();
  const action = input.action.trim();

  if (!title) {
    throw new Error("El nombre del playbook es obligatorio.");
  }

  if (!trigger) {
    throw new Error("Debes definir un trigger para el playbook.");
  }

  if (!action) {
    throw new Error("Debes definir la acción principal del playbook.");
  }

  let playbook;

  try {
    [playbook] = await db
      .insert(schema.automationPlaybooks)
      .values({
        clientId: context.clientId,
        projectId: context.project?.id ?? input.projectId ?? null,
        title,
        trigger,
        action,
        result: normalizeOptionalString(input.result),
        summary: normalizeOptionalString(input.summary),
        status: normalizeAutomationPlaybookStatus(input.status),
        metadata: {
          source: "workspace",
        },
        updatedAt: new Date(),
      })
      .returning();
  } catch (error) {
    if (isMissingWorkspaceRelationError(error)) {
      throw new Error("Las automatizaciones persistidas todavía no están disponibles en Neon porque falta sincronizar la tabla `automation_playbooks`.");
    }

    throw error;
  }

  await recordWorkspaceAuditEvent({
    actor: options.actor,
    client: context.client,
    project: context.project,
    module: "automation",
    action: "create-playbook",
    entityType: "automation_playbook",
    entityId: playbook.id,
    summary: `Creó el playbook ${playbook.title}.`,
    metadata: {
      trigger: playbook.trigger,
      actionName: playbook.action,
      status: playbook.status,
      result: playbook.result,
    },
  });

  return playbook;
}

export async function createWorkspaceAutomationRun(input: CreateWorkspaceAutomationRunInput, options: WorkspaceMutationOptions = {}) {
  const db = requireDb();
  let linkedPlaybook: typeof schema.automationPlaybooks.$inferSelect | null = null;

  try {
    if (input.playbookId) {
      [linkedPlaybook] = await db
        .select()
        .from(schema.automationPlaybooks)
        .where(eq(schema.automationPlaybooks.id, input.playbookId))
        .limit(1);
    }
  } catch (error) {
    if (isMissingWorkspaceRelationError(error)) {
      throw new Error("Las automatizaciones persistidas todavía no están disponibles en Neon porque falta sincronizar la tabla `automation_playbooks`.");
    }

    throw error;
  }

  if (input.playbookId && !linkedPlaybook) {
    throw new Error("No encontramos el playbook de automatización indicado.");
  }

  const context = await resolveOperationalContext({
    clientId: linkedPlaybook?.clientId ?? input.clientId ?? null,
    clientSlug: input.clientSlug,
    projectId: linkedPlaybook?.projectId ?? input.projectId ?? null,
  });
  const title = normalizeOptionalString(input.title) ?? linkedPlaybook?.title ?? null;

  if (!title) {
    throw new Error("Debes indicar un playbook válido o un título para registrar la ejecución.");
  }

  const status = normalizeAutomationRunStatus(input.status, "completed");
  const runTimestamp = new Date();
  let automationRun;

  try {
    [automationRun] = await db
      .insert(schema.automationRuns)
      .values({
        playbookId: linkedPlaybook?.id ?? null,
        clientId: context.clientId,
        projectId: context.project?.id ?? linkedPlaybook?.projectId ?? input.projectId ?? null,
        title,
        status,
        triggerSource: normalizeOptionalString(input.triggerSource) ?? linkedPlaybook?.trigger ?? "manual",
        summary: normalizeOptionalString(input.summary) ?? buildDefaultAutomationRunSummary(title, status),
        startedAt: runTimestamp,
        finishedAt: isFinishedAutomationRunStatus(status) ? runTimestamp : null,
        metadata: {
          source: "workspace",
          playbookTitle: linkedPlaybook?.title ?? null,
          playbookTrigger: linkedPlaybook?.trigger ?? null,
          playbookAction: linkedPlaybook?.action ?? null,
        },
        updatedAt: runTimestamp,
      })
      .returning();
  } catch (error) {
    if (isMissingWorkspaceRelationError(error)) {
      throw new Error("Las automatizaciones persistidas todavía no están disponibles en Neon porque falta sincronizar la tabla `automation_runs`.");
    }

    throw error;
  }

  if (linkedPlaybook) {
    await db
      .update(schema.automationPlaybooks)
      .set({
        lastRunAt: runTimestamp,
        updatedAt: runTimestamp,
      })
      .where(eq(schema.automationPlaybooks.id, linkedPlaybook.id));
  }

  await recordWorkspaceAuditEvent({
    actor: options.actor,
    client: context.client,
    project: context.project,
    module: "automation",
    action: "register-run",
    entityType: "automation_run",
    entityId: automationRun.id,
    summary: `Registró una ejecución ${getAutomationRunStatusLabel(status).toLowerCase()} para ${title}.`,
    metadata: {
      playbookId: automationRun.playbookId,
      status: automationRun.status,
      triggerSource: automationRun.triggerSource,
      startedAt: automationRun.startedAt.toISOString(),
      finishedAt: toIsoString(automationRun.finishedAt),
    },
  });

  return automationRun;
}

export async function createWorkspaceLink(input: CreateWorkspaceLinkInput, options: WorkspaceMutationOptions = {}) {
  const db = requireDb();
  const context = await resolveOperationalContext(input);

  if (!input.url || !input.url.trim()) {
    throw new Error("Debes indicar una URL para el link.");
  }

  const title = input.title.trim();
  const url = input.url.trim();
  const domain = input.domain ?? null;

  const [link] = await db
    .insert(schema.links)
    .values({
      clientId: context.clientId,
      projectId: context.project?.id ?? input.projectId ?? null,
      title,
      url,
      kind: (normalizeOptionalString(input.kind) ?? "url") as "url" | "social_profile" | "github_repo" | "tiktok_account" | "streaming_community" | "dashboard" | "saas" | "document_reference" | "other",
      description: normalizeOptionalString(input.description),
      imageUrl: normalizeOptionalString(input.imageUrl),
      domain: normalizeOptionalString(domain),
      metadata: {
        source: "workspace",
      },
      updatedAt: new Date(),
    })
    .returning();

  await recordWorkspaceAuditEvent({
    actor: options.actor,
    client: context.client,
    project: context.project,
    module: "hub",
    action: "create-link",
    entityType: "link",
    entityId: link.id,
    summary: `Registró el link ${title}.`,
    metadata: {
      url,
      kind: link.kind,
      domain: link.domain,
    },
  });

  return link;
}

export async function getPortalConversationMessages(clientId: string) {
  const db = requireDb();
  return readOptionalWorkspaceDataset(() =>
    db
      .select()
      .from(schema.conversationMessages)
      .where(eq(schema.conversationMessages.clientId, clientId))
      .orderBy(desc(schema.conversationMessages.createdAt)),
  );
}

export async function getClientById(clientId: string) {
  const db = requireDb();
  const [client] = await db.select().from(schema.clients).where(eq(schema.clients.id, clientId)).limit(1);

  if (!client) {
    throw new Error("Cliente no encontrado.");
  }

  return client;
}

export async function getProjectById(projectId: string) {
  const db = requireDb();
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId)).limit(1);

  if (!project) {
    throw new Error("Proyecto no encontrado.");
  }

  return project;
}

async function resolveOptionalClientId(clientId: string | null | undefined, clientSlug: string | null | undefined) {
  if (clientId) {
    return clientId;
  }

  const normalizedSlug = normalizeOptionalString(clientSlug);

  if (!normalizedSlug) {
    return null;
  }

  const db = requireDb();
  const [client] = await db
    .select({ id: schema.clients.id })
    .from(schema.clients)
    .where(eq(schema.clients.slug, normalizeSlug(normalizedSlug)))
    .limit(1);

  if (!client) {
    throw new Error("No encontramos un cliente con ese slug.");
  }

  return client.id;
}

async function ensureWorkspaceClient(
  input: {
    slug?: string | null;
    name: string;
    brand?: string | null;
    email?: string | null;
    phone?: string | null;
    company?: string | null;
    phase?: string | null;
    progress?: number | null;
    totalInvestmentCents?: number | null;
    paidCents?: number | null;
    pendingCents?: number | null;
    nextAction?: string | null;
    nextActionContext?: string | null;
    nextActionCta?: string | null;
  },
  options: { reuseExisting: boolean },
) {
  const db = requireDb();
  const name = input.name.trim();

  if (!name) {
    throw new Error("El nombre del cliente es obligatorio.");
  }

  const slug = normalizeSlug(input.slug ?? name);
  const [existing] = await db.select().from(schema.clients).where(eq(schema.clients.slug, slug)).limit(1);

  if (existing) {
    if (options.reuseExisting) {
      return existing;
    }

    throw new Error("Ya existe un cliente con ese slug.");
  }

  const brand = normalizeOptionalString(input.brand) ?? name.toUpperCase();
  const totalInvestmentCents = normalizeAmount(input.totalInvestmentCents);
  const paidCents = normalizeAmount(input.paidCents);
  const pendingCents = input.pendingCents == null ? Math.max(totalInvestmentCents - paidCents, 0) : normalizeAmount(input.pendingCents);
  const [client] = await db
    .insert(schema.clients)
    .values({
      slug,
      name,
      brand,
      email: normalizeEmail(input.email),
      phone: normalizeOptionalString(input.phone),
      company: normalizeOptionalString(input.company) ?? name,
      status: "active",
      phase: normalizeOptionalString(input.phase) ?? "Onboarding",
      progress: normalizePercent(input.progress ?? 0),
      totalInvestmentCents,
      paidCents,
      pendingCents,
      nextAction: normalizeOptionalString(input.nextAction) ?? "Crear proyecto inicial",
      nextActionContext: normalizeOptionalString(input.nextActionContext) ?? "Operación",
      nextActionCta: normalizeOptionalString(input.nextActionCta) ?? "Abrir OS",
      metadata: {
        source: "workspace",
        displayName: name,
        statusLabel: "Cliente activo",
        statusHighlights: [
          { label: "Último update", value: formatDateTime(new Date()) },
          { label: "Responsable", value: "Vertrex OS" },
        ],
      },
      updatedAt: new Date(),
    })
    .returning();

  return client;
}

async function resolveClientForProjectCreation(input: CreateWorkspaceProjectInput) {
  const existingClientId = await resolveOptionalClientId(input.clientId, input.clientSlug);

  if (existingClientId) {
    return getClientById(existingClientId);
  }

  if (!input.createClient) {
    return null;
  }

  const clientName = normalizeOptionalString(input.clientName) ?? input.name.trim();

  return ensureWorkspaceClient(
    {
      slug: input.clientSlug,
      name: clientName,
      brand: normalizeOptionalString(input.clientBrand) ?? clientName.toUpperCase(),
      email: input.clientEmail,
      company: input.clientCompany,
      totalInvestmentCents: input.clientTotalInvestmentCents,
      paidCents: input.clientPaidCents,
      pendingCents: input.clientPendingCents,
      nextAction: "Abrir proyecto",
      nextActionContext: input.name.trim(),
      nextActionCta: "Abrir OS",
    },
    { reuseExisting: true },
  );
}

function hasReachedPortalActivationThreshold(totalInvestmentCents: number | null | undefined, paidCents: number | null | undefined) {
  const total = totalInvestmentCents ?? 0;
  const paid = paidCents ?? 0;
  return total > 0 && paid * 2 >= total;
}

async function resolveOperationalContext(input: { clientId?: string | null; clientSlug?: string | null; projectId?: string | null }) {
  const project = input.projectId ? await getProjectById(input.projectId) : null;
  const explicitClientId = await resolveOptionalClientId(input.clientId ?? null, input.clientSlug ?? null);

  if (explicitClientId && project?.clientId && explicitClientId !== project.clientId) {
    throw new Error("El cliente indicado no coincide con el cliente enlazado al proyecto.");
  }

  const clientId = explicitClientId ?? project?.clientId ?? null;
  const client = clientId ? await getClientById(clientId) : null;

  return {
    clientId,
    client,
    project,
  };
}

async function ensurePortalAccessUser(input: {
  client: Awaited<ReturnType<typeof getClientById>>;
  userName?: string | null;
  userEmail?: string | null;
  password?: string | null;
  activateNow?: boolean | null;
  actor?: AuditActorInput | null;
}) {
  const db = requireDb();
  const desiredName = normalizeOptionalString(input.userName) ?? input.client.name;
  const desiredEmail = normalizeEmail(input.userEmail) ?? `${input.client.slug}@client.vertrex.co`;
  const plainPassword = normalizeOptionalString(input.password)
    ?? normalizeOptionalString(process.env.TEST_CLIENT_PASSWORD)
    ?? normalizeOptionalString(process.env.SEED_DEFAULT_PASSWORD);

  if (!plainPassword) {
    throw new Error("Debes indicar una contraseña para provisionar el acceso del portal o configurar TEST_CLIENT_PASSWORD / SEED_DEFAULT_PASSWORD.");
  }

  const [existingByClient] = await db
    .select()
    .from(schema.users)
    .where(and(eq(schema.users.clientId, input.client.id), eq(schema.users.role, "client")))
    .limit(1);
  const [existingByEmail] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, desiredEmail))
    .limit(1);

  if (existingByEmail && existingByEmail.clientId && existingByEmail.clientId !== input.client.id) {
    throw new Error("Ya existe un usuario con ese correo asociado a otro cliente.");
  }

  const targetUser = existingByClient ?? existingByEmail ?? null;
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  if (targetUser) {
    const [updated] = await db
      .update(schema.users)
      .set({
        name: desiredName,
        email: desiredEmail,
        passwordHash,
        role: "client",
        clientId: input.client.id,
        isActive: input.activateNow ? true : targetUser.isActive,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, targetUser.id))
      .returning();

    await recordWorkspaceAuditEvent({
      actor: input.actor,
      client: input.client,
      module: "portal",
      action: input.activateNow ? "activate-portal-access" : "update-portal-access",
      entityType: "user",
      entityId: updated.id,
      summary: `${input.activateNow ? "Activó" : "Actualizó"} el acceso portal de ${updated.name}.`,
      metadata: {
        email: updated.email,
        isActive: updated.isActive,
      },
    });

    return updated;
  }

  const [created] = await db
    .insert(schema.users)
    .values({
      name: desiredName,
      email: desiredEmail,
      passwordHash,
      role: "client",
      clientId: input.client.id,
      isActive: input.activateNow ?? true,
      updatedAt: new Date(),
    })
    .returning();

  await recordWorkspaceAuditEvent({
    actor: input.actor,
    client: input.client,
    module: "portal",
    action: (input.activateNow ?? true) ? "activate-portal-access" : "provision-portal-access",
    entityType: "user",
    entityId: created.id,
    summary: `${(input.activateNow ?? true) ? "Activó" : "Provisionó"} el acceso portal de ${created.name}.`,
    metadata: {
      email: created.email,
      isActive: created.isActive,
    },
  });

  return created;
}

async function recordWorkspaceAuditEvent(input: {
  actor?: AuditActorInput | null;
  client?: { id: string; name?: string | null } | null;
  project?: { id: string; name?: string | null } | null;
  module: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
  clientVisible?: boolean;
}) {
  await recordAuditEvent({
    actor: input.actor,
    clientId: input.client?.id ?? null,
    clientName: input.client?.name ?? null,
    projectId: input.project?.id ?? null,
    projectName: input.project?.name ?? null,
    module: input.module,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    summary: input.summary,
    metadata: input.metadata,
  });

  if (input.entityId) {
    await recordBusinessEvent({
      actor: input.actor,
      eventType: `${input.module}.${input.action}`,
      module: input.module,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      clientId: input.client?.id ?? null,
      clientName: input.client?.name ?? null,
      projectId: input.project?.id ?? null,
      projectName: input.project?.name ?? null,
      summary: input.summary,
      clientVisible: input.clientVisible ?? isClientVisibleBusinessEvent(input.module, input.entityType),
      payload: input.metadata,
    });
  }
}

function createEmptyWorkspaceSnapshot(): WorkspaceSnapshot {
  return {
    databaseConfigured: false,
    storage: getStorageConnectionSummary(),
    summary: {
      clients: 0,
      activeClients: 0,
      projects: 0,
      openTasks: 0,
      deals: 0,
      upcomingEvents: 0,
      pendingInvoices: 0,
      tickets: 0,
      files: 0,
    },
    clients: [],
    projects: [],
    tasks: [],
    milestones: [],
    deals: [],
    events: [],
    files: [],
    credentials: [],
    tickets: [],
    invoices: [],
    documents: [],
    transactions: [],
    messages: [],
    automationPlaybooks: [],
    automationRuns: [],
    links: [],
    users: [],
  };
}

async function readOptionalWorkspaceDataset<T>(reader: () => Promise<T[]>) {
  try {
    return await reader();
  } catch (error) {
    if (isMissingWorkspaceRelationError(error)) {
      return [];
    }

    throw error;
  }
}

function isMissingWorkspaceRelationError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  if (typeof error === "string") {
    return hasMissingWorkspaceRelationMessage(error);
  }

  if (typeof error === "object") {
    const candidate = error as { code?: unknown; message?: unknown; cause?: unknown };

    if (candidate.code === "42P01") {
      return true;
    }

    if (typeof candidate.message === "string" && hasMissingWorkspaceRelationMessage(candidate.message)) {
      return true;
    }

    return isMissingWorkspaceRelationError(candidate.cause);
  }

  return false;
}

function hasMissingWorkspaceRelationMessage(message: string) {
  const normalized = message.toLowerCase();

  return (
    (normalized.includes("relation") && normalized.includes("does not exist"))
    || (normalized.includes("table") && normalized.includes("does not exist"))
    || normalized.includes("no such table")
    || normalized.includes("undefined_table")
    || normalized.includes("database_url no está configurada")
    || normalized.includes("database_url is not configured")
    || normalized.includes("connection")
    || normalized.includes("connect")
    || normalized.includes("econnrefused")
    || normalized.includes("enotfound")
  );
}

function countBy<T>(items: T[], getKey: (item: T) => string | null) {
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

function sumNumberBy<T>(items: T[], getKey: (item: T) => string | null, getValue: (item: T) => number) {
  const map = new Map<string, number>();

  for (const item of items) {
    const key = getKey(item);

    if (!key) {
      continue;
    }

    map.set(key, (map.get(key) ?? 0) + getValue(item));
  }

  return map;
}

function normalizeSlug(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!normalized) {
    throw new Error("No fue posible generar un slug válido.");
  }

  return normalized;
}

function normalizeOptionalString(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeProjectTrack(value: string | null | undefined, fallback: WorkspaceProjectTrack = "commercial"): WorkspaceProjectTrack {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) {
    return fallback;
  }

  if (["community", "comunidad", "open-source", "open_source", "social"].includes(normalized)) {
    return "community";
  }

  if (["roadmap", "future", "futuro", "upcoming", "planned", "launch", "pipeline"].includes(normalized)) {
    return "roadmap";
  }

  return "commercial";
}

function isRoadmapProjectStatus(status: string | null | undefined) {
  return ["planned", "upcoming", "launch", "launching", "scheduled", "prelaunch", "roadmap"].includes((status ?? "").trim().toLowerCase());
}

function normalizeEmail(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();
  return normalized ? normalized : null;
}

function normalizeAmount(value: number | null | undefined) {
  return Math.max(0, Math.round(value ?? 0));
}

function normalizePositiveInteger(value: number | null | undefined, fallback = 1) {
  const normalized = Math.round(value ?? fallback);
  return normalized > 0 ? normalized : fallback;
}

function normalizeNonNegativeInteger(value: number | null | undefined, fallback = 0) {
  const normalized = Math.round(value ?? fallback);
  return normalized >= 0 ? normalized : fallback;
}

function normalizeAutomationPlaybookStatus(
  value: WorkspaceAutomationPlaybookStatus | null | undefined,
  fallback: WorkspaceAutomationPlaybookStatus = "active",
): WorkspaceAutomationPlaybookStatus {
  return value ?? fallback;
}

function normalizeAutomationRunStatus(
  value: WorkspaceAutomationRunStatus | null | undefined,
  fallback: WorkspaceAutomationRunStatus = "queued",
): WorkspaceAutomationRunStatus {
  return value ?? fallback;
}

function isFinishedAutomationRunStatus(status: WorkspaceAutomationRunStatus) {
  return ["completed", "needs_review", "failed"].includes(status);
}

function getAutomationRunStatusLabel(status: WorkspaceAutomationRunStatus) {
  switch (status) {
    case "queued":
      return "encolada";
    case "running":
      return "en ejecución";
    case "completed":
      return "completada";
    case "needs_review":
      return "pendiente de revisión";
    case "failed":
      return "fallida";
  }
}

function buildDefaultAutomationRunSummary(title: string, status: WorkspaceAutomationRunStatus) {
  switch (status) {
    case "queued":
      return `El playbook ${title} quedó en cola para ejecutarse con contexto operativo.`;
    case "running":
      return `El playbook ${title} se marcó como en ejecución desde el workspace.`;
    case "completed":
      return `El playbook ${title} se ejecutó manualmente y dejó traza auditable.`;
    case "needs_review":
      return `El playbook ${title} requiere validación humana antes de cerrarse.`;
    case "failed":
      return `El playbook ${title} registró una falla y debe revisarse.`;
  }
}

function normalizePercent(value: number | null | undefined) {
  return Math.max(0, Math.min(100, Math.round(value ?? 0)));
}

function isClosedMilestoneStatus(status: string | null | undefined) {
  return ["approved", "completed", "skipped"].includes((status ?? "").trim().toLowerCase());
}

function isClientVisibleBusinessEvent(module: string, entityType: string) {
  if (["project", "task", "milestone", "invoice", "ticket", "message", "event", "document"].includes(entityType)) {
    return true;
  }

  return ["projects", "finance", "support", "portal"].includes(module);
}

function parseDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toIsoString(value: Date | null) {
  return value ? value.toISOString() : null;
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function getStringMetadata(metadata: Record<string, unknown>, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" ? value : null;
}

function requireDb() {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL no está configurada. Conecta Neon para operar Vertrex OS.");
  }

  return getDb();
}
