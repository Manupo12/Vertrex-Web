"use client";

import { useState, useEffect } from "react";
import { BellIcon } from "lucide-react";
import { NotificationSheet } from "./NotificationSheet";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/lib/db/actions/notifications";

export interface NotificationBellProps {
  initialNotifications?: any[];
}

export function NotificationBell({ initialNotifications = [] }: NotificationBellProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.readAt).length;

  const handleMarkAllRead = async () => {
    await markAllNotificationsReadAction();
    setNotifications(notifications.map(n => ({ ...n, readAt: new Date() })));
  };

  const handleMarkRead = async (id: string) => {
    await markNotificationReadAction(id);
    setNotifications(notifications.map(n => n.id === id ? { ...n, readAt: new Date() } : n));
  };

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="relative p-2 rounded-full hover:bg-[var(--color-muted)] transition-colors text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-[var(--color-primary)] ring-2 ring-[var(--color-background)]" />
        )}
      </button>
      
      <NotificationSheet 
        notifications={notifications} 
        open={open} 
        onOpenChange={setOpen}
        onMarkAllRead={handleMarkAllRead}
        onMarkRead={handleMarkRead}
      />
    </>
  );
}
