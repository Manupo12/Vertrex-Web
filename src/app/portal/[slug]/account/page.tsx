import { db } from "@/lib/db";
import { clients, clientPortalUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requirePortalClient } from "@/lib/auth/portal";
import { AccountForm } from "./AccountForm";

export default async function PortalAccountPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await requirePortalClient(slug);

  const [client] = await db.select().from(clients).where(eq(clients.id, session.clientId));
  if (!client) throw new Error("Cliente no encontrado");

  const portalUsers = await db.select().from(clientPortalUsers).where(eq(clientPortalUsers.clientId, client.id));
  const currentUser = portalUsers[0];

  return (
    <AccountForm
      clientName={client.name}
      userName={currentUser?.name || "Usuario principal"}
      userEmail={currentUser?.email || client.email || ""}
      portalUserId={currentUser?.id || ""}
    />
  );
}
