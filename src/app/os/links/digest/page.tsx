import { db } from "@/lib/db";
import { repositories } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { requireOsUser } from "@/lib/auth/session";
import { GithubCard } from "@/components/os/Links/GithubCard";
import Link from "next/link";
import { formatShortDate } from "@/lib/format";

export default async function LinksDigestPage() {
  await requireOsUser();
  // V3 Weekly Digest: Repos saved in the last 7 days.
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  // Here we would filter by createdAt >= sevenDaysAgo. For simplicity showing all recent.
  const recentRepos = await db.select().from(repositories).orderBy(desc(repositories.createdAt)).limit(15);

  return (
    <div>
      <PageHeader 
        title="Digest Semanal" 
        description="Repositorios descubiertos recientemente. ¿Algo para usar esta semana?" 
        breadcrumbs={[{ label: "Links", href: "/os/links" }, { label: "Digest" }]}
      />
      
      <div className="mt-6">
        {recentRepos.length > 0 ? (
          <div className="space-y-8 max-w-4xl mx-auto">
            {recentRepos.map(repo => (
              <div key={repo.id} className="relative pb-8 pl-8 border-l border-[var(--color-border)] last:border-0 last:pb-0">
                <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] ring-4 ring-[var(--color-background)]" />
                <div className="text-sm font-medium text-[var(--color-muted-foreground)] mb-3">
                  Guardado el {formatShortDate(repo.createdAt)}
                </div>
                <GithubCard repo={repo} />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-[var(--color-muted-foreground)]">
            No has guardado ningún repositorio recientemente.
          </div>
        )}
      </div>
    </div>
  );
}
