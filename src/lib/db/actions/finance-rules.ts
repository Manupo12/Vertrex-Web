import { db } from "@/lib/db";
import { finances, entityLinks } from "@/lib/db/schema";
import { eq, or, ilike } from "drizzle-orm";

export async function projectHasPaidAdvance(projectId: string): Promise<boolean> {
  const connections = await db.select().from(entityLinks)
    .where(or(
      eq(entityLinks.sourceId, projectId),
      eq(entityLinks.targetId, projectId)
    ));
    
  const financeIds = connections
    .filter(c => c.sourceType === "finance" || c.targetType === "finance")
    .map(c => c.sourceId === projectId ? c.targetId : c.sourceId);
    
  if (financeIds.length === 0) return false;
  
  const advancePayments = await Promise.all(
    financeIds.map(async (fid) => {
      const rows = await db.select().from(finances)
        .where(eq(finances.id, fid))
        .limit(1);
      return rows[0];
    })
  );
  
  return advancePayments.some(f => 
    f && f.status === "paid" && (f.concept.toLowerCase().includes("anticipo") || f.concept.toLowerCase().includes("50%"))
  );
}
