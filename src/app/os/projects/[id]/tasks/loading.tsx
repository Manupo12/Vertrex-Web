import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/os/layout/PageHeader";

export default function TasksLoading() {
  return (
    <div>
      <PageHeader 
        title="Cargando tareas..." 
        description="Obteniendo backlog y ejecución." 
        breadcrumbs={[{ label: "Proyectos" }, { label: "Tareas" }]}
      />
      <div className="mt-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
