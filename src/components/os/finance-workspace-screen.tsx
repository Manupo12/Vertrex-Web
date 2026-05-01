"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  DollarSign,
  FilePlus,
  Plus,
  Receipt,
  Repeat,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import {
  EmptyWorkspacePanel,
  ErrorWorkspacePanel,
  LoadingWorkspacePanel,
  formatDateTime,
  formatMoney,
  formatNumber,
} from "@/components/os/workspace-ui";
import { dealPipelineGroups, getDealPipelineGroup } from "@/lib/ops/deal-stages";
import { isOutstandingInvoiceStatus } from "@/lib/ops/status-catalog";
import { useWorkspaceSnapshot } from "@/lib/ops/use-workspace-snapshot";
import type { UIStore } from "@/lib/store/ui";
import { getBillingSchedules, createBillingSchedule, deleteBillingSchedule } from "@/lib/finance/billing-schedule-service";

type FinanceWorkspaceScreenProps = {
  open: UIStore["open"];
};

type ExpenseCategory = {
  category: string;
  amountCents: number;
  percent: number;
};

export default function FinanceWorkspaceScreen({ open }: FinanceWorkspaceScreenProps) {
  const { snapshot, loading, error, refresh } = useWorkspaceSnapshot();
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    label: "",
    clientId: "",
    amountCents: 0,
    dueDate: "",
    status: "draft" as "draft" | "issued" | "pending" | "paid",
  });
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [schedules, setSchedules] = useState<{ id: string; label: string; amountCents: number; frequency: string; status: string; clientId: string | null; nextInvoiceDate: Date | null }[]>([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    label: "",
    clientId: "",
    amountCents: 0,
    frequency: "monthly" as "monthly" | "quarterly" | "yearly",
    startDate: "",
  });
  const [savingSchedule, setSavingSchedule] = useState(false);

  useEffect(() => {
    getBillingSchedules({ status: "active" }).then((rows) =>
      setSchedules(
        rows.map((r) => ({
          id: r.id,
          label: r.label,
          amountCents: r.amountCents,
          frequency: r.frequency,
          status: r.status,
          clientId: r.clientId,
          nextInvoiceDate: r.nextInvoiceDate,
        }))
      )
    );
  }, []);

  const incomeTransactions = snapshot.transactions.filter((transaction) => transaction.type === "income");
  const expenseTransactions = snapshot.transactions.filter((transaction) => transaction.type === "expense");
  const totalIncome = incomeTransactions.reduce((total, transaction) => total + transaction.amountCents, 0);
  const totalExpenses = expenseTransactions.reduce((total, transaction) => total + transaction.amountCents, 0);
  const netCash = totalIncome - totalExpenses;
  const pendingInvoices = snapshot.invoices.filter((invoice) => isOutstandingInvoiceStatus(invoice.status));
  const pendingInvoiceAmount = pendingInvoices.reduce((total, invoice) => total + invoice.amountCents, 0);
  const averageMonthlyExpense = expenseTransactions.length > 0 ? totalExpenses / Math.max(1, expenseTransactions.length) : 0;
  const runwayMonths = averageMonthlyExpense > 0 ? netCash / averageMonthlyExpense : 0;

  const expenseCategories = useMemo<ExpenseCategory[]>(() => {
    const totals = new Map<string, number>();

    for (const transaction of expenseTransactions) {
      const key = transaction.category?.trim() || "Sin categoría";
      totals.set(key, (totals.get(key) ?? 0) + transaction.amountCents);
    }

    const amountTotal = Array.from(totals.values()).reduce((sum, value) => sum + value, 0);

    return Array.from(totals.entries())
      .map(([category, amountCents]) => ({
        category,
        amountCents,
        percent: amountTotal > 0 ? Math.round((amountCents / amountTotal) * 100) : 0,
      }))
      .sort((left, right) => right.amountCents - left.amountCents)
      .slice(0, 5);
  }, [expenseTransactions]);

  const ledgerRows = [...snapshot.transactions]
    .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())
    .slice(0, 8);

  const receivableClients = [...pendingInvoices]
    .sort((left, right) => right.amountCents - left.amountCents)
    .slice(0, 4);

  if (loading) {
    return <LoadingWorkspacePanel label="Cargando finanzas operativas reales..." />;
  }

  if (error) {
    return <ErrorWorkspacePanel message={error} onRetry={refresh} />;
  }

  if (
    snapshot.transactions.length === 0 &&
    snapshot.invoices.length === 0 &&
    snapshot.deals.length === 0 &&
    snapshot.clients.length === 0
  ) {
    return (
      <EmptyWorkspacePanel
        title="Aún no hay movimientos financieros reales"
        description="Registra transacciones, facturas o deals comerciales para activar el tablero financiero operativo."
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight text-foreground">
              Finanzas Operativas
              <span className="flex items-center gap-1.5 rounded border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
                Sync Live
              </span>
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <Wallet className="h-4 w-4" /> Caja disponible: <span className="font-mono font-medium text-foreground">{formatMoney(netCash)}</span>
              </p>
              <div className="h-4 w-px bg-border"></div>
              <p className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-500" /> Runway proyectado: <span className="font-medium text-foreground">{runwayMonths > 0 ? `${runwayMonths.toFixed(1)} meses` : "Sin cálculo"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/api/admin/export/transactions"
              className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
              download
            >
              Exportar Transacciones
            </a>
            <a
              href="/api/admin/export/invoices"
              className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
              download
            >
              Exportar Invoices
            </a>
            <button className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80" onClick={refresh}>
              Actualizar
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_0_15px_rgba(0,255,135,0.2)] transition-all hover:shadow-[0_0_25px_rgba(0,255,135,0.4)]" onClick={() => setShowInvoiceForm(true)}>
              <FilePlus className="h-4 w-4" /> Nueva factura
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_0_15px_rgba(0,255,135,0.2)] transition-all hover:shadow-[0_0_25px_rgba(0,255,135,0.4)]" onClick={() => setShowScheduleForm(true)}>
              <Repeat className="h-4 w-4" /> Billing Schedule
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_0_15px_rgba(0,255,135,0.2)] transition-all hover:shadow-[0_0_25px_rgba(0,255,135,0.4)]" onClick={() => open("registerTransaction", { type: "income" })}>
              <Receipt className="h-4 w-4" /> Nueva transacción
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Ingresos" value={formatMoney(totalIncome)} detail={`${formatNumber(incomeTransactions.length)} movimientos`} icon={TrendingUp} accent="text-primary" positive />
        <MetricCard title="Gastos" value={formatMoney(totalExpenses)} detail={`${formatNumber(expenseTransactions.length)} egresos`} icon={TrendingDown} accent="text-amber-400" />
        <MetricCard title="Pendiente por cobrar" value={formatMoney(pendingInvoiceAmount)} detail={`${formatNumber(pendingInvoices.length)} facturas`} icon={CalendarDays} accent="text-destructive" />
        <MetricCard title="Balance neto" value={formatMoney(netCash)} detail={netCash >= 0 ? "Caja positiva" : "Caja en revisión"} icon={DollarSign} accent={netCash >= 0 ? "text-blue-400" : "text-destructive"} positive={netCash >= 0} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-xl border border-border bg-card xl:col-span-1">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <BarChart3 className="h-5 w-5 text-muted-foreground" /> Análisis de gastos
            </h2>
            <button className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground" onClick={() => open("registerTransaction", { type: "expense" })}>
              Registrar gasto
            </button>
          </div>
          <div className="space-y-4 p-5">
            {expenseCategories.length > 0 ? (
              expenseCategories.map((item) => (
                <div key={item.category} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-foreground">{item.category}</span>
                    <span className="font-mono text-muted-foreground">{formatMoney(item.amountCents)}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${item.percent}%` }}></div>
                  </div>
                  <p className="text-right text-xs text-muted-foreground">{item.percent}% del burn</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No hay egresos reales registrados todavía.</p>
            )}
          </div>
        </div>

        <div className="space-y-6 xl:col-span-2">
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-lg font-semibold text-foreground">Cobranza e invoices abiertas</h2>
              <span className="text-xs text-muted-foreground">Clientes con saldo pendiente</span>
            </div>
            <div className="grid gap-3 p-4 md:grid-cols-2">
              {receivableClients.length > 0 ? (
                receivableClients.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="cursor-pointer rounded-xl border border-border/60 bg-secondary/20 p-4 transition-colors hover:border-primary/30"
                    onClick={() => open("invoiceDetail", invoice.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{invoice.label}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{invoice.clientName ?? invoice.invoiceNumber}</p>
                      </div>
                      <span className="rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {invoice.status}
                      </span>
                    </div>
                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-primary">{formatMoney(invoice.amountCents)}</p>
                        <p className="text-xs text-muted-foreground">{invoice.dueDate ? formatDateTime(invoice.dueDate) : "Sin vencimiento"}</p>
                      </div>
                      <button
                        className="rounded-lg border border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-foreground transition-colors hover:border-primary/30 hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          open("registerTransaction", { type: "income" });
                        }}
                      >
                        Registrar pago
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-secondary/20 px-6 py-10 text-sm text-muted-foreground md:col-span-2">
                  No hay facturas abiertas pendientes de cobro.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-lg font-semibold text-foreground">Ledger transaccional</h2>
              <span className="text-xs text-muted-foreground">Últimos {ledgerRows.length} movimientos</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border/50 bg-secondary/10 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">Entidad</th>
                    <th className="px-5 py-3">Concepto</th>
                    <th className="px-5 py-3">Fecha</th>
                    <th className="px-5 py-3 text-right">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerRows.length > 0 ? (
                    ledgerRows.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="cursor-pointer border-b border-border/30 transition-colors hover:bg-secondary/30"
                        onClick={() => open("transactionDetail", transaction.id)}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`rounded-lg border p-2 ${transaction.type === "income" ? "border-primary/20 bg-primary/10 text-primary" : "border-amber-500/20 bg-amber-500/10 text-amber-500"}`}>
                              {transaction.type === "income" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{transaction.clientName ?? transaction.projectName ?? "Vertrex"}</p>
                              <p className="text-xs text-muted-foreground">{transaction.category ?? transaction.type}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{transaction.description ?? "Sin descripción"}</td>
                        <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{formatDateTime(transaction.occurredAt)}</td>
                        <td className={`px-5 py-3 text-right font-mono font-semibold ${transaction.type === "income" ? "text-primary" : "text-amber-500"}`}>
                          {transaction.type === "income" ? "+" : "-"}
                          {formatMoney(transaction.amountCents)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-5 py-8 text-sm text-muted-foreground" colSpan={4}>
                        Todavía no hay movimientos registrados en el ledger operativo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-xl border border-border bg-card xl:col-span-1">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Repeat className="h-5 w-5 text-muted-foreground" /> Billing Schedules
            </h2>
            <button className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground" onClick={() => setShowScheduleForm(true)}>
              Crear schedule
            </button>
          </div>
          <div className="space-y-3 p-4">
            {schedules.length > 0 ? (
              schedules.map((schedule) => (
                <div key={schedule.id} className="rounded-xl border border-border/60 bg-secondary/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{schedule.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {snapshot.clients.find((c) => c.id === schedule.clientId)?.name ?? "Sin cliente"} · {schedule.frequency}
                      </p>
                    </div>
                    <span className="rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {schedule.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <p className="text-sm font-semibold text-primary">{formatMoney(schedule.amountCents)}</p>
                    <button
                      className="text-destructive hover:text-destructive/80"
                      onClick={async () => {
                        await deleteBillingSchedule(schedule.id);
                        const updated = await getBillingSchedules({ status: "active" });
                        setSchedules(updated.map((r) => ({ id: r.id, label: r.label, amountCents: r.amountCents, frequency: r.frequency, status: r.status, clientId: r.clientId, nextInvoiceDate: r.nextInvoiceDate })));
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No hay billing schedules activos.</p>
            )}
          </div>
        </div>

        <div className="space-y-6 xl:col-span-2">
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-lg font-semibold text-foreground">Cobranza e invoices abiertas</h2>
              <span className="text-xs text-muted-foreground">Clientes con saldo pendiente</span>
            </div>
            <div className="grid gap-3 p-4 md:grid-cols-2">
              {receivableClients.length > 0 ? (
                receivableClients.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="cursor-pointer rounded-xl border border-border/60 bg-secondary/20 p-4 transition-colors hover:border-primary/30"
                    onClick={() => open("invoiceDetail", invoice.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{invoice.label}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{invoice.clientName ?? invoice.invoiceNumber}</p>
                      </div>
                      <span className="rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {invoice.status}
                      </span>
                    </div>
                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-primary">{formatMoney(invoice.amountCents)}</p>
                        <p className="text-xs text-muted-foreground">{invoice.dueDate ? formatDateTime(invoice.dueDate) : "Sin vencimiento"}</p>
                      </div>
                      <button
                        className="rounded-lg border border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-foreground transition-colors hover:border-primary/30 hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          open("registerTransaction", { type: "income" });
                        }}
                      >
                        Registrar pago
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-secondary/20 px-6 py-10 text-sm text-muted-foreground md:col-span-2">
                  No hay facturas abiertas pendientes de cobro.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-lg font-semibold text-foreground">Ledger transaccional</h2>
              <span className="text-xs text-muted-foreground">Últimos {ledgerRows.length} movimientos</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border/50 bg-secondary/10 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">Entidad</th>
                    <th className="px-5 py-3">Concepto</th>
                    <th className="px-5 py-3">Fecha</th>
                    <th className="px-5 py-3 text-right">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerRows.length > 0 ? (
                    ledgerRows.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="cursor-pointer border-b border-border/30 transition-colors hover:bg-secondary/30"
                        onClick={() => open("transactionDetail", transaction.id)}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`rounded-lg border p-2 ${transaction.type === "income" ? "border-primary/20 bg-primary/10 text-primary" : "border-amber-500/20 bg-amber-500/10 text-amber-500"}`}>
                              {transaction.type === "income" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{transaction.clientName ?? transaction.projectName ?? "Vertrex"}</p>
                              <p className="text-xs text-muted-foreground">{transaction.category ?? transaction.type}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{transaction.description ?? "Sin descripción"}</td>
                        <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{formatDateTime(transaction.occurredAt)}</td>
                        <td className={`px-5 py-3 text-right font-mono font-semibold ${transaction.type === "income" ? "text-primary" : "text-amber-500"}`}>
                          {transaction.type === "income" ? "+" : "-"}
                          {formatMoney(transaction.amountCents)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-5 py-8 text-sm text-muted-foreground" colSpan={4}>
                        Todavía no hay movimientos registrados en el ledger operativo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showInvoiceForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground">Nueva factura</h3>
            <p className="mt-1 text-sm text-muted-foreground">Crear invoice desde deal o proyecto</p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Concepto</label>
                <input
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  value={invoiceForm.label}
                  onChange={(e) => setInvoiceForm((prev) => ({ ...prev, label: e.target.value }))}
                  placeholder="Ej: Factura mensualidad Abril"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Cliente</label>
                <select
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  value={invoiceForm.clientId}
                  onChange={(e) => setInvoiceForm((prev) => ({ ...prev, clientId: e.target.value }))}
                >
                  <option value="">Seleccionar cliente...</option>
                  {snapshot.clients.map((client) => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Monto (centavos)</label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                    value={invoiceForm.amountCents}
                    onChange={(e) => setInvoiceForm((prev) => ({ ...prev, amountCents: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Vencimiento</label>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Estado inicial</label>
                <select
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  value={invoiceForm.status}
                  onChange={(e) => setInvoiceForm((prev) => ({ ...prev, status: e.target.value as typeof invoiceForm.status }))}
                >
                  <option value="draft">Borrador</option>
                  <option value="issued">Emitida</option>
                  <option value="pending">Pendiente</option>
                  <option value="paid">Pagada</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
                onClick={() => setShowInvoiceForm(false)}
              >
                Cancelar
              </button>
              <button
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                disabled={!invoiceForm.label || !invoiceForm.clientId || savingInvoice}
                onClick={async () => {
                  setSavingInvoice(true);
                  try {
                    await requestWorkspaceMutation(
                      {
                        kind: "invoice",
                        payload: {
                          label: invoiceForm.label,
                          clientId: invoiceForm.clientId,
                          amountCents: invoiceForm.amountCents,
                          dueDate: invoiceForm.dueDate || undefined,
                          status: invoiceForm.status,
                        },
                      },
                      "Error al crear factura"
                    );
                    setShowInvoiceForm(false);
                    setInvoiceForm({ label: "", clientId: "", amountCents: 0, dueDate: "", status: "draft" });
                    refresh();
                  } catch {
                    // handled by requestWorkspaceMutation
                  } finally {
                    setSavingInvoice(false);
                  }
                }}
              >
                {savingInvoice ? "Guardando..." : "Crear factura"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showScheduleForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground">Nuevo Billing Schedule</h3>
            <p className="mt-1 text-sm text-muted-foreground">Facturación recurrente automática</p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Concepto</label>
                <input
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  value={scheduleForm.label}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, label: e.target.value }))}
                  placeholder="Ej: Mantenimiento mensual"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Cliente</label>
                <select
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  value={scheduleForm.clientId}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, clientId: e.target.value }))}
                >
                  <option value="">Seleccionar cliente...</option>
                  {snapshot.clients.map((client) => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Monto (centavos)</label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                    value={scheduleForm.amountCents}
                    onChange={(e) => setScheduleForm((prev) => ({ ...prev, amountCents: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Frecuencia</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                    value={scheduleForm.frequency}
                    onChange={(e) => setScheduleForm((prev) => ({ ...prev, frequency: e.target.value as typeof scheduleForm.frequency }))}
                  >
                    <option value="monthly">Mensual</option>
                    <option value="quarterly">Trimestral</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Fecha inicio</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  value={scheduleForm.startDate}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
                onClick={() => setShowScheduleForm(false)}
              >
                Cancelar
              </button>
              <button
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                disabled={!scheduleForm.label || !scheduleForm.clientId || savingSchedule}
                onClick={async () => {
                  setSavingSchedule(true);
                  try {
                    await createBillingSchedule({
                      label: scheduleForm.label,
                      clientId: scheduleForm.clientId,
                      amountCents: scheduleForm.amountCents,
                      frequency: scheduleForm.frequency,
                      startDate: new Date(scheduleForm.startDate),
                    });
                    setShowScheduleForm(false);
                    setScheduleForm({ label: "", clientId: "", amountCents: 0, frequency: "monthly", startDate: "" });
                    const updated = await getBillingSchedules({ status: "active" });
                    setSchedules(updated.map((r) => ({ id: r.id, label: r.label, amountCents: r.amountCents, frequency: r.frequency, status: r.status, clientId: r.clientId, nextInvoiceDate: r.nextInvoiceDate })));
                    refresh();
                  } catch {
                    // handled
                  } finally {
                    setSavingSchedule(false);
                  }
                }}
              >
                {savingSchedule ? "Guardando..." : "Crear schedule"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

async function requestWorkspaceMutation(body: Record<string, unknown>, fallbackMessage: string) {
  const response = await fetch("/api/admin/workspace", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error ?? fallbackMessage);
  }
  return payload;
}

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
  accent,
  positive,
}: {
  title: string;
  value: string;
  detail: string;
  icon: typeof TrendingUp;
  accent: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className={`mt-2 text-2xl font-semibold tracking-tight ${accent}`}>{value}</h3>
        </div>
        <div className="rounded-lg bg-secondary/60 p-2">
          <Icon className={`h-4 w-4 ${accent}`} />
        </div>
      </div>
      <p className={`text-xs ${positive ? "text-primary" : "text-muted-foreground"}`}>{detail}</p>
    </div>
  );
}
