import postgres from 'postgres';
import { loadEnvConfig } from '@next/env';
import { readFileSync } from 'fs';
loadEnvConfig(process.cwd());

async function main() {
  const sql = postgres(process.env.DATABASE_URL || '', { max: 1, idle_timeout: 30 });
  const tables = await sql<{ tablename: string }[]>`SELECT tablename FROM pg_tables WHERE schemaname='public'`;
  for (const { tablename } of tables) {
    console.log('DROP', tablename);
    await sql.unsafe(`DROP TABLE IF EXISTS "${tablename}" CASCADE`);
  }
  const enums = await sql<{ typname: string }[]>`SELECT typname FROM pg_type WHERE typtype='e'`;
  for (const { typname } of enums) {
    console.log('DROP ENUM', typname);
    await sql.unsafe(`DROP TYPE IF EXISTS "${typname}" CASCADE`);
  }
  const m = readFileSync('drizzle/0000_abandoned_slayback.sql', 'utf-8');
  const stmts = m.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);
  for (const s of stmts) {
    try { await sql.unsafe(s); console.log('OK:', s.slice(0, 60)); } catch(e: any) { console.log('ERR:', e.message.slice(0, 80)); }
  }
  await sql.end();
  console.log('Migration complete');
}
main().catch(console.error);
