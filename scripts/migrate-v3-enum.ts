import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "");

async function run() {
  console.log("Adding missing entity_type enum values...");
  const values = ["task", "cycle", "milestone", "comment", "approval", "signature", "notification", "activity", "saved_view", "tag"];
  
  for (const val of values) {
    try {
      await sql.unsafe(`ALTER TYPE "public"."entity_type" ADD VALUE IF NOT EXISTS '${val}'`);
      console.log(`  ✓ entity_type.${val}`);
    } catch (e: any) {
      console.log(`  - ${e.message?.substring(0, 80)}`);
    }
  }

  console.log("\nCreating missing tables...");
  const createStatements = [
    `CREATE TABLE IF NOT EXISTS "tasks" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "project_id" uuid REFERENCES projects(id) ON DELETE CASCADE,
      "parent_task_id" uuid,
      "identifier" text NOT NULL UNIQUE,
      "title" text NOT NULL,
      "description_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
      "state" text DEFAULT 'backlog' NOT NULL,
      "priority" integer DEFAULT 0 NOT NULL,
      "estimate_points" integer,
      "assignee_id" uuid REFERENCES users(id),
      "cycle_id" uuid REFERENCES cycles(id) ON DELETE SET NULL,
      "milestone_id" uuid REFERENCES milestones(id) ON DELETE SET NULL,
      "order_index" integer DEFAULT 0 NOT NULL,
      "due_date" timestamp,
      "started_at" timestamp,
      "completed_at" timestamp,
      "created_by" uuid REFERENCES users(id),
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "task_labels" (
      "task_id" uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      "tag_id" uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (task_id, tag_id)
    )`,
    `CREATE TABLE IF NOT EXISTS "document_folders" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "name" text NOT NULL,
      "parent_id" uuid,
      "created_at" timestamp DEFAULT now() NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "legal_templates" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "name" text NOT NULL,
      "type" text NOT NULL,
      "body_html" text NOT NULL,
      "variables" jsonb DEFAULT '[]'::jsonb NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "resource_folders" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "name" text NOT NULL,
      "parent_id" uuid,
      "created_at" timestamp DEFAULT now() NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "resource_access_log" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "resource_id" uuid NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
      "actor_id" uuid NOT NULL REFERENCES users(id),
      "action" text NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "signatures" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "legal_id" uuid NOT NULL REFERENCES legal_documents(id) ON DELETE CASCADE,
      "signer_name" text NOT NULL,
      "signer_email" text,
      "client_id" uuid REFERENCES clients(id),
      "portal_user_id" uuid,
      "ip_address" text,
      "user_agent" text,
      "signed_at" timestamp DEFAULT now() NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "link_collections" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "name" text NOT NULL,
      "description" text,
      "created_at" timestamp DEFAULT now() NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "share_tokens" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "document_id" uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      "token" text NOT NULL UNIQUE,
      "expires_at" timestamp NOT NULL,
      "created_by" uuid REFERENCES users(id),
      "created_at" timestamp DEFAULT now() NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "marketing_hashtags" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "label" text NOT NULL,
      "tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
      "account_id" uuid REFERENCES social_accounts(id) ON DELETE CASCADE,
      "created_at" timestamp DEFAULT now() NOT NULL
    )`,
  ];

  for (const stmt of createStatements) {
    try {
      await sql.unsafe(stmt);
      console.log(`  ✓ Table created`);
    } catch (e: any) {
      console.log(`  - ${e.message?.substring(0, 100)}`);
    }
  }

  console.log("\nCreating indexes...");
  const indexes = [
    `CREATE INDEX IF NOT EXISTS tasks_project_idx ON tasks(project_id)`,
    `CREATE INDEX IF NOT EXISTS tasks_assignee_idx ON tasks(assignee_id)`,
    `CREATE INDEX IF NOT EXISTS tasks_cycle_idx ON tasks(cycle_id)`,
    `CREATE INDEX IF NOT EXISTS tasks_milestone_idx ON tasks(milestone_id)`,
    `CREATE INDEX IF NOT EXISTS tasks_parent_idx ON tasks(parent_task_id)`,
    `CREATE INDEX IF NOT EXISTS tasks_state_idx ON tasks(state)`,
    `CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON tasks(due_date)`,
    `CREATE INDEX IF NOT EXISTS entity_links_relation_type_idx ON entity_links(relation_type)`,
    `CREATE INDEX IF NOT EXISTS entity_links_srt_idx ON entity_links(source_type, relation_type, target_type)`,
  ];

  for (const stmt of indexes) {
    try {
      await sql.unsafe(stmt);
      console.log(`  ✓ Index created`);
    } catch (e: any) {
      console.log(`  - ${e.message?.substring(0, 100)}`);
    }
  }

  // Add foreign keys for tasks table
  console.log("\nAdding foreign keys...");
  const fks = [
    `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tasks_parent_task_id_fkey') THEN ALTER TABLE tasks ADD CONSTRAINT tasks_parent_task_id_fkey FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE; END IF; END $$`,
  ];
  for (const stmt of fks) {
    try {
      await sql.unsafe(stmt);
      console.log(`  ✓ FK created`);
    } catch (e: any) {
      console.log(`  - ${e.message?.substring(0, 100)}`);
    }
  }

  await sql.end();
  console.log("\nMigration complete!");
}

run().catch(console.error);
