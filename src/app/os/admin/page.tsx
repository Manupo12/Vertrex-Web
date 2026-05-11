import { db } from "@/lib/db";
import { clients, projects, tickets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";

export const dynamic = 'force-dynamic';
import { StatCard } from "@/components/os/data/StatCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

export default async function AdminPage() {
  const [activeClients, activeProjects, openTickets] = await Promise.all([
    db.select().from(clients).where(eq(clients.status, "active")).then(r => r.length),
    db.select().from(projects).where(eq(projects.status, "active")).then(r => r.length),
    db.select().from(tickets).where(eq(tickets.status, "open")).then(r => r.length),
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard iconName="users" label="Clientes activos" value={activeClients} href="/os/crm" />
        <StatCard iconName="projects" label="Proyectos activos" value={activeProjects} href="/os/projects" />
        <StatCard iconName="tickets" label="Tickets abiertos" value={openTickets} />
        <StatCard iconName="database" label="Estado DB" value="Online" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Accesos rapidos</CardTitle><CardDescription>Atajos a las secciones mas usadas</CardDescription></CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Link href="/os/crm" className="rounded-lg border border-border p-3 text-sm hover:bg-accent/50 transition-colors">Nuevo cliente</Link>
            <Link href="/os/projects" className="rounded-lg border border-border p-3 text-sm hover:bg-accent/50 transition-colors">Nuevo proyecto</Link>
            <Link href="/os/hub?view=ideas" className="rounded-lg border border-border p-3 text-sm hover:bg-accent/50 transition-colors">Capturar idea</Link>
            <Link href="/os/agenda" className="rounded-lg border border-border p-3 text-sm hover:bg-accent/50 transition-colors">Agendar reunion</Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Salud del sistema</CardTitle><CardDescription>Metricas en tiempo real</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Modo</span><span>{process.env.NODE_ENV || "development"}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Framework</span><span>Next.js 15</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Base de datos</span><span>Neon PostgreSQL</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Deploy</span><span>Vercel</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
