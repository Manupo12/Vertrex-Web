import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL || "");

async function main() {
  console.log("Verifying migration state...");

  const [hasMigrations] = await sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '__drizzle_migrations')`;
  console.log("__drizzle_migrations exists:", hasMigrations.exists);

  if (hasMigrations.exists) {
    const count = await sql`SELECT COUNT(*) as count FROM __drizzle_migrations`;
    console.log("Applied migrations:", count[0].count);

    const entries = await sql`SELECT hash, created_at FROM __drizzle_migrations ORDER BY created_at`;
    for (const e of entries) {
      console.log(`  - ${e.hash} (${e.created_at})`);
    }
  }

  const tables = ["tasks", "cycles", "milestones", "tags", "task_labels", "comments", "approvals", "notifications", "activity", "saved_views", "client_portal_users", "document_folders", "resource_folders", "resource_access_log", "legal_templates", "signatures", "share_tokens", "link_collections", "marketing_hashtags", "module_permissions"];

  for (const table of tables) {
    const [result] = await sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = ${table})`;
    console.log(`  ${result.exists ? '✓' : '✗'} ${table}`);
  }

  await sql.end();
}
main().catch(console.error);
