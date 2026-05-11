"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { updateProjectAction } from "@/lib/db/actions/projects";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

import { Input } from "@/components/ui/input";
import { AsyncSubmitButton } from "@/components/os/ui/AsyncSubmitButton";

export function EditProjectForm({ project }: { project: { id: string; name: string; status: string; progress: number; currentVersion: string | null } }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="ghost" size="sm"><Pencil className="mr-2 h-4 w-4" />Editar</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar proyecto</DialogTitle></DialogHeader>
        <form action={async (fd) => {
          await updateProjectAction(project.id, { name: String(fd.get("name")), status: String(fd.get("status")), progress: parseInt(String(fd.get("progress"))), currentVersion: String(fd.get("current_version")) });
          setOpen(false); toast.success("Proyecto actualizado");
        }} className="space-y-4">
          <div><label className="block text-sm font-medium text-muted-foreground mb-1">Nombre</label><Input name="name" defaultValue={project.name} required /></div>
          <div><label className="block text-sm font-medium text-muted-foreground mb-1">Versi\u00f3n</label><Input name="current_version" defaultValue={project.currentVersion || ""} /></div>
          <div><label className="block text-sm font-medium text-muted-foreground mb-1">Progreso (%)</label><Input name="progress" type="number" min="0" max="100" defaultValue={project.progress} /></div>
          <div><label className="block text-sm font-medium text-muted-foreground mb-1">Estado</label>
            <select name="status" defaultValue={project.status} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="active">Activo</option>
              <option value="paused">Pausado</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
          <AsyncSubmitButton className="w-full">Guardar</AsyncSubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
