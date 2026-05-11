import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "");

const CREATE_TABLES = [
  `CREATE TABLE IF NOT EXISTS "tags" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "slug" text NOT NULL UNIQUE, "label" text NOT NULL, "color" text DEFAULT '#64748b' NOT NULL, "scope" text DEFAULT 'global' NOT NULL, "scope_id" uuid, "created_at" timestamp DEFAULT now() NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "document_folders" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "name" text NOT NULL, "parent_id" uuid, "created_at" timestamp DEFAULT now() NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "resource_folders" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "name" text NOT NULL, "parent_id" uuid, "created_at" timestamp DEFAULT now() NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "resource_access_log" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "resource_id" uuid NOT NULL REFERENCES resources(id) ON DELETE CASCADE, "actor_id" uuid NOT NULL REFERENCES users(id), "action" text NOT NULL, "created_at" timestamp DEFAULT now() NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "legal_templates" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "name" text NOT NULL, "type" text NOT NULL, "body_html" text NOT NULL, "variables" jsonb DEFAULT '[]'::jsonb NOT NULL, "created_at" timestamp DEFAULT now() NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "signatures" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "legal_id" uuid NOT NULL REFERENCES legal_documents(id) ON DELETE CASCADE, "signer_name" text NOT NULL, "signer_email" text, "client_id" uuid REFERENCES clients(id), "portal_user_id" uuid, "ip_address" text, "user_agent" text, "signed_at" timestamp DEFAULT now() NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "link_collections" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "name" text NOT NULL, "description" text, "created_at" timestamp DEFAULT now() NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "share_tokens" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "document_id" uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE, "token" text NOT NULL UNIQUE, "expires_at" timestamp NOT NULL, "created_by" uuid REFERENCES users(id), "created_at" timestamp DEFAULT now() NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "cycles" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "project_id" uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE, "name" text NOT NULL, "starts_at" timestamp NOT NULL, "ends_at" timestamp NOT NULL, "status" text DEFAULT 'planned' NOT NULL, "goal" text, "created_at" timestamp DEFAULT now() NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "milestones" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "project_id" uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE, "name" text NOT NULL, "description" text, "target_date" timestamp, "status" text DEFAULT 'open' NOT NULL, "order_index" integer DEFAULT 0 NOT NULL, "created_at" timestamp DEFAULT now() NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "module_permissions" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "user_id" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, "module" text NOT NULL, "permission" text DEFAULT 'read' NOT NULL, "created_at" timestamp DEFAULT now() NOT NULL, UNIQUE(user_id, module))`,
  `CREATE TABLE IF NOT EXISTS "marketing_hashtags" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "label" text NOT NULL, "tags" jsonb DEFAULT '[]'::jsonb NOT NULL, "account_id" uuid REFERENCES social_accounts(id) ON DELETE CASCADE, "created_at" timestamp DEFAULT now() NOT NULL)`,
];

async function run() {
  console.log("Creating missing V3 tables...");
  for (const stmt of CREATE_TABLES) {
    try {
      await sql.unsafe(stmt);
      console.log(`  ✓ Table created/verified`);
    } catch (e: any) {
      console.log(`  - ${e.message?.substring(0, 100)}`);
    }
  }
  await sql.end();
  console.log("Done!");
}

run().catch(console.error);
