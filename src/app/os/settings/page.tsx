import { PageHeader } from "@/components/os/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireAdminUser } from "@/lib/auth/session";
import { SettingsAccount } from "./SettingsAccount";
import { db } from "@/lib/db";
import { resources } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ResourcesList } from "@/app/os/resources/ResourcesList";

export default async function SettingsPage() {
  await requireAdminUser();
  const internalVars = await db.select().from(resources).where(eq(resources.type, "env"));

  return (
    <div>
      <PageHeader title="Configuracion" description="Ajustes del sistema" breadcrumbs={[{ label: "Configuracion" }]} />
      <Tabs defaultValue="cuenta" className="max-w-4xl">
        <TabsList>
          <TabsTrigger value="cuenta">Cuenta</TabsTrigger>
          <TabsTrigger value="variables">Variables internas</TabsTrigger>
          <TabsTrigger value="mcp">MCP</TabsTrigger>
          <TabsTrigger value="sistema">Sistema</TabsTrigger>
        </TabsList>
        <TabsContent value="cuenta" className="mt-4"><SettingsAccount /></TabsContent>
        <TabsContent value="variables" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Variables de Entorno</CardTitle>
              <CardDescription>Variables internas guardadas como recursos cifrados.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResourcesList resources={internalVars} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="mcp" className="mt-4">
          <Card><CardHeader><CardTitle>Endpoint MCP</CardTitle><CardDescription>Para agentes IA externos (Sofia, OpenClaw).</CardDescription></CardHeader><CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Endpoint</span><code className="text-xs bg-accent px-2 py-0.5 rounded">GET /api/mcp/graph</code></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Auth</span><code className="text-xs bg-accent px-2 py-0.5 rounded">Bearer MCP_SECRET</code></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Response</span><span>JSON: clients, projects, entity_links</span></div>
            </div>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="sistema" className="mt-4">
          <Card><CardHeader><CardTitle>Informacion</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Framework</span><span>Next.js 15</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Base de datos</span><span>Neon PostgreSQL</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">ORM</span><span>Drizzle</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Entorno</span><span>{process.env.NODE_ENV || "development"}</span></div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
