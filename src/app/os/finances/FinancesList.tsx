"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toolbar } from "@/components/os/layout/Toolbar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable } from "@/components/os/data/DataTable";
import { MobileCardList } from "@/components/os/data/MobileCardList";
import { DollarSign } from "lucide-react";
import { formatCurrencyCop, formatShortDate } from "@/lib/format";
import { ColumnDef } from "@tanstack/react-table";

type FinanceRow = {
  id: string;
  type: string;
  amountCop: number;
  status: string;
  concept: string;
  dueDate: Date | null;
  paidAt: Date | null;
  createdAt: Date;
};

export function FinancesList({ finances }: { finances: FinanceRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const filtered = finances.filter((f) => {
    if (typeFilter && f.type !== typeFilter) return false;
    if (query && !f.concept.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const columns: ColumnDef<FinanceRow>[] = [
    {
      accessorKey: "concept",
      header: "Concepto",
      cell: ({ row }) => <span className="font-medium text-foreground">{row.original.concept}</span>,
    },
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) => (
        <Badge variant={row.original.type === "ingreso" ? "success" : "danger"} className="text-[10px]">
          {row.original.type === "ingreso" ? "Ingreso" : "Gasto"}
        </Badge>
      ),
    },
    {
      accessorKey: "amountCop",
      header: "Monto",
      cell: ({ row }) => <span className="font-semibold">{formatCurrencyCop(row.original.amountCop)}</span>,
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => <StatusBadge category="finance" status={row.original.status} />,
    },
    {
      id: "date",
      header: "Fecha",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.dueDate ? `Vence: ${formatShortDate(row.original.dueDate)}` : formatShortDate(row.original.createdAt)}
        </span>
      ),
    },
  ];

  if (finances.length === 0) {
    return (
      <EmptyState
        icon={DollarSign}
        title="Sin movimientos financieros"
        description="Registra tu primer ingreso o gasto."
        actionLabel="Nuevo movimiento"
        onAction={() => router.push("/os/finances/new")}
      />
    );
  }

  return (
    <div>
      <Toolbar
        searchPlaceholder="Buscar movimientos..."
        onSearch={setQuery}
        resultCount={filtered.length}
        filters={
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todos</option>
            <option value="ingreso">Ingresos</option>
            <option value="gasto">Gastos</option>
          </select>
        }
      />
      
      <div className="hidden sm:block mt-4">
        <DataTable 
          columns={columns} 
          data={filtered} 
          onRowClick={(row) => router.push(`/os/finances/${row.id}`)} 
        />
      </div>

      <div className="mt-4 sm:hidden">
        <MobileCardList 
          data={filtered}
          renderCard={(f) => (
            <div
              onClick={() => router.push(`/os/finances/${f.id}`)}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent/30"
            >
              <div className="flex items-center gap-3">
                <Badge variant={f.type === "ingreso" ? "success" : "danger"} className="text-[10px]">
                  {f.type === "ingreso" ? "Ingreso" : "Gasto"}
                </Badge>
                <div>
                  <p className="text-sm font-medium text-foreground">{f.concept}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.dueDate ? `Vence: ${formatShortDate(f.dueDate)}` : formatShortDate(f.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <p className="text-sm font-semibold">{formatCurrencyCop(f.amountCop)}</p>
                <StatusBadge category="finance" status={f.status} />
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}
