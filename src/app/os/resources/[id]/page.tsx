import { db } from "@/lib/db";
import { resources } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EntitySidebar } from "@/components/os/Graph/EntitySidebar";
import { EntityConnectSheet } from "@/components/os/actions/EntityConnectSheet";
import { createResourceAction } from "@/lib/db/actions/resources";
import { notFound, redirect } from "next/navigation";
import { RevealButton } from "./RevealButton";

interface Props {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ projectId?: string }>;
}

export default async function ResourceDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { projectId } = (await searchParams) || {};

  if (id === "new") {
    redirect(`/os/resources/new${projectId ? `?projectId=${projectId}` : ""}`);
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
