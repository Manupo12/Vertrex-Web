"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatRelativeTime } from "@/lib/format";
import { BellIcon, MessageSquareIcon, CheckCircle2Icon, AlertCircleIcon, CalendarIcon } from "lucide-react";
import Link from "next/link";

export interface NotificationSheetProps {
  notifications: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
}

export function NotificationSheet({ notifications, open, onOpenChange, onMarkAllRead, onMarkRead }: NotificationSheetProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "task_assigned": return <CheckCircle2Icon className="h-4 w-4 text-blue-500" />;
      case "comment_replied": return <MessageSquareIcon className="h-4 w-4 text-green-500" />;
      case "approval_requested": return <AlertCircleIcon className="h-4 w-4 text-orange-500" />;
      default: return <BellIcon className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getLink = (targetType: string, targetId: string) => {
    // Basic mapping, should be expanded
    if (targetType === "task") return `/t/${targetId}`;
    if (targetType === "document") return `/os/documents/${targetId}`;
    return "#";
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[420px] w-[90vw] flex flex-col p-0" side="right">
        <SheetHeader className="p-6 border-b border-[var(--color-border)]">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl">Notificaciones</SheetTitle>
            {notifications.some(n => !n.readAt) && (
              <button 
                onClick={onMarkAllRead}
                className="text-xs text-[var(--color-primary)] hover:underline font-medium"
              >
                Marcar todo leído
              </button>
            )}
          </div>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto p-2">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-[var(--color-muted-foreground)]">
              <BellIcon className="h-8 w-8 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Sin notificaciones por ahora.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map(n => (
                <Link 
                  key={n.id} 
                  href={getLink(n.targetType, n.targetId)}
                  onClick={() => {
                    if (!n.readAt) onMarkRead(n.id);
                    onOpenChange(false);
                  }}
                  className={`flex gap-3 p-3 rounded-lg transition-colors hover:bg-[var(--color-muted)] ${!n.readAt ? 'bg-[var(--color-primary)]/5' : ''}`}
                >
                  <div className="mt-0.5 shrink-0 bg-[var(--color-card)] border border-[var(--color-border)] w-8 h-8 rounded-full flex items-center justify-center">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.readAt ? 'font-semibold text-[var(--color-foreground)]' : 'font-medium text-[var(--color-muted-foreground)]'}`}>
                      {n.title}
                    </p>
                    {n.body && <p className="text-xs text-[var(--color-muted-foreground)] mt-1 truncate">{n.body}</p>}
                    <p className="text-[10px] text-[var(--color-muted-foreground)] mt-2">
                      {formatRelativeTime(n.createdAt)}
                    </p>
                  </div>
                  {!n.readAt && (
                    <div className="shrink-0 w-2 h-2 rounded-full bg-[var(--color-primary)] mt-1.5" />
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-[var(--color-border)] text-center">
          <Link 
            href="/os/notifications" 
            onClick={() => onOpenChange(false)}
            className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
          >
            Ver todas las notificaciones
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
