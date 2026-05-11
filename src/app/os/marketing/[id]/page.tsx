import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { socialAccounts, contentPlan } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatShortDate } from "@/lib/format";
import { SocialRevealButton } from "./SocialRevealButton";
import { ContentForm } from "./ContentForm";
import { ContentStatusSelect } from "./ContentStatusSelect";

export default async function MarketingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const [account] = await db.select().from(socialAccounts).where(eq(socialAccounts.id, id)).limit(1);
  if (!account) notFound();

  const content = await db.select().from(contentPlan).where(eq(contentPlan.socialAccountId, id));

  return (
    <div>
      <PageHeader 
        title={`${account.platform}: ${account.handle}`} 
        breadcrumbs={[{ label: "Marketing", href: "/os/marketing" }, { label: account.handle }]}
        badge={<Badge variant="neutral" className="capitalize">{account.platform}</Badge>}
      />
      <div className="max-w-4xl">
        <Tabs defaultValue="cuenta">
          <TabsList>
            <TabsTrigger value="cuenta">Cuenta</TabsTrigger>
            <TabsTrigger value="contenido">Contenido</TabsTrigger>
            <TabsTrigger value="credenciales">Credenciales</TabsTrigger>
          </TabsList>
          
          <TabsContent value="cuenta" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Detalles</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Plataforma</span><span className="capitalize">{account.platform}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Usuario / Handle</span><span>{account.handle}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Email asociado</span><span>{account.email || "-"}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Creada el</span><span>{formatShortDate(account.createdAt)}</span></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contenido" className="mt-4">
            <ContentForm socialAccountId={account.id} />
            <Card>
              <CardHeader><CardTitle className="text-sm">Plan de Contenido</CardTitle></CardHeader>
              <CardContent>
                {content.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No hay contenido planeado.</p>
                ) : (
                  <div className="space-y-2">
                    {content.map(c => (
                      <div key={c.id} className="flex justify-between items-center rounded-lg border border-border p-3 hover:bg-accent/30 transition-colors">
                        <div>
                          <p className="text-sm font-medium">{c.title}</p>
                          <p className="text-xs text-muted-foreground">{c.contentType}</p>
                        </div>
                        <ContentStatusSelect contentId={c.id} initialStatus={c.status} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credenciales" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Seguridad</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-accent/20 border border-border">
                  <div>
                    <p className="text-sm font-medium">Contrasena de la cuenta</p>
                    <p className="text-xs text-muted-foreground">Guardada en formato cifrado.</p>
                  </div>
                  <SocialRevealButton accountId={account.id} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
