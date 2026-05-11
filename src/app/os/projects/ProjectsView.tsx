"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toolbar } from "@/components/os/layout/Toolbar";
import { ProgressBar } from "@/components/os/data/ProgressBar";
import { EmptyState } from "@/components/ui/empty-state";
import { FolderKanban, AlertTriangle } from "lucide-react";
import { updateProjectAction } from "@/lib/db/actions/projects";
import { KanbanBoard } from "@/components/os/data/KanbanBoard";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProjectsViewProps {
  projects: Array<{ id: string; name: string; status: string; progress: number; currentVersion: string | null; referenceLinks: unknown; createdAt: Date; hasPaidAdvance: boolean; clientName: string | null }>;
}

const PROJECT_COLUMNS = [
  { id: "active", label: "Activos" },
  { id: "paused", label: "Pausados" },
  { id: "completed", label: "Completados" },
  { id: "cancelled", label: "Cancelados" },
];

export function ProjectsView({ projects }: ProjectsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const statusFilter = searchParams.get("status") || "";

  const setStatusFilter = (newStatus: string) => {
    const params = new URLSearchParams(searchParams);
    if (newStatus) params.set("status", newStatus);
    else params.delete("status");
    router.push(`/os/projects?${params.toString()}`);
  };

  if (projects.length === 0 && !statusFilter && !query) {
    return <EmptyState icon={FolderKanban} title="No hay proyectos activos" description="Convierte una idea o crea un proyecto manual." actionLabel="Crear proyecto" onAction={() => router.push("/os/projects/new")} />;
  }

  const filtered = projects.filter(p => {
    if (statusFilter && p.status !== statusFilter) return false;
    if (query && !p.name.toLowerCase().includes(query.toLowerCase()) && !p.clientName?.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const kanbanItems = filtered.map(p => ({
    ...p,
    id: p.id,
    status: p.status
  }));

  const handleItemMove = async (itemId: string, newStatus: string) => {
    try {
      await updateProjectAction(itemId, { status: newStatus });
      toast.success("Estado actualizado");
      router.refresh();
    } catch {
      toast.error("Error al actualizar");
      throw new Error("Update failed");
    }
  };

  const renderProjectCard = (p: { id: string; name: string; progress: number; currentVersion: string | null; hasPaidAdvance: boolean; clientName: string | null; status: string }) => (
    <div 
      onClick={() => router.push(`/os/projects/${p.id}`)} 
      className="cursor-pointer rounded-lg border border-border bg-card p-3 hover:bg-accent/30 transition-colors shadow-sm"
    >
      <div className="flex justify-between items-start mb-1">
        <div>
          <p className="font-medium text-sm text-foreground">{p.name}</p>
          {p.clientName && <p className="text-[10px] text-primary font-medium">{p.clientName}</p>}
        </div>
        {!p.hasPaidAdvance && <AlertTriangle className="h-4 w-4 text-red-500" />}
      </div>
      <p className="text-xs text-muted-foreground mb-2">{p.currentVersion}</p>
      <ProgressBar value={p.progress} size="sm" className="mb-1" />
      <p className="text-[10px] text-muted-foreground text-right">{p.progress}%</p>
    </div>
  );

  return (
    <div>
      <Toolbar searchPlaceholder="Buscar proyectos..." onSearch={setQuery} resultCount={filtered.length} filters={
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="paused">Pausados</SelectItem>
            <SelectItem value="completed">Completados</SelectItem>
            <SelectItem value="cancelled">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      } />

      <KanbanBoard 
        items={kanbanItems} 
        columns={statusFilter && statusFilter !== "all" ? PROJECT_COLUMNS.filter(c => c.id === statusFilter) : PROJECT_COLUMNS}
        renderItem={renderProjectCard}
        onItemMove={handleItemMove}
      />
    </div>
  );
}
