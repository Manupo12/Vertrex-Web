"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { updateProjectAction, deleteProjectAction } from "@/lib/db/actions/projects";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

import { Input } from "@/components/ui/input";
import { AsyncSubmitButton } from "@/components/os/ui/AsyncSubmitButton";

export function EditProjectForm({ project }: { project: { id: string; name: string; status: string; progress: number; currentVersion: string | null; githubRepoUrl?: string | null } }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setShowConfirmDelete(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProjectAction(project.id);
      toast.success("Proyecto eliminado");
      setOpen(false);
      router.push("/os/projects");
    } catch {
      toast.error("Error al eliminar el proyecto");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild><Button variant="ghost" size="sm"><Pencil className="mr-2 h-4 w-4" />Editar</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{showConfirmDelete ? "Eliminar proyecto" : "Editar proyecto"}</DialogTitle>
        </DialogHeader>
        {showConfirmDelete ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-foreground">
              ¿Estás seguro de que deseas eliminar el proyecto <strong>{project.name}</strong>?
            </p>
            <p className="text-xs text-muted-foreground bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-red-500">
              Esta acción no se puede deshacer y eliminará de manera permanente todas las tareas, hitos y ciclos relacionados.
            </p>
            <div className="flex gap-2">
              <Button
                variant="danger"
                className="flex-1"
                disabled={isDeleting}
                onClick={handleDelete}
              >
                {isDeleting ? "Eliminando..." : "Confirmar Eliminar"}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                disabled={isDeleting}
                onClick={() => setShowConfirmDelete(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <form action={async (fd) => {
            const urlVal = String(fd.get("github_repo_url") || "").trim();
            await updateProjectAction(project.id, { 
              name: String(fd.get("name")), 
              status: String(fd.get("status")), 
              progress: parseInt(String(fd.get("progress"))), 
              currentVersion: String(fd.get("current_version")),
              githubRepoUrl: urlVal || null
            });
            setOpen(false); toast.success("Proyecto actualizado");
          }} className="space-y-4">
            <div><label className="block text-sm font-medium text-muted-foreground mb-1">Nombre</label><Input name="name" defaultValue={project.name} required /></div>
            <div><label className="block text-sm font-medium text-muted-foreground mb-1">Versión</label><Input name="current_version" defaultValue={project.currentVersion || ""} /></div>
            <div><label className="block text-sm font-medium text-muted-foreground mb-1">Progreso (%)</label><Input name="progress" type="number" min="0" max="100" defaultValue={project.progress} /></div>
            <div><label className="block text-sm font-medium text-muted-foreground mb-1">Repositorio GitHub (URL)</label><Input name="github_repo_url" placeholder="https://github.com/usuario/repo" defaultValue={project.githubRepoUrl || ""} /></div>
            <div><label className="block text-sm font-medium text-muted-foreground mb-1">Estado</label>
              <select name="status" defaultValue={project.status} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="active">Activo</option>
                <option value="paused">Pausado</option>
                <option value="completed">Completado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
            <div className="flex gap-2">
              <AsyncSubmitButton className="flex-1">Guardar</AsyncSubmitButton>
              <Button type="button" variant="danger" onClick={() => setShowConfirmDelete(true)}>
                Eliminar
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
