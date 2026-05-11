import { db } from "@/lib/db";
import { tasks, users, projects } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { MineView } from "./MineView";
import { requireOsUser } from "@/lib/auth/session";

export default async function MinePage() {
  const session = await requireOsUser();
  const myTasks = await db.select().from(tasks).where(eq(tasks.assigneeId, session.userId)).orderBy(desc(tasks.createdAt));
  const allProjects = await db.select().from(projects);
  const allUsers = await db.select().from(users);

  return (
    <div>
      <PageHeader 
        title="Mis tareas" 
        description="Lo que tienes asignado." 
        breadcrumbs={[{ label: "Proyectos", href: "/os/projects" }, { label: "Mis tareas" }]}
      />
      <MineView initialTasks={myTasks} projects={allProjects} users={allUsers} />
    </div>
  );
}
