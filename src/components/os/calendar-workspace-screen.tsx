"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Clock3, MapPin, Plus, Users, Video, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

import {
  EmptyWorkspacePanel,
  ErrorWorkspacePanel,
  LoadingWorkspacePanel,
  formatDate,
  formatDateTime,
  formatNumber,
} from "@/components/os/workspace-ui";
import { useWorkspaceSnapshot } from "@/lib/ops/use-workspace-snapshot";
import type { WorkspaceEventRecord } from "@/lib/ops/workspace-service";
import type { UIStore } from "@/lib/store/ui";

type CalendarWorkspaceScreenProps = {
  open: UIStore["open"];
};

type EventGroup = {
  label: string;
  dateKey: string;
  events: WorkspaceEventRecord[];
};

export default function CalendarWorkspaceScreen({ open }: CalendarWorkspaceScreenProps) {
  const { snapshot, loading, error, refresh } = useWorkspaceSnapshot();
  const [viewMode, setViewMode] = useState<"list" | "month" | "week" | "day">("list");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventFormData, setEventFormData] = useState({ title: "", startsAt: "", endsAt: "", clientSlug: "", kind: "meeting", location: "", meetUrl: "" });
  const [savingEvent, setSavingEvent] = useState(false);

  const openEventForm = (date?: Date) => {
    const base = date || new Date();
    const start = new Date(base);
    start.setHours(9, 0, 0, 0);
    const end = new Date(base);
    end.setHours(10, 0, 0, 0);
    setEventFormData({
      title: "",
      startsAt: start.toISOString().slice(0, 16),
      endsAt: end.toISOString().slice(0, 16),
      clientSlug: "",
      kind: "meeting",
      location: "",
      meetUrl: "",
    });
    setShowEventForm(true);
  };

  const sortedEvents = [...snapshot.events].sort(
    (left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
  );
  const upcomingEvents = sortedEvents.slice(0, 4);
  const groupedEvents = useMemo<EventGroup[]>(() => groupEventsByDate(sortedEvents), [sortedEvents]);
  const nextWindow = buildNextWindow(sortedEvents);

  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const monthEvents = sortedEvents.filter((event) => {
    const eventDate = new Date(event.startsAt);
    return eventDate >= monthStart && eventDate <= monthEnd;
  });

  if (loading) {
    return <LoadingWorkspacePanel label="Cargando agenda operativa real..." />;
  }

  if (error) {
    return <ErrorWorkspacePanel message={error} onRetry={refresh} />;
  }

  if (snapshot.events.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyWorkspacePanel
          title="No hay eventos reales en la agenda"
          description="Crea reuniones, follow-ups o sesiones internas para activar el calendario operativo sincronizado."
        />
        <div className="flex gap-3">
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" onClick={() => open("createEvent")}>
            Crear evento
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Agenda</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {formatNumber(snapshot.events.length)} eventos sincronizados en el calendario operativo del workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-secondary p-1">
            <button
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary/80"}`}
              onClick={() => setViewMode("list")}
            >
              Lista
            </button>
            <button
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "month" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary/80"}`}
              onClick={() => setViewMode("month")}
            >
              Mes
            </button>
            <button
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "week" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary/80"}`}
              onClick={() => setViewMode("week")}
            >
              Semana
            </button>
            <button
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "day" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary/80"}`}
              onClick={() => setViewMode("day")}
            >
              Día
            </button>
          </div>
          <button className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80" onClick={refresh}>
            Actualizar
          </button>
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_0_15px_rgba(0,255,135,0.2)] transition-all hover:shadow-[0_0_25px_rgba(0,255,135,0.35)]" onClick={() => open("createEvent")}>
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nuevo evento
            </span>
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Eventos próximos" value={String(snapshot.summary.upcomingEvents)} subtitle={upcomingEvents[0] ? upcomingEvents[0].title : "Sin eventos"} icon={CalendarDays} />
        <MetricCard title="Esta semana" value={String(nextWindow.thisWeek)} subtitle="Eventos en los próximos 7 días" icon={Clock3} />
        <MetricCard title="Con cliente" value={String(sortedEvents.filter((event) => Boolean(event.clientId)).length)} subtitle="Sesiones vinculadas a cuentas" icon={Users} />
        <MetricCard title="Con videollamada" value={String(sortedEvents.filter((event) => Boolean(event.meetUrl)).length)} subtitle="Eventos listos para acceso remoto" icon={Video} />
      </div>

      {viewMode === "month" ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                className="rounded-lg border border-border bg-secondary p-2 text-foreground transition-colors hover:bg-secondary/80"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h2 className="text-lg font-semibold text-foreground">
                {new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric" }).format(currentDate)}
              </h2>
              <button
                className="rounded-lg border border-border bg-secondary p-2 text-foreground transition-colors hover:bg-secondary/80"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <button
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setCurrentDate(new Date())}
            >
              Hoy
            </button>
          </div>
          <CalendarMonthView
            currentDate={currentDate}
            events={monthEvents}
            onEventClick={(eventId) => open("eventDetail", eventId)}
            onDateClick={(date) => openEventForm(date)}
          />
        </div>
      ) : viewMode === "week" ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                className="rounded-lg border border-border bg-secondary p-2 text-foreground transition-colors hover:bg-secondary/80"
                onClick={() => {
                  const d = new Date(currentDate);
                  d.setDate(d.getDate() - 7);
                  setCurrentDate(d);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h2 className="text-lg font-semibold text-foreground">
                Semana del {currentDate.toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
              </h2>
              <button
                className="rounded-lg border border-border bg-secondary p-2 text-foreground transition-colors hover:bg-secondary/80"
                onClick={() => {
                  const d = new Date(currentDate);
                  d.setDate(d.getDate() + 7);
                  setCurrentDate(d);
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <button
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setCurrentDate(new Date())}
            >
              Hoy
            </button>
          </div>
          <CalendarWeekView
            currentDate={currentDate}
            events={sortedEvents}
            onEventClick={(eventId) => open("eventDetail", eventId)}
            onDateClick={(date) => openEventForm(date)}
          />
        </div>
      ) : viewMode === "day" ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                className="rounded-lg border border-border bg-secondary p-2 text-foreground transition-colors hover:bg-secondary/80"
                onClick={() => {
                  const d = new Date(currentDate);
                  d.setDate(d.getDate() - 1);
                  setCurrentDate(d);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h2 className="text-lg font-semibold text-foreground">
                {new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(currentDate)}
              </h2>
              <button
                className="rounded-lg border border-border bg-secondary p-2 text-foreground transition-colors hover:bg-secondary/80"
                onClick={() => {
                  const d = new Date(currentDate);
                  d.setDate(d.getDate() + 1);
                  setCurrentDate(d);
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <button
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setCurrentDate(new Date())}
            >
              Hoy
            </button>
          </div>
          <CalendarDayView
            currentDate={currentDate}
            events={sortedEvents}
            onEventClick={(eventId) => open("eventDetail", eventId)}
            onDateClick={() => openEventForm(currentDate)}
          />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <section className="rounded-2xl border border-border bg-card">
              <div className="border-b border-border px-5 py-4">
                <h2 className="text-lg font-semibold text-foreground">Próximos hitos</h2>
              </div>
              <div className="space-y-3 p-4">
                {upcomingEvents.map((event) => (
                  <button key={event.id} className="w-full rounded-xl border border-border/60 bg-secondary/20 p-4 text-left transition-colors hover:border-primary/30 hover:bg-primary/5" onClick={() => open("eventDetail", event.id)}>
                    <p className="text-sm font-semibold text-foreground">{event.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(event.startsAt)}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card">
              <div className="border-b border-border px-5 py-4">
                <h2 className="text-lg font-semibold text-foreground">Resumen</h2>
              </div>
              <div className="space-y-2 p-4">
                <RadarItem label="Hoy" value={nextWindow.today} />
                <RadarItem label="Mañana" value={nextWindow.tomorrow} />
                <RadarItem label="Esta semana" value={nextWindow.thisWeek} />
              </div>
            </section>
          </aside>

          <section className="rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-lg font-semibold text-foreground">Agenda completa</h2>
            </div>
            <div className="divide-y divide-border/50">
              {groupedEvents.length > 0 ? (
                groupedEvents.map((group) => (
                  <div key={group.dateKey} className="p-5">
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">{group.label}</h3>
                    <div className="space-y-3">
                      {group.events.map((event) => (
                        <button
                          key={event.id}
                          className="flex w-full items-start gap-4 rounded-xl border border-border/60 bg-secondary/20 p-4 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
                          onClick={() => open("eventDetail", event.id)}
                        >
                          <div className="rounded-lg border border-border bg-background p-2">
                            <CalendarDays className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-foreground">{event.title}</p>
                              <span className="text-xs text-muted-foreground">{formatEventWindow(event.startsAt, event.endsAt)}</span>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              {event.clientName ? (
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" /> {event.clientName}
                                </span>
                              ) : null}
                              {event.location ? (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" /> {event.location}
                                </span>
                              ) : null}
                              {event.meetUrl ? (
                                <span className="flex items-center gap-1 text-primary">
                                  <Video className="h-3 w-3" /> Videollamada
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">No hay eventos programados.</div>
              )}
            </div>
          </section>
        </div>
      )}

      {showEventForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground">Nuevo evento</h3>
            <p className="mt-1 text-sm text-muted-foreground">Agendar reunión o bloque de foco</p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Título</label>
                <input
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  value={eventFormData.title}
                  onChange={(e) => setEventFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Kickoff cliente"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Inicio</label>
                  <input
                    type="datetime-local"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                    value={eventFormData.startsAt}
                    onChange={(e) => setEventFormData((prev) => ({ ...prev, startsAt: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Fin</label>
                  <input
                    type="datetime-local"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                    value={eventFormData.endsAt}
                    onChange={(e) => setEventFormData((prev) => ({ ...prev, endsAt: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Cliente (slug)</label>
                <input
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  value={eventFormData.clientSlug}
                  onChange={(e) => setEventFormData((prev) => ({ ...prev, clientSlug: e.target.value }))}
                  placeholder="budaphone"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Ubicación</label>
                <input
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  value={eventFormData.location}
                  onChange={(e) => setEventFormData((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="Google Meet / oficina"
                />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
                onClick={() => setShowEventForm(false)}
              >
                Cancelar
              </button>
              <button
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                disabled={!eventFormData.title || !eventFormData.startsAt || !eventFormData.endsAt || savingEvent}
                onClick={async () => {
                  setSavingEvent(true);
                  try {
                    await requestWorkspaceMutation(
                      {
                        kind: "event",
                        payload: {
                          title: eventFormData.title,
                          clientSlug: eventFormData.clientSlug || undefined,
                          kind: eventFormData.kind,
                          location: eventFormData.location || undefined,
                          meetUrl: eventFormData.meetUrl || undefined,
                          startsAt: eventFormData.startsAt,
                          endsAt: eventFormData.endsAt,
                        },
                      },
                      "Error al crear evento"
                    );
                    setShowEventForm(false);
                    refresh();
                  } catch {
                    // handled
                  } finally {
                    setSavingEvent(false);
                  }
                }}
              >
                {savingEvent ? "Guardando..." : "Guardar evento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

async function requestWorkspaceMutation(body: Record<string, unknown>, fallbackMessage: string) {
  const response = await fetch("/api/admin/workspace", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error ?? fallbackMessage);
  }
  return payload;
}

function CalendarMonthView({
  currentDate,
  events,
  onEventClick,
  onDateClick,
}: {
  currentDate: Date;
  events: WorkspaceEventRecord[];
  onEventClick: (eventId: string) => void;
  onDateClick: (date: Date) => void;
}) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = [];

  for (let i = 0; i < startOffset; i++) {
    currentWeek.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(new Date(year, month, day));
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  const today = new Date();
  const isToday = (date: Date) =>
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const getEventsForDate = (date: Date) => {
    const dateKey = date.toISOString().slice(0, 10);
    return events.filter((event) => event.startsAt.slice(0, 10) === dateKey);
  };

  const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map((day) => (
          <div key={day} className="p-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {weeks.flat().map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="min-h-[100px] border-b border-r border-border/30 bg-secondary/10" />;
          }

          const dayEvents = getEventsForDate(date);
          const isCurrentDay = isToday(date);

          return (
            <div
              key={date.toISOString()}
              className={`min-h-[100px] border-b border-r border-border/30 p-2 transition-colors hover:bg-secondary/20 cursor-pointer ${
                isCurrentDay ? "bg-primary/5" : ""
              }`}
              onClick={() => onDateClick(date)}
            >
              <div className={`mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium ${
                isCurrentDay ? "bg-primary text-primary-foreground" : "text-foreground"
              }`}>
                {date.getDate()}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <button
                    key={event.id}
                    className="w-full truncate rounded bg-primary/20 px-1.5 py-0.5 text-left text-[10px] text-primary transition-colors hover:bg-primary/30"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event.id);
                    }}
                  >
                    {event.title}
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-muted-foreground">+{dayEvents.length - 3} más</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CalendarWeekView({
  currentDate,
  events,
  onEventClick,
  onDateClick,
}: {
  currentDate: Date;
  events: WorkspaceEventRecord[];
  onEventClick: (eventId: string) => void;
  onDateClick: (date: Date) => void;
}) {
  const startOfWeek = new Date(currentDate);
  const dayOfWeek = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
  const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const fullWeekDays = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const today = new Date();

  const isToday = (date: Date) =>
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const getEventsForDate = (date: Date) => {
    const dateKey = date.toISOString().slice(0, 10);
    return events.filter((event) => event.startsAt.slice(0, 10) === dateKey);
  };

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map((day, i) => {
          const date = new Date(startOfWeek);
          date.setDate(date.getDate() + i);
          const isCurrentDay = isToday(date);
          return (
            <div key={day} className={`p-3 text-center ${isCurrentDay ? "bg-primary/5" : ""}`}>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{day}</div>
              <div className={`mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${isCurrentDay ? "bg-primary text-primary-foreground" : "text-foreground"}`}>
                {date.getDate()}
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: 7 }, (_, i) => {
          const date = new Date(startOfWeek);
          date.setDate(date.getDate() + i);
          const dayEvents = getEventsForDate(date);
          return (
            <div
              key={i}
              className="min-h-[200px] border-r border-border/30 p-2 transition-colors hover:bg-secondary/10 cursor-pointer"
              onClick={() => onDateClick(date)}
            >
              <div className="space-y-1">
                {dayEvents.map((event) => (
                  <button
                    key={event.id}
                    className="w-full truncate rounded bg-primary/20 px-2 py-1 text-left text-xs text-primary transition-colors hover:bg-primary/30"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event.id);
                    }}
                  >
                    {formatEventWindow(event.startsAt, event.endsAt)} {event.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CalendarDayView({
  currentDate,
  events,
  onEventClick,
  onDateClick,
}: {
  currentDate: Date;
  events: WorkspaceEventRecord[];
  onEventClick: (eventId: string) => void;
  onDateClick: () => void;
}) {
  const dayEvents = events.filter((event) => {
    const eventDate = new Date(event.startsAt);
    return (
      eventDate.getDate() === currentDate.getDate() &&
      eventDate.getMonth() === currentDate.getMonth() &&
      eventDate.getFullYear() === currentDate.getFullYear()
    );
  });

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="border-b border-border px-6 py-4">
        <p className="text-sm text-muted-foreground">
          {dayEvents.length} evento(s) programado(s)
        </p>
      </div>
      <div className="divide-y divide-border/50">
        {dayEvents.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Sin eventos. Haz clic para crear uno.
          </div>
        ) : (
          dayEvents.map((event) => (
            <button
              key={event.id}
              className="flex w-full items-start gap-4 p-5 text-left transition-colors hover:bg-secondary/10"
              onClick={() => onEventClick(event.id)}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-medium text-primary">
                  {new Intl.DateTimeFormat("es-CO", { hour: "numeric", minute: "2-digit" }).format(new Date(event.startsAt))}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat("es-CO", { hour: "numeric", minute: "2-digit" }).format(new Date(event.endsAt))}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{event.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{event.description}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {event.clientName && <span className="rounded bg-secondary/50 px-2 py-0.5">{event.clientName}</span>}
                  {event.location && <span className="rounded bg-secondary/50 px-2 py-0.5">{event.location}</span>}
                  {event.meetUrl && <span className="rounded bg-primary/20 px-2 py-0.5 text-primary">Videollamada</span>}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
      <div className="border-t border-border px-6 py-4">
        <button
          className="w-full rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary/80"
          onClick={onDateClick}
        >
          + Nuevo evento
        </button>
      </div>
    </div>
  );
}

function groupEventsByDate(events: WorkspaceEventRecord[]) {
  const groups = new Map<string, WorkspaceEventRecord[]>();

  for (const event of events) {
    const dateKey = new Date(event.startsAt).toISOString().slice(0, 10);
    const existing = groups.get(dateKey) ?? [];
    existing.push(event);
    groups.set(dateKey, existing);
  }

  return Array.from(groups.entries()).map(([dateKey, grouped]) => ({
    dateKey,
    label: formatDate(grouped[0]?.startsAt ?? dateKey),
    events: grouped,
  }));
}

function buildNextWindow(events: WorkspaceEventRecord[]) {
  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowKey = tomorrow.toISOString().slice(0, 10);
  const limit = new Date(now);
  limit.setDate(now.getDate() + 7);

  let today = 0;
  let tomorrowCount = 0;
  let thisWeek = 0;

  for (const event of events) {
    const eventDate = new Date(event.startsAt);
    const dateKey = eventDate.toISOString().slice(0, 10);

    if (dateKey === todayKey) {
      today += 1;
    }

    if (dateKey === tomorrowKey) {
      tomorrowCount += 1;
    }

    if (eventDate <= limit) {
      thisWeek += 1;
    }
  }

  return {
    today,
    tomorrow: tomorrowCount,
    thisWeek,
  };
}

function formatEventWindow(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Horario pendiente";
  }

  const startLabel = new Intl.DateTimeFormat("es-CO", {
    hour: "numeric",
    minute: "2-digit",
  }).format(start);
  const endLabel = new Intl.DateTimeFormat("es-CO", {
    hour: "numeric",
    minute: "2-digit",
  }).format(end);

  return `${startLabel} - ${endLabel}`;
}

function MetricCard({ title, value, subtitle, icon: Icon }: { title: string; value: string; subtitle: string; icon: typeof CalendarDays }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</h3>
        </div>
        <div className="rounded-xl bg-secondary/60 p-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function RadarItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-secondary/20 px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-base font-semibold text-foreground">{value}</span>
    </div>
  );
}
