import { db } from "@/lib/db";
import { resources } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EntitySidebar } from "@/components/os/Graph/EntitySidebar";
import { EntityConnectSheet } from "@/components/os/actions/EntityConnectSheet";
import { createResourceAction } from "@/lib/db/actions/resources";
import { notFound } from "next/navigation";
import { RevealButton } from "./RevealButton";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ResourceDetailPage({ params }: Props) {
  const { id } = await params;

  if (id === "new") {
    return (
      <div>
        <PageHeader
          title="Nuevo recurso"
          breadcrumbs={[
            { label: "Recursos", href: "/os/resources" },
            { label: "Nuevo" },
          ]}
        />
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Crear recurso</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={async (fd) => { await createResourceAction(fd); }} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">
                  Titulo *
                </label>
                <input
                  name="title"
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">
                  Tipo
                </label>
                <select
                  name="type"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="api_key">API Key</option>
                  <option value="env">.env</option>
                  <option value="password">Password</option>
                  <option value="credential">Credencial</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">
                  Valor secreto *
                </label>
                <input
                  name="value"
                  required
                  type="password"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Guardar
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [resource] = await db
    .select()
    .from(resources)
    .where(eq(resources.id, id))
    .limit(1);

  if (!resource) notFound();

  return (
    <div>
      <PageHeader
        title={resource.title}
        breadcrumbs={[
          { label: "Recursos", href: "/os/resources" },
          { label: resource.title },
        ]}
        secondaryActions={<EntityConnectSheet sourceId={resource.id} sourceType="resource" />}
      />
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1">
          <Card>
            <CardContent className="pt-6">
              <RevealButton resourceId={resource.id} />
            </CardContent>
          </Card>
        </div>
        <div className="w-full shrink-0 lg:w-72">
          <EntitySidebar entityId={resource.id} />
        </div>
      </div>
    </div>
  );
}
