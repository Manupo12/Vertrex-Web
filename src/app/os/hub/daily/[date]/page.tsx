import { db } from "@/lib/db";
import { knowledgeNotes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { requireOsUser } from "@/lib/auth/session";
import { BlockEditor } from "@/components/os/Editor/BlockEditor";
import { redirect } from "next/navigation";
import { formatShortDate } from "@/lib/format";

export default async function DailyNotePage({ params }: { params: Promise<{ date: string }> }) {
  await requireOsUser();
  const { date } = await params;

  // En un caso real, buscaríamos la nota por un campo "dailyDate" o título específico.
  // Para V3 spec lo simulamos por título "Daily {date}"
  const title = `Daily ${date}`;
  const [note] = await db.select()
    .from(knowledgeNotes)
    .where(and(eq(knowledgeNotes.type, "note"), eq(knowledgeNotes.title, title)))
    .limit(1);

  // V3 spec requires "upsert" for daily notes.
  // We'll show the view but in a full implementation this would create the note if missing.

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
        {note ? (
           <BlockEditor 
             initialContent={note.contentJson} 
             onChange={() => {}} 
             editable={true} 
           />
        ) : (
          <div className="space-y-4">
             <p className="text-sm text-[var(--color-muted-foreground)] mb-6">Esta es tu primera entrada de hoy. Escribe sobre lo que estás trabajando.</p>
             <BlockEditor 
               initialContent={[{ type: "paragraph", content: [{ type: "text", text: "Hoy me voy a enfocar en..." }] }]} 
               onChange={() => {}} 
               editable={true} 
             />
          </div>
        )}
      </div>
    </div>
  );
}
