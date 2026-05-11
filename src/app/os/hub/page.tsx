import { db } from "@/lib/db";
import { knowledgeNotes } from "@/lib/db/schema";
import { PageHeader } from "@/components/os/layout/PageHeader";
import Link from "next/link";
import { HubView } from "./HubView";

interface Props {
  searchParams: Promise<{ view?: string }>;
}

export default async function HubPage({ searchParams }: Props) {
  const { view = "ideas" } = await searchParams;
  const allNotes = await db
    .select()
    .from(knowledgeNotes)
    .orderBy(knowledgeNotes.createdAt);

  return (
    <div>
      <PageHeader
        title="Knowledge Hub"
        description="Notas, ideas e incubadora"
        breadcrumbs={[{ label: "Hub" }]}
        primaryAction={
          <Link
            href="/os/hub/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            + Nueva nota
          </Link>
        }
      />
      <HubView notes={allNotes} defaultView={view} />
    </div>
  );
}
