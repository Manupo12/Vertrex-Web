import { PageHeader } from "@/components/os/layout/PageHeader";
import { requireOsUser } from "@/lib/auth/session";
import { CreateResourceForm } from "./CreateResourceForm";

export default async function NewResourcePage({ searchParams }: { searchParams?: Promise<{ projectId?: string }> }) {
  await requireOsUser();
  const { projectId } = (await searchParams) || {};

  return (
    <div>
      <PageHeader
        title="Nuevo recurso"
        description="Guarda informacion confidencial de forma segura."
        breadcrumbs={[{ label: "Recursos", href: "/os/resources" }, { label: "Nuevo" }]}
      />
      <div className="mt-6 max-w-lg">
        <CreateResourceForm projectId={projectId} />
      </div>
    </div>
  );
}
