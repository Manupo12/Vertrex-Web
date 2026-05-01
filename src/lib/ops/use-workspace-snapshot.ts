"use client";

import { useCallback, useEffect, useState } from "react";

import type { WorkspaceSnapshot } from "@/lib/ops/workspace-service";

export const emptyWorkspaceSnapshot: WorkspaceSnapshot = {
  databaseConfigured: false,
  storage: {
    googleDriveConfigured: false,
    driveSharedAccount: null,
  },
  summary: {
    clients: 0,
    activeClients: 0,
    projects: 0,
    openTasks: 0,
    deals: 0,
    upcomingEvents: 0,
    pendingInvoices: 0,
    tickets: 0,
    files: 0,
  },
  clients: [],
  users: [],
  projects: [],
  tasks: [],
  milestones: [],
  deals: [],
  events: [],
  files: [],
  credentials: [],
  tickets: [],
  invoices: [],
  documents: [],
  transactions: [],
  messages: [],
  automationPlaybooks: [],
  automationRuns: [],
  links: [],
};

export function useWorkspaceSnapshot(options?: { enabled?: boolean; initialSnapshot?: WorkspaceSnapshot }) {
  const enabled = options?.enabled ?? true;
  const initialSnapshot = options?.initialSnapshot ?? emptyWorkspaceSnapshot;
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot>(initialSnapshot);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setSnapshot(initialSnapshot);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/workspace", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as WorkspaceSnapshot | { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload && "error" in payload && typeof payload.error === "string" ? payload.error : "No fue posible cargar el workspace operativo.");
      }

      setSnapshot(payload as WorkspaceSnapshot);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "No fue posible cargar el workspace operativo.");
      setSnapshot(emptyWorkspaceSnapshot);
    } finally {
      setLoading(false);
    }
  }, [enabled, initialSnapshot]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    snapshot,
    loading,
    error,
    refresh,
  };
}
