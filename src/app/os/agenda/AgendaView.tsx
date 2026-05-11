"use client";
import { useState } from "react";
import { Toolbar } from "@/components/os/layout/Toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { Calendar as CalendarIcon, Video, LayoutGrid, List } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { Calendar, dateFnsLocalizer, View, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

const locales = {
  "es": es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

type AgendaEvent = { id: string; title: string; description: string | null; startsAt: Date; endsAt: Date; meetLink: string | null };

export function AgendaView({ events }: { events: AgendaEvent[] }) {
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [currentView, setCurrentView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);

  const filtered = events.filter(e => !query || e.title.toLowerCase().includes(query.toLowerCase()));

  const calendarEvents = filtered.map(e => ({
    id: e.id,
    title: e.title,
    start: new Date(e.startsAt),
    end: new Date(e.endsAt),
    resource: e,
  }));

  if (events.length === 0) {
    return <EmptyState icon={CalendarIcon} title="Sin eventos" description="Agenda tu primera reunion o entrega." />;
  }

  const now = new Date();
  const upcoming = filtered.filter(e => new Date(e.startsAt) >= now);
  const past = filtered.filter(e => new Date(e.startsAt) < now);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Toolbar searchPlaceholder="Buscar eventos..." onSearch={setQuery} className="flex-1" />
        <div className="flex items-center gap-1 border border-border rounded-lg p-1 bg-muted/30">
          <Button 
            variant={viewMode === "calendar" ? "secondary" : "ghost"} 
            size="sm" 
            onClick={() => setViewMode("calendar")}
            className="h-8 gap-2"
          >
            <LayoutGrid className="h-4 w-4" /> Calendario
          </Button>
          <Button 
            variant={viewMode === "list" ? "secondary" : "ghost"} 
            size="sm" 
            onClick={() => setViewMode("list")}
            className="h-8 gap-2"
          >
            <List className="h-4 w-4" /> Lista
          </Button>
        </div>
      </div>

      {viewMode === "calendar" ? (
        <Card className="p-4 border border-border bg-card shadow-sm overflow-hidden">
          <div className="h-[600px] os-calendar">
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: "100%" }}
              culture="es"
              messages={{
                next: "Sig",
                previous: "Ant",
                today: "Hoy",
                month: "Mes",
                week: "Semana",
                day: "D\u00eda",
                agenda: "Agenda",
                date: "Fecha",
                time: "Hora",
                event: "Evento",
                noEventsInRange: "No hay eventos en este rango",
                showMore: (total) => `+ Ver ${total} m\u00e1s`,
              }}
              view={currentView}
              onView={(v) => setCurrentView(v)}
              date={date}
              onNavigate={(d) => setDate(d)}
              onSelectEvent={(e) => setSelectedEvent(e.resource)}
              eventPropGetter={() => ({
                className: "bg-primary text-primary-foreground border-none rounded-md px-2 py-0.5 text-xs font-medium",
                style: { backgroundColor: "var(--primary)" }
              })}
            />
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-medium mb-3">Pr\u00f3ximos ({upcoming.length})</h2>
            <div className="space-y-2">
              {upcoming.map(e => (
                <div key={e.id} onClick={() => setSelectedEvent(e)} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:bg-accent/30 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-sm font-bold">{new Date(e.startsAt).getDate()}</div>
                    <div><p className="font-medium text-sm">{e.title}</p><p className="text-xs text-muted-foreground">{formatDateTime(e.startsAt)} - {formatDateTime(e.endsAt)}</p></div>
                  </div>
                  {e.meetLink && <Button variant="ghost" size="sm" onClick={(ev) => { ev.stopPropagation(); window.open(e.meetLink!, "_blank", "noreferrer"); }} className="h-8 w-8 p-0"><Video className="h-4 w-4" /></Button>}
                </div>
              ))}
              {upcoming.length === 0 && <p className="text-sm text-muted-foreground py-4">Sin eventos pr\u00f3ximos.</p>}
            </div>
          </div>
          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-medium mb-3 text-muted-foreground">Pasados ({past.length})</h2>
              <div className="space-y-1 opacity-60">
                {past.map(e => (
                  <div key={e.id} onClick={() => setSelectedEvent(e)} className="flex justify-between rounded-lg border border-border/50 p-3 text-sm cursor-pointer hover:bg-accent/10 transition-colors">
                    <span>{e.title}</span>
                    <span className="text-xs text-muted-foreground">{formatDateTime(e.startsAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Sheet open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <SheetContent>
          {selectedEvent && (
            <>
              <SheetHeader>
                <SheetTitle className="text-xl">{selectedEvent.title}</SheetTitle>
                <SheetDescription>
                  {formatDateTime(selectedEvent.startsAt)} - {formatDateTime(selectedEvent.endsAt)}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {selectedEvent.description && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Descripci\u00f3n</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{selectedEvent.description}</p>
                  </div>
                )}
                
                {selectedEvent.meetLink && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Videollamada</p>
                    <a 
                      href={selectedEvent.meetLink} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-green-600 hover:bg-green-500/20 transition-colors"
                    >
                      <Video className="h-5 w-5" />
                      <span className="font-semibold text-sm underline underline-offset-4">Unirse a Google Meet</span>
                    </a>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
