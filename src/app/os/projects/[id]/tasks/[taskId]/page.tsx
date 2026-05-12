import { db } from "@/lib/db";
import { tasks, users, projects, cycles, milestones, entityLinks } from "@/lib/db/schema";
import { eq, and, inArray, ne } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { requireOsUser } from "@/lib/auth/session";
import { TaskDetailClient } from "./TaskDetailClient";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string, taskId: string }> }) {
  await requireOsUser();
  const { id, taskId } = await params;

  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  if (!project) throw new Error("Proyecto no encontrado");

  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
  if (!task) throw new Error("Tarea no encontrada");

  const allUsers = await db.select().from(users);

  const subtasks = await db.select().from(tasks).where(eq(tasks.parentTaskId, taskId));

  const blockingLinks = await db.select().from(entityLinks)
    .where(and(eq(entityLinks.sourceId, taskId), eq(entityLinks.relationType, "blocks")));
  const blockedByLinks = await db.select().from(entityLinks)
    .where(and(eq(entityLinks.targetId, taskId), eq(entityLinks.relationType, "blocked_by")));

  const blockingTasks = await db.select().from(tasks).where(inArray(tasks.id, blockingLinks.map(l => l.targetId)));
  const blockedByTasks = await db.select().from(tasks).where(inArray(tasks.id, blockedByLinks.map(l => l.sourceId)));

  const blockingWithLinks = blockingTasks.map(t => ({
    task: t,
    linkId: blockingLinks.find(l => l.targetId === t.id)?.id || "",
  }));
  const blockedByWithLinks = blockedByTasks.map(t => ({
    task: t,
    linkId: blockedByLinks.find(l => l.sourceId === t.id)?.id || "",
  }));

  const projectCycles = await db.select().from(cycles).where(eq(cycles.projectId, id));
  const projectMilestones = await db.select().from(milestones).where(eq(milestones.projectId, id));

  const allProjectTasks = await db.select({ id: tasks.id, identifier: tasks.identifier, title: tasks.title })
    .from(tasks)
    .where(and(eq(tasks.projectId, id), ne(tasks.id, taskId)));

  return (
    <div>
      <PageHeader 
        title={task.title} 
        breadcrumbs={[
          { label: "Proyectos", href: "/os/projects" }, 
          { label: project.name, href: `/os/projects/${id}` },
          { label: "Tareas", href: `/os/projects/${id}/tasks` },
          { label: task.identifier }
        ]}
      />
      
      <TaskDetailClient
        task={task}
        allUsers={allUsers}
        project={project}
        subtasks={subtasks}
        blockingWithLinks={blockingWithLinks}
        blockedByWithLinks={blockedByWithLinks}
        cycles={projectCycles}
        milestones={projectMilestones}
        allProjectTasks={allProjectTasks}
      />
    </div>
  );
}
