import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { TeamList } from "./TeamList";
import Link from "next/link";
import { requireAdminUser } from "@/lib/auth/session";

export default async function TeamPage() {
  await requireAdminUser();
  const allUsers = await db.select().from(users).orderBy(users.createdAt);
  return (
    <div>
      <PageHeader title="Equipo" description="Gestion de miembros del equipo" breadcrumbs={[{ label: "Equipo" }]} primaryAction={
        <Link href="/os/team/new" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">+ Nuevo miembro</Link>
      } />
      <TeamList users={allUsers} />
    </div>
  );
}
