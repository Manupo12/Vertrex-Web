"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { BellIcon, CheckCircle2Icon, MessageSquareIcon, AlertCircleIcon } from "lucide-react";
import { formatRelativeTime } from "@/lib/format";
import Link from "next/link";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/lib/db/actions/notifications";

export function NotificationsView({ initialNotifications }: { initialNotifications: any[] }) {
  const [items, setItems] = useState(initialNotifications);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsReadAction();
      setItems(items.map(n => ({ ...n, readAt: new Date().toISOString() })));
      toast.success("Todas marcadas como leídas");
    } catch {
      toast.error("Error al marcar notificaciones");
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationReadAction(id);
      setItems(items.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
    } catch {
      // silent
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "task_assigned": return <CheckCircle2Icon className="h-5 w-5 text-blue-500" />;
      case "comment_replied": return <MessageSquareIcon className="h-5 w-5 text-green-500" />;
      case "approval_requested": return <AlertCircleIcon className="h-5 w-5 text-orange-500" />;
      default: return <BellIcon className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getLink = (targetType: string, targetId: string) => {
    if (targetType === "task") return `/t/${targetId}`;
    if (targetType === "document") return `/os/documents/${targetId}`;
    return "#";
  };

  const renderList = (list: any[]) => {
    if (list.length === 0) {
      return (
        <div className="mt-8">
          <EmptyState 
            icon={BellIcon} 
            title="Sin notificaciones" 
            description="No tienes notificaciones en esta vista." 
          />
        </div>
      );
    }

    return (
      <div className="mt-6 bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] overflow-hidden">
        {list.map(n => (
          <Link 
            key={n.id} 
            href={getLink(n.targetType, n.targetId)}
            onClick={() => !n.readAt && handleMarkRead(n.id)}
            className={`flex items-start gap-4 p-4 border-b border-[var(--color-border)] transition-colors hover:bg-[var(--color-muted)]/30 ${!n.readAt ? 'bg-[var(--color-primary)]/5' : ''}`}
          >
            <div className="shrink-0 bg-[var(--color-background)] border border-[var(--color-border)] w-10 h-10 rounded-full flex items-center justify-center">
              {getIcon(n.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${!n.readAt ? 'font-semibold text-[var(--color-foreground)]' : 'font-medium text-[var(--color-muted-foreground)]'}`}>
                {n.title}
              </p>
              {n.body && <p className="text-sm text-[var(--color-muted-foreground)] mt-1">{n.body}</p>}
              <p className="text-xs text-[var(--color-muted-foreground)] mt-2">
                {formatRelativeTime(n.createdAt)}
              </p>
            </div>
            {!n.readAt && (
              <div className="shrink-0 w-2 h-2 rounded-full bg-[var(--color-primary)] mt-2" />
            )}
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <Tabs defaultValue="all" className="w-full">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">Todas ({items.length})</TabsTrigger>
              <TabsTrigger value="unread">No leídas ({items.filter(n => !n.readAt).length})</TabsTrigger>
            </TabsList>
            {items.some(n => !n.readAt) && (
              <button 
                onClick={handleMarkAllRead}
                className="text-sm text-[var(--color-primary)] hover:underline font-medium"
              >
                Marcar todo leído
              </button>
            )}
          </div>
          <TabsContent value="all">
            {renderList(items)}
          </TabsContent>
          <TabsContent value="unread">
            {renderList(items.filter(n => !n.readAt))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
