import { db } from "@/lib/db";
import { marketingHashtags, socialAccounts } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { requireOsUser } from "@/lib/auth/session";
import { HashtagsView } from "./HashtagsView";

export default async function HashtagsPage() {
  await requireOsUser();
  const allHashtags = await db.select().from(marketingHashtags).orderBy(desc(marketingHashtags.createdAt));
  const accounts = await db.select().from(socialAccounts);

  return (
    <div>
      <PageHeader 
        title="Biblioteca de Hashtags" 
        description="Grupos de hashtags listos para copiar." 
        breadcrumbs={[{ label: "Marketing", href: "/os/marketing" }, { label: "Hashtags" }]}
        primaryAction={
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            + Nuevo grupo
          </button>
        }
      />
      
      <HashtagsView hashtags={allHashtags} accounts={accounts} />
    </div>
  );
}
