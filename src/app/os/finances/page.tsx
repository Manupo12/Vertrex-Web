import { db } from "@/lib/db";
import { finances } from "@/lib/db/schema";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { getMonthlyFinanceSummary } from "@/lib/db/actions/finances";
import Link from "next/link";
import { FinancesList } from "./FinancesList";
import { ExportCSVButton } from "./ExportCSVButton";

import { FinanceTabs } from "./FinanceTabs";

export default async function FinancesPage() {
  const allFinances = await db
    .select()
    .from(finances)
    .orderBy(finances.createdAt);

  const summary = await getMonthlyFinanceSummary();

  return (
    <div>
      <PageHeader
        title="Finanzas"
        description="Control de ingresos y gastos en COP"
        breadcrumbs={[{ label: "Finanzas" }]}
        primaryAction={
          <div className="flex items-center gap-2">
            <ExportCSVButton />
            <Link
              href="/os/finances/new"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              + Nuevo movimiento
            </Link>
          </div>
        }
      />
      
      <FinanceTabs activeTab="movimientos" />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-1 text-xs text-muted-foreground">
            Ingresos del mes
          </p>
          <p className="text-2xl font-bold text-green-400">
            ${summary.ingresos.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-1 text-xs text-muted-foreground">
            Gastos del mes
          </p>
          <p className="text-2xl font-bold text-red-400">
            ${summary.gastos.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-1 text-xs text-muted-foreground">Neto</p>
          <p className="text-2xl font-bold">
            {summary.neto >= 0
              ? `$${summary.neto.toLocaleString()}`
              : `-$${Math.abs(summary.neto).toLocaleString()}`}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-1 text-xs text-muted-foreground">Pendientes</p>
          <p className="text-2xl font-bold text-amber-400">
            {summary.pendientes}
          </p>
        </div>
      </div>
      <FinancesList finances={allFinances} />
    </div>
  );
}
