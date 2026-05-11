"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { UsersIcon, CheckCircle2Icon, AlertCircleIcon } from "lucide-react";
import { formatShortDate } from "@/lib/format";

export function WorkloadView({ stats }: { stats: any[] }) {
  if (stats.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState 
          icon={UsersIcon} 
          title="Sin datos de equipo" 
          description="No hay miembros en el equipo." 
        />
      </div>
    );
  }

  // Sort by highest workload
  const sortedStats = [...stats].sort((a, b) => b.activeTasksCount - a.activeTasksCount);

  return (
    <div className="mt-6 bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-[var(--color-muted)]/50 text-[var(--color-muted-foreground)] uppercase text-xs">
            <tr>
              <th className="px-6 py-3 font-semibold">Miembro del equipo</th>
              <th className="px-6 py-3 font-semibold text-center">Tareas Activas</th>
              <th className="px-6 py-3 font-semibold text-center">Vencidas</th>
              <th className="px-6 py-3 font-semibold text-center">Completadas</th>
              <th className="px-6 py-3 font-semibold text-right">Próxima entrega</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {sortedStats.map((stat) => (
              <tr key={stat.id} className="hover:bg-[var(--color-muted)]/20 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-bold text-[var(--color-primary-foreground)] relative">
                      {stat.name.substring(0, 2).toUpperCase()}
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-[var(--color-card)] ${stat.status === 'active' ? 'bg-green-500' : stat.status === 'focused' ? 'bg-orange-500' : stat.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'}`} title={stat.status}></span>
                    </div>
                    <div>
                      <div className="font-medium text-[var(--color-foreground)]">{stat.name}</div>
                      <div className="text-xs text-[var(--color-muted-foreground)] capitalize">{stat.role}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`inline-flex items-center justify-center h-6 w-6 rounded-md font-medium text-xs ${stat.activeTasksCount > 10 ? 'bg-orange-500/10 text-orange-500' : 'bg-[var(--color-muted)] text-[var(--color-foreground)]'}`}>
                    {stat.activeTasksCount}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {stat.overdueTasksCount > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-500">
                      <AlertCircleIcon className="h-3 w-3" /> {stat.overdueTasksCount}
                    </span>
                  ) : (
                    <span className="text-[var(--color-muted-foreground)]">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-1 text-[var(--color-muted-foreground)]">
                    <CheckCircle2Icon className="h-3.5 w-3.5" />
                    <span>{stat.totalCompleted}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-[var(--color-muted-foreground)]">
                  {stat.nextDeadline ? formatShortDate(stat.nextDeadline) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
