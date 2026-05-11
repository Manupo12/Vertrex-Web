import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "");

async function migrate() {
  console.log("Running V3 column migration...");

  const statements = [
    `ALTER TABLE "agenda_events" ADD COLUMN IF NOT EXISTS "recurrence_rule" text DEFAULT 'none' NOT NULL`,
    `ALTER TABLE "agenda_events" ADD COLUMN IF NOT EXISTS "timezone" text DEFAULT 'America/Bogota' NOT NULL`,
    `ALTER TABLE "agenda_events" ADD COLUMN IF NOT EXISTS "external_provider" text`,
    `ALTER TABLE "agenda_events" ADD COLUMN IF NOT EXISTS "external_id" text`,
    `ALTER TABLE "agenda_events" ADD COLUMN IF NOT EXISTS "reminder_minutes" integer`,
    `ALTER TABLE "content_plan" ADD COLUMN IF NOT EXISTS "asset_document_ids" jsonb DEFAULT '[]'::jsonb NOT NULL`,
    `ALTER TABLE "content_plan" ADD COLUMN IF NOT EXISTS "reach" integer`,
    `ALTER TABLE "content_plan" ADD COLUMN IF NOT EXISTS "likes" integer`,
    `ALTER TABLE "content_plan" ADD COLUMN IF NOT EXISTS "comments" integer`,
    `ALTER TABLE "content_plan" ADD COLUMN IF NOT EXISTS "saves" integer`,
    `ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "folder_id" uuid`,
    `ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "version" integer DEFAULT 1 NOT NULL`,
    `ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "parent_id" uuid`,
    `ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "is_public" boolean DEFAULT true NOT NULL`,
    `ALTER TABLE "finances" ADD COLUMN IF NOT EXISTS "currency" text DEFAULT 'COP' NOT NULL`,
    `ALTER TABLE "finances" ADD COLUMN IF NOT EXISTS "recurrence" text DEFAULT 'none' NOT NULL`,
    `ALTER TABLE "finances" ADD COLUMN IF NOT EXISTS "next_due_date" timestamp`,
    `ALTER TABLE "finances" ADD COLUMN IF NOT EXISTS "vat_amount_cop" integer DEFAULT 0 NOT NULL`,
    `ALTER TABLE "finances" ADD COLUMN IF NOT EXISTS "vat_rate" integer DEFAULT 0 NOT NULL`,
    `ALTER TABLE "finances" ADD COLUMN IF NOT EXISTS "invoice_number" text`,
    `ALTER TABLE "knowledge_notes" ADD COLUMN IF NOT EXISTS "objective" text`,
    `ALTER TABLE "legal_documents" ADD COLUMN IF NOT EXISTS "expires_at" timestamp`,
    `ALTER TABLE "legal_documents" ADD COLUMN IF NOT EXISTS "template_id" uuid`,
    `ALTER TABLE "legal_documents" ADD COLUMN IF NOT EXISTS "requires_signature" boolean DEFAULT false NOT NULL`,
    `ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "collection_id" uuid`,
    `ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "reading_status" text DEFAULT 'triage' NOT NULL`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "project_key" text`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "budget_cop" integer`,
    `ALTER TABLE "repositories" ADD COLUMN IF NOT EXISTS "collection_id" uuid`,
    `ALTER TABLE "resources" ADD COLUMN IF NOT EXISTS "rotation_due_at" timestamp`,
    `ALTER TABLE "resources" ADD COLUMN IF NOT EXISTS "visibility" text DEFAULT 'team' NOT NULL`,
    `ALTER TABLE "resources" ADD COLUMN IF NOT EXISTS "folder_id" uuid`,
    `ALTER TABLE "resources" ADD COLUMN IF NOT EXISTS "owner_id" uuid`,
    `ALTER TABLE "social_accounts" ADD COLUMN IF NOT EXISTS "followers_count" integer DEFAULT 0`,
    `ALTER TABLE "social_accounts" ADD COLUMN IF NOT EXISTS "reach_count" integer DEFAULT 0`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active' NOT NULL`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "preferences" jsonb DEFAULT '{}'::jsonb`,
    `ALTER TABLE "client_portal_users" ADD COLUMN IF NOT EXISTS "preferences" jsonb DEFAULT '{}'::jsonb`,
  ];

  for (const stmt of statements) {
    try {
      await sql.unsafe(stmt);
      console.log(`  ✓ ${stmt.substring(0, 70)}`);
    } catch (e: any) {
      console.log(`  - ${e.message?.substring(0, 80)}`);
    }
  }

  // Backfill project_key
  const existingProjects: any[] = await sql`SELECT id, name, project_key FROM projects WHERE project_key IS NULL`;
  for (const p of existingProjects) {
    const key = (p.name || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().substring(0, 3) || "PRJ";
    await sql`UPDATE projects SET project_key = ${key} WHERE id = ${p.id} AND project_key IS NULL`;
    console.log(`  ✓ Backfilled project_key for ${p.name} -> ${key}`);
  }

  // Add unique constraint
  try {
    await sql.unsafe(`ALTER TABLE "projects" ADD CONSTRAINT "projects_project_key_unique" UNIQUE("project_key")`);
    console.log(`  ✓ Added unique constraint on projects.project_key`);
  } catch (e: any) {
    console.log(`  - Unique constraint: ${e.message?.substring(0, 80)}`);
  }

  await sql.end();
  console.log("Migration complete!");
}

migrate().catch(console.error);
