"use client";

import { useState } from "react";
import { LifeBuoy, Plus, Clock, AlertCircle, CheckCircle2 } from "lucide-react";

import {
  EmptyWorkspacePanel,
  ErrorWorkspacePanel,
  LoadingWorkspacePanel,
  formatDateTime,
} from "@/components/os/workspace-ui";
import { useWorkspaceSnapshot } from "@/lib/ops/use-workspace-snapshot";
import { updateTicketStatus } from "@/lib/tickets/ticket-service";
import type { UIStore } from "@/lib/store/ui";
import type { WorkspaceTicketRecord } from "@/lib/ops/workspace-service";

type TicketsWorkspaceScreenProps = {
  open: UIStore["open"];
};

const ticketStatuses = [
  { id: "open", title: "Abiertos", icon: LifeBuoy, color: "text-blue-400" },
  { id: "in_progress", title: "En Progreso", icon: Clock, color: "text-amber-400" },
  { id: "waiting", title: "En Espera", icon: AlertCircle, color: "text-orange-400" },
  { id: "resolved", title: "Resueltos", icon: CheckCircle2, color: "text-emerald-400" },
  { id: "closed", title: "Cerrados", icon: CheckCircle2, color: "text-muted-foreground" },
];

export default function TicketsWorkspaceScreen({ open }: TicketsWorkspaceScreenProps) {
  const { snapshot, loading, error, refresh } = useWorkspaceSnapshot();
  const [draggingTicketId, setDraggingTicketId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const handleDragStart = (ticketId: string) => {
    setDraggingTicketId(ticketId);
  };

  const handleDragEnd = () => {
    setDraggingTicketId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const ticketId = e.dataTransfer.getData("text/plain");
    if (ticketId) {
      try {
        await updateTicketStatus(ticketId, newStatus as "open" | "in_progress" | "resolved" | "closed");
        await refresh();
      } catch (err) {
        console.error("Error updating ticket status:", err);
      }
    }
    setDragOverColumn(null);
    setDraggingTicketId(null);
  };

  if (loading) {
    return <LoadingWorkspacePanel label="Cargando tickets..." />;
  }

  if (error) {
    return <ErrorWorkspacePanel message={error} onRetry={refresh} />;
  }

  if (snapshot.tickets.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyWorkspacePanel
          title="No hay tickets"
          description="Crea tickets de soporte para dar seguimiento a incidencias y solicitudes."
        />
        <div className="flex gap-3">
          <button
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            onClick={() => open("createTicket")}
          >
            <Plus className="mr-2 inline h-4 w-4" />
            Crear ticket
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Tickets de Soporte</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {snapshot.tickets.length} tickets activos en el sistema.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
            onClick={refresh}
          >
            Actualizar
          </button>
          <button
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_0_15px_rgba(0,255,135,0.2)] transition-all hover:shadow-[0_0_25px_rgba(0,255,135,0.35)]"
            onClick={() => open("createTicket")}
          >
            <Plus className="h-4 w-4" /> Nuevo ticket
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {ticketStatuses.map((status) => {
          const columnTickets = snapshot.tickets.filter((t) => t.status === status.id);
          const Icon = status.icon;

          return (
            <div
              key={status.id}
              className={`rounded-xl border border-border bg-card transition-colors ${
                dragOverColumn === status.id ? "border-primary bg-primary/5" : ""
              }`}
              onDragOver={(e) => handleDragOver(e, status.id)}
              onDrop={(e) => handleDrop(e, status.id)}
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${status.color}`} />
                  <h3 className="text-sm font-semibold text-foreground">{status.title}</h3>
                </div>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                  {columnTickets.length}
                </span>
              </div>
              <div className="space-y-2 p-3">
                {columnTickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    isDragging={draggingTicketId === ticket.id}
                    onDragStart={() => handleDragStart(ticket.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => open("ticketDetail", ticket.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TicketCard({
  ticket,
  isDragging,
  onDragStart,
  onDragEnd,
  onClick,
}: {
  ticket: WorkspaceTicketRecord;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onClick: () => void;
}) {
  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case "high":
        return "text-destructive";
      case "medium":
        return "text-amber-400";
      case "low":
        return "text-muted-foreground";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", ticket.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`cursor-pointer rounded-lg border border-border/60 bg-secondary/20 p-3 transition-all hover:border-primary/30 hover:bg-primary/5 ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground line-clamp-2">{ticket.title}</p>
        {ticket.priority && (
          <span className={`text-xs ${getPriorityColor(ticket.priority)}`}>
            {ticket.priority === "high" ? "●" : ticket.priority === "medium" ? "◐" : "○"}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span>{ticket.requestTypeLabel}</span>
        {ticket.slaStatus !== "on_track" && (
          <span className={`rounded px-1 ${ticket.slaStatus === "at_risk" ? "bg-amber-500/20 text-amber-500" : "bg-destructive/20 text-destructive"}`}>
            {ticket.slaLabel}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{ticket.clientName ?? "Sin cliente"}</span>
        <span>{formatDateTime(ticket.updatedAt)}</span>
      </div>
      {ticket.assignedTo && (
        <div className="mt-2 text-xs text-primary">Asignado: {ticket.assignedTo}</div>
      )}
    </div>
  );
}
