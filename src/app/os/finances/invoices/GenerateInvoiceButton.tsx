"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash, FileText } from "lucide-react";
import { toast } from "sonner";
import { generateInvoiceAction } from "@/lib/db/actions/finances";
import { getProjectMilestonesAction } from "@/lib/db/actions/milestones";

export function GenerateInvoiceButton({ projects }: { projects: { id: string; name: string }[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [milestones, setMilestones] = useState<any[]>([]);
  const [milestoneId, setMilestoneId] = useState<string>("none");
  const [items, setItems] = useState<{ description: string; amount: number }[]>([
    { description: "", amount: 0 }
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (projectId) {
      getProjectMilestonesAction(projectId).then(setMilestones).catch(() => setMilestones([]));
    } else {
      setMilestones([]);
    }
    setMilestoneId("none");
  }, [projectId]);

  const addItem = () => {
    setItems([...items, { description: "", amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: "description" | "amount", value: any) => {
    const next = [...items];
    if (field === "amount") {
      next[index].amount = parseInt(value, 10) || 0;
    } else {
      next[index].description = value;
    }
    setItems(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      toast.error("Seleccione un proyecto");
      return;
    }
    if (items.some(i => !i.description.trim() || i.amount <= 0)) {
      toast.error("Complete todos los ítems con montos válidos");
      return;
    }
    setLoading(true);
    try {
      await generateInvoiceAction(
        projectId,
        milestoneId === "none" ? null : milestoneId,
        items
      );
      toast.success("Cuenta de cobro generada exitosamente");
      setIsOpen(false);
      // Reset form
      setProjectId("");
      setMilestones([]);
      setMilestoneId("none");
      setItems([{ description: "", amount: 0 }]);
      window.location.reload(); // Refresh the page to show the new invoice
    } catch (err: any) {
      toast.error("Error al generar cuenta de cobro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="inline-flex items-center gap-2">
          <Plus className="h-4 w-4" /> Generar cuenta
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generar Cuenta de Cobro</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label>Proyecto *</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="w-full bg-background mt-1">
                <SelectValue placeholder="Seleccione un proyecto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {projectId && milestones.length > 0 && (
            <div>
              <Label>Hito Asociado (Opcional)</Label>
              <Select value={milestoneId} onValueChange={setMilestoneId}>
                <SelectTrigger className="w-full bg-background mt-1">
                  <SelectValue placeholder="Seleccione un hito" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguno</SelectItem>
                  {milestones.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Ítems de Cobro *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-8">
                <Plus className="h-4 w-4 mr-1" /> Añadir Ítem
              </Button>
            </div>
            {items.map((item, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  placeholder="Descripción del concepto"
                  value={item.description}
                  onChange={e => updateItem(index, "description", e.target.value)}
                  className="flex-1"
                  required
                />
                <Input
                  type="number"
                  placeholder="Monto (COP)"
                  value={item.amount || ""}
                  onChange={e => updateItem(index, "amount", e.target.value)}
                  className="w-32"
                  min="1"
                  required
                />
                {items.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)} className="h-9 w-9 text-red-500 hover:text-red-700">
                    <Trash className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Generando..." : "Generar Cuenta de Cobro"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
