import { sql } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

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
]);
export const storageProviderEnum = pgEnum("storage_provider", ["neon", "drive"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("team"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

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

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"),
  progress: integer("progress").notNull().default(0),
  currentVersion: text("current_version").default("v1.0"),
  referenceLinks: jsonb("reference_links").notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  sizeBytes: integer("size_bytes").notNull().default(0),
  storageProvider: storageProviderEnum("storage_provider").notNull().default("neon"),
  driveFileId: text("drive_file_id"),
  url: text("url"),
  mimeType: text("mime_type"),
  contentBase64: text("content_base64"),
  isPublic: boolean("is_public").notNull().default(true),
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
  isPublic: boolean("is_public").notNull().default(false),
  signedAt: timestamp("signed_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
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

export const resources = pgTable("resources", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  type: text("type").notNull().default("otro"),
  encryptedValue: text("encrypted_value").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const finances = pgTable("finances", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  amountCop: integer("amount_cop").notNull().default(0),
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
  meetLink: text("meet_link"),
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
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const links = pgTable("links", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  url: text("url").notNull().unique(),
  title: text("title"),
  description: text("description"),
  imageUrl: text("image_url"),
  type: text("type").notNull().default("otro"),
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

export const contentPlan = pgTable("content_plan", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  socialAccountId: uuid("social_account_id").notNull().references(() => socialAccounts.id),
  title: text("title").notNull(),
  contentType: text("content_type").notNull(),
  status: text("status").notNull().default("idea"),
  scheduledAt: timestamp("scheduled_at"),
  notes: text("notes"),
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
}));
