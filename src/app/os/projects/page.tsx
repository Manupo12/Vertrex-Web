import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import Link from "next/link";
import { ProjectsView } from "./ProjectsView";
import { projectHasPaidAdvance } from "@/lib/db/actions/finance-rules";

interface Props { searchParams: Promise<{ status?: string }> }

export default async function ProjectsPage({ searchParams }: Props) {
  const { status = "" } = await searchParams;
  const where = status ? eq(projects.status, status) : undefined;
  const allProjects = await db.select().from(projects).where(where).orderBy(projects.createdAt);

  const enrichedProjects = await Promise.all(allProjects.map(async p => ({
    ...p,
    hasPaidAdvance: p.status === "active" ? await projectHasPaidAdvance(p.id) : true
  })));

  return (
    <div>
      <PageHeader title="Proyectos" description="Gesti&oacute;n de proyectos" breadcrumbs={[{ label: "Proyectos" }]} primaryAction={
        <Link href="/os/projects/new" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">+ Nuevo proyecto</Link>
      } />
      <ProjectsView projects={enrichedProjects} />
    </div>
  );
}
