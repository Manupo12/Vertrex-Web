"use client";
import { useState } from "react";
import { Toolbar } from "@/components/os/layout/Toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { Calendar, Video } from "lucide-react";
import { formatDateTime } from "@/lib/format";

type AgendaEvent = { id: string; title: string; description: string | null; startsAt: Date; endsAt: Date; meetLink: string | null };

export function AgendaView({ events }: { events: AgendaEvent[] }) {
  const [query, setQuery] = useState("");
  const filtered = events.filter(e => !query || e.title.toLowerCase().includes(query.toLowerCase()));

  if (events.length === 0) {
    return <EmptyState icon={Calendar} title="Sin eventos" description="Agenda tu primera reunion o entrega." />;
  }

  const now = new Date();
  const upcoming = filtered.filter(e => new Date(e.startsAt) >= now);
  const past = filtered.filter(e => new Date(e.startsAt) < now);

  return (
    <div>
      <Toolbar searchPlaceholder="Buscar eventos..." onSearch={setQuery} />
      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-medium mb-3">Proximos ({upcoming.length})</h2>
          <div className="space-y-2">
            {upcoming.map(e => (
              <div key={e.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:bg-accent/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-sm font-bold">{new Date(e.startsAt).getDate()}</div>
                  <div><p className="font-medium text-sm">{e.title}</p><p className="text-xs text-muted-foreground">{formatDateTime(e.startsAt)} - {formatDateTime(e.endsAt)}</p></div>
                </div>
                {e.meetLink && <a href={e.meetLink} target="_blank" className="rounded-lg border border-border p-2 hover:bg-accent transition-colors"><Video className="h-4 w-4" /></a>}
              </div>
            ))}
            {upcoming.length === 0 && <p className="text-sm text-muted-foreground py-4">Sin eventos proximos.</p>}
          </div>
        </div>
        {past.length > 0 && (
          <div>
            <h2 className="text-sm font-medium mb-3 text-muted-foreground">Pasados ({past.length})</h2>
            <div className="space-y-1 opacity-60">
              {past.map(e => <div key={e.id} className="flex justify-between rounded-lg border border-border/50 p-3 text-sm"><span>{e.title}</span><span className="text-xs text-muted-foreground">{formatDateTime(e.startsAt)}</span></div>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
