"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { IdentifierChip } from "./IdentifierChip";
import { TaskStatePill } from "./TaskStatePill";
import { PriorityDot } from "./PriorityDot";
import { formatShortDate } from "@/lib/format";
import { useState, useEffect } from "react";
import { deleteTaskAction } from "@/lib/db/actions/tasks";
import { listCommentsAction, addCommentAction } from "@/lib/db/actions/comments";
import { toast } from "sonner";
import { TrashIcon } from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";

export interface TaskDetailSheetProps {
  task: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditFull?: () => void;
  onDelete?: () => void;
  users?: any[];
}

export function TaskDetailSheet({ task, open, onOpenChange, onEditFull, onDelete, users = [] }: TaskDetailSheetProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (open && task) {
      listCommentsAction("task", task.id).then(setComments).catch(() => {});
    }
  }, [open, task]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !task) return;
    try {
      await addCommentAction("task", task.id, newComment.trim());
      setNewComment("");
      const updated = await listCommentsAction("task", task.id);
      setComments(updated);
      toast.success("Comentario agregado");
    } catch {
      toast.error("Error al agregar comentario");
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    setIsDeleting(true);
    try {
      await deleteTaskAction(task.id);
      toast.success("Tarea eliminada");
      onDelete?.();
      onOpenChange(false);
    } catch {
      toast.error("Error al eliminar la tarea");
    } finally {
      setIsDeleting(false);
      setShowDeleteAlert(false);
    }
  };

  if (!task) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-[600px] w-[90vw] overflow-y-auto" style={{ maxWidth: "720px" }}>
          <SheetHeader className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <IdentifierChip identifier={task.identifier} />
              <TaskStatePill state={task.state} />
              <PriorityDot priority={task.priority} showLabel />
              <button
                onClick={() => setShowDeleteAlert(true)}
                className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-md text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 transition-colors"
                title="Eliminar tarea"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
            <SheetTitle className="text-xl">{task.title}</SheetTitle>
          </SheetHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="text-sm text-[var(--color-foreground)]">
                <p className="opacity-70 italic">Descripción de la tarea...</p>
              </div>
              {onEditFull && (
                <button
                  onClick={onEditFull}
                  className="text-sm text-[var(--color-primary)] hover:underline"
                >
                  Abrir en pantalla completa para editar
                </button>
              )}
            </div>
            <div className="space-y-4">
              <div className="rounded-lg border border-[var(--color-border)] p-4 space-y-3 bg-[var(--color-card)]">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Propiedades</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-[var(--color-muted-foreground)]">Estado</span>
                  <span>{task.state}</span>
                  <span className="text-[var(--color-muted-foreground)]">Prioridad</span>
                  <span>{task.priority}</span>
                  <span className="text-[var(--color-muted-foreground)]">Vencimiento</span>
                  <span>{formatShortDate(task.dueDate) || "-"}</span>
                </div>
              </div>
            </div>
          </div>

          <details className="mt-6 border-t border-[var(--color-border)] pt-4">
            <summary className="text-sm font-semibold cursor-pointer text-[var(--color-foreground)]">
              Comentarios ({comments.length})
            </summary>
            <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-sm text-[var(--color-muted-foreground)] py-2">No hay comentarios todavía.</p>
              ) : (
                comments.map(c => {
                  const author = users.find(u => u.id === c.authorId);
                  return (
                    <div key={c.id} className="text-sm p-3 bg-[var(--color-muted)]/20 rounded-lg border border-[var(--color-border)]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-xs">{author?.name || "Usuario"}</span>
                        <span className="text-xs text-[var(--color-muted-foreground)]">
                          {c.authorType === "team" ? "Equipo" : "Cliente"}
                        </span>
                      </div>
                      <p className="text-[var(--color-foreground)] whitespace-pre-wrap">{c.body}</p>
                    </div>
                  );
                })
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <textarea
                className="flex-1 text-xs bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-2 py-1.5 min-h-[36px] resize-none"
                rows={1}
                placeholder="Añadir comentario..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
              />
              <button
                onClick={handleAddComment}
                className="text-xs px-3 py-1.5 rounded-md bg-[var(--color-primary)] text-[var(--color-primary-foreground)] font-medium hover:opacity-90 transition-opacity shrink-0"
              >
                Comentar
              </button>
            </div>
          </details>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar tarea</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de eliminar la tarea <strong>{task?.identifier}</strong>? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={isDeleting} onClick={handleDelete}>
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
