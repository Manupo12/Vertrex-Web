import { notFound } from "next/navigation";
import { getRepositoryById, getLinkById, loadRepositoryReadmeAction } from "@/lib/db/actions/links";
import { getResolvedEntityConnections } from "@/lib/db/actions/graph";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EntitySidebar } from "@/components/os/Graph/EntitySidebar";
import { EntityConnectSheet } from "@/components/os/actions/EntityConnectSheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RepoActions } from "./RepoActions";
import ReactMarkdown from "react-markdown";
import { formatShortDate } from "@/lib/format";
import { EntityGraph } from "@/components/os/Graph/EntityGraph";

export default async function LinkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const repo = await getRepositoryById(id);
  const link = !repo ? await getLinkById(id) : null;

  if (!repo && !link) {
    notFound();
  }

  const resolvedConnections = await getResolvedEntityConnections(id);

  if (repo) {
    let readme = repo.readmeContent;
    if (!readme) {
      try {
        const { readmeContent } = await loadRepositoryReadmeAction(repo.id);
        readme = readmeContent;
      } catch (e) {
        readme = "No se pudo cargar el README.";
      }
    }

    return (
      <div>
        <PageHeader 
          title={`${repo.owner}/${repo.repoName}`} 
          description={repo.description || "Repositorio de GitHub"}
          breadcrumbs={[{ label: "Links", href: "/os/links" }, { label: repo.repoName }]}
          badge={<Badge variant="neutral">{repo.language || "Desconocido"}</Badge>}
          secondaryActions={<EntityConnectSheet sourceId={repo.id} sourceType="repository" />}
        />
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1">
            <Tabs defaultValue="resumen">
              <TabsList>
                <TabsTrigger value="resumen">Resumen</TabsTrigger>
                <TabsTrigger value="readme">README</TabsTrigger>
                <TabsTrigger value="conexiones">Conexiones</TabsTrigger>
              </TabsList>
              <TabsContent value="resumen" className="space-y-4">
                <Card className="bg-yellow-500/10 border-yellow-500/20">
                  <CardContent className="p-4">
                    <p className="font-bold text-yellow-600 mb-1">Por que lo guardaste?</p>
                    <p className="text-yellow-700 dark:text-yellow-500">{repo.savedReason}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm">Detalles Tecnicos</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Estrellas</span><span>{repo.stars}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Forks</span><span>{repo.forks}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant="info" className="text-[10px]">{repo.implementationStatus}</Badge></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Actualizado</span><span>{repo.pushedAt ? formatShortDate(repo.pushedAt) : "-"}</span></div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="readme">
                <Card>
                  <CardContent className="p-6 prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{readme || "No README found."}</ReactMarkdown>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="conexiones">
                <EntityGraph entityId={repo.id} connections={resolvedConnections} entityLabel={`${repo.owner}/${repo.repoName}`} entityType="Repositorio" />
              </TabsContent>
            </Tabs>
          </div>
          <div className="w-full lg:w-72 shrink-0"><EntitySidebar entityId={repo.id} /></div>
        </div>
      </div>
    );
  }

  if (link) {
    return (
      <div>
        <PageHeader 
          title={link.title || link.url} 
          description={link.description || "Link externo"}
          breadcrumbs={[{ label: "Links", href: "/os/links" }, { label: "Detalle" }]}
          badge={<Badge variant="neutral">{link.type}</Badge>}
          secondaryActions={<EntityConnectSheet sourceId={link.id} sourceType="link" />}
        />
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1">
            <Tabs defaultValue="resumen">
              <TabsList>
                <TabsTrigger value="resumen">Resumen</TabsTrigger>
                <TabsTrigger value="conexiones">Conexiones</TabsTrigger>
              </TabsList>
              <TabsContent value="resumen">
                <Card>
                  <CardContent className="p-6">
                    <a href={link.url} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">{link.url}</a>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="conexiones">
                <EntityGraph entityId={link.id} connections={resolvedConnections} entityLabel={link.title || link.url} entityType="Link" />
              </TabsContent>
            </Tabs>
          </div>
          <div className="w-full lg:w-72 shrink-0"><EntitySidebar entityId={link.id} /></div>
        </div>
      </div>
    );
  }

  return null;
}
