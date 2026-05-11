import { db } from "@/lib/db";
import { repositories, links, linkCollections } from "@/lib/db/schema";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { LinksView } from "./LinksView";
import Link from "next/link";
import { ListIcon, SparklesIcon } from "lucide-react";

export default async function LinksPage() {
  const [allRepos, allLinks, allCollections] = await Promise.all([
    db.select().from(repositories).orderBy(repositories.createdAt),
    db.select().from(links).orderBy(links.createdAt),
    db.select().from(linkCollections).orderBy(linkCollections.name),
  ]);

  const repos = allRepos.map(r => ({ ...r, topics: r.topics as string[] }));

  return (
    <div>
      <PageHeader 
        title="Links & Repositorios" 
        description="Repositorios GitHub y links útiles" 
        breadcrumbs={[{ label: "Links" }]} 
        secondaryActions={
          <div className="flex gap-2">
            <Link href="/os/links/digest" className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1.5 text-xs font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors">
              <SparklesIcon className="h-3.5 w-3.5" /> Digest
            </Link>
            <Link href="/os/links/collections" className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1.5 text-xs font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors">
              <ListIcon className="h-3.5 w-3.5" /> Colecciones
            </Link>
          </div>
        }
      />
      <LinksView repos={repos} links={allLinks} collections={allCollections} />
    </div>
  );
}
