import { db } from "@/lib/db";
import { projects, milestones, cycles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { RoadmapTimeline } from "@/components/os/Tasks/RoadmapTimeline";
import { requireOsUser } from "@/lib/auth/session";

export default async function RoadmapPage() {
  await requireOsUser();
  const activeProjects = await db.select().from(projects).where(eq(projects.status, "active"));
  const allMilestones = await db.select().from(milestones);
  const allCycles = await db.select().from(cycles);

  return (
    <div>
      <PageHeader 
        title="Roadmap" 
        description="Próximos 12 meses por proyecto." 
        breadcrumbs={[{ label: "Proyectos", href: "/os/projects" }, { label: "Roadmap" }]}
      />
      <div className="mt-6">
        <RoadmapTimeline projects={activeProjects} milestones={allMilestones} cycles={allCycles} />
      </div>
    </div>
  );
}
