"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { ShieldAlertIcon, KeyIcon, EyeIcon } from "lucide-react";
import { formatDateTime } from "@/lib/format";

export function AuditView({ logs, resources, users }: { logs: any[], resources: any[], users: any[] }) {
  if (logs.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState 
          icon={ShieldAlertIcon} 
          title="Sin registros de auditoría" 
          description="Aún no hay accesos registrados a los recursos confidenciales." 
        />
      </div>
    );
  }

  return (
    <div className="mt-6 bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-[var(--color-muted)]/50 text-[var(--color-muted-foreground)] uppercase text-xs">
            <tr>
              <th className="px-6 py-3 font-semibold">Fecha y Hora</th>
              <th className="px-6 py-3 font-semibold">Usuario</th>
              <th className="px-6 py-3 font-semibold">Acción</th>
              <th className="px-6 py-3 font-semibold">Recurso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {logs.map((log) => {
              const user = users.find(u => u.id === log.actorId);
              const resource = resources.find(r => r.id === log.resourceId);
              
              return (
                <tr key={log.id} className="hover:bg-[var(--color-muted)]/20 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-[var(--color-muted-foreground)]">
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-[var(--color-foreground)]">
                    {user?.name || "Desconocido"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.action === 'reveal' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                        <EyeIcon className="h-3.5 w-3.5" /> Reveló secreto
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
                        {log.action}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {resource ? (
                      <div className="flex items-center gap-2">
                        <KeyIcon className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                        <span className="font-medium">{resource.title}</span>
                      </div>
                    ) : (
                      <span className="text-[var(--color-muted-foreground)] italic">Recurso eliminado</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
