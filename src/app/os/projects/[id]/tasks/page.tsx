import { db } from "@/lib/db";
import { tasks, users, projects, cycles, milestones } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { TasksView } from "./TasksView";
import { requireOsUser } from "@/lib/auth/session";

export default async function ProjectTasksPage({ params }: { params: Promise<{ id: string }> }) {
  await requireOsUser();
  const { id } = await params;
  
  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  if (!project) throw new Error("Proyecto no encontrado");

  const projectTasks = await db.select().from(tasks).where(eq(tasks.projectId, id)).orderBy(desc(tasks.createdAt));
  const allUsers = await db.select().from(users);
  const projectCycles = await db.select().from(cycles).where(eq(cycles.projectId, id));
  const projectMilestones = await db.select().from(milestones).where(eq(milestones.projectId, id));

  return (
    <div>
      <PageHeader 
        title="Tareas" 
        description={`Backlog y ejecución de ${project.name}`}
        breadcrumbs={[{ label: "Proyectos", href: "/os/projects" }, { label: project.name, href: `/os/projects/${id}` }, { label: "Tareas" }]}
      />
      <TasksView initialTasks={projectTasks} users={allUsers} projectId={id} projects={[project]}
        cycles={projectCycles} milestones={projectMilestones} />
    </div>
  );
}
