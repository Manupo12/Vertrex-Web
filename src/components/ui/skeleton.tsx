"use client";

import { cn } from "@/lib/utils";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
      {...props}
    />
  );
}

function SkeletonLine({ className }: { className?: string }) {
  return <Skeleton className={cn("h-4 w-full", className)} />;
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <Skeleton
      className={cn("h-[180px] w-full rounded-xl", className)}
    />
  );
}

function SkeletonTableRow({
  cols = 4,
  className,
}: {
  cols?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-4 py-3", className)}>
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4 flex-1",
            i === 0 && "h-8 w-8 flex-none rounded-full"
          )}
        />
      ))}
    </div>
  );
}

function TableSkeleton({
  rows = 5,
  cols = 4,
  className,
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-0", className)}>
      <div className="flex items-center gap-4 rounded-t-xl border border-border bg-card px-6 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      <div className="rounded-b-xl border border-t-0 border-border px-6 py-2">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonTableRow key={i} cols={cols} />
        ))}
      </div>
    </div>
  );
}

function CardGridSkeleton({
  cards = 6,
  className,
}: {
  cards?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {Array.from({ length: cards }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

function StatsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[100px] w-full rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-[300px] w-full rounded-xl" />
        <Skeleton className="h-[300px] w-full rounded-xl" />
      </div>
    </div>
  );
}

function KanbanSkeleton({
  cols = 4,
  cardsPerCol = 3,
  className,
}: {
  cols?: number;
  cardsPerCol?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-4 overflow-x-auto pb-4",
        className
      )}
    >
      {Array.from({ length: cols }).map((_, ci) => (
        <div
          key={ci}
          className="flex w-[280px] flex-none flex-col gap-3 rounded-xl border border-border bg-card p-4"
        >
          <Skeleton className="mb-1 h-5 w-24" />
          {Array.from({ length: cardsPerCol }).map((_, ri) => (
            <SkeletonCard key={ri} />
          ))}
        </div>
      ))}
    </div>
  );
}

function DetailSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="flex gap-2 border-b border-border pb-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export {
  Skeleton,
  SkeletonLine,
  SkeletonCard,
  SkeletonTableRow,
  TableSkeleton,
  CardGridSkeleton,
  StatsSkeleton,
  KanbanSkeleton,
  DetailSkeleton,
};
