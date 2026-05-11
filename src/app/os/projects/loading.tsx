import { KanbanSkeleton } from "@/components/ui/skeleton";

export default function ProjectsLoading() {
  return (
    <div>
      <div className="mb-6"><div className="mb-2 h-4 w-24 animate-pulse rounded bg-muted" /><div className="flex items-center justify-between"><div className="h-8 w-44 animate-pulse rounded bg-muted" /><div className="h-10 w-36 animate-pulse rounded bg-muted" /></div></div>
      <KanbanSkeleton />
    </div>
  );
}
