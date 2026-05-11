import { db } from "@/lib/db";
import { legalDocuments } from "@/lib/db/schema";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { LegalList } from "./LegalList";

export default async function LegalPage() {
  const allDocs = await db.select().from(legalDocuments).orderBy(legalDocuments.createdAt);
  return (
    <div>
      <PageHeader title="Legal" description="Documentos legales: contratos, cuentas de cobro, acuerdos" breadcrumbs={[{ label: "Legal" }]} />
      <LegalList documents={allDocs} />
    </div>
  );
}
