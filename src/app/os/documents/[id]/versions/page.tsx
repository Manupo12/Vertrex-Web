import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { requireOsUser } from "@/lib/auth/session";
import { formatShortDate, formatFileSize } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { DownloadIcon, FileIcon } from "lucide-react";

export default async function DocumentVersionsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireOsUser();
  const { id } = await params;

  const [document] = await db.select().from(documents).where(eq(documents.id, id));
  if (!document) throw new Error("Documento no encontrado");

  // Fetch all versions of this document (following parentId)
  // For V3 simplicity, we'll fetch the document and any document that has it as parentId
  const allVersions = await db.select()
    .from(documents)
    .where(eq(documents.parentId, id))
    .orderBy(desc(documents.version));
    
  // Include the main document in the list
  const versionsList = [document, ...allVersions].sort((a, b) => b.version - a.version);

  return (
    <div>
      <PageHeader 
        title={`Versiones de ${document.name}`}
        breadcrumbs={[
          { label: "Documentos", href: "/os/documents" }, 
          { label: document.name, href: `/os/documents/${id}` },
          { label: "Versiones" }
        ]}
      />
      
      <div className="mt-6 bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[var(--color-muted)]/50 text-[var(--color-muted-foreground)] uppercase text-xs">
              <tr>
                <th className="px-6 py-3 font-semibold">Versión</th>
                <th className="px-6 py-3 font-semibold">Fecha</th>
                <th className="px-6 py-3 font-semibold">Tamaño</th>
                <th className="px-6 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {versionsList.map((ver) => (
                <tr key={ver.id} className="hover:bg-[var(--color-muted)]/20 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-[var(--color-foreground)] flex items-center gap-3">
                    <FileIcon className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                    Versión {ver.version}
                    {ver.id === document.id && (
                      <span className="text-[10px] uppercase font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-1.5 py-0.5 rounded ml-2">Actual</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-[var(--color-muted-foreground)]">
                    {formatShortDate(ver.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-[var(--color-muted-foreground)] font-mono">
                    {formatFileSize(ver.sizeBytes)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`/api/documents/${ver.id}`} download>
                        <DownloadIcon className="h-4 w-4 mr-2" /> Descargar
                      </a>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
