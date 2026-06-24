import { PageHeader } from "@/components/os/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireAdminUser } from "@/lib/auth/session";
import { SettingsAccount } from "./SettingsAccount";
import { SettingsNotifications } from "./SettingsNotifications";
import { SettingsAppearance } from "./SettingsAppearance";
import { db } from "@/lib/db";
import { resources, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ResourcesList } from "@/app/os/resources/ResourcesList";
import { Button } from "@/components/ui/button";
import { CopyIcon } from "lucide-react";
import { readFileSync } from "fs";

export default async function SettingsPage() {
  const session = await requireAdminUser();
  const internalVars = await db.select().from(resources).where(eq(resources.type, "env"));
  const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
  const osVersion = pkg.version || "3.0.0";

  const hasDrive = !!(
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
    process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
    process.env.GOOGLE_OAUTH_REFRESH_TOKEN
  );
  const hasGithub = !!process.env.GITHUB_TOKEN;

  const [userRecord] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  const initialPreferences = userRecord?.preferences || {};

  return (
    <div>
      <PageHeader title="Configuración" description="Ajustes del sistema y perfil" breadcrumbs={[{ label: "Configuración" }]} />
      
      <Tabs defaultValue="cuenta" className="mt-6">
        <TabsList className="mb-6 bg-transparent border-b border-[var(--color-border)] rounded-none p-0 h-auto justify-start w-full overflow-x-auto flex-nowrap hide-scrollbar">
          <TabsTrigger value="cuenta" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--color-primary)] data-[state=active]:bg-transparent px-4 py-2">Cuenta</TabsTrigger>
          <TabsTrigger value="notificaciones" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--color-primary)] data-[state=active]:bg-transparent px-4 py-2">Notificaciones</TabsTrigger>
          <TabsTrigger value="integraciones" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--color-primary)] data-[state=active]:bg-transparent px-4 py-2">Integraciones</TabsTrigger>
          <TabsTrigger value="variables" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--color-primary)] data-[state=active]:bg-transparent px-4 py-2">Variables internas</TabsTrigger>
          <TabsTrigger value="mcp" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--color-primary)] data-[state=active]:bg-transparent px-4 py-2">MCP API</TabsTrigger>
          <TabsTrigger value="apariencia" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--color-primary)] data-[state=active]:bg-transparent px-4 py-2">Apariencia</TabsTrigger>
          <TabsTrigger value="sistema" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--color-primary)] data-[state=active]:bg-transparent px-4 py-2">Sistema</TabsTrigger>
        </TabsList>
        
        <TabsContent value="cuenta"><SettingsAccount /></TabsContent>
        
        <TabsContent value="notificaciones">
          <SettingsNotifications initialPreferences={initialPreferences} />
        </TabsContent>

        <TabsContent value="integraciones">
          <Card className="max-w-2xl mb-4 bg-[var(--color-card)]">
            <CardHeader><CardTitle>Google Drive</CardTitle><CardDescription>Almacenamiento de archivos grandes</CardDescription></CardHeader>
            <CardContent>
              <div className="flex justify-between items-center p-3 bg-[var(--color-muted)]/20 rounded-lg border border-[var(--color-border)] mb-4">
                <div className="text-sm">Estado de la conexión</div>
                {hasDrive ? (
                  <div className="text-xs px-2 py-1 bg-green-500/10 text-green-500 rounded font-medium">Conectado (OAuth2)</div>
                ) : (
                  <div className="text-xs px-2 py-1 bg-red-500/10 text-red-500 rounded font-medium">Desconectado</div>
                )}
              </div>
              {hasDrive && (
                <Button variant="outline" size="sm">Renovar token</Button>
              )}
            </CardContent>
          </Card>
          <Card className="max-w-2xl mb-4 bg-[var(--color-card)]">
            <CardHeader><CardTitle>GitHub</CardTitle><CardDescription>Extracción de metadata de repositorios</CardDescription></CardHeader>
            <CardContent>
              <div className="flex justify-between items-center p-3 bg-[var(--color-muted)]/20 rounded-lg border border-[var(--color-border)] mb-4">
                <div className="text-sm">Token configurado</div>
                {hasGithub ? (
                  <div className="text-xs px-2 py-1 bg-green-500/10 text-green-500 rounded font-medium">Activo</div>
                ) : (
                  <div className="text-xs px-2 py-1 bg-red-500/10 text-red-500 rounded font-medium">Inactivo</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variables">
          <Card className="max-w-4xl bg-[var(--color-card)]">
            <CardHeader>
              <CardTitle>Variables de Entorno</CardTitle>
              <CardDescription>Variables internas guardadas como recursos cifrados.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResourcesList resources={internalVars} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mcp">
          <Card className="max-w-2xl bg-[var(--color-card)]">
            <CardHeader><CardTitle>API REST V1 & MCP</CardTitle><CardDescription>Endpoints API V1 para agentes y automatizaciones</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-[var(--color-muted)]/50 p-4 border border-[var(--color-border)]">
                <div className="mb-4">
                  <p className="text-sm font-medium mb-1 flex items-center justify-between">GET /api/v1/search?q=QUERY <Button variant="ghost" size="sm" className="h-6"><CopyIcon className="h-3 w-3" /></Button></p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">Búsqueda global y unificada de entidades en el OS.</p>
                </div>
                <div className="mb-4">
                  <p className="text-sm font-medium mb-1 flex items-center justify-between">GET /api/v1/tasks <Button variant="ghost" size="sm" className="h-6"><CopyIcon className="h-3 w-3" /></Button></p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">Listado de tareas del OS con filtros opcionales.</p>
                </div>
                <div className="mb-4">
                  <p className="text-sm font-medium mb-1 flex items-center justify-between">GET /api/v1/activity <Button variant="ghost" size="sm" className="h-6"><CopyIcon className="h-3 w-3" /></Button></p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">Feed de actividad reciente en tiempo real.</p>
                </div>
                <div className="mb-4">
                  <p className="text-sm font-medium mb-1 flex items-center justify-between text-green-500">POST /api/v1/intent <Button variant="ghost" size="sm" className="h-6"><CopyIcon className="h-3 w-3" /></Button></p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">Motor de intenciones de lenguaje natural (reemplaza stubs antiguos).</p>
                </div>
                <div className="mt-4 pt-4 border-t border-[var(--color-border)] space-y-2">
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Para autenticar tus llamadas API, genera tus <strong>tokens personales de API</strong> haciendo un POST con JSON <code className="text-primary font-mono">{`{"name": "nombre-del-token"}`}</code> a:
                  </p>
                  <p className="text-sm font-semibold text-primary font-mono bg-black/40 p-2 rounded border border-[var(--color-border)]">
                    /api/v1/auth/tokens
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apariencia">
          <SettingsAppearance initialPreferences={initialPreferences} />
        </TabsContent>

        <TabsContent value="sistema">
          <Card className="max-w-2xl bg-[var(--color-card)]">
            <CardHeader><CardTitle>Salud del sistema</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm p-3 bg-[var(--color-muted)]/20 rounded border border-[var(--color-border)]"><span className="text-[var(--color-muted-foreground)]">Modo</span><span className="font-medium">{process.env.NODE_ENV || "development"}</span></div>
              <div className="flex justify-between text-sm p-3 bg-[var(--color-muted)]/20 rounded border border-[var(--color-border)]"><span className="text-[var(--color-muted-foreground)]">Base de datos</span><span className="font-medium">Neon PostgreSQL</span></div>
              <div className="flex justify-between text-sm p-3 bg-[var(--color-muted)]/20 rounded border border-[var(--color-border)]"><span className="text-[var(--color-muted-foreground)]">Versión OS</span><span className="font-medium">{osVersion}</span></div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
