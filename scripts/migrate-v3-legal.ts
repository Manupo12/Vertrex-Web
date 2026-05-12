import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL || "");
async function run() {
  try { await sql.unsafe(`ALTER TABLE legal_documents ADD COLUMN IF NOT EXISTS body_html text`); console.log('✓ body_html added'); } catch(e:any) { console.log('-', e.message); }
  try { await sql.unsafe(`ALTER TABLE legal_documents ADD COLUMN IF NOT EXISTS content_base64 text`); console.log('✓ content_base64 added'); } catch(e:any) { console.log('-', e.message); }
  try { await sql.unsafe(`ALTER TABLE legal_documents ADD COLUMN IF NOT EXISTS mime_type text`); console.log('✓ mime_type added'); } catch(e:any) { console.log('-', e.message); }
  try { await sql.unsafe(`ALTER TABLE signatures ADD COLUMN IF NOT EXISTS pdf_url text`); console.log('✓ pdf_url added'); } catch(e:any) { console.log('-', e.message); }
  try { await sql.unsafe(`ALTER TABLE signatures ADD COLUMN IF NOT EXISTS pdf_hash text`); console.log('✓ pdf_hash added'); } catch(e:any) { console.log('-', e.message); }
  await sql.end();
}
run().catch(console.error);
