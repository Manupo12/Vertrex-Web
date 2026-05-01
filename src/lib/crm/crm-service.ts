"use server";

import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { clients, deals } from "@/lib/db/schema";
import { canonicalDealStageValues } from "@/lib/ops/deal-stages";
import { showToast } from "@/components/ui/toast-container";

export type DealStage = typeof canonicalDealStageValues[number];

export async function updateClient(
  clientId: string,
  data: {
    name?: string;
    email?: string | null;
    phone?: string | null;
    company?: string | null;
    phase?: string | null;
    progress?: number;
  }
): Promise<void> {
  const db = getDb();
  
  await db
    .update(clients)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(clients.id, clientId));
  showToast("Cliente actualizado", "success");
}

export async function archiveClient(clientId: string): Promise<void> {
  const db = getDb();
  
  await db
    .update(clients)
    .set({
      status: "archived",
      updatedAt: new Date(),
    })
    .where(eq(clients.id, clientId));
  showToast("Cliente archivado", "info");
}

export async function updateDeal(
  dealId: string,
  data: {
    title?: string;
    stage?: DealStage;
    valueCents?: number;
    probability?: number;
    owner?: string | null;
    expectedCloseAt?: Date | null;
    summary?: string | null;
  }
): Promise<void> {
  const db = getDb();
  
  await db
    .update(deals)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(deals.id, dealId));
  showToast("Deal actualizado", "success");
}

export async function advanceDealStage(dealId: string, newStage: DealStage): Promise<void> {
  const db = getDb();
  
  await db
    .update(deals)
    .set({
      stage: newStage,
      updatedAt: new Date(),
    })
    .where(eq(deals.id, dealId));
  showToast(`Deal movido a ${newStage}`, "success");
}

export async function archiveDeal(dealId: string): Promise<void> {
  const db = getDb();
  
  await db
    .update(deals)
    .set({
      stage: "perdido",
      updatedAt: new Date(),
    })
    .where(eq(deals.id, dealId));
  showToast("Deal archivado como perdido", "info");
}
