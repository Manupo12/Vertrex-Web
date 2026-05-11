import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/os/layout/PageHeader";

export default function BoardLoading() {
  return (
    <div>
      <PageHeader 
        title="Cargando tablero..." 
        description="Obteniendo el kanban del proyecto." 
        breadcrumbs={[{ label: "Proyectos" }, { label: "Tablero" }]}
      />
      <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="min-w-[280px] space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
