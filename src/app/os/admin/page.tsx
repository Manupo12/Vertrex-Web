import { db } from "@/lib/db";
import { clients, projects, tickets, tasks, activity, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";

export const dynamic = 'force-dynamic';
import { StatCard } from "@/components/os/data/StatCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { requireOsUser } from "@/lib/auth/session";
import { ActivityFeed } from "@/components/os/Activity/ActivityFeed";
import { TaskRow } from "@/components/os/Tasks/TaskRow";

export default async function AdminPage() {
  const session = await requireOsUser();
  const [activeClients, activeProjects, openTickets, myActiveTasks, recentActivity, allUsers] = await Promise.all([
    db.select().from(clients).where(eq(clients.status, "active")).then(r => r.length),
    db.select().from(projects).where(eq(projects.status, "active")).then(r => r.length),
    db.select().from(tickets).where(eq(tickets.status, "open")).then(r => r.length),
    db.select().from(tasks).where(eq(tasks.assigneeId, session.userId)).orderBy(desc(tasks.priority), desc(tasks.createdAt)).limit(5),
    db.select().from(activity).orderBy(desc(activity.createdAt)).limit(10),
    db.select().from(users)
  ]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Estado general de Vertrex OS"
        breadcrumbs={[{ label: "Dashboard" }]}
        secondaryActions={
          <div className="flex gap-2">
            <a href="https://vercel.com/vertrex/analytics" target="_blank" rel="noopener" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Vercel Analytics</a>
            <a href="https://console.neon.tech" target="_blank" rel="noopener" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Neon Studio</a>
          </div>
        }
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6 mt-6">
        <StatCard iconName="users" label="Clientes activos" value={activeClients} href="/os/crm" />
        <StatCard iconName="projects" label="Proyectos activos" value={activeProjects} href="/os/projects" />
        <StatCard iconName="tickets" label="Tickets abiertos" value={openTickets} />
        <StatCard iconName="database" label="Estado DB" value="Online" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mi día</CardTitle>
              <CardDescription>Tareas prioritarias asignadas a ti</CardDescription>
            </CardHeader>
            <CardContent className="p-0 border-t border-[var(--color-border)]">
              {myActiveTasks.length > 0 ? (
                <div className="divide-y divide-[var(--color-border)]">
                  {myActiveTasks.map(t => (
                    <TaskRow key={t.id} task={t} users={allUsers} density="compact" />
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-muted-foreground">No tienes tareas asignadas hoy.</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Accesos rápidos</CardTitle><CardDescription>Atajos a las secciones más usadas</CardDescription></CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Link href="/os/crm/new" className="rounded-lg border border-border p-3 text-sm hover:bg-accent/50 transition-colors text-center font-medium">Nuevo cliente</Link>
              <Link href="/os/projects/new" className="rounded-lg border border-border p-3 text-sm hover:bg-accent/50 transition-colors text-center font-medium">Nuevo proyecto</Link>
              <Link href="/os/hub?view=ideas" className="rounded-lg border border-border p-3 text-sm hover:bg-accent/50 transition-colors text-center font-medium">Capturar idea</Link>
              <Link href="/os/agenda" className="rounded-lg border border-border p-3 text-sm hover:bg-accent/50 transition-colors text-center font-medium">Agendar reunión</Link>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] overflow-hidden">
            <div className="p-6 border-b border-[var(--color-border)]">
              <h3 className="font-semibold text-lg">Actividad reciente</h3>
              <p className="text-sm text-muted-foreground">Últimos eventos en el sistema</p>
            </div>
            <ActivityFeed activities={recentActivity} users={allUsers} />
          </div>
        </div>
      </div>
    </div>
  );
}
