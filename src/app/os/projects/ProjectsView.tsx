"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toolbar } from "@/components/os/layout/Toolbar";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProgressBar } from "@/components/os/data/ProgressBar";
import { EmptyState } from "@/components/ui/empty-state";
import { FolderKanban, AlertTriangle } from "lucide-react";
import { formatShortDate } from "@/lib/format";

interface ProjectsViewProps {
  projects: Array<{ id: string; name: string; status: string; progress: number; currentVersion: string | null; referenceLinks: unknown; createdAt: Date; hasPaidAdvance: boolean }>;
}

export function ProjectsView({ projects }: ProjectsViewProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  if (projects.length === 0) {
    return <EmptyState icon={FolderKanban} title="No hay proyectos activos" description="Convierte una idea o crea un proyecto manual." actionLabel="Crear proyecto" onAction={() => router.push("/os/projects/new")} />;
  }

  const filtered = projects.filter(p => {
    if (statusFilter && p.status !== statusFilter) return false;
    if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const columns: Record<string, typeof filtered> = {};
  (statusFilter ? [statusFilter] : ["active", "paused", "completed", "cancelled"]).forEach(s => { columns[s] = filtered.filter(p => p.status === s); });

  return (
    <div>
      <Toolbar searchPlaceholder="Buscar proyectos..." onSearch={setQuery} resultCount={filtered.length} filters={
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Todos</option><option value="active">Activos</option><option value="paused">Pausados</option><option value="completed">Completados</option><option value="cancelled">Cancelados</option>
        </select>
      } />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {Object.entries(columns).map(([status, items]) => (
          <div key={status} className="rounded-xl border border-border bg-card/50 p-3">
            <div className="mb-3 flex items-center justify-between"><StatusBadge category="project" status={status} /><span className="text-xs text-muted-foreground">{items.length}</span></div>
            <div className="space-y-2">
              {items.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">Vac&iacute;o</p>}
              {items.map(p => (
                <div key={p.id} onClick={() => router.push(`/os/projects/${p.id}`)} className="cursor-pointer rounded-lg border border-border bg-card p-3 hover:bg-accent/30 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-medium text-sm text-foreground">{p.name}</p>
                    {!p.hasPaidAdvance && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{p.currentVersion}</p>
                  <ProgressBar value={p.progress} size="sm" className="mb-1" />
                  <p className="text-[10px] text-muted-foreground text-right">{p.progress}%</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
