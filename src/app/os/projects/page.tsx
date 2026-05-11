import { db } from "@/lib/db";
import { projects, entityLinks, clients } from "@/lib/db/schema";
import { eq, and, or } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import Link from "next/link";
import { ProjectsView } from "./ProjectsView";
import { projectHasPaidAdvance } from "@/lib/db/actions/finance-rules";

interface Props { searchParams: Promise<{ status?: string }> }

export default async function ProjectsPage({ searchParams }: Props) {
  const { status = "" } = await searchParams;
  const where = status ? eq(projects.status, status) : undefined;
  const allProjects = await db.select().from(projects).where(where).orderBy(projects.createdAt);

  const enrichedProjects = await Promise.all(allProjects.map(async p => {
    const hasPaidAdvance = p.status === "active" ? await projectHasPaidAdvance(p.id) : true;
    
    // Find connected client
    const [clientLink] = await db.select().from(entityLinks).where(
      or(
        and(eq(entityLinks.sourceId, p.id), eq(entityLinks.targetType, "client")),
        and(eq(entityLinks.targetId, p.id), eq(entityLinks.sourceType, "client"))
      )
    ).limit(1);

    let clientName = null;
    if (clientLink) {
      const clientId = clientLink.sourceType === "client" ? clientLink.sourceId : clientLink.targetId;
      const [client] = await db.select({ name: clients.name }).from(clients).where(eq(clients.id, clientId)).limit(1);
      clientName = client?.name;
    }

    return {
      ...p,
      hasPaidAdvance,
      clientName
    };
  }));

  return (
    <div>
      <PageHeader title="Proyectos" description="Gesti&oacute;n de proyectos" breadcrumbs={[{ label: "Proyectos" }]} primaryAction={
        <Link href="/os/projects/new" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">+ Nuevo proyecto</Link>
      } />
      <ProjectsView projects={enrichedProjects} />
    </div>
  );
}
