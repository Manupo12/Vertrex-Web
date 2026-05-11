import postgres from 'postgres';
import { loadEnvConfig } from '@next/env';
import { readFileSync } from 'fs';
import { join } from 'path';

loadEnvConfig(process.cwd());

async function main() {
  const sql = postgres(process.env.DATABASE_URL || '', { max: 1, idle_timeout: 30 });
  
  console.log('Dropping old tables...');
  const tables = await sql<{ tablename: string }[]>`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
  for (const { tablename } of tables) {
    console.log(`  Dropping ${tablename}...`);
    await sql.unsafe(`DROP TABLE IF EXISTS "${tablename}" CASCADE`);
  }

  console.log('Dropping old enums...');
  const enums = await sql<{ typname: string }[]>`SELECT typname FROM pg_type WHERE typtype = 'e'`;
  for (const { typname } of enums) {
    console.log(`  Dropping enum ${typname}...`);
    await sql.unsafe(`DROP TYPE IF EXISTS "${typname}" CASCADE`);
  }

  console.log('Applying new migration...');
  const migrationPath = join(process.cwd(), 'drizzle/0000_sticky_gamma_corps.sql');
  const migrationSql = readFileSync(migrationPath, 'utf-8');
  const statements = migrationSql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);

  for (const stmt of statements) {
    try {
      await sql.unsafe(stmt);
      console.log(`  OK: ${stmt.slice(0, 80)}`);
    } catch (err: any) {
      console.log(`  ERR: ${err.message.slice(0, 100)}`);
    }
  }

  console.log('Migration complete!');
  await sql.end();
}

main().catch(console.error);
