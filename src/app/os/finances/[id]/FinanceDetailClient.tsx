"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, CheckCircle, X } from "lucide-react";
import { formatCurrencyCop, formatShortDate } from "@/lib/format";
import { toast } from "sonner";
import {
  markFinancePaidAction,
  updateFinanceAction,
  deleteFinanceAction,
} from "@/lib/db/actions/finances";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface FinanceDetail {
  id: string;
  type: string;
  amountCop: number;
  status: string;
  concept: string;
  dueDate: Date | null;
  paidAt: Date | null;
  createdAt: Date;
}

export function FinanceDetailClient({ finance }: { finance: FinanceDetail }) {
  const [editing, setEditing] = useState(false);

  async function handleUpdate(formData: FormData) {
    try {
      await updateFinanceAction(finance.id, formData);
      setEditing(false);
      toast.success("Movimiento actualizado");
    } catch {
      toast.error("Error al actualizar");
    }
  }

  async function handleDelete() {
    await deleteFinanceAction(finance.id);
  }

  if (editing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Editar movimiento</span>
            <Button variant="ghost" size="icon" onClick={() => setEditing(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleUpdate} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Concepto *</label>
              <input name="concept" defaultValue={finance.concept} required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Tipo</label>
              <select name="type" defaultValue={finance.type}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="ingreso">Ingreso</option>
                <option value="gasto">Gasto</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Monto (COP) *</label>
              <input name="amount_cop" type="number" defaultValue={finance.amountCop} required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Estado</label>
              <select name="status" defaultValue={finance.status}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="pending">Pendiente</option>
                <option value="paid">Pagado</option>
                <option value="overdue">Vencido</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Fecha vencimiento</label>
              <input name="due_date" type="date"
                defaultValue={finance.dueDate ? new Date(finance.dueDate).toISOString().split("T")[0] : ""}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">Guardar</Button>
              <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="icon" onClick={() => setEditing(true)} title="Editar">
          <Pencil className="h-4 w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" title="Eliminar">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar movimiento</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro de eliminar &quot;{finance.concept}&quot;? Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Card>
        <CardContent className="pt-6 text-center">
          <p className="mb-1 text-4xl font-bold">{formatCurrencyCop(finance.amountCop)}</p>
          <Badge variant={finance.type === "ingreso" ? "success" : "danger"}>
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
        <form action={async () => { await markFinancePaidAction(finance.id); }}>
          <Button type="submit" variant="outline">
            <CheckCircle className="mr-2 h-4 w-4" />
            Marcar como pagado
          </Button>
        </form>
      )}
    </>
  );
}
