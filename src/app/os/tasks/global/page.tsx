import { db } from "@/lib/db";
import { tasks, users, projects, cycles, milestones } from "@/lib/db/schema";
import { requireOsUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { GlobalTasksView } from "./GlobalTasksView";

export const dynamic = 'force-dynamic';

export default async function GlobalTasksPage() {
  const session = await requireOsUser();
  const allTasks = await db.select().from(tasks);
  const allUsers = await db.select().from(users);
  const allProjects = await db.select().from(projects);
  const allCycles = await db.select().from(cycles);
  const allMilestones = await db.select().from(milestones);

  return (
    <div>
      <PageHeader
        title="Tareas globales"
        description="Tablero Kanban con todas las tareas asignadas a miembros del equipo"
        breadcrumbs={[{ label: "Tareas globales" }]}
      />
      <GlobalTasksView
        initialTasks={allTasks}
        users={allUsers}
        projects={allProjects}
        cycles={allCycles}
        milestones={allMilestones}
        session={session}
      />
    </div>
  );
}
