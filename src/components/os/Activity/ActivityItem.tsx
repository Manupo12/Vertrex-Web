"use client";

import { formatRelativeTime } from "@/lib/format";
import { CheckCircle2Icon, MessageSquareIcon, AlertCircleIcon, SettingsIcon, UserIcon, Edit2Icon, LinkIcon, FileIcon } from "lucide-react";
import Link from "next/link";

export interface ActivityItemProps {
  activity: any;
  users?: any[];
}

export function ActivityItem({ activity, users = [] }: ActivityItemProps) {
  const getActorInfo = () => {
    if (activity.actorType === "system") return { name: "Sistema", icon: <SettingsIcon className="h-4 w-4 text-muted-foreground" /> };
    if (activity.actorType === "client") return { name: "Cliente", icon: <UserIcon className="h-4 w-4 text-[var(--color-primary)]" /> };
    
    const user = users.find(u => u.id === activity.actorId);
    return { name: user?.name || "Usuario", icon: <UserIcon className="h-4 w-4 text-blue-500" /> };
  };

  const getVerbText = () => {
    switch (activity.verb) {
      case "created": return "creó";
      case "updated": return "actualizó";
      case "completed": return "completó";
      case "commented": return "comentó en";
      case "signed": return "firmó";
      case "approved": return "aprobó";
      case "rejected": return "rechazó";
      case "status_changed": return "cambió el estado de";
      case "moved": return "movió";
      default: return activity.verb;
    }
  };

  const getTargetLink = () => {
    if (activity.targetType === "task") return `/t/${activity.targetId}`;
    if (activity.targetType === "project") return `/os/projects/${activity.targetId}`;
    if (activity.targetType === "document") return `/os/documents/${activity.targetId}`;
    return "#";
  };

  const getTargetIcon = () => {
    if (activity.targetType === "task") return <CheckCircle2Icon className="h-3 w-3 inline mr-1" />;
    if (activity.targetType === "document") return <FileIcon className="h-3 w-3 inline mr-1" />;
    return <LinkIcon className="h-3 w-3 inline mr-1" />;
  };

  const actor = getActorInfo();
  
  return (
    <div className="flex gap-4 p-4 border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-muted)]/20 transition-colors">
      <div className="shrink-0 mt-0.5">
        <div className="w-8 h-8 rounded-full bg-[var(--color-card)] border border-[var(--color-border)] flex items-center justify-center">
          {actor.icon}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm">
          <span className="font-semibold text-[var(--color-foreground)] mr-1">{actor.name}</span>
          <span className="text-[var(--color-muted-foreground)] mr-1">{getVerbText()}</span>
          <Link href={getTargetLink()} className="font-medium text-[var(--color-primary)] hover:underline inline-flex items-center">
            {getTargetIcon()}
            {activity.payload?.identifier || activity.payload?.title || activity.targetType}
          </Link>
        </div>
        
        {activity.payload && Object.keys(activity.payload).length > 0 && activity.verb !== "created" && activity.verb !== "moved" && (
          <div className="mt-2 p-2 rounded-md bg-[var(--color-muted)]/30 border border-[var(--color-border)] text-xs text-[var(--color-muted-foreground)] font-mono">
            {activity.payload.from && activity.payload.to ? (
              <div className="flex items-center gap-2">
                <span className="line-through opacity-70">{activity.payload.from}</span>
                <span>→</span>
                <span className="font-medium text-[var(--color-foreground)]">{activity.payload.to}</span>
              </div>
            ) : (
              JSON.stringify(activity.payload)
            )}
          </div>
        )}
        
        <div className="text-xs text-[var(--color-muted-foreground)] mt-2">
          {formatRelativeTime(activity.createdAt)}
        </div>
      </div>
    </div>
  );
}
