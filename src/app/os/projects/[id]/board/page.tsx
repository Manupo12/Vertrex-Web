import { db } from "@/lib/db";
import { tasks, users, projects } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { BoardView } from "./BoardView";
import { requireOsUser } from "@/lib/auth/session";

export default async function ProjectBoardPage({ params }: { params: Promise<{ id: string }> }) {
  await requireOsUser();
  const { id } = await params;
  
  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  if (!project) throw new Error("Proyecto no encontrado");

  const projectTasks = await db.select().from(tasks).where(eq(tasks.projectId, id)).orderBy(desc(tasks.createdAt));
  const allUsers = await db.select().from(users);

  return (
    <div>
      <PageHeader 
        title="Tablero" 
        description={`Ejecución visual de ${project.name}`}
        breadcrumbs={[{ label: "Proyectos", href: "/os/projects" }, { label: project.name, href: `/os/projects/${id}` }, { label: "Tablero" }]}
      />
      <BoardView initialTasks={projectTasks} users={allUsers} projectId={id} />
    </div>
  );
}
