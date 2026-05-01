import { useWorkspaceSnapshot } from "@/lib/ops/use-workspace-snapshot";
import ProjectsTimelineView from "@/components/os/projects-timeline-view";

export default function ProjectTimelinePage() {
  const { snapshot, loading, error } = useWorkspaceSnapshot();

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center text-sm text-muted-foreground">
        Cargando timeline...
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center text-sm text-destructive">
        {error ?? "No se pudo cargar el timeline"}
      </div>
    );
  }

  return <ProjectsTimelineView snapshot={snapshot} />;
}