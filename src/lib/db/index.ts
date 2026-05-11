import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/db/schema";

declare global {
  var vertrexSql: ReturnType<typeof postgres> | undefined;
  var vertrexDb: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

function createDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;
  const sql = globalThis.vertrexSql ?? postgres(databaseUrl, { max: 10, prepare: false, idle_timeout: 20 });
  const db = globalThis.vertrexDb ?? drizzle(sql, { schema });
  if (process.env.NODE_ENV !== "production") {
    globalThis.vertrexSql = sql;
    globalThis.vertrexDb = db;
  }
  return db;
}

export const db = createDatabase()!;
export { schema };
