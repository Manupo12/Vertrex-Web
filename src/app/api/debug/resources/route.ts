import { NextResponse } from "next/server";

export async function GET() {
  const results: Record<string, any> = {};

  // 1. Check ENCRYPTION_KEY
  results.encryptionKey = process.env.ENCRYPTION_KEY ? `SET (${process.env.ENCRYPTION_KEY.length} chars)` : "MISSING";

  // 2. Check DB connection
  try {
    const { db } = await import("@/lib/db");
    const { resources } = await import("@/lib/db/schema");
    const { sql } = await import("drizzle-orm");
    await db.execute(sql`SELECT 1`);
    results.db = "connected";
  } catch (e: any) {
    results.db = `ERROR: ${e.message}`;
  }

  // 3. Test encrypt/decrypt
  try {
    const { encrypt, decrypt } = await import("@/lib/security/encryption");
    const testValue = "test_value_123";
    const encrypted = encrypt(testValue);
    const decrypted = decrypt(encrypted);
    results.encrypt = decrypted === testValue ? "OK" : "MISMATCH";
  } catch (e: any) {
    results.encrypt = `ERROR: ${e.message}`;
  }

  // 4. Test requireOsUser
  try {
    const { getOsSession } = await import("@/lib/auth/session");
    const session = await getOsSession();
    results.session = session ? `OK (${session.name})` : "NO_SESSION";
  } catch (e: any) {
    results.session = `ERROR: ${e.message}`;
  }

  // 5. Test requireModuleAccess
  try {
    const { getOsSession } = await import("@/lib/auth/session");
    const session = await getOsSession();
    if (session) {
      const { requireModuleAccess } = await import("@/lib/auth/permissions");
      await requireModuleAccess(session.userId, "resources", "write");
      results.rbac = "OK";
    } else {
      results.rbac = "SKIPPED (no session)";
    }
  } catch (e: any) {
    results.rbac = `ERROR: ${e.message}`;
  }

  return NextResponse.json(results);
}
