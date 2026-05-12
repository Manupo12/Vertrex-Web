import { PageHeader } from "@/components/os/layout/PageHeader";
import { requireAdminUser } from "@/lib/auth/session";
import { CreateTeamMemberForm } from "./CreateTeamMemberForm";

export default async function NewTeamMemberPage() {
  await requireAdminUser();

  return (
    <div>
      <PageHeader
        title="Nuevo miembro"
        description="Agrega un miembro al equipo de Vertrex OS."
        breadcrumbs={[{ label: "Equipo", href: "/os/team" }, { label: "Nuevo" }]}
      />
      <div className="mt-6 max-w-lg">
        <CreateTeamMemberForm />
      </div>
    </div>
  );
}
