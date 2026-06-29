import {
  getFinanceById,
  createFinanceAction,
} from "@/lib/db/actions/finances";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EntitySidebar } from "@/components/os/Graph/EntitySidebar";
import { EntityConnectSheet } from "@/components/os/actions/EntityConnectSheet";
import { notFound } from "next/navigation";
import { FinanceDetailClient } from "./FinanceDetailClient";

interface Props {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ projectId?: string }>;
}

export default async function FinanceDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { projectId } = (await searchParams) || {};

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
              {projectId && <input type="hidden" name="project_id" value={projectId} />}
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
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">
                  Recurrencia
                </label>
                <select
                  name="recurrence"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="none">Ninguna</option>
                  <option value="monthly">Mensual</option>
                  <option value="yearly">Anual</option>
                </select>
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
          <FinanceDetailClient finance={finance} />
        </div>
        <div className="w-full shrink-0 lg:w-72">
          <EntitySidebar entityId={finance.id} />
        </div>
      </div>
    </div>
  );
}
