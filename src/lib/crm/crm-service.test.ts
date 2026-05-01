import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb } from "@/test/utils/db";
import { clients, deals } from "@/lib/db/schema";
import { updateDeal, advanceDealStage, archiveDeal } from "./crm-service";
import type { DealStage } from "./crm-service";

const TEST_CLIENT_SLUG = "test-deal-client-" + Date.now();

describe("crm-service integration", () => {
  let clientId: string;
  let dealId: string;

  beforeAll(async () => {
    const { db } = createTestDb();
    const [client] = await db
      .insert(clients)
      .values({
        slug: TEST_CLIENT_SLUG,
        name: "Test Deal Client",
        brand: "TDC",
        email: "test-deal@client.vertrex.co",
        company: "Test Deal Client",
        status: "active",
        phase: "Onboarding",
        progress: 0,
        totalInvestmentCents: 0,
        paidCents: 0,
        pendingCents: 0,
      })
      .returning({ id: clients.id });
    clientId = client.id;

    const [deal] = await db
      .insert(deals)
      .values({
        clientId,
        title: "Test Deal",
        stage: "sin_contactar",
        valueCents: 100000,
        probability: 10,
        owner: "Test Owner",
      })
      .returning({ id: deals.id });
    dealId = deal.id;
  });

  afterAll(async () => {
    const { db, sql } = createTestDb();
    await db.delete(deals).where(eq(deals.clientId, clientId));
    await db.delete(clients).where(eq(clients.id, clientId));
    await sql.end();
  });

  it("should update a deal", async () => {
    await updateDeal(dealId, { title: "Updated Test Deal", probability: 25 });

    const { db } = createTestDb();
    const [updated] = await db.select().from(deals).where(eq(deals.id, dealId)).limit(1);
    expect(updated.title).toBe("Updated Test Deal");
    expect(updated.probability).toBe(25);
  });

  it("should advance deal stage", async () => {
    await advanceDealStage(dealId, "contactado" as DealStage);

    const { db } = createTestDb();
    const [updated] = await db.select().from(deals).where(eq(deals.id, dealId)).limit(1);
    expect(updated.stage).toBe("contactado");
  });

  it("should archive a deal", async () => {
    await archiveDeal(dealId);

    const { db } = createTestDb();
    const [updated] = await db.select().from(deals).where(eq(deals.id, dealId)).limit(1);
    expect(updated.stage).toBe("perdido");
  });
});
