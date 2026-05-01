import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";

const testDatabaseUrl = process.env.DATABASE_URL;

export function createTestDb() {
  if (!testDatabaseUrl) {
    throw new Error("DATABASE_URL no está configurada para tests.");
  }
  const sql = postgres(testDatabaseUrl, { ssl: "require", max: 1 });
  const db = drizzle(sql, { schema });
  return { sql, db };
}

export async function cleanupTestUser(email: string) {
  const { sql, db } = createTestDb();
  try {
    const users = await db.select().from(schema.users).where(eq(schema.users.email, email));
    for (const user of users) {
      await db.delete(schema.sessions).where(eq(schema.sessions.userId, user.id));
      await db.delete(schema.users).where(eq(schema.users.id, user.id));
    }
  } finally {
    await sql.end();
  }
}
