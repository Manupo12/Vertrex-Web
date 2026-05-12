"use client";

import { useState } from "react";
import { BlockEditor } from "@/components/os/Editor/BlockEditor";
import { TaskStatePill } from "@/components/os/Tasks/TaskStatePill";
import { PriorityDot } from "@/components/os/Tasks/PriorityDot";
import { TaskAssigneeSelect } from "@/components/os/Tasks/TaskAssigneeSelect";
import { IdentifierChip } from "@/components/os/Tasks/IdentifierChip";
import { updateTaskAction, changeTaskStateAction, assignTaskAction, setTaskPriorityAction, createSubtaskAction, linkTaskBlocksAction, unlinkTaskBlocksAction } from "@/lib/db/actions/tasks";
import { TASK_TYPES } from "@/components/os/Tasks/TaskFilters";
import { formatShortDate } from "@/lib/format";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { FlagIcon, ChevronDownIcon, PlusIcon, X, Search } from "lucide-react";

const VALID_STATES = ["backlog", "todo", "in_progress", "in_review", "done", "cancelled"];

export function TaskDetailClient({
  task: initialTask, allUsers, project, subtasks: initialSubtasks,
  blockingWithLinks: initialBlockingWithLinks, blockedByWithLinks: initialBlockedByWithLinks,
  cycles, milestones, allProjectTasks = []
}: {
  task: any; allUsers: any[]; project: any;
  subtasks: any[]; blockingWithLinks: Array<{ task: any; linkId: string }>; blockedByWithLinks: Array<{ task: any; linkId: string }>;
  cycles?: any[]; milestones?: any[]; allProjectTasks?: Array<{ id: string; identifier: string; title: string }>;
}) {
  const [task, setTask] = useState(initialTask);
  const [subtasks, setSubtasks] = useState(initialSubtasks);
  const [blockingWithLinks, setBlockingWithLinks] = useState(initialBlockingWithLinks);
  const [blockedByWithLinks, setBlockedByWithLinks] = useState(initialBlockedByWithLinks);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [subtaskInput, setSubtaskInput] = useState("");
  const [isCreatingSubtask, setIsCreatingSubtask] = useState(false);
  const [showBlockSearch, setShowBlockSearch] = useState(false);
  const [blockSearchQuery, setBlockSearchQuery] = useState("");

  const handleTitleSave = async () => {
    if (!title.trim()) return;
    try {
      const updated = await updateTaskAction(task.id, { title });
      setTask({ ...task, title: updated.title });
      setIsEditingTitle(false);
      toast.success("Título actualizado");
    } catch {
      toast.error("Error al actualizar título");
    }
  };

  const handleDescriptionChange = async (content: any) => {
    try {
      await updateTaskAction(task.id, { descriptionJson: content });
    } catch {
      toast.error("Error al guardar descripción");
    }
  };

  const handleStateChange = async (state: string) => {
    try {
      await changeTaskStateAction(task.id, state);
      setTask({ ...task, state });
    } catch (e: any) {
      toast.error(e.message || "Error al cambiar estado");
    }
  };

  const handlePriorityChange = async (priority: number) => {
    try {
      await setTaskPriorityAction(task.id, priority);
      setTask({ ...task, priority });
    } catch {
      toast.error("Error al actualizar prioridad");
    }
  };

  const handleAssigneeChange = async (assigneeId: string | null) => {
    try {
      await assignTaskAction(task.id, assigneeId);
      setTask({ ...task, assigneeId });
    } catch {
      toast.error("Error al actualizar asignado");
    }
  };

  const handlePropertyChange = async (field: string, value: any) => {
    try {
      await updateTaskAction(task.id, { [field]: value });
      setTask({ ...task, [field]: value });
    } catch {
      toast.error("Error al actualizar");
    }
  };

  const handleCreateSubtask = async () => {
    if (!subtaskInput.trim()) return;
    setIsCreatingSubtask(true);
    try {
      const newSubtask = await createSubtaskAction(task.id, subtaskInput.trim());
      setSubtasks([...subtasks, newSubtask]);
      setSubtaskInput("");
      toast.success("Subtarea creada");
    } catch {
      toast.error("Error al crear subtarea");
    } finally {
      setIsCreatingSubtask(false);
    }
  };

  const handleAddBlock = async (targetTaskId: string) => {
    try {
      await linkTaskBlocksAction(task.id, targetTaskId);
      const found = allProjectTasks.find(t => t.id === targetTaskId);
      if (found) {
        setBlockingWithLinks([...blockingWithLinks, { task: { ...found, state: "todo" }, linkId: "" }]);
      }
      setShowBlockSearch(false);
      setBlockSearchQuery("");
      toast.success("Bloqueo añadido");
    } catch {
      toast.error("Error al añadir bloqueo");
    }
  };

  const handleRemoveBlock = async (linkId: string) => {
    try {
      await unlinkTaskBlocksAction(linkId);
      setBlockingWithLinks(blockingWithLinks.filter(b => b.linkId !== linkId));
      toast.success("Bloqueo eliminado");
    } catch {
      toast.error("Error al eliminar bloqueo");
    }
  };

  const handleRemoveBlockedBy = async (linkId: string) => {
    try {
      await unlinkTaskBlocksAction(linkId);
      setBlockedByWithLinks(blockedByWithLinks.filter(b => b.linkId !== linkId));
      toast.success("Bloqueo eliminado");
    } catch {
      toast.error("Error al eliminar bloqueo");
    }
  };

  const blockedTaskIds = new Set([
    ...blockingWithLinks.map(b => b.task.id),
    ...blockedByWithLinks.map(b => b.task.id),
    task.id,
  ]);

  const availableTasks = allProjectTasks.filter(t => !blockedTaskIds.has(t.id));

  const filteredAvailableTasks = blockSearchQuery
    ? availableTasks.filter(t =>
        t.title.toLowerCase().includes(blockSearchQuery.toLowerCase()) ||
        t.identifier.toLowerCase().includes(blockSearchQuery.toLowerCase())
      )
    : availableTasks;

  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[var(--color-border)]">
          <IdentifierChip identifier={task.identifier} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1">
                <TaskStatePill state={task.state} />
                <ChevronDownIcon className="h-3 w-3 text-[var(--color-muted-foreground)]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {VALID_STATES.map(s => (
                <DropdownMenuItem key={s} onClick={() => handleStateChange(s)}>
                  <TaskStatePill state={s} size="sm" />
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1">
                <PriorityDot priority={task.priority} showLabel />
                <ChevronDownIcon className="h-3 w-3 text-[var(--color-muted-foreground)]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-32">
              {[0, 4, 3, 2, 1].map(p => (
                <DropdownMenuItem key={p} onClick={() => handlePriorityChange(p)}>
                  <PriorityDot priority={p} showLabel />
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isEditingTitle ? (
          <input
            autoFocus
            type="text"
            className="w-full text-2xl font-bold bg-transparent border-b-2 border-[var(--color-primary)] outline-none mb-4"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTitleSave();
              if (e.key === "Escape") { setTitle(task.title); setIsEditingTitle(false); }
            }}
          />
        ) : (
          <h1
            className="text-2xl font-bold mb-4 cursor-pointer hover:text-[var(--color-primary)] transition-colors"
            onClick={() => setIsEditingTitle(true)}
          >
            {task.title}
          </h1>
        )}

        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg overflow-hidden">
          <BlockEditor
            initialContent={task.descriptionJson}
            onChange={handleDescriptionChange}
            editable={true}
          />
        </div>

        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Subtareas ({subtasks.length})</h3>
          {subtasks.length > 0 ? (
            <div className="space-y-2">
              {subtasks.map(st => (
                <div key={st.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[var(--color-muted)]/30 transition-colors">
                  <div className={`w-4 h-4 rounded border-2 flex-shrink-0 ${st.state === 'done' ? 'bg-green-500 border-green-500' : 'border-[var(--color-border)]'}`}>
                    {st.state === 'done' && <span className="text-white text-[8px] flex items-center justify-center">✓</span>}
                  </div>
                  <span className="text-sm font-mono text-[var(--color-muted-foreground)]">{st.identifier}</span>
                  <span className={`text-sm flex-1 ${st.state === 'done' ? 'line-through text-[var(--color-muted-foreground)]' : ''}`}>{st.title}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-muted-foreground)]">Sin subtareas.</p>
          )}
          <div className="flex items-center gap-2 mt-3">
            <input
              value={subtaskInput}
              onChange={e => setSubtaskInput(e.target.value)}
              placeholder="Añadir subtarea..."
              className="flex-1 text-sm bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-1.5"
              onKeyDown={e => e.key === 'Enter' && handleCreateSubtask()}
            />
            <button
              onClick={handleCreateSubtask}
              disabled={isCreatingSubtask || !subtaskInput.trim()}
              className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isCreatingSubtask ? "..." : "Añadir"}
            </button>
          </div>
        </div>

        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Bloqueos</h3>
            <button
              onClick={() => { setShowBlockSearch(true); setBlockSearchQuery(""); }}
              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <PlusIcon className="h-3 w-3" />
              Añadir bloqueo
            </button>
          </div>

          {blockingWithLinks.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase mb-2">Esta tarea bloquea</p>
              <div className="space-y-2">
                {blockingWithLinks.map(({ task: bt, linkId }) => (
                  <div key={bt.id} className="flex items-center gap-2 text-sm py-1.5 px-3 rounded-lg bg-red-500/5 border border-red-500/10">
                    <span className="font-mono text-[var(--color-muted-foreground)]">{bt.identifier}</span>
                    <span className="flex-1">{bt.title}</span>
                    <button
                      onClick={() => handleRemoveBlock(linkId)}
                      className="text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)] transition-colors"
                      title="Quitar bloqueo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {blockedByWithLinks.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase mb-2">Bloqueada por</p>
              <div className="space-y-2">
                {blockedByWithLinks.map(({ task: bt, linkId }) => (
                  <div key={bt.id} className="flex items-center gap-2 text-sm py-1.5 px-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                    <span className="font-mono text-[var(--color-muted-foreground)]">{bt.identifier}</span>
                    <span className="flex-1">{bt.title}</span>
                    {bt.state === 'done' && <span className="text-[10px] text-green-500">✓ Resuelto</span>}
                    <button
                      onClick={() => handleRemoveBlockedBy(linkId)}
                      className="text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)] transition-colors"
                      title="Quitar bloqueo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {blockingWithLinks.length === 0 && blockedByWithLinks.length === 0 && (
            <p className="text-sm text-[var(--color-muted-foreground)]">Sin bloqueos registrados.</p>
          )}
        </div>

        {showBlockSearch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowBlockSearch(false)}>
            <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4">Añadir bloqueo</h3>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                <input
                  type="text"
                  placeholder="Buscar tarea para bloquear..."
                  value={blockSearchQuery}
                  onChange={e => setBlockSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg pl-9 pr-3 py-2 text-sm"
                />
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {filteredAvailableTasks.length === 0 ? (
                  <p className="text-sm text-[var(--color-muted-foreground)] text-center py-4">
                    {blockSearchQuery ? "Sin resultados" : "No hay tareas disponibles para bloquear"}
                  </p>
                ) : (
                  filteredAvailableTasks.slice(0, 20).map(t => (
                    <button
                      key={t.id}
                      onClick={() => handleAddBlock(t.id)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--color-muted)] transition-colors flex items-center gap-2"
                    >
                      <span className="font-mono text-xs text-[var(--color-muted-foreground)]">{t.identifier}</span>
                      <span className="text-sm">{t.title}</span>
                    </button>
                  ))
                )}
              </div>
              <div className="flex justify-end mt-4">
                <button onClick={() => setShowBlockSearch(false)} className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-4">Propiedades</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="text-[var(--color-muted-foreground)]">Asignado</span>
              <span className="col-span-2">
                <TaskAssigneeSelect
                  assigneeId={task.assigneeId}
                  assigneeName={allUsers.find((u: any) => u.id === task.assigneeId)?.name}
                  users={allUsers}
                  onSelect={handleAssigneeChange}
                />
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="text-[var(--color-muted-foreground)]">Estado</span>
              <span className="col-span-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="inline-flex items-center gap-1">
                      <TaskStatePill state={task.state} size="sm" />
                      <ChevronDownIcon className="h-3 w-3 text-[var(--color-muted-foreground)]" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {VALID_STATES.map(s => (
                      <DropdownMenuItem key={s} onClick={() => handleStateChange(s)}>
                        <TaskStatePill state={s} size="sm" />
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="text-[var(--color-muted-foreground)]">Prioridad</span>
              <span className="col-span-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="inline-flex items-center gap-1">
                      {task.priority === 0 ? <FlagIcon className="h-3.5 w-3.5 text-[var(--color-muted-foreground)]" /> : <PriorityDot priority={task.priority} />}
                      <ChevronDownIcon className="h-3 w-3 text-[var(--color-muted-foreground)]" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-32">
                    {[0, 4, 3, 2, 1].map(p => (
                      <DropdownMenuItem key={p} onClick={() => handlePriorityChange(p)}>
                        <PriorityDot priority={p} showLabel />
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="text-[var(--color-muted-foreground)]">Tipo</span>
              <span className="col-span-2">
                <select
                  className="text-xs bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-2 py-1"
                  value={task.taskType || "other"}
                  onChange={(e) => handlePropertyChange("taskType", e.target.value)}
                >
                  {TASK_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="text-[var(--color-muted-foreground)]">Vencimiento</span>
              <span className="col-span-2">
                <input
                  type="date"
                  className="text-xs bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-2 py-1"
                  value={task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""}
                  onChange={(e) => handlePropertyChange("dueDate", e.target.value || null)}
                />
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="text-[var(--color-muted-foreground)]">Puntos</span>
              <span className="col-span-2">
                <input
                  type="number"
                  min="0"
                  className="text-xs bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-2 py-1 w-20"
                  value={task.estimatePoints || ""}
                  onChange={(e) => handlePropertyChange("estimatePoints", Number(e.target.value) || null)}
                />
              </span>
            </div>
            {cycles && cycles.length > 0 && (
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-[var(--color-muted-foreground)]">Ciclo</span>
                <span className="col-span-2">
                  <select
                    className="text-xs bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-2 py-1 max-w-[140px]"
                    value={task.cycleId || ""}
                    onChange={(e) => handlePropertyChange("cycleId", e.target.value || null)}
                  >
                    <option value="">Sin ciclo</option>
                    {cycles.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </span>
              </div>
            )}
            {milestones && milestones.length > 0 && (
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-[var(--color-muted-foreground)]">Hito</span>
                <span className="col-span-2">
                  <select
                    className="text-xs bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-2 py-1 max-w-[140px]"
                    value={task.milestoneId || ""}
                    onChange={(e) => handlePropertyChange("milestoneId", e.target.value || null)}
                  >
                    <option value="">Sin hito</option>
                    {milestones.map((m: any) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
