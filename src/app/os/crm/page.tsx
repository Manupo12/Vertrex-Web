import { db } from "@/lib/db";
import { clients, clientContactors, users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { CrmList } from "./CrmList";
import { NewClientDialog } from "./NewClientDialog";

interface Props { searchParams: Promise<{ q?: string; status?: string }> }

export default async function CrmPage({ searchParams }: Props) {
  const { q = "", status = "" } = await searchParams;

  const statsRows = await db
    .select({
      status: clients.status,
      count: sql<number>`count(*)::int`,
    })
    .from(clients)
    .groupBy(clients.status);

  const stats = statsRows.reduce((acc, row) => ({ ...acc, [row.status]: row.count }), {} as Record<string, number>);

  let allClients;
  if (status) {
    allClients = await db.select().from(clients).where(eq(clients.status, status)).orderBy(clients.createdAt);
  } else {
    allClients = await db.select().from(clients).orderBy(clients.createdAt);
  }

  // Fetch all contactors in one query
  const contactorsList = await db
    .select({
      clientId: clientContactors.clientId,
      userId: users.id,
      userName: users.name,
    })
    .from(clientContactors)
    .innerJoin(users, eq(clientContactors.userId, users.id));

  const contactorsMap = contactorsList.reduce((acc, row) => {
    if (!acc[row.clientId]) acc[row.clientId] = [];
    acc[row.clientId].push({ id: row.userId, name: row.userName });
    return acc;
  }, {} as Record<string, { id: string; name: string }[]>);

  const clientsWithContactors = allClients.map(c => ({
    ...c,
    contactors: contactorsMap[c.id] || [],
  }));

  const filtered = q
    ? clientsWithContactors.filter(c =>
        c.name.toLowerCase().includes(q.toLowerCase()) ||
        c.slug.toLowerCase().includes(q.toLowerCase()) ||
        (c.email || "").toLowerCase().includes(q.toLowerCase())
      )
    : clientsWithContactors;

  return (
    <div>
      <PageHeader
        title="Clientes & CRM"
        description="Gestiona prospectos, ventas y accesos al portal de clientes"
        breadcrumbs={[{ label: "CRM" }]}
        primaryAction={<NewClientDialog />}
      />
      <CrmList clients={filtered} stats={stats} />
    </div>
  );
}
