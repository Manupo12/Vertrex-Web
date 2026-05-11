import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "");

async function run() {
  console.log("Adding task_type enum and column...");
  
  try {
    await sql.unsafe(`CREATE TYPE "public"."task_type" AS ENUM('code','design','marketing','content','document','meeting','research','ops','support','bug','feature','other')`);
    console.log("  ✓ Created task_type enum");
  } catch (e: any) {
    if (e.message?.includes("already exists")) {
      console.log("  - task_type enum already exists");
    } else {
      console.log("  - " + e.message?.substring(0, 100));
    }
  }
  
  try {
    await sql.unsafe(`ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "task_type" "task_type" DEFAULT 'other' NOT NULL`);
    console.log("  ✓ Added task_type column to tasks");
  } catch (e: any) {
    console.log("  - " + e.message?.substring(0, 100));
  }
  
  await sql.end();
  console.log("Done!");
}

run().catch(console.error);
