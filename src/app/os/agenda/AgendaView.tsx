"use client";
import { useState, useMemo } from "react";
import { Toolbar } from "@/components/os/layout/Toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { Calendar as CalendarIcon, Video, LayoutGrid, List, RefreshCwIcon, ClockIcon } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { Calendar, dateFnsLocalizer, View, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, startOfWeek as startOfWeekFns, endOfWeek, startOfDay, endOfDay, subMonths, addMonths } from "date-fns";
import { es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { expandRecurringEvents } from "@/lib/agenda/recurrence";

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

type AgendaEvent = { id: string; title: string; description: string | null; startsAt: Date; endsAt: Date; meetLink: string | null; recurrenceRule?: string; timezone?: string; externalProvider?: string | null };

export function AgendaView({ events }: { events: AgendaEvent[] }) {
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [currentView, setCurrentView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);

  const { start: rangeStart, end: rangeEnd } = useMemo(() => {
    if (viewMode === "list") {
      return { start: subMonths(new Date(), 1), end: addMonths(new Date(), 12) };
    }
    switch (currentView) {
      case Views.MONTH:
        return { start: startOfMonth(date), end: endOfMonth(date) };
      case Views.WEEK:
        return { start: startOfWeekFns(date, { weekStartsOn: 1 }), end: endOfWeek(date, { weekStartsOn: 1 }) };
      case Views.DAY:
        return { start: startOfDay(date), end: endOfDay(date) };
      default:
        return { start: subMonths(date, 1), end: addMonths(date, 1) };
    }
  }, [viewMode, currentView, date]);

  const expanded = useMemo(
    () => expandRecurringEvents(events, rangeStart, rangeEnd),
    [events, rangeStart, rangeEnd]
  );

  const filtered = expanded.filter(e => !query || e.title.toLowerCase().includes(query.toLowerCase()));

  const calendarEvents = filtered.map(e => ({
    id: e.id,
    title: e.title,
    start: new Date(e.startsAt),
    end: new Date(e.endsAt),
    resource: e,
  }));

  if (events.length === 0 && !expanded.some(e => e.isRecurrence)) {
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
              eventPropGetter={(event: any) => {
                const isExternal = event.resource.externalProvider;
                return {
                  className: `border-none rounded-md px-2 py-0.5 text-xs font-medium ${isExternal ? 'bg-blue-500/20 text-blue-600' : 'bg-primary text-primary-foreground'}`,
                  style: isExternal ? undefined : { backgroundColor: "var(--color-primary)" }
                };
              }}
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
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{e.title}</p>
                        {e.externalProvider === "google" && <span className="text-[10px] uppercase font-bold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded">Google</span>}
                        {e.recurrenceRule && e.recurrenceRule !== 'none' && <span title="Recurrente"><RefreshCwIcon className="h-3 w-3 text-muted-foreground" /></span>}
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDateTime(e.startsAt)} - {formatDateTime(e.endsAt)}</p>
                    </div>
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
                    <div className="flex items-center gap-2">
                      <span>{e.title}</span>
                      {e.externalProvider === "google" && <span className="text-[10px] uppercase font-bold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded">Google</span>}
                    </div>
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
                <div className="flex items-center gap-2 mb-2">
                  {selectedEvent.externalProvider === "google" && <Badge variant="neutral" className="bg-blue-500/10 text-blue-500 border-none">Google Calendar</Badge>}
                  {selectedEvent.recurrenceRule && selectedEvent.recurrenceRule !== 'none' && (
                    <Badge variant="neutral" className="flex items-center gap-1">
                      <RefreshCwIcon className="h-3 w-3" /> {selectedEvent.recurrenceRule}
                    </Badge>
                  )}
                </div>
                <SheetTitle className="text-xl">{selectedEvent.title}</SheetTitle>
                <SheetDescription>
                  {formatDateTime(selectedEvent.startsAt)} - {formatDateTime(selectedEvent.endsAt)}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
                  <ClockIcon className="h-4 w-4" />
                  <span>Zona horaria: {selectedEvent.timezone || "America/Bogota"}</span>
                </div>
                
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
