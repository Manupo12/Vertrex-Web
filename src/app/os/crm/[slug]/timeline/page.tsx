import { db } from "@/lib/db";
import { clients, activity, entityLinks, users } from "@/lib/db/schema";
import { eq, or, desc, inArray } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { requireOsUser } from "@/lib/auth/session";
import { ActivityFeed } from "@/components/os/Activity/ActivityFeed";

export default async function ClientTimelinePage({ params }: { params: Promise<{ slug: string }> }) {
  await requireOsUser();
  const { slug } = await params;

  const [client] = await db.select().from(clients).where(eq(clients.slug, slug));
  if (!client) throw new Error("Cliente no encontrado");

  // Get everything connected to this client
  const connectedLinks = await db.select().from(entityLinks).where(
    or(
      eq(entityLinks.sourceId, client.id),
      eq(entityLinks.targetId, client.id)
    )
  );

  const targetIds = [
    client.id,
    ...connectedLinks.map(l => l.sourceId === client.id ? l.targetId : l.sourceId)
  ];

  // Fetch activity for client and connected entities
  const clientActivity = await db.select()
    .from(activity)
    .where(inArray(activity.targetId, targetIds))
    .orderBy(desc(activity.createdAt))
    .limit(50);

  const allUsers = await db.select().from(users);

  return (
    <div>
      <PageHeader 
        title="Timeline" 
        description={`Actividad relacionada con ${client.name}`}
        breadcrumbs={[
          { label: "CRM", href: "/os/crm" }, 
          { label: client.name, href: `/os/crm/${slug}` }, 
          { label: "Timeline" }
        ]}
      />
      
      <div className="mt-6 max-w-3xl">
        <ActivityFeed activities={clientActivity} users={allUsers} />
      </div>
    </div>
  );
}
