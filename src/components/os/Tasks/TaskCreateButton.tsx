"use client";
import { useState } from "react";
import { QuickTaskModal } from "./QuickTaskModal";

interface TaskCreateButtonProps {
  projectId?: string;
  cycleId?: string;
  milestoneId?: string;
  label?: string;
  className?: string;
  projects?: any[];
  users?: any[];
  currentUserId?: string;
  cycles?: any[];
  milestones?: any[];
}

export function TaskCreateButton({ projectId, cycleId, milestoneId, label = "+ Tarea", className, projects, users, currentUserId, cycles, milestones }: TaskCreateButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className={className || "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"}>
        {label}
      </button>
      {open && (
        <QuickTaskModal
          open={open}
          onOpenChange={setOpen}
          defaultProjectId={projectId}
          defaultCycleId={cycleId}
          defaultMilestoneId={milestoneId}
          projects={projects || []}
          users={users || []}
          currentUserId={currentUserId}
          cycles={cycles}
          milestones={milestones}
        />
      )}
    </>
  );
}
