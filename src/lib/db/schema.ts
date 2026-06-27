import { sql } from "drizzle-orm";
import { boolean, foreignKey, index, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["team", "admin"]);
export const entityTypeEnum = pgEnum("entity_type", [
  "client",
  "project",
  "document",
  "resource",
  "finance",
  "agenda",
  "link",
  "repository",
  "ticket",
  "note",
  "idea",
  "legal",
  "social_account",
  "team_member",
  "task",
  "cycle",
  "milestone",
  "comment",
  "approval",
  "signature",
  "notification",
  "activity",
  "saved_view",
  "tag",
]);
export const storageProviderEnum = pgEnum("storage_provider", ["neon", "drive"]);

export const taskTypeEnum = pgEnum("task_type", [
  "code",
  "design",
  "marketing",
  "content",
  "document",
  "meeting",
  "research",
  "ops",
  "support",
  "bug",
  "feature",
  "other",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("team"),
  isActive: boolean("is_active").notNull().default(true),
  status: text("status").notNull().default("active"),
  preferences: jsonb("preferences").default(sql`'{}'::jsonb`),
  telegramUsername: text("telegram_username"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const modulePermissions = pgTable("module_permissions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  module: text("module").notNull(),
  permission: text("permission").notNull().default("read"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  userModuleUnique: unique().on(table.userId, table.module)
}));

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  pinHash: text("pin_hash").notNull(),
  email: text("email"),
  phone: text("phone"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const clientPortalUsers = pgTable("client_portal_users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email"),
  roleLabel: text("role_label"),
  pinHash: text("pin_hash").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  projectKey: text("project_key").unique(),
  budgetCop: integer("budget_cop"),
  status: text("status").notNull().default("active"),
  progress: integer("progress").notNull().default(0),
  progressMode: text("progress_mode").notNull().default("auto"),
  currentVersion: text("current_version").default("v1.0"),
  referenceLinks: jsonb("reference_links").notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const cycles = pgTable("cycles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  status: text("status").notNull().default("planned"),
  goal: text("goal"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const milestones = pgTable("milestones", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  targetDate: timestamp("target_date"),
  status: text("status").notNull().default("open"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  label: text("label").notNull(),
  color: text("color").notNull().default("#64748b"),
  scope: text("scope").notNull().default("global"),
  scopeId: uuid("scope_id"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  parentTaskId: uuid("parent_task_id"), 
  identifier: text("identifier").notNull().unique(),
  title: text("title").notNull(),
  descriptionJson: jsonb("description_json").notNull().default(sql`'{}'::jsonb`),
  state: text("state").notNull().default("backlog"),
  priority: integer("priority").notNull().default(0),
  taskType: taskTypeEnum("task_type").notNull().default("other"),
  estimatePoints: integer("estimate_points"),
  assigneeId: uuid("assignee_id").references(() => users.id),
  cycleId: uuid("cycle_id").references(() => cycles.id, { onDelete: "set null" }),
  milestoneId: uuid("milestone_id").references(() => milestones.id, { onDelete: "set null" }),
  orderIndex: integer("order_index").notNull().default(0),
  dueDate: timestamp("due_date"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  parentFk: foreignKey({
    columns: [table.parentTaskId],
    foreignColumns: [table.id],
    name: "tasks_parent_task_id_fkey"
  }).onDelete("cascade"),
  projectIdx: index("tasks_project_idx").on(table.projectId),
  assigneeIdx: index("tasks_assignee_idx").on(table.assigneeId),
  cycleIdx: index("tasks_cycle_idx").on(table.cycleId),
  milestoneIdx: index("tasks_milestone_idx").on(table.milestoneId),
  parentIdx: index("tasks_parent_idx").on(table.parentTaskId),
  stateIdx: index("tasks_state_idx").on(table.state),
  dueDateIdx: index("tasks_due_date_idx").on(table.dueDate),
}));

export const taskLabels = pgTable("task_labels", {
  taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  tagId: uuid("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey({ columns: [table.taskId, table.tagId] }),
}));

export const documentFolders = pgTable("document_folders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  parentId: uuid("parent_id"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  parentFk: foreignKey({
    columns: [table.parentId],
    foreignColumns: [table.id],
    name: "document_folders_parent_id_fkey"
  }).onDelete("cascade"),
}));

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  folderId: uuid("folder_id").references(() => documentFolders.id, { onDelete: "set null" }),
  version: integer("version").notNull().default(1),
  parentId: uuid("parent_id"),
  sizeBytes: integer("size_bytes").notNull().default(0),
  storageProvider: storageProviderEnum("storage_provider").notNull().default("neon"),
  driveFileId: text("drive_file_id"),
  url: text("url"),
  mimeType: text("mime_type"),
  contentBase64: text("content_base64"),
  isPublic: boolean("is_public").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  parentFk: foreignKey({
    columns: [table.parentId],
    foreignColumns: [table.id],
    name: "documents_parent_id_fkey"
  }).onDelete("cascade"),
}));

