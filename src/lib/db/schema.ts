import {
  boolean,
  integer,
  jsonb,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  foreignKey,
} from "drizzle-orm/pg-core";
import {
  workspaceDocumentStatusValues,
  workspaceInvoiceStatusValues,
  workspaceTaskStatusValues,
} from "../ops/status-catalog";

export const userRoleEnum = pgEnum("user_role", ["team", "client"]);
export const teamSubroleEnum = pgEnum("team_subrole", ["admin", "ops", "dev", "growth", "finance_legal", "support"]);
export const documentStatusEnum = pgEnum("document_status", workspaceDocumentStatusValues);
export const documentKindEnum = pgEnum("document_kind", ["Comercial", "Legal", "Finanzas", "Requerimientos", "Operativo"]);
export const documentOriginEnum = pgEnum("document_origin", ["generator", "portal", "legal", "os"]);
export const invoiceStatusEnum = pgEnum("invoice_status", workspaceInvoiceStatusValues);
export const ticketStatusEnum = pgEnum("ticket_status", ["open", "in_progress", "resolved", "closed"]);
export const taskStatusEnum = pgEnum("task_status", workspaceTaskStatusValues);
export const milestoneStatusEnum = pgEnum("milestone_status", ["pending", "in_progress", "under_review", "approved", "completed", "blocked", "skipped"]);
export const businessEventActorTypeEnum = pgEnum("business_event_actor_type", ["user", "ai", "system", "automation"]);
export const credentialStatusEnum = pgEnum("credential_status", ["requested", "shared", "updated"]);
export const fileSourceEnum = pgEnum("file_source", ["client", "vertrex"]);
export const requestStatusEnum = pgEnum("document_request_status", ["requested", "drafting", "delivered", "closed"]);
export const generatedDocumentTypeEnum = pgEnum("generated_document_type", ["oficio", "contrato", "cuenta-de-cobro", "sow"]);
export const automationPlaybookStatusEnum = pgEnum("automation_playbook_status", ["draft", "active", "paused"]);
export const automationRunStatusEnum = pgEnum("automation_run_status", ["queued", "running", "completed", "needs_review", "failed"]);
export const aiApprovalStatusEnum = pgEnum("ai_approval_status", ["pending", "approved", "rejected", "expired", "cancelled"]);
export const aiActionTypeEnum = pgEnum("ai_action_type", [
  "create_task",
  "update_task",
  "delete_task",
  "create_invoice",
  "update_invoice",
  "send_document",
  "update_deal_stage",
  "create_project",
  "add_milestone",
  "update_milestone",
  "send_message",
  "provision_portal",
  "rotate_credential",
  "execute_playbook",
  "modify_budget",
]);
export const dealStageEnum = pgEnum("deal_stage", [
  "sin_contactar",
  "contactado",
  "pendiente",
  "interesado",
  "propuesta_enviada",
  "pendiente_anticipo_50",
  "cliente_activo",
  "pausado",
  "perdido",
]);
export const linkTypeEnum = pgEnum("link_type", ["url", "social_profile", "github_repo", "tiktok_account", "streaming_community", "dashboard", "saas", "document_reference", "other"]);

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    brand: text("brand").notNull(),
    email: text("email"),
    phone: text("phone"),
    company: text("company"),
    status: text("status").notNull().default("active"),
    phase: text("phase"),
    progress: integer("progress").notNull().default(0),
    totalInvestmentCents: integer("total_investment_cents").notNull().default(0),
    paidCents: integer("paid_cents").notNull().default(0),
    pendingCents: integer("pending_cents").notNull().default(0),
    welcomeTitle: text("welcome_title"),
    welcomeDescription: text("welcome_description"),
    nextAction: text("next_action"),
    nextActionContext: text("next_action_context"),
    nextActionCta: text("next_action_cta"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex("clients_slug_idx").on(table.slug),
  }),
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull().default("team"),
    teamSubrole: teamSubroleEnum("team_subrole"),
    capabilities: jsonb("capabilities").$type<string[]>().notNull().default([]),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    avatarUrl: text("avatar_url"),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    totpSecret: text("totp_secret"),
    totpEnabled: boolean("totp_enabled").notNull().default(false),
    totpVerifiedAt: timestamp("totp_verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
  }),
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    sessionToken: text("session_token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    sessionTokenIdx: uniqueIndex("sessions_session_token_idx").on(table.sessionToken),
  }),
);

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"),
  progress: integer("progress").notNull().default(0),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  actorRole: userRoleEnum("actor_role"),
  actorName: text("actor_name"),
  actorEmail: text("actor_email"),
  targetUserId: uuid("target_user_id").references(() => users.id, { onDelete: "set null" }),
  targetName: text("target_name"),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
  clientName: text("client_name"),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  projectName: text("project_name"),
  module: text("module").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  summary: text("summary").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const businessEvents = pgTable("business_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventType: text("event_type").notNull(),
  module: text("module").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  actorType: businessEventActorTypeEnum("actor_type").notNull().default("system"),
  actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  actorName: text("actor_name"),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
  clientName: text("client_name"),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  projectName: text("project_name"),
  summary: text("summary").notNull(),
  clientVisible: boolean("client_visible").notNull().default(false),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  snapshotBefore: jsonb("snapshot_before").$type<Record<string, unknown>>(),
  snapshotAfter: jsonb("snapshot_after").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const automationPlaybooks = pgTable(
  "automation_playbooks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    trigger: text("trigger").notNull(),
    action: text("action").notNull(),
    result: text("result"),
    summary: text("summary"),
    status: automationPlaybookStatusEnum("status").notNull().default("active"),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    automationPlaybooksUpdatedAtIdx: index("automation_playbooks_updated_at_idx").on(table.updatedAt),
    automationPlaybooksProjectIdx: index("automation_playbooks_project_idx").on(table.projectId),
  }),
);

