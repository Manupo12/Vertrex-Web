import { db } from "@/lib/db";
import { legalTemplates } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { requireOsUser } from "@/lib/auth/session";
import { TemplatesView } from "./TemplatesView";

export default async function LegalTemplatesPage() {
  await requireOsUser();
  const allTemplates = await db.select().from(legalTemplates).orderBy(desc(legalTemplates.createdAt));

  return (
    <div>
      <PageHeader 
        title="Plantillas Legales" 
        description="Gestiona las plantillas de contratos y acuerdos." 
        breadcrumbs={[{ label: "Legal", href: "/os/legal" }, { label: "Plantillas" }]}
        primaryAction={
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            + Nueva plantilla
          </button>
        }
      />
      
      <TemplatesView initialTemplates={allTemplates} />
    </div>
  );
}
