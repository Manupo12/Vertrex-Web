"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Send, Trash2, Edit2, Check, X } from "lucide-react";
import { getComments, addComment, updateComment, deleteComment, type CommentEntityType, type CommentRecord } from "@/lib/comments/comment-service";
import { formatDateTime } from "@/components/os/workspace-ui";

interface CommentsSectionProps {
  entityType: CommentEntityType;
  entityId: string;
  currentUser?: string;
}

export function CommentsSection({ entityType, entityId, currentUser = "Usuario" }: CommentsSectionProps) {
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const loadComments = async () => {
    try {
      const data = await getComments(entityType, entityId);
      setComments(data);
    } catch (err) {
      console.error("Error loading comments:", err);
    }
  };

  useEffect(() => {
    loadComments();
  }, [entityType, entityId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      await addComment(entityType, entityId, currentUser, newComment);
      setNewComment("");
      await loadComments();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      await updateComment(commentId, editContent);
      setEditingId(null);
      await loadComments();
    } catch (err) {
      console.error("Error updating comment:", err);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("¿Eliminar este comentario?")) return;

    try {
      await deleteComment(commentId);
      await loadComments();
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <MessageSquare className="h-4 w-4" />
        <span>Comentarios ({comments.length})</span>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Escribe un comentario..."
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !newComment.trim()}
          className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
          {loading ? "Enviando..." : "Enviar"}
        </button>
      </form>

      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">
            Sin comentarios aún. Sé el primero en comentar.
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="rounded-lg border border-border/60 bg-secondary/20 p-3">
              {editingId === comment.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(comment.id)}
                      className="flex items-center gap-1 rounded bg-primary px-2 py-1 text-xs text-primary-foreground"
                    >
                      <Check className="h-3 w-3" /> Guardar
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs"
                    >
                      <X className="h-3 w-3" /> Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-medium text-foreground">{comment.author}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {formatDateTime(comment.createdAt.toISOString())}
                      </span>
                    </div>
                    {comment.author === currentUser && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingId(comment.id);
                            setEditContent(comment.content);
                          }}
                          className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-foreground">{comment.content}</p>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
