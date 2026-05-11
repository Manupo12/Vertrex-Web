"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { FolderKanbanIcon } from "lucide-react";
import { formatCurrencyCop } from "@/lib/format";
import Link from "next/link";

export function ProjectsFinanceView({ projects }: { projects: any[] }) {
  if (projects.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState 
          icon={FolderKanbanIcon} 
          title="Sin proyectos activos" 
          description="Aún no hay proyectos para calcular rentabilidad." 
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
              <th className="px-6 py-3 font-semibold">Proyecto</th>
              <th className="px-6 py-3 font-semibold text-right">Ingresos (Pagados)</th>
              <th className="px-6 py-3 font-semibold text-right">Gastos (Pagados)</th>
              <th className="px-6 py-3 font-semibold text-right">Margen Neto</th>
              <th className="px-6 py-3 font-semibold text-right">% Rentabilidad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {projects.map((p) => {
              const isProfitable = p.margen > 0;
              const isLoss = p.margen < 0;
              
              return (
                <tr key={p.id} className="hover:bg-[var(--color-muted)]/20 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    <Link href={`/os/projects/${p.id}`} className="text-[var(--color-primary)] hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-green-500">
                    {formatCurrencyCop(p.ingresos)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-orange-500">
                    {formatCurrencyCop(p.gastos)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right font-mono font-semibold ${isProfitable ? 'text-green-500' : isLoss ? 'text-red-500' : 'text-[var(--color-foreground)]'}`}>
                    {formatCurrencyCop(p.margen)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${isProfitable ? 'bg-green-500/10 text-green-500' : isLoss ? 'bg-red-500/10 text-red-500' : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'}`}>
                      {p.margenPorcentaje.toFixed(1)}%
                    </div>
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
