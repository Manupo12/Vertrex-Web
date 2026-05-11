import { db } from "@/lib/db";
import { repositories, links } from "@/lib/db/schema";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { LinksView } from "./LinksView";

export default async function LinksPage() {
  const [repos, allLinks] = await Promise.all([
    db.select().from(repositories).orderBy(repositories.createdAt),
    db.select().from(links).orderBy(links.createdAt),
  ]);
  return (
    <div>
      <PageHeader title="Links & Repositorios" description="Repositorios GitHub y links utiles" breadcrumbs={[{ label: "Links" }]} />
      <LinksView repos={repos} links={allLinks} />
    </div>
  );
}
