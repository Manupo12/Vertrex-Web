"use client";

import { ActivityItem } from "./ActivityItem";
import { EmptyState } from "@/components/ui/empty-state";
import { ActivityIcon } from "lucide-react";

export interface ActivityFeedProps {
  activities: any[];
  users?: any[];
}

export function ActivityFeed({ activities, users = [] }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="py-8">
        <EmptyState 
          icon={ActivityIcon} 
          title="Sin actividad reciente" 
          description="No hay eventos registrados para esta vista." 
        />
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] overflow-hidden">
      <div className="divide-y divide-[var(--color-border)]">
        {activities.map((act) => (
          <ActivityItem key={act.id} activity={act} users={users} />
        ))}
      </div>
    </div>
  );
}
