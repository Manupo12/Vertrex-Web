import { db } from "@/lib/db";
import { knowledgeNotes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { requireOsUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { formatShortDate } from "@/lib/format";
import { DailyNoteEditor } from "./DailyNoteEditor";

export default async function DailyNotePage({ params }: { params: Promise<{ date: string }> }) {
  await requireOsUser();
  const { date } = await params;

  const title = `Daily ${date}`;
  const [note] = await db.select()
    .from(knowledgeNotes)
    .where(and(eq(knowledgeNotes.type, "note"), eq(knowledgeNotes.title, title)))
    .limit(1);

  return (
    <div>
      <PageHeader 
        title={`Registro Diario`} 
        description={formatShortDate(new Date(date))}
        breadcrumbs={[
          { label: "Hub", href: "/os/hub" }, 
          { label: "Daily" },
          { label: date }
        ]}
      />
      
      <div className="mt-6 bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] p-6 min-h-[500px]">
        {!note && (
          <p className="text-sm text-[var(--color-muted-foreground)] mb-6">
            Esta es tu primera entrada de hoy. Escribe sobre lo que estás trabajando.
          </p>
        )}
        <DailyNoteEditor date={date} initialContent={note?.contentJson} />
      </div>
    </div>
  );
}
