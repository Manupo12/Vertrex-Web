import { KanbanSkeleton } from "@/components/ui/skeleton";

export default function HubLoading() {
  return (
    <div>
      <div className="mb-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      </div>
      <KanbanSkeleton />
    </div>
  );
}
