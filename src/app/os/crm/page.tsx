import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import Link from "next/link";
import { CrmList } from "./CrmList";

interface Props { searchParams: Promise<{ q?: string; status?: string }> }

export default async function CrmPage({ searchParams }: Props) {
  const { q = "", status = "" } = await searchParams;

  let allClients;
  if (status) {
    allClients = await db.select().from(clients).where(eq(clients.status, status)).orderBy(clients.createdAt);
  } else {
    allClients = await db.select().from(clients).orderBy(clients.createdAt);
  }

  const filtered = q
    ? allClients.filter(c =>
        c.name.toLowerCase().includes(q.toLowerCase()) ||
        c.slug.toLowerCase().includes(q.toLowerCase()) ||
        (c.email || "").toLowerCase().includes(q.toLowerCase())
      )
    : allClients;

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Gestiona clientes y accesos al portal"
        breadcrumbs={[{ label: "CRM" }]}
        primaryAction={
          <Link href="/os/crm/new" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">+ Nuevo cliente</Link>
        }
      />
      <CrmList clients={filtered} />
    </div>
  );
}