export const automationRuns = pgTable(
  "automation_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    playbookId: uuid("playbook_id").references(() => automationPlaybooks.id, { onDelete: "set null" }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    status: automationRunStatusEnum("status").notNull().default("queued"),
    triggerSource: text("trigger_source"),
    summary: text("summary").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    automationRunsStartedAtIdx: index("automation_runs_started_at_idx").on(table.startedAt),
    automationRunsPlaybookIdx: index("automation_runs_playbook_idx").on(table.playbookId),
  }),
);

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  owner: text("owner"),
  status: taskStatusEnum("status").notNull().default("todo"),
  dueLabel: text("due_label"),
  position: integer("position").notNull().default(0),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const milestones = pgTable("milestones", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: milestoneStatusEnum("status").notNull().default("pending"),
  targetDate: timestamp("target_date", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  approvedById: uuid("approved_by_id").references(() => users.id, { onDelete: "set null" }),
  clientVisible: boolean("client_visible").notNull().default(true),
  weight: integer("weight").notNull().default(1),
  orderIndex: integer("order_index").notNull().default(0),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const documentTemplates = pgTable(
  "document_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    templateKey: text("template_key").notNull(),
    slug: text("slug").notNull(),
    clientSlug: text("client_slug").notNull(),
    clientLabel: text("client_label").notNull(),
    title: text("title").notNull(),
    kind: text("kind").notNull(),
    category: documentKindEnum("category").notNull(),
    htmlPath: text("html_path").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    templateKeyIdx: uniqueIndex("document_templates_template_key_idx").on(table.templateKey),
  }),
);

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  templateId: uuid("template_id").references(() => documentTemplates.id, { onDelete: "set null" }),
  createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
  code: text("code").notNull(),
  title: text("title").notNull(),
  status: documentStatusEnum("status").notNull().default("draft"),
  category: documentKindEnum("category").notNull(),
  origin: documentOriginEnum("origin").notNull().default("generator"),
  htmlPath: text("html_path"),
  pdfPath: text("pdf_path"),
  summary: text("summary"),
  currentVersion: integer("current_version").notNull().default(1),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const documentVersions = pgTable("document_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull().default(1),
  htmlContent: text("html_content").notNull(),
  pdfPath: text("pdf_path"),
  draft: jsonb("draft").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const documentRequests = pgTable("document_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }),
  requestedById: uuid("requested_by_id").references(() => users.id, { onDelete: "set null" }),
  templateKey: text("template_key").notNull(),
  title: text("title").notNull(),
  status: requestStatusEnum("status").notNull().default("requested"),
  notes: text("notes"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const generatedDocuments = pgTable("generated_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => clients.id, { onDelete: "set null" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  type: generatedDocumentTypeEnum("type").notNull(),
  lang: text("lang").notNull().default("es"),
  title: text("title").notNull(),
  code: text("code").notNull(),
  blobUrl: text("blob_url").notNull(),
  blobPath: text("blob_path"),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }),
    documentId: uuid("document_id").references(() => documents.id, { onDelete: "set null" }),
    supportTicketId: uuid("support_ticket_id"),
    label: text("label").notNull(),
    invoiceNumber: text("invoice_number").notNull(),
    amountCents: integer("amount_cents").notNull().default(0),
    dueLabel: text("due_label"),
    dueDate: timestamp("due_date", { withTimezone: true }),
    status: invoiceStatusEnum("status").notNull().default("pending"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    invoiceNumberIdx: uniqueIndex("invoices_invoice_number_idx").on(table.invoiceNumber),
  }),
);

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  type: text("type").notNull(),
  amountCents: integer("amount_cents").notNull().default(0),
  category: text("category"),
  description: text("description"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const deals = pgTable("deals", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  stage: dealStageEnum("stage").notNull().default("sin_contactar"),
  billingModel: text("billing_model").notNull().default("one-time"),
  valueCents: integer("value_cents").notNull().default(0),
  probability: integer("probability").notNull().default(0),
  owner: text("owner"),
  summary: text("summary"),
  lastContactAt: timestamp("last_contact_at", { withTimezone: true }),
  expectedCloseAt: timestamp("expected_close_at", { withTimezone: true }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const calendarEvents = pgTable("calendar_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  kind: text("kind").notNull().default("meeting"),
  location: text("location"),
  meetUrl: text("meet_url"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  attendees: jsonb("attendees").$type<string[]>().notNull().default([]),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const portalCredentials = pgTable("portal_credentials", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  scope: text("scope"),
  status: credentialStatusEnum("status").notNull().default("requested"),
  updatedLabel: text("updated_label"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const portalFiles = pgTable("portal_files", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sizeLabel: text("size_label"),
  uploadedAtLabel: text("uploaded_at_label"),
  category: text("category"),
  source: fileSourceEnum("source").notNull().default("vertrex"),
  storageKey: text("storage_key"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tickets = pgTable("tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  summary: text("summary"),
  status: ticketStatusEnum("status").notNull().default("open"),
  updatedLabel: text("updated_label"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const conversationMessages = pgTable("conversation_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  senderRole: text("sender_role").notNull().default("team"),
  senderName: text("sender_name").notNull(),
  channel: text("channel").notNull().default("portal"),
  message: text("message").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const aiMemory = pgTable(
  "ai_memory",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: text("key").notNull(),
    category: text("category").notNull().default("global"),
    content: text("content").notNull(),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    aiMemoryKeyIdx: uniqueIndex("ai_memory_key_idx").on(table.key),
  }),
);

export const openclawSessions = pgTable(
  "openclaw_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionKey: text("session_key").notNull(),
    status: text("status").notNull().default("active"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    permissions: jsonb("permissions").$type<Record<string, unknown>>().notNull().default({}),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    openclawSessionKeyIdx: uniqueIndex("openclaw_sessions_session_key_idx").on(table.sessionKey),
  }),
);

export const links = pgTable(
  "links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    url: text("url").notNull(),
    kind: linkTypeEnum("kind").notNull().default("url"),
    description: text("description"),
    imageUrl: text("image_url"),
    domain: text("domain"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    linksClientIdx: index("links_client_idx").on(table.clientId),
    linksProjectIdx: index("links_project_idx").on(table.projectId),
    linksUrlIdx: index("links_url_idx").on(table.url),
  }),
);

export const entityRelationTypeEnum = pgEnum("entity_relation_type", [
  "depends_on",
  "blocks",
  "relates_to",
  "duplicates",
  "parent_of",
  "child_of",
  "references",
  "member_of",
  "has_member",
]);

export const entityRelations = pgTable(
  "entity_relations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceType: text("source_type").notNull(),
    sourceId: uuid("source_id").notNull(),
    targetType: text("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    relationType: entityRelationTypeEnum("relation_type").notNull().default("relates_to"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    sourceIdx: index("entity_relations_source_idx").on(table.sourceType, table.sourceId),
    targetIdx: index("entity_relations_target_idx").on(table.targetType, table.targetId),
    uniqueRelationIdx: uniqueIndex("entity_relations_unique_idx").on(
      table.sourceType,
      table.sourceId,
      table.targetType,
      table.targetId,
      table.relationType,
    ),
  }),
);

export const aiApprovals = pgTable(
  "ai_approvals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actionType: aiActionTypeEnum("action_type").notNull(),
    status: aiApprovalStatusEnum("status").notNull().default("pending"),
    description: text("description").notNull(),
    context: jsonb("context").$type<Record<string, unknown>>().notNull().default({}),
    proposedChanges: jsonb("proposed_changes").$type<Record<string, unknown>>().notNull().default({}),
    requestedById: uuid("requested_by_id").references(() => users.id, { onDelete: "set null" }),
    requestedByName: text("requested_by_name"),
    approvedById: uuid("approved_by_id").references(() => users.id, { onDelete: "set null" }),
    approvedByName: text("approved_by_name"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    rejectedById: uuid("rejected_by_id").references(() => users.id, { onDelete: "set null" }),
    rejectedByName: text("rejected_by_name"),
    rejectedAt: timestamp("rejected_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    executedAt: timestamp("executed_at", { withTimezone: true }),
    executionResult: jsonb("execution_result").$type<Record<string, unknown>>(),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    entityType: text("entity_type"),
    entityId: uuid("entity_id"),
    priority: text("priority").notNull().default("normal"),
    riskLevel: text("risk_level").notNull().default("medium"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    statusIdx: index("ai_approvals_status_idx").on(table.status),
    requestedByIdx: index("ai_approvals_requested_by_idx").on(table.requestedById),
    clientIdx: index("ai_approvals_client_idx").on(table.clientId),
    projectIdx: index("ai_approvals_project_idx").on(table.projectId),
    entityIdx: index("ai_approvals_entity_idx").on(table.entityType, table.entityId),
    pendingPriorityIdx: index("ai_approvals_pending_priority_idx").on(table.status, table.priority),
  }),
);

export const workspaceSettings = pgTable(
  "workspace_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    category: text("category").notNull().default("general"),
    key: text("key").notNull(),
    value: jsonb("value").$type<Record<string, unknown>>().notNull().default({}),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    updatedById: uuid("updated_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    categoryKeyIdx: uniqueIndex("workspace_settings_category_key_idx").on(table.category, table.key),
  }),
);

export const portalActivityFeed = pgTable(
  "portal_activity_feed",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    actorType: text("actor_type").notNull(),
    actorName: text("actor_name"),
    actorId: uuid("actor_id"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    entityName: text("entity_name"),
    description: text("description").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    clientVisible: boolean("client_visible").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    clientIdx: index("portal_feed_client_idx").on(table.clientId),
    projectIdx: index("portal_feed_project_idx").on(table.projectId),
    entityIdx: index("portal_feed_entity_idx").on(table.entityType, table.entityId),
    createdAtIdx: index("portal_feed_created_at_idx").on(table.createdAt),
  }),
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    author: text("author").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    entityIdx: index("comments_entity_idx").on(table.entityType, table.entityId),
    createdAtIdx: index("comments_created_at_idx").on(table.createdAt),
  }),
);

export const kbArticles = pgTable(
  "kb_articles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    category: text("category").notNull().default("general"),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    viewCount: integer("view_count").notNull().default(0),
    helpfulCount: integer("helpful_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    categoryIdx: index("kb_category_idx").on(table.category),
    createdAtIdx: index("kb_created_at_idx").on(table.createdAt),
  }),
);

export const emailLogs = pgTable(
  "email_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    to: text("to").notNull(),
    subject: text("subject").notNull(),
    template: text("template").notNull(),
    variables: jsonb("variables").$type<Record<string, string>>().notNull().default({}),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
    status: text("status").notNull().default("pending"),
    error: text("error"),
  },
  (table) => ({
    statusIdx: index("email_status_idx").on(table.status),
    sentAtIdx: index("email_sent_at_idx").on(table.sentAt),
  }),
);

export const clientContacts = pgTable(
  "client_contacts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    role: text("role").notNull().default("primary"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    clientIdx: index("client_contacts_client_idx").on(table.clientId),
  }),
);

