import { db } from "@/lib/db";
import { documentFolders, documents } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { requireOsUser } from "@/lib/auth/session";
import Link from "next/link";
import { FolderIcon } from "lucide-react";

export default async function DocumentFoldersPage() {
  await requireOsUser();
  const folders = await db.select().from(documentFolders).orderBy(desc(documentFolders.createdAt));
  const allDocs = await db.select().from(documents);

  return (
    <div>
      <PageHeader title="Carpetas de documentos" description="Organiza tus documentos en carpetas." breadcrumbs={[{ label: "Documentos", href: "/os/documents" }, { label: "Carpetas" }]} />
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {folders.map(f => {
          const folderDocs = allDocs.filter(d => d.folderId === f.id);
          return (
            <Link key={f.id} href={`/os/documents?folder=${f.id}`} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-5 hover:border-[var(--color-primary)]/50 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <FolderIcon className="h-8 w-8 text-[var(--color-primary)]" />
                <div>
                  <h3 className="font-semibold">{f.name}</h3>
                  <p className="text-xs text-[var(--color-muted-foreground)]">{folderDocs.length} documentos</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      {folders.length === 0 && (
        <div className="mt-6 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-12 text-center">
          <FolderIcon className="h-12 w-12 mx-auto mb-4 text-[var(--color-muted-foreground)] opacity-30" />
          <p className="text-[var(--color-muted-foreground)]">No hay carpetas. Crea una desde la vista de documentos.</p>
        </div>
      )}
    </div>
  );
}
