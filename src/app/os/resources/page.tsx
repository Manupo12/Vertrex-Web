import { db } from "@/lib/db";
import { resources, resourceFolders } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import Link from "next/link";
import { ResourcesList } from "./ResourcesList";
import { requireOsUser } from "@/lib/auth/session";

export default async function ResourcesPage() {
  await requireOsUser();
  const allResources = await db
    .select()
    .from(resources)
    .orderBy(desc(resources.createdAt));
    
  const allFolders = await db.select().from(resourceFolders).orderBy(resourceFolders.name);

  return (
    <div>
      <PageHeader
        title="Recursos"
        description="Boveda de informacion confidencial"
        breadcrumbs={[{ label: "Recursos" }]}
        primaryAction={
          <Link
            href="/os/resources/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            + Nuevo recurso
          </Link>
        }
      />
      <ResourcesList resources={allResources} folders={allFolders} />
    </div>
  );
}
