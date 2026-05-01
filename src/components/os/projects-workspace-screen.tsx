"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  CircleAlert,
  FolderKanban,
  KanbanSquare,
  ListTodo,
  Loader2,
  Plus,
  Target,
} from "lucide-react";

import {
  EmptyWorkspacePanel,
  ErrorWorkspacePanel,
  LoadingWorkspacePanel,
  formatDateTime,
  formatNumber,
} from "@/components/os/workspace-ui";
import { postWorkspaceCommand } from "@/lib/ops/workspace-client";
import { useWorkspaceSnapshot } from "@/lib/ops/use-workspace-snapshot";
import type { WorkspaceMilestoneRecord, WorkspaceProjectRecord, WorkspaceTaskRecord } from "@/lib/ops/workspace-service";
import { useUIStore } from "@/lib/store/ui";
import { updateTaskStatus } from "@/lib/projects/task-service";
import type { WorkspaceTaskStatusValue } from "@/lib/ops/status-catalog";

type TaskColumn = {
  key: "todo" | "in_progress" | "review" | "blocked" | "done";
  title: string;
  subtitle: string;
  tasks: WorkspaceTaskRecord[];
};

const columnDefinitions: Array<Omit<TaskColumn, "tasks">> = [
  { key: "todo", title: "Todo", subtitle: "Backlog listo para ejecutar" },
  { key: "in_progress", title: "In Progress", subtitle: "Trabajo activo" },
  { key: "review", title: "In Review", subtitle: "Validación y QA" },
  { key: "blocked", title: "Blocked", subtitle: "Esperando dependencia" },
  { key: "done", title: "Completed", subtitle: "Entregado o cerrado" },
];

const projectTrackOptions = [
  { value: "commercial", label: "Comercial / SaaS" },
  { value: "community", label: "Comunidad" },
  { value: "roadmap", label: "Roadmap / Futuro" },
];

const milestoneStatusOptions = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "completed", label: "Completed" },
  { value: "blocked", label: "Blocked" },
  { value: "skipped", label: "Skipped" },
];

