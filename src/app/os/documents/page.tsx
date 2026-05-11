import { db } from "@/lib/db";
import { documents, documentFolders } from "@/lib/db/schema";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { DocsList } from "./DocsList";

export default async function DocumentsPage() {
  const allDocs = await db.select().from(documents).orderBy(documents.createdAt);
  const allFolders = await db.select().from(documentFolders).orderBy(documentFolders.name);

  return (
    <div>
      <PageHeader title="Documentos" description="Repositorio de documentos de trabajo" breadcrumbs={[{ label: "Documentos" }]} />
      <DocsList documents={allDocs} folders={allFolders} />
    </div>
  );
}
