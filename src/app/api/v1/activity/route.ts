import { authed } from "@/lib/api/handler";
import { db } from "@/lib/db";
import { activity } from "@/lib/db/schema";
import { desc, gt, and, eq } from "drizzle-orm";

export const runtime = "nodejs";

export const GET = authed(async ({ req }) => {
  const sp = new URL(req.url).searchParams;
  const since = sp.get("since")
    ? new Date(sp.get("since")!)
    : new Date(Date.now() - 7 * 864e5);
  const targetType = sp.get("entity");
  const limit = Number(sp.get("limit") || 200);
  const where = targetType
    ? and(gt(activity.createdAt, since), eq(activity.targetType, targetType as any))
    : gt(activity.createdAt, since);
  return db.select().from(activity).where(where).orderBy(desc(activity.createdAt)).limit(limit);
});