export default function ProjectsWorkspaceScreen() {
  const open = useUIStore((store) => store.open);
  const { snapshot, loading, error, refresh } = useWorkspaceSnapshot();
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [submittingProject, setSubmittingProject] = useState(false);
  const [submittingTask, setSubmittingTask] = useState(false);
  const [submittingMilestone, setSubmittingMilestone] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [milestoneError, setMilestoneError] = useState<string | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dropTargetColumn, setDropTargetColumn] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const columns = useMemo<TaskColumn[]>(() => {
    return columnDefinitions.map((column) => ({
      ...column,
      tasks: snapshot.tasks.filter((task) => normalizeTaskStatus(task.status) === column.key),
    }));
  }, [snapshot.tasks]);

  const activeMilestones = useMemo(() => snapshot.milestones.filter((milestone) => !isMilestoneClosed(milestone.status)), [snapshot.milestones]);
  const blockedMilestones = useMemo(() => snapshot.milestones.filter((milestone) => milestone.status === "blocked" || milestone.status === "under_review").length, [snapshot.milestones]);
  const visibleMilestones = useMemo(() => snapshot.milestones.filter((milestone) => milestone.clientVisible).length, [snapshot.milestones]);
  const milestoneFocus = useMemo(() => [...snapshot.milestones].sort(compareMilestones).slice(0, 6), [snapshot.milestones]);

  const topProjects = [...snapshot.projects]
    .sort((left, right) => right.progress - left.progress || right.openTasks - left.openTasks)
    .slice(0, 5);

  async function handleProjectSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittingProject(true);
    setProjectError(null);

    const formData = new FormData(event.currentTarget);
    const name = readFormText(formData, "name");
    const clientMode = readFormText(formData, "clientMode") ?? "none";
    const createClient = clientMode === "create";
    const provisionPortalAccess = readFormCheckbox(formData, "provisionPortalAccess");

    if (!name) {
      setProjectError("Debes indicar el nombre del proyecto.");
      setSubmittingProject(false);
      return;
    }

    if (createClient && !readFormText(formData, "clientName")) {
      setProjectError("Debes indicar el nombre del cliente si vas a crearlo desde el proyecto.");
      setSubmittingProject(false);
      return;
    }

    if (provisionPortalAccess && clientMode === "none") {
      setProjectError("Para provisionar acceso portal debes vincular o crear un cliente.");
      setSubmittingProject(false);
      return;
    }

    try {
      await postWorkspaceCommand(
        "project",
        {
          clientSlug: clientMode === "existing" ? readFormText(formData, "clientSlug") : readFormText(formData, "clientSlugCreate"),
          createClient,
          clientName: readFormText(formData, "clientName"),
          clientBrand: readFormText(formData, "clientBrand"),
          clientEmail: readFormText(formData, "clientEmail"),
          clientCompany: readFormText(formData, "clientCompany"),
          clientTotalInvestmentCents: readFormAmountCents(formData, "clientTotalInvestment"),
          clientPaidCents: readFormAmountCents(formData, "clientPaidAmount"),
          clientPendingCents: readFormAmountCents(formData, "clientPendingAmount"),
          provisionPortalAccess,
          portalUserName: readFormText(formData, "portalUserName"),
          portalUserEmail: readFormText(formData, "portalUserEmail"),
          portalUserPassword: readFormText(formData, "portalUserPassword"),
          name,
          description: readFormText(formData, "description"),
          status: readFormText(formData, "status") || "active",
          track: readFormText(formData, "track") || "commercial",
          progress: readFormNumber(formData, "progress") ?? 0,
          startDate: toIsoDate(readFormText(formData, "startDate")),
          endDate: toIsoDate(readFormText(formData, "endDate")),
        },
        "No fue posible crear el proyecto.",
      );
      event.currentTarget.reset();
      setShowProjectForm(false);
      await refresh();
    } catch (submissionError) {
      setProjectError(submissionError instanceof Error ? submissionError.message : "No fue posible crear el proyecto.");
    } finally {
      setSubmittingProject(false);
    }
  }

  async function handleTaskSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittingTask(true);
    setTaskError(null);

    const formData = new FormData(event.currentTarget);
    const title = readFormText(formData, "title");

    if (!title) {
      setTaskError("Debes indicar el título de la tarea.");
      setSubmittingTask(false);
      return;
    }

    try {
      await postWorkspaceCommand(
        "task",
        {
          clientSlug: readFormText(formData, "clientSlug"),
          projectId: readFormText(formData, "projectId"),
          title,
          owner: readFormText(formData, "owner"),
          status: (readFormText(formData, "status") as TaskColumn["key"] | null) ?? "todo",
          dueLabel: readFormText(formData, "dueLabel"),
        },
        "No fue posible crear la tarea.",
      );
      event.currentTarget.reset();
      setShowTaskForm(false);
      await refresh();
    } catch (submissionError) {
      setTaskError(submissionError instanceof Error ? submissionError.message : "No fue posible crear la tarea.");
    } finally {
      setSubmittingTask(false);
    }
  }

  async function handleMilestoneSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittingMilestone(true);
    setMilestoneError(null);

    const formData = new FormData(event.currentTarget);
    const projectId = readFormText(formData, "projectId");
    const title = readFormText(formData, "title");

    if (!projectId) {
      setMilestoneError("Debes seleccionar un proyecto para crear el milestone.");
      setSubmittingMilestone(false);
      return;
    }

    if (!title) {
      setMilestoneError("Debes indicar el título del milestone.");
      setSubmittingMilestone(false);
      return;
    }

    try {
      await postWorkspaceCommand(
        "milestone",
        {
          projectId,
          title,
          description: readFormText(formData, "description"),
          status: readFormText(formData, "status") || "pending",
          targetDate: toIsoDate(readFormText(formData, "targetDate")),
          clientVisible: readFormCheckbox(formData, "clientVisible"),
          weight: readFormNumber(formData, "weight") ?? 1,
          orderIndex: readFormNumber(formData, "orderIndex") ?? 0,
        },
        "No fue posible crear el milestone.",
      );
      event.currentTarget.reset();
      setShowMilestoneForm(false);
      await refresh();
    } catch (submissionError) {
      setMilestoneError(submissionError instanceof Error ? submissionError.message : "No fue posible crear el milestone.");
    } finally {
      setSubmittingMilestone(false);
    }
  }

  if (loading) {
    return <LoadingWorkspacePanel label="Cargando proyectos y tareas reales..." />;
  }

  if (error) {
    return <ErrorWorkspacePanel message={error} onRetry={refresh} />;
  }

  if (snapshot.projects.length === 0 && snapshot.tasks.length === 0 && snapshot.milestones.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyWorkspacePanel
          title="Aún no hay proyectos ni tareas reales"
          description="Crea un proyecto o una tarea para activar el tablero operativo y el detalle conectado al workspace."
        />
        <div className="flex gap-3">
          <button className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground" onClick={() => setShowProjectForm((value) => !value)}>
            Nuevo proyecto
          </button>
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" onClick={() => setShowTaskForm((value) => !value)}>
            Nueva tarea
          </button>
        </div>
        {showProjectForm ? <ProjectForm clients={snapshot.clients.map((client) => ({ slug: client.slug, name: client.name }))} onSubmit={handleProjectSubmit} submitting={submittingProject} error={projectError} /> : null}
        {showTaskForm ? <TaskForm clients={snapshot.clients.map((client) => ({ slug: client.slug, name: client.name }))} projects={snapshot.projects} onSubmit={handleTaskSubmit} submitting={submittingTask} error={taskError} /> : null}
        {showMilestoneForm ? <MilestoneForm projects={snapshot.projects} onSubmit={handleMilestoneSubmit} submitting={submittingMilestone} error={milestoneError} /> : null}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Proyectos</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tablero real con {formatNumber(snapshot.projects.length)} proyectos y {formatNumber(snapshot.tasks.length)} tareas sincronizadas.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/api/admin/export/projects"
            className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
            download
          >
            Exportar CSV
          </a>
          <button className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80" onClick={refresh}>
            Actualizar
          </button>
          <button className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:text-primary" onClick={() => setShowProjectForm((value) => !value)}>
            <span className="inline-flex items-center gap-2">
              <FolderKanban className="h-4 w-4" /> Nuevo proyecto
            </span>
          </button>
          <button className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:text-primary" onClick={() => setShowMilestoneForm((value) => !value)}>
            <span className="inline-flex items-center gap-2">
              <Target className="h-4 w-4" /> Nuevo milestone
            </span>
          </button>
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_0_15px_rgba(0,255,135,0.2)] transition-all hover:shadow-[0_0_25px_rgba(0,255,135,0.35)]" onClick={() => setShowTaskForm((value) => !value)}>
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nueva tarea
            </span>
          </button>
        </div>
      </div>

      {showProjectForm ? <ProjectForm clients={snapshot.clients.map((client) => ({ slug: client.slug, name: client.name }))} onSubmit={handleProjectSubmit} submitting={submittingProject} error={projectError} /> : null}
      {showMilestoneForm ? <MilestoneForm projects={snapshot.projects} onSubmit={handleMilestoneSubmit} submitting={submittingMilestone} error={milestoneError} /> : null}
      {showTaskForm ? <TaskForm clients={snapshot.clients.map((client) => ({ slug: client.slug, name: client.name }))} projects={snapshot.projects} onSubmit={handleTaskSubmit} submitting={submittingTask} error={taskError} /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Proyectos activos" value={String(snapshot.summary.projects)} subtitle={`${formatNumber(snapshot.clients.length)} clientes conectados`} icon={FolderKanban} />
        <MetricCard title="Tareas abiertas" value={String(snapshot.summary.openTasks)} subtitle={`${formatNumber(columns.find((column) => column.key === "in_progress")?.tasks.length ?? 0)} en ejecución`} icon={ListTodo} />
        <MetricCard title="Milestones activos" value={String(activeMilestones.length)} subtitle={`${formatNumber(visibleMilestones)} visibles al cliente`} icon={Target} />
        <MetricCard title="Milestones sensibles" value={String(blockedMilestones)} subtitle="Bloqueados o en revisión" icon={Target} />
        <MetricCard title="En revisión" value={String(columns.find((column) => column.key === "review")?.tasks.length ?? 0)} subtitle="Pendientes de QA o feedback" icon={KanbanSquare} />
        <MetricCard title="Promedio progreso" value={`${computeAverageProgress(snapshot.projects)}%`} subtitle="Avance medio derivado del portafolio" icon={Target} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-4 xl:grid-cols-4">
          {columns.map((column) => {
            const handleDragOver = (e: React.DragEvent) => {
              e.preventDefault();
              setDropTargetColumn(column.key);
            };

            const handleDragLeave = () => {
              setDropTargetColumn(null);
            };

            const handleDrop = async (e: React.DragEvent) => {
              e.preventDefault();
              const taskId = e.dataTransfer.getData("taskId");
              setDropTargetColumn(null);
              setDraggingTaskId(null);

              if (!taskId) return;

              const task = snapshot.tasks.find((t) => t.id === taskId);
              if (!task) return;

              const currentStatus = normalizeTaskStatus(task.status);
              if (currentStatus === column.key) return;

              setIsUpdating(true);
              try {
                await updateTaskStatus(taskId, column.key);
                await refresh();
              } finally {
                setIsUpdating(false);
              }
            };

            const isDropTarget = dropTargetColumn === column.key;

            return (
              <section
                key={column.key}
                className={`rounded-2xl border bg-card shadow-sm transition-colors ${isDropTarget ? "border-primary bg-primary/5" : "border-border"}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="border-b border-border px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{column.title}</h2>
                      <p className="mt-1 text-xs text-muted-foreground">{column.subtitle}</p>
                    </div>
                    <span className="rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-foreground">
                      {column.tasks.length}
                    </span>
                  </div>
                </div>
                <div className={`space-y-3 p-4 min-h-[200px] ${isUpdating ? "opacity-50" : ""}`}>
                  {column.tasks.length > 0 ? (
                    column.tasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        isDragging={draggingTaskId === task.id}
                        onDragStart={() => setDraggingTaskId(task.id)}
                        onDragEnd={() => setDraggingTaskId(null)}
                        onClick={() => open("taskDetail", task.id)}
                      />
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-border bg-secondary/20 px-4 py-8 text-center text-sm text-muted-foreground">
                      {isDropTarget ? "Suelta aquí para mover" : "Sin tareas en esta columna."}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-lg font-semibold text-foreground">Milestones foco</h2>
            </div>
            <div className="space-y-3 p-4">
              {milestoneFocus.length > 0 ? (
                milestoneFocus.map((milestone) => <MilestoneCard key={milestone.id} milestone={milestone} />)
              ) : (
                <p className="text-sm text-muted-foreground">Aún no hay milestones registrados.</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-lg font-semibold text-foreground">Proyectos foco</h2>
            </div>
            <div className="space-y-3 p-4">
              {topProjects.length > 0 ? (
                topProjects.map((project) => <ProjectCard key={project.id} project={project} />)
              ) : (
                <p className="text-sm text-muted-foreground">No hay proyectos para mostrar todavía.</p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function normalizeTaskStatus(status: string): TaskColumn["key"] {
  if (status === "done") {
    return "done";
  }

  if (status === "review") {
    return "review";
  }

  if (status === "in_progress") {
    return "in_progress";
  }

  return "todo";
}

function computeAverageProgress(projects: WorkspaceProjectRecord[]) {
  if (projects.length === 0) {
    return 0;
  }

  return Math.round(projects.reduce((total, project) => total + project.progress, 0) / projects.length);
}

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() || null : null;
}

function readFormNumber(formData: FormData, key: string) {
  const value = readFormText(formData, key);

  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function readFormAmountCents(formData: FormData, key: string) {
  const value = readFormText(formData, key);

  if (!value) {
    return null;
  }

  const normalized = value.replace(/[^0-9.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : null;
}

function readFormCheckbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function toIsoDate(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function MetricCard({ title, value, subtitle, icon: Icon }: { title: string; value: string; subtitle: string; icon: typeof FolderKanban }) {
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

function ProjectCard({ project }: { project: WorkspaceProjectRecord }) {
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{project.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{project.clientName ?? "Proyecto independiente"}</p>
        </div>
        <span className="rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
          {project.status}
        </span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${project.progress}%` }}></div>
      </div>
      <div className="mt-3 space-y-2 text-xs text-muted-foreground">
        <div className="flex items-center justify-between gap-3">
          <span>{project.progress}% completado</span>
          <span>{project.openTasks} tareas abiertas</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>{project.completedMilestones}/{project.milestoneCount} milestones</span>
          <span>{project.milestoneCount > 0 ? "Delivery trazable" : "Sin milestones"}</span>
        </div>
      </div>
    </div>
  );
}

function MilestoneCard({ milestone }: { milestone: WorkspaceMilestoneRecord }) {
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{milestone.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{milestone.projectName ?? "Proyecto sin nombre"}</p>
        </div>
        <span className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-wide ${getMilestoneStatusClass(milestone.status)}`}>
          {formatMilestoneStatusLabel(milestone.status)}
        </span>
      </div>
      {milestone.description ? <p className="mt-3 text-xs text-muted-foreground">{milestone.description}</p> : null}
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{milestone.targetDate ? formatDateTime(milestone.targetDate) : "Sin fecha objetivo"}</span>
        <span>{milestone.clientVisible ? "Visible al cliente" : "Interno"}</span>
      </div>
    </div>
  );
}

function TaskCard({ task, isDragging, onDragStart, onDragEnd, onClick }: { task: WorkspaceTaskRecord; isDragging?: boolean; onDragStart?: () => void; onDragEnd?: () => void; onClick?: () => void }) {
  return (
    <button
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("taskId", task.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.();
      }}
      onDragEnd={() => onDragEnd?.()}
      className={`w-full rounded-xl border border-border/60 bg-secondary/20 p-4 text-left transition-all hover:border-primary/30 hover:bg-primary/5 ${isDragging ? "opacity-50 rotate-2" : ""}`}
      onClick={onClick}
    >
      <p className="text-sm font-semibold text-foreground">{task.title}</p>
      <p className="mt-2 text-xs text-muted-foreground">{task.projectName ?? task.clientName ?? "Sin vínculo"}</p>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{task.owner ?? "Sin owner"}</span>
        <span>{task.dueLabel ?? formatDateTime(task.updatedAt)}</span>
      </div>
    </button>
  );
}

function ProjectForm({ clients, onSubmit, submitting, error }: { clients: Array<{ slug: string; name: string }>; onSubmit: (event: FormEvent<HTMLFormElement>) => void; submitting: boolean; error: string | null }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <FolderKanban className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Crear proyecto</h2>
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="rounded-2xl border border-border/70 bg-secondary/10 p-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">Relación del proyecto</h3>
            <p className="text-xs text-muted-foreground">Puedes dejarlo independiente, vincular un cliente existente o crear uno nuevo en el mismo paso.</p>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Select name="clientMode" label="Modo" disabled={submitting} options={[{ value: "none", label: "Proyecto independiente" }, { value: "existing", label: "Vincular cliente existente" }, { value: "create", label: "Crear cliente nuevo" }]} />
            <Select name="clientSlug" label="Cliente existente" disabled={submitting} options={[{ value: "", label: "Selecciona un cliente" }, ...clients.map((client) => ({ value: client.slug, label: client.name }))]} />
            <Input name="clientSlugCreate" label="Slug cliente nuevo" placeholder="budaphone" disabled={submitting} />
            <Input name="clientName" label="Nombre cliente nuevo" placeholder="Budaphone" disabled={submitting} />
            <Input name="clientBrand" label="Marca cliente" placeholder="Budaphone Retail" disabled={submitting} />
            <Input name="clientEmail" label="Email cliente" placeholder="equipo@cliente.com" type="email" disabled={submitting} />
            <Input name="clientCompany" label="Empresa cliente" placeholder="Budaphone SAS" disabled={submitting} />
            <Input name="clientTotalInvestment" label="Inversión cliente (USD)" placeholder="15000" disabled={submitting} />
            <Input name="clientPaidAmount" label="Pagado cliente (USD)" placeholder="7500" disabled={submitting} />
            <Input name="clientPendingAmount" label="Pendiente cliente (USD)" placeholder="7500" disabled={submitting} />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Input name="name" label="Nombre" placeholder="Portal Cliente Budaphone" required disabled={submitting} />
          <Input name="status" label="Estado" placeholder="active" disabled={submitting} />
          <Select name="track" label="Track" disabled={submitting} options={projectTrackOptions} defaultValue="commercial" />
          <Input name="progress" label="Progreso" placeholder="15" type="number" disabled={submitting} />
          <Input name="startDate" label="Inicio" type="date" disabled={submitting} />
          <Input name="endDate" label="Fin" type="date" disabled={submitting} />
        </div>
        <Input name="description" label="Descripción" placeholder="Lanzamiento de portal y automatizaciones" disabled={submitting} />
        <section className="rounded-2xl border border-border/70 bg-secondary/10 p-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">Acceso portal</h3>
            <p className="text-xs text-muted-foreground">Si el proyecto tiene cliente, puedes dejar provisionado su acceso al login y portal desde aquí. El usuario queda activo cuando la cuenta ya cumple el anticipo del 50%.</p>
          </div>
          <div className="mt-4 space-y-4">
            <CheckboxField name="provisionPortalAccess" label="Provisionar acceso portal" disabled={submitting} />
            <div className="grid gap-4 md:grid-cols-3">
              <Input name="portalUserName" label="Nombre usuario portal" placeholder="Equipo cliente" disabled={submitting} />
              <Input name="portalUserEmail" label="Email portal" placeholder="portal@cliente.com" type="email" disabled={submitting} />
              <Input name="portalUserPassword" label="Contraseña portal" placeholder="Temporal segura" type="password" disabled={submitting} />
            </div>
          </div>
        </section>
        {error ? <InlineError message={error} /> : null}
        <div className="flex justify-end gap-3">
          <button type="submit" disabled={submitting} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Creando...</span> : "Crear proyecto"}
          </button>
        </div>
      </form>
    </section>
  );
}

function MilestoneForm({ projects, onSubmit, submitting, error }: { projects: WorkspaceProjectRecord[]; onSubmit: (event: FormEvent<HTMLFormElement>) => void; submitting: boolean; error: string | null }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <Target className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Crear milestone</h2>
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Select name="projectId" label="Proyecto" disabled={submitting} options={[{ value: "", label: "Selecciona un proyecto" }, ...projects.map((project) => ({ value: project.id, label: project.name }))]} />
          <Input name="title" label="Título" placeholder="Kickoff aprobado" required disabled={submitting} />
          <Select name="status" label="Estado" disabled={submitting} options={milestoneStatusOptions} defaultValue="pending" />
          <Input name="targetDate" label="Fecha objetivo" type="date" disabled={submitting} />
          <Input name="weight" label="Peso" type="number" placeholder="1" disabled={submitting} />
          <Input name="orderIndex" label="Orden" type="number" placeholder="0" disabled={submitting} />
        </div>
        <Input name="description" label="Descripción" placeholder="Aprobación formal del arranque operativo" disabled={submitting} />
        <CheckboxField name="clientVisible" label="Visible para el cliente" disabled={submitting} defaultChecked />
        {error ? <InlineError message={error} /> : null}
        <div className="flex justify-end gap-3">
          <button type="submit" disabled={submitting} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Creando...</span> : "Crear milestone"}
          </button>
        </div>
      </form>
    </section>
  );
}

function TaskForm({ clients, projects, onSubmit, submitting, error }: { clients: Array<{ slug: string; name: string }>; projects: WorkspaceProjectRecord[]; onSubmit: (event: FormEvent<HTMLFormElement>) => void; submitting: boolean; error: string | null }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <ListTodo className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Crear tarea</h2>
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Input name="title" label="Título" placeholder="Configurar acceso al portal" required disabled={submitting} />
          <Select name="projectId" label="Proyecto" disabled={submitting} options={[{ value: "", label: "Sin proyecto" }, ...projects.map((project) => ({ value: project.id, label: project.name }))]} />
          <Select name="clientSlug" label="Cliente" disabled={submitting} options={[{ value: "", label: "Sin cliente" }, ...clients.map((client) => ({ value: client.slug, label: client.name }))]} />
          <Input name="owner" label="Owner" placeholder="Juan M." disabled={submitting} />
          <Select name="status" label="Estado" disabled={submitting} options={[{ value: "todo", label: "Todo" }, { value: "in_progress", label: "In Progress" }, { value: "review", label: "Review" }, { value: "blocked", label: "Blocked" }, { value: "done", label: "Done" }, { value: "archived", label: "Archived" }]} />
          <Input name="dueLabel" label="Fecha / label" placeholder="Hoy 6:00 PM" disabled={submitting} />
        </div>
        {error ? <InlineError message={error} /> : null}
        <div className="flex justify-end gap-3">
          <button type="submit" disabled={submitting} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Creando...</span> : "Crear tarea"}
          </button>
        </div>
      </form>
    </section>
  );
}

function Input({ label, name, placeholder, type = "text", required = false, disabled = false }: { label: string; name: string; placeholder?: string; type?: string; required?: boolean; disabled?: boolean }) {
  return (
    <label className="space-y-2 text-sm text-muted-foreground">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary/40"
      />
    </label>
  );
}

function Select({ label, name, options, disabled = false, defaultValue }: { label: string; name: string; options: Array<{ value: string; label: string }>; disabled?: boolean; defaultValue?: string }) {
  return (
    <label className="space-y-2 text-sm text-muted-foreground">
      <span>{label}</span>
      <select name={name} disabled={disabled} defaultValue={defaultValue} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary/40">
        {options.map((option) => (
          <option key={`${name}-${option.value || option.label}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckboxField({ name, label, disabled = false, defaultChecked = false }: { name: string; label: string; disabled?: boolean; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground">
      <input name={name} type="checkbox" disabled={disabled} defaultChecked={defaultChecked} className="h-4 w-4 rounded border-border bg-background text-primary" />
      <span>{label}</span>
    </label>
  );
}

function isMilestoneClosed(status: string) {
  return ["approved", "completed", "skipped"].includes(status);
}

function compareMilestones(left: WorkspaceMilestoneRecord, right: WorkspaceMilestoneRecord) {
  const leftClosed = isMilestoneClosed(left.status) ? 1 : 0;
  const rightClosed = isMilestoneClosed(right.status) ? 1 : 0;

  if (leftClosed !== rightClosed) {
    return leftClosed - rightClosed;
  }

  const leftTarget = left.targetDate ? new Date(left.targetDate).getTime() : Number.MAX_SAFE_INTEGER;
  const rightTarget = right.targetDate ? new Date(right.targetDate).getTime() : Number.MAX_SAFE_INTEGER;

  if (leftTarget !== rightTarget) {
    return leftTarget - rightTarget;
  }

  return left.orderIndex - right.orderIndex;
}

function formatMilestoneStatusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function getMilestoneStatusClass(status: string) {
  if (status === "blocked") {
    return "border-destructive/30 bg-destructive/10 text-destructive";
  }

  if (status === "under_review") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-500";
  }

  if (isMilestoneClosed(status)) {
    return "border-primary/20 bg-primary/10 text-primary";
  }

  return "border-border bg-background text-muted-foreground";
}

function InlineError({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}
