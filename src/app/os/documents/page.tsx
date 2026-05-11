import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { DocsList } from "./DocsList";

export default async function DocumentsPage() {
  const allDocs = await db.select().from(documents).orderBy(documents.createdAt);
  return (
    <div>
      <PageHeader title="Documentos" description="Repositorio de documentos de trabajo" breadcrumbs={[{ label: "Documentos" }]} />
      <DocsList documents={allDocs} />
    </div>
  );
}
