"use client";

import { useState, useEffect } from "react";
import { QuickTaskModal } from "./QuickTaskModal";
import { GlobalHotkeys } from "../Shortcuts/GlobalHotkeys";

export function QuickTaskProvider({ projects, users, currentUserId }: { projects: any[], users: any[], currentUserId?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOpenQuickTask = (e: CustomEvent) => {
      setOpen(true);
    };
    window.addEventListener("open-quick-task", handleOpenQuickTask as EventListener);
    return () => window.removeEventListener("open-quick-task", handleOpenQuickTask as EventListener);
  }, []);

  return (
    <>
      <GlobalHotkeys onQuickTask={() => setOpen(true)} />
      <QuickTaskModal 
        open={open} 
        onOpenChange={setOpen} 
        projects={projects} 
        users={users} 
        currentUserId={currentUserId} 
      />
    </>
  );
}
