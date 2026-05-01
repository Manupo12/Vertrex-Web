import { isDatabaseConfigured, getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const checks: Record<string, { status: "ok" | "error"; responseMs?: number; message?: string }> = {};
  let overall = "ok";

  // Database check
  const dbStart = Date.now();
  try {
    if (!isDatabaseConfigured()) {
      throw new Error("DATABASE_URL not configured");
    }
    const db = getDb();
    await db.execute("SELECT 1");
    checks.database = { status: "ok", responseMs: Date.now() - dbStart };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown DB error";
    checks.database = { status: "error", message };
    overall = "error";
  }

  // Auth secret check (presence only, not value)
  try {
    if (!process.env.AUTH_SECRET) {
      throw new Error("AUTH_SECRET not configured");
    }
    checks.auth = { status: "ok" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown auth error";
    checks.auth = { status: "error", message };
    overall = "error";
  }

  const statusCode = overall === "ok" ? 200 : 503;

  return Response.json(
    {
      status: overall,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "unknown",
      checks,
    },
    { status: statusCode },
  );
}
