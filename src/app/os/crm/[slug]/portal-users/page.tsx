import { db } from "@/lib/db";
import { clients, clientPortalUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { requireOsUser } from "@/lib/auth/session";
import { PortalUsersView } from "./PortalUsersView";

export default async function PortalUsersPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireOsUser();
  const { slug } = await params;

  const [client] = await db.select().from(clients).where(eq(clients.slug, slug));
  if (!client) throw new Error("Cliente no encontrado");

  const portalUsers = await db.select().from(clientPortalUsers).where(eq(clientPortalUsers.clientId, client.id));

  return (
    <div>
      <PageHeader 
        title="Usuarios del Portal" 
        description={`Accesos delegados para el equipo de ${client.name}`}
        breadcrumbs={[
          { label: "CRM", href: "/os/crm" }, 
          { label: client.name, href: `/os/crm/${slug}` }, 
          { label: "Usuarios Portal" }
        ]}
      />
      <PortalUsersView initialUsers={portalUsers} clientId={client.id} />
    </div>
  );
}
