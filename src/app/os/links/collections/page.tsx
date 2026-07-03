import { db } from "@/lib/db";
import { linkCollections } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { requireOsUser } from "@/lib/auth/session";
import { NewCollectionDialog } from "./NewCollectionDialog";

export default async function LinkCollectionsPage() {
  await requireOsUser();
  const collections = await db.select().from(linkCollections).orderBy(desc(linkCollections.createdAt));

  return (
    <div>
      <PageHeader 
        title="Colecciones" 
        description="Agrupa links y repositorios por tema." 
        breadcrumbs={[{ label: "Links", href: "/os/links" }, { label: "Colecciones" }]}
        primaryAction={<NewCollectionDialog />}
      />
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map(c => (
          <div key={c.id} className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6 hover:border-[var(--color-primary)]/50 transition-colors cursor-pointer">
            <h3 className="font-semibold text-lg mb-2">{c.name}</h3>
            <p className="text-sm text-[var(--color-muted-foreground)]">{c.description || "Sin descripción"}</p>
          </div>
        ))}
        {collections.length === 0 && (
          <div className="col-span-full py-12 text-center text-[var(--color-muted-foreground)] bg-[var(--color-card)] rounded-xl border border-[var(--color-border)]">
            No hay colecciones creadas aún.
          </div>
        )}
      </div>
    </div>
  );
}
