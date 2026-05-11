import { db } from "@/lib/db";
import { resourceAccessLog, resources, users } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { requireAdminUser } from "@/lib/auth/session";
import { AuditView } from "./AuditView";

export default async function ResourceAuditPage() {
  await requireAdminUser();
  const allLogs = await db.select().from(resourceAccessLog).orderBy(desc(resourceAccessLog.createdAt));
  const allResources = await db.select().from(resources);
  const allUsers = await db.select().from(users);

  return (
    <div>
      <PageHeader 
        title="Auditoría de Recursos" 
        description="Historial de accesos a secretos y credenciales." 
        breadcrumbs={[{ label: "Recursos", href: "/os/resources" }, { label: "Auditoría" }]}
      />
      
      <AuditView logs={allLogs} resources={allResources} users={allUsers} />
    </div>
  );
}
