import { db } from "@/lib/db";
import { agendaEvents } from "@/lib/db/schema";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { AgendaView } from "./AgendaView";

export default async function AgendaPage() {
  const events = await db.select().from(agendaEvents).orderBy(agendaEvents.startsAt);
  return (
    <div>
      <PageHeader title="Agenda" description="Calendario de reuniones y eventos" breadcrumbs={[{ label: "Agenda" }]} primaryAction={
        <a href="/os/agenda/new" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">+ Nuevo evento</a>
      } />
      <AgendaView events={events} />
    </div>
  );
}
