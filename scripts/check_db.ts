import postgres from 'postgres';
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
async function main() {
  const sql = postgres(process.env.DATABASE_URL || '');
  const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`;
  console.log(tables);
  await sql.end();
}
main().catch(console.error);
