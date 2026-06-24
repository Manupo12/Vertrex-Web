import { db } from "@/lib/db";
import { finances } from "@/lib/db/schema";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { requireOsUser } from "@/lib/auth/session";
import { addWeeks, format, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { FinanceTabs } from "../FinanceTabs";

export default async function CashflowPage() {
  await requireOsUser();
  const allFinances = await db.select().from(finances);

  const now = new Date();
  const weeks: { label: string; income: number; expenses: number; balance: number }[] = [];

  for (let w = 0; w < 13; w++) {
    const weekStart = startOfWeek(addWeeks(now, w), { weekStartsOn: 1 });
    const weekEnd = startOfWeek(addWeeks(now, w + 1), { weekStartsOn: 1 });

    let income = 0;
    let expenses = 0;

    for (const f of allFinances) {
      if (f.type === "ingreso" && f.status === "pending" && f.dueDate) {
        if (f.dueDate >= weekStart && f.dueDate < weekEnd) {
          income += f.amountCop;
        }
      }
      if (f.type === "gasto") {
        if (f.status === "pending" && f.dueDate && f.dueDate >= weekStart && f.dueDate < weekEnd) {
          expenses += f.amountCop;
        }
        if (f.recurrence === "monthly" && f.nextDueDate) {
          const projected = new Date(f.nextDueDate);
          while (projected < weekEnd) {
            if (projected >= weekStart) {
              expenses += f.amountCop;
            }
            projected.setMonth(projected.getMonth() + 1);
          }
        }
      }
    }

    weeks.push({
      label: format(weekStart, "d MMM", { locale: es }),
      income,
      expenses,
      balance: income - expenses,
    });
  }

  const runningBalance = weeks.reduce((sum, w) => sum + w.balance, 0);
  const totalPendingIncome = weeks.reduce((sum, w) => sum + w.income, 0);
  const totalProjectedExpenses = weeks.reduce((sum, w) => sum + w.expenses, 0);

  return (
    <div>
      <PageHeader title="Proyección de Caja" description="Ingresos pendientes y gastos recurrentes a 90 días." breadcrumbs={[{ label: "Finanzas", href: "/os/finances" }, { label: "Cashflow" }]} />
      
      <FinanceTabs activeTab="cashflow" />
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-4">
          <div className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wider mb-1">Ingresos pendientes</div>
          <div className="font-medium text-2xl text-green-500">${totalPendingIncome.toLocaleString()}</div>
        </div>
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-4">
          <div className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wider mb-1">Gastos proyectados</div>
          <div className="font-medium text-2xl text-red-500">${totalProjectedExpenses.toLocaleString()}</div>
        </div>
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-4">
          <div className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wider mb-1">Balance neto 90d</div>
          <div className={`font-medium text-2xl ${runningBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>${runningBalance.toLocaleString()}</div>
        </div>
      </div>
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/30">
              <th className="text-left px-4 py-3 font-medium">Semana</th>
              <th className="text-right px-4 py-3 font-medium">Ingresos</th>
              <th className="text-right px-4 py-3 font-medium">Gastos</th>
              <th className="text-right px-4 py-3 font-medium">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {weeks.map((w, i) => (
              <tr key={i} className="hover:bg-[var(--color-muted)]/20 transition-colors">
                <td className="px-4 py-3">{w.label}</td>
                <td className="px-4 py-3 text-right text-green-500">${w.income.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-red-500">${w.expenses.toLocaleString()}</td>
                <td className={`px-4 py-3 text-right font-medium ${w.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>${w.balance.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
