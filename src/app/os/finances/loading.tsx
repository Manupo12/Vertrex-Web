import { TableSkeleton } from "@/components/ui/skeleton";

export default function FinancesLoading() {
  return (
    <div>
      <div className="mb-6">
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
      </div>
      <TableSkeleton />
    </div>
  );
}
