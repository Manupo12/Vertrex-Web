import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "");

async function migrate() {
  console.log("Running V3 table creation...");

  // Create remaining tables that migration might have missed
  const createStatements = [
    `CREATE TABLE IF NOT EXISTS "client_portal_users" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "client_id" uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      "name" text NOT NULL,
      "email" text,
      "role_label" text,
      "pin_hash" text NOT NULL,
      "is_active" boolean DEFAULT true NOT NULL,
      "preferences" jsonb DEFAULT '{}'::jsonb,
      "created_at" timestamp DEFAULT now() NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "comments" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "author_type" text NOT NULL,
      "author_id" uuid NOT NULL,
      "target_type" "entity_type" NOT NULL,
      "target_id" uuid NOT NULL,
      "body" text NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "approvals" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "title" text NOT NULL,
      "description" text,
      "target_type" "entity_type" NOT NULL,
      "target_id" uuid NOT NULL,
      "client_id" uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      "status" text DEFAULT 'pending' NOT NULL,
      "requested_by" uuid REFERENCES users(id),
      "responded_at" timestamp,
      "responded_by" uuid,
      "response_note" text,
      "created_at" timestamp DEFAULT now() NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "notifications" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "user_id" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "type" text NOT NULL,
      "title" text NOT NULL,
      "body" text,
      "target_type" "entity_type",
      "target_id" uuid,
      "read_at" timestamp,
      "created_at" timestamp DEFAULT now() NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "activity" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "actor_type" text NOT NULL,
      "actor_id" uuid,
      "verb" text NOT NULL,
      "target_type" "entity_type" NOT NULL,
      "target_id" uuid NOT NULL,
      "payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "saved_views" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "owner_id" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "name" text NOT NULL,
      "route" text NOT NULL,
      "query_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
      "is_shared" boolean DEFAULT false NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL
    )`,
  ];

  for (const stmt of createStatements) {
    try {
      await sql.unsafe(stmt);
      console.log(`  ✓ Table created`);
    } catch (e: any) {
      console.log(`  - ${e.message?.substring(0, 80)}`);
    }
  }

  await sql.end();
  console.log("Table creation complete!");
}

migrate().catch(console.error);
