import {
  getFinanceById,
  createFinanceAction,
  markFinancePaidAction,
} from "@/lib/db/actions/finances";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { EntitySidebar } from "@/components/os/Graph/EntitySidebar";
import { EntityConnectSheet } from "@/components/os/actions/EntityConnectSheet";
import { formatCurrencyCop, formatShortDate } from "@/lib/format";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FinanceDetailPage({ params }: Props) {
  const { id } = await params;

  if (id === "new") {
    return (
      <div>
        <PageHeader
          title="Nuevo movimiento"
          breadcrumbs={[
            { label: "Finanzas", href: "/os/finances" },
            { label: "Nuevo" },
          ]}
        />
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Crear movimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createFinanceAction} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">
                  Concepto *
                </label>
                <input
                  name="concept"
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">
                  Tipo
                </label>
                <select
                  name="type"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="ingreso">Ingreso</option>
                  <option value="gasto">Gasto</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">
                  Monto (COP) *
                </label>
                <input
                  name="amount_cop"
                  type="number"
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">
                  Estado
                </label>
                <select
                  name="status"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="pending">Pendiente</option>
                  <option value="paid">Pagado</option>
                  <option value="overdue">Vencido</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">
                  Fecha vencimiento
                </label>
                <input
                  name="due_date"
                  type="date"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Crear
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const finance = await getFinanceById(id);
  if (!finance) notFound();

  return (
    <div>
      <PageHeader
        title={finance.concept}
        breadcrumbs={[
          { label: "Finanzas", href: "/os/finances" },
          { label: finance.concept },
        ]}
        badge={<StatusBadge category="finance" status={finance.status} />}
        secondaryActions={<EntityConnectSheet sourceId={finance.id} sourceType="finance" />}
      />
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="mb-1 text-4xl font-bold">
                {formatCurrencyCop(finance.amountCop)}
              </p>
              <Badge
                variant={finance.type === "ingreso" ? "success" : "danger"}
              >
                {finance.type === "ingreso" ? "Ingreso" : "Gasto"}
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Detalles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Concepto</span>
                <span>{finance.concept}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado</span>
                <StatusBadge category="finance" status={finance.status} />
              </div>
              {finance.dueDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vence</span>
                  <span>{formatShortDate(finance.dueDate)}</span>
                </div>
              )}
              {finance.paidAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pagado</span>
                  <span>{formatShortDate(finance.paidAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>
          {finance.status !== "paid" && (
            <form action={markFinancePaidAction.bind(null, finance.id)}>
              <Button type="submit" variant="outline">
                <CheckCircle className="mr-2 h-4 w-4" />
                Marcar como pagado
              </Button>
            </form>
          )}
        </div>
        <div className="w-full shrink-0 lg:w-72">
          <EntitySidebar entityId={finance.id} />
        </div>
      </div>
    </div>
  );
}
