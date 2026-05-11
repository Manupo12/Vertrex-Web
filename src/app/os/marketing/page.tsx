import { db } from "@/lib/db";
import { socialAccounts, contentPlan } from "@/lib/db/schema";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { MarketingView } from "./MarketingView";

export default async function MarketingPage() {
  const [accounts, plans] = await Promise.all([
    db.select().from(socialAccounts).orderBy(socialAccounts.createdAt),
    db.select().from(contentPlan).orderBy(contentPlan.scheduledAt),
  ]);
  return (
    <div>
      <PageHeader title="Marketing" description="Gestion de redes sociales" breadcrumbs={[{ label: "Marketing" }]} />
      <MarketingView accounts={accounts} plans={plans} />
    </div>
  );
}
