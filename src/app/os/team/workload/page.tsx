import { db } from "@/lib/db";
import { users, tasks } from "@/lib/db/schema";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { requireAdminUser } from "@/lib/auth/session";
import { WorkloadView } from "./WorkloadView";

export default async function WorkloadPage() {
  await requireAdminUser();
  const allUsers = await db.select().from(users);
  const allTasks = await db.select().from(tasks);

  // Group tasks by assignee
  const workloadStats = allUsers.map(user => {
    const userTasks = allTasks.filter(t => t.assigneeId === user.id);
    const activeTasks = userTasks.filter(t => ["todo", "in_progress", "in_review"].includes(t.state));
    const overdueTasks = activeTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date());
    
    // Sort active tasks to find next deadline
    const upcomingTasks = activeTasks
      .filter(t => t.dueDate && new Date(t.dueDate) >= new Date())
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
      
    return {
      ...user,
      activeTasksCount: activeTasks.length,
      overdueTasksCount: overdueTasks.length,
      nextDeadline: upcomingTasks.length > 0 ? upcomingTasks[0].dueDate : null,
      totalCompleted: userTasks.filter(t => t.state === 'done').length,
    };
  });

  return (
    <div>
      <PageHeader 
        title="Workload del Equipo" 
        description="Capacidad y carga de trabajo actual." 
        breadcrumbs={[{ label: "Equipo", href: "/os/team" }, { label: "Workload" }]}
      />
      <WorkloadView stats={workloadStats} />
    </div>
  );
}
