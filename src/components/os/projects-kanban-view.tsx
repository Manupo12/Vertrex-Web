"use client";

import { useMemo, useState } from "react";
import { FolderKanban, Plus } from "lucide-react";
import { useWorkspaceSnapshot } from "@/lib/ops/use-workspace-snapshot";
import { updateTaskStatus } from "@/lib/projects/task-service";
import type { WorkspaceTaskRecord } from "@/lib/ops/workspace-service";
import type { WorkspaceTaskStatusValue } from "@/lib/ops/status-catalog";
import type { UIStore } from "@/lib/store/ui";
import {
  EmptyWorkspacePanel,
  ErrorWorkspacePanel,
  LoadingWorkspacePanel,
} from "@/components/os/workspace-ui";

const columns = [
  { id: "todo", title: "Todo", subtitle: "Backlog" },
  { id: "in_progress", title: "In Progress", subtitle: "Trabajo activo" },
  { id: "review", title: "In Review", subtitle: "Validación" },
  { id: "blocked", title: "Blocked", subtitle: "Esperando" },
  { id: "done", title: "Done", subtitle: "Completado" },
];

function normalizeStatus(status: string) {
  const s = status.toLowerCase().replace(/\s+/g, "_");
  if (["todo", "backlog", "pending"].includes(s)) return "todo";
  if (["in_progress", "active", "doing"].includes(s)) return "in_progress";
  if (["review", "qa", "testing"].includes(s)) return "review";
  if (["blocked", "hold", "waiting"].includes(s)) return "blocked";
  if (["done", "completed", "closed"].includes(s)) return "done";
  return "todo";
}

export default function ProjectsKanbanView({ open }: { open: UIStore["open"] }) {
  const { snapshot, loading, error, refresh } = useWorkspaceSnapshot();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const grouped = useMemo(() => {
    const map: Record<string, WorkspaceTaskRecord[]> = {};
    for (const c of columns) map[c.id] = [];
    for (const task of snapshot?.tasks ?? []) {
      const key = normalizeStatus(task.status);
      map[key]?.push(task);
    }
    return map;
  }, [snapshot?.tasks]);

  const handleDragStart = (taskId: string) => setDraggingId(taskId);
  const handleDragEnd = () => {
    setDraggingId(null);
    setDropTarget(null);
  };
  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDropTarget(colId);
  };
  const handleDrop = async (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    setIsUpdating(true);
    try {
      await updateTaskStatus(id, colId as WorkspaceTaskStatusValue);
      await refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
      setDraggingId(null);
      setDropTarget(null);
    }
  };

  if (loading) return <LoadingWorkspacePanel label="Cargando tablero..." />;
  if (error) return <ErrorWorkspacePanel message={error} onRetry={refresh} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <FolderKanban className="h-5 w-5 text-primary" />
          Tablero Kanban
        </h2>
        <button
          onClick={() => open("createDeal")}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nuevo
        </button>
      </div>

      {snapshot?.tasks?.length === 0 ? (
        <EmptyWorkspacePanel
          title="Sin tareas"
          description="Arrastra o crea tareas para visualizarlas en el tablero."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {columns.map((col) => (
            <div
              key={col.id}
              className={`flex flex-col gap-3 rounded-xl border p-3 transition-colors ${
                dropTarget === col.id ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
                  <p className="text-xs text-muted-foreground">{col.subtitle}</p>
                </div>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                  {grouped[col.id]?.length ?? 0}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {(grouped[col.id] ?? []).map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", task.id);
                      handleDragStart(task.id);
                    }}
                    onDragEnd={handleDragEnd}
                    onClick={() => open("taskDetail", task.id)}
                    className={`cursor-pointer rounded-lg border border-border bg-background p-3 text-sm shadow-sm transition hover:border-primary/50 ${
                      draggingId === task.id ? "opacity-50" : "opacity-100"
                    } ${isUpdating ? "pointer-events-none opacity-60" : ""}`}
                  >
                    <p className="font-medium text-foreground">{task.title}</p>
                    {task.projectName && (
                      <p className="mt-1 text-xs text-muted-foreground">{task.projectName}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
