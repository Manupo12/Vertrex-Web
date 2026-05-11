"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { FileTextIcon, DownloadIcon } from "lucide-react";
import { formatShortDate } from "@/lib/format";
import { Button } from "@/components/ui/button";

export function InvoicesView({ initialInvoices, clients, projects }: { initialInvoices: any[], clients: any[], projects: any[] }) {
  if (initialInvoices.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState 
          icon={FileTextIcon} 
          title="Sin cuentas de cobro" 
          description="Aún no has generado ninguna cuenta de cobro o factura." 
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
              <th className="px-6 py-3 font-semibold">Documento</th>
              <th className="px-6 py-3 font-semibold">Fecha</th>
              <th className="px-6 py-3 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {initialInvoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-[var(--color-muted)]/20 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-[var(--color-foreground)] flex items-center gap-3">
                  <FileTextIcon className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                  {inv.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-[var(--color-muted-foreground)]">
                  {formatShortDate(inv.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <Button variant="ghost" size="sm">
                    <DownloadIcon className="h-4 w-4 mr-2" /> Descargar PDF
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
