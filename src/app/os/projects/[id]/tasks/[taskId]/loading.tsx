import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/os/layout/PageHeader";

export default function TaskDetailLoading() {
  return (
    <div>
      <PageHeader 
        title="Cargando tarea..." 
        breadcrumbs={[{ label: "Proyectos" }, { label: "Tareas" }]}
      />
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  );
}
