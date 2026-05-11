import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { db } = await import("@/lib/db");
    const { users } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");
    
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ status: "error", message: "DATABASE_URL not set" }, { status: 500 });
    }
    
    const userCount = await db.select().from(users).then(r => r.length);
    const activeUsers = await db.select().from(users).where(eq(users.isActive, true)).then(r => r.map(u => u.email));
    
    return NextResponse.json({
      status: "ok",
      database: "connected",
      userCount,
      activeUsers,
      env: { nodeEnv: process.env.NODE_ENV, hasDbUrl: !!process.env.DATABASE_URL }
    });
  } catch (e: any) {
    return NextResponse.json({ status: "error", message: e.message, stack: e.stack?.split("\n")[0] }, { status: 500 });
  }
}