export const timeEntries = pgTable(
  "time_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    durationMinutes: integer("duration_minutes").notNull(),
    description: text("description"),
    loggedAt: timestamp("logged_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    taskIdx: index("time_entries_task_idx").on(table.taskId),
    userIdx: index("time_entries_user_idx").on(table.userId),
    loggedAtIdx: index("time_entries_logged_at_idx").on(table.loggedAt),
  }),
);

export const responseMacros = pgTable(
  "response_macros",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    category: text("category").notNull().default("general"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    categoryIdx: index("response_macros_category_idx").on(table.category),
  }),
);

export const billingSchedules = pgTable(
  "billing_schedules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    label: text("label").notNull(),
    amountCents: integer("amount_cents").notNull(),
    frequency: text("frequency").notNull(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }),
    nextInvoiceDate: timestamp("next_invoice_date", { withTimezone: true }),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    clientIdx: index("billing_schedules_client_idx").on(table.clientId),
    nextDateIdx: index("billing_schedules_next_date_idx").on(table.nextInvoiceDate),
  }),
);

export const fileFolders = pgTable(
  "file_folders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    parentId: uuid("parent_id"),
    name: text("name").notNull(),
    description: text("description"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    parentFk: foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: "file_folders_parent_fk",
    }).onDelete("cascade"),
    parentIdx: index("file_folders_parent_idx").on(table.parentId),
  }),
);

export const fileShares = pgTable(
  "file_shares",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fileId: uuid("file_id").notNull(),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    accessCount: integer("access_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tokenIdx: uniqueIndex("file_shares_token_idx").on(table.token),
  }),
);

export const documentSignatures = pgTable(
  "document_signatures",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentId: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id),
    signedAt: timestamp("signed_at", { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text("ip_address"),
    confirmationContext: text("confirmation_context").notNull(),
    snapshotHash: text("snapshot_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    docIdx: index("document_signatures_doc_idx").on(table.documentId),
  }),
);

export const teamAvailability = pgTable(
  "team_availability",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("team_availability_user_idx").on(table.userId),
  }),
);

export const ticketSatisfaction = pgTable(
  "ticket_satisfaction",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ticketId: uuid("ticket_id").notNull().references(() => tickets.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    ticketIdx: uniqueIndex("ticket_satisfaction_ticket_idx").on(table.ticketId),
  }),
);