export const shareTokens = pgTable("share_tokens", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const legalTemplates = pgTable("legal_templates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(),
  bodyHtml: text("body_html").notNull(),
  variables: jsonb("variables").notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const legalDocuments = pgTable("legal_documents", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull().default("otro"),
  sizeBytes: integer("size_bytes").notNull().default(0),
  storageProvider: storageProviderEnum("storage_provider").notNull().default("neon"),
  driveFileId: text("drive_file_id"),
  url: text("url"),
  contentBase64: text("content_base64"),
  mimeType: text("mime_type"),
  bodyHtml: text("body_html"),
  isPublic: boolean("is_public").notNull().default(false),
  expiresAt: timestamp("expires_at"),
  templateId: uuid("template_id").references(() => legalTemplates.id),
  requiresSignature: boolean("requires_signature").notNull().default(false),
  signedAt: timestamp("signed_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const signatures = pgTable("signatures", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  legalId: uuid("legal_id").notNull().references(() => legalDocuments.id, { onDelete: "cascade" }),
  signerName: text("signer_name").notNull(),
  signerEmail: text("signer_email"),
  clientId: uuid("client_id").references(() => clients.id),
  portalUserId: uuid("portal_user_id").references(() => clientPortalUsers.id),
  pdfUrl: text("pdf_url"),
  pdfHash: text("pdf_hash"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  signedAt: timestamp("signed_at").notNull().default(sql`now()`),
});

export const knowledgeNotes = pgTable("knowledge_notes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  contentJson: jsonb("content_json").notNull().default(sql`'{}'::jsonb`),
  type: text("type").notNull().default("note"),
  ideaStatus: text("idea_status").default("semilla"),
  objective: text("objective"),
  nextStep: text("next_step"),
  relatedProjectId: uuid("related_project_id").references(() => projects.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const resourceFolders = pgTable("resource_folders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  parentId: uuid("parent_id"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  parentFk: foreignKey({
    columns: [table.parentId],
    foreignColumns: [table.id],
    name: "resource_folders_parent_id_fkey"
  }).onDelete("cascade"),
}));

export const resources = pgTable("resources", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  type: text("type").notNull().default("otro"),
  encryptedValue: text("encrypted_value").notNull(),
  rotationDueAt: timestamp("rotation_due_at"),
  visibility: text("visibility").notNull().default("team"),
  folderId: uuid("folder_id").references(() => resourceFolders.id, { onDelete: "set null" }),
  ownerId: uuid("owner_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const resourceAccessLog = pgTable("resource_access_log", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  resourceId: uuid("resource_id").notNull().references(() => resources.id, { onDelete: "cascade" }),
  actorId: uuid("actor_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const finances = pgTable("finances", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  amountCop: integer("amount_cop").notNull().default(0),
  currency: text("currency").notNull().default("COP"),
  recurrence: text("recurrence").notNull().default("none"),
  nextDueDate: timestamp("next_due_date"),
  vatAmountCop: integer("vat_amount_cop").notNull().default(0),
  vatRate: integer("vat_rate").notNull().default(0),
  invoiceNumber: text("invoice_number"),
  status: text("status").notNull().default("pending"),
  concept: text("concept").notNull(),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const agendaEvents = pgTable("agenda_events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  recurrenceRule: text("recurrence_rule").notNull().default("none"),
  timezone: text("timezone").notNull().default("America/Bogota"),
  externalProvider: text("external_provider"),
  externalId: text("external_id"),
  reminderMinutes: integer("reminder_minutes"),
  meetLink: text("meet_link"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const linkCollections = pgTable("link_collections", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const repositories = pgTable("repositories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  url: text("url").notNull().unique(),
  owner: text("owner").notNull(),
  repoName: text("repo_name").notNull(),
  description: text("description"),
  language: text("language"),
  languageColor: text("language_color"),
  stars: integer("stars").notNull().default(0),
  forks: integer("forks").notNull().default(0),
  topics: jsonb("topics").notNull().default(sql`'[]'::jsonb`),
  pushedAt: timestamp("pushed_at"),
  readmeContent: text("readme_content"),
  savedReason: text("saved_reason").notNull(),
  implementationStatus: text("implementation_status").notNull().default("pendiente"),
  priority: integer("priority").notNull().default(3),
  collectionId: uuid("collection_id").references(() => linkCollections.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const links = pgTable("links", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  url: text("url").notNull().unique(),
  title: text("title"),
  description: text("description"),
  imageUrl: text("image_url"),
  type: text("type").notNull().default("otro"),
  collectionId: uuid("collection_id").references(() => linkCollections.id, { onDelete: "set null" }),
  readingStatus: text("reading_status").notNull().default("triage"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const socialAccounts = pgTable("social_accounts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  platform: text("platform").notNull(),
  handle: text("handle").notNull(),
  email: text("email"),
  passwordEncrypted: text("password_encrypted"),
  notes: text("notes"),
  followersCount: integer("followers_count").default(0),
  reachCount: integer("reach_count").default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const marketingHashtags = pgTable("marketing_hashtags", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  label: text("label").notNull(),
  tags: jsonb("tags").notNull().default(sql`'[]'::jsonb`),
  accountId: uuid("account_id").references(() => socialAccounts.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const contentPlan = pgTable("content_plan", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  socialAccountId: uuid("social_account_id").notNull().references(() => socialAccounts.id),
  title: text("title").notNull(),
  contentType: text("content_type").notNull(),
  status: text("status").notNull().default("idea"),
  scheduledAt: timestamp("scheduled_at"),
  notes: text("notes"),
  assetDocumentIds: jsonb("asset_document_ids").notNull().default(sql`'[]'::jsonb`),
  reach: integer("reach"),
  likes: integer("likes"),
  comments: integer("comments"),
  saves: integer("saves"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: uuid("client_id").notNull().references(() => clients.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const entityLinks = pgTable("entity_links", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceId: uuid("source_id").notNull(),
  sourceType: entityTypeEnum("source_type").notNull(),
  targetId: uuid("target_id").notNull(),
  targetType: entityTypeEnum("target_type").notNull(),
  relationType: text("relation_type").notNull().default("relates_to"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  sourceIdx: index("entity_links_source_idx").on(table.sourceId, table.sourceType),
  targetIdx: index("entity_links_target_idx").on(table.targetId, table.targetType),
  relationTypeIdx: index("entity_links_relation_type_idx").on(table.relationType),
  sourceRelationTargetIdx: index("entity_links_srt_idx").on(table.sourceType, table.relationType, table.targetType),
}));

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  authorType: text("author_type").notNull(), // 'team' | 'client'
  authorId: uuid("author_id").notNull(),
  targetType: entityTypeEnum("target_type").notNull(),
  targetId: uuid("target_id").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const approvals = pgTable("approvals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  targetType: entityTypeEnum("target_type").notNull(),
  targetId: uuid("target_id").notNull(),
  clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  requestedBy: uuid("requested_by").references(() => users.id),
  respondedAt: timestamp("responded_at"),
  respondedBy: uuid("responded_by"),
  responseNote: text("response_note"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  targetType: entityTypeEnum("target_type"),
  targetId: uuid("target_id"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const activity = pgTable("activity", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  actorType: text("actor_type").notNull(), // 'team' | 'client' | 'system'
  actorId: uuid("actor_id"),
  verb: text("verb").notNull(),
  targetType: entityTypeEnum("target_type").notNull(),
  targetId: uuid("target_id").notNull(),
  payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const savedViews = pgTable("saved_views", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: uuid("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  route: text("route").notNull(),
  queryJson: jsonb("query_json").notNull().default(sql`'{}'::jsonb`),
  isShared: boolean("is_shared").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const apiTokens = pgTable("api_tokens", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  prefix: text("prefix").notNull(),
  scopes: jsonb("scopes").notNull().default(sql`'[]'::jsonb`),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  userIdx: index("api_tokens_user_idx").on(table.userId),
}));
