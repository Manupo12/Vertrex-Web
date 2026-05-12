import { db } from "@/lib/db";
import { milestones, projects, tasks, users } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { requireOsUser } from "@/lib/auth/session";
import { CreateMilestoneDialog } from "./CreateMilestoneDialog";
import { TaskCreateButton } from "@/components/os/Tasks/TaskCreateButton";
import { MilestonesClient } from "./MilestonesClient";

export default async function MilestonesPage({ params }: { params: Promise<{ id: string }> }) {
  await requireOsUser();
  const { id } = await params;

  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  if (!project) throw new Error("Proyecto no encontrado");

  const projectMilestones = await db.select().from(milestones).where(eq(milestones.projectId, id)).orderBy(asc(milestones.orderIndex));
  const allUsers = await db.select().from(users);

  const allMilestoneTasks = await db.select({ id: tasks.id, state: tasks.state, milestoneId: tasks.milestoneId, title: tasks.title }).from(tasks).where(eq(tasks.projectId, id));

  return (
    <div>
      <PageHeader 
        title="Hitos" 
        description={`Milestones de ${project.name}`}
        breadcrumbs={[{ label: "Proyectos", href: "/os/projects" }, { label: project.name, href: `/os/projects/${id}` }, { label: "Hitos" }]}
        secondaryActions={
          <TaskCreateButton projectId={id} label="+ Tarea" projects={[project]} users={allUsers} />
        }
        primaryAction={
          <CreateMilestoneDialog projectId={id} />
        }
      />
      
      <MilestonesClient
        milestones={projectMilestones}
        allMilestoneTasks={allMilestoneTasks}
        projectId={id}
      />
    </div>
  );
}
