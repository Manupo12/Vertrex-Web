import { db } from "@/lib/db";
import { resourceFolders, resources } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { requireOsUser } from "@/lib/auth/session";
import { FolderIcon } from "lucide-react";
import Link from "next/link";

export default async function ResourceFoldersPage() {
  await requireOsUser();
  const folders = await db.select().from(resourceFolders).orderBy(desc(resourceFolders.createdAt));
  const allResources = await db.select().from(resources);

  return (
    <div>
      <PageHeader title="Carpetas de recursos" description="Organiza tus recursos cifrados." breadcrumbs={[{ label: "Recursos", href: "/os/resources" }, { label: "Carpetas" }]} />
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {folders.map(f => {
          const folderResources = allResources.filter(r => r.folderId === f.id);
          return (
            <Link key={f.id} href={`/os/resources?folder=${f.id}`} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-5 hover:border-[var(--color-primary)]/50 transition-colors">
              <div className="flex items-center gap-3">
                <FolderIcon className="h-8 w-8 text-[var(--color-primary)]" />
                <div>
                  <h3 className="font-semibold">{f.name}</h3>
                  <p className="text-xs text-[var(--color-muted-foreground)]">{folderResources.length} recursos</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      {folders.length === 0 && (
        <div className="mt-6 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-12 text-center">
          <FolderIcon className="h-12 w-12 mx-auto mb-4 text-[var(--color-muted-foreground)] opacity-30" />
          <p className="text-[var(--color-muted-foreground)]">No hay carpetas de recursos.</p>
        </div>
      )}
    </div>
  );
}
