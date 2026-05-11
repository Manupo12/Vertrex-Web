import { db } from "@/lib/db";
import { approvals, clients } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requirePortalClient } from "@/lib/auth/portal";
import { ApprovalsView } from "./ApprovalsView";

export default async function PortalApprovalsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await requirePortalClient(slug);

  const [client] = await db.select().from(clients).where(eq(clients.id, session.clientId));
  if (!client) throw new Error("Cliente no encontrado");

  const clientApprovals = await db.select()
    .from(approvals)
    .where(eq(approvals.clientId, client.id))
    .orderBy(desc(approvals.createdAt));

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Aprobaciones</h1>
        <p className="text-muted-foreground text-lg">Revisa y responde a las solicitudes del equipo.</p>
      </div>
      
      <ApprovalsView initialApprovals={clientApprovals} />
    </div>
  );
}
