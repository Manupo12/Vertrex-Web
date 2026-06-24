"use client";

import { formatRelativeTime } from "@/lib/format";
import { UserIcon } from "lucide-react";
import { EntityMentionRenderer } from "../Editor/EntityMentionRenderer";

// Parser for rich @mentions within comment bodies, rendering them as EntityMentionRenderer chips.
const renderBody = (text: string) => {
  // Regex to match mentions: @type:id[label]
  const mentionRegex = /@(\w+):([a-zA-Z0-9-]+)\[([^\]]+)\]/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex, match.index)}</span>);
    }
    parts.push(
      <EntityMentionRenderer 
        key={`mention-${match.index}`} 
        entityType={match[1]} 
        entityId={match[2]} 
        label={match[3]} 
      />
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : text;
};

export interface CommentThreadProps {
  comments: any[];
  users: any[];
  clients?: any[];
  onReply?: (commentId: string) => void;
  onEdit?: (commentId: string) => void;
  onDelete?: (commentId: string) => void;
  currentUserId?: string;
}

export function CommentThread({ comments, users, clients = [], onReply, onEdit, onDelete, currentUserId }: CommentThreadProps) {
  if (comments.length === 0) {
    return <div className="text-sm text-[var(--color-muted-foreground)] py-4 text-center">No hay comentarios todavía.</div>;
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => {
        const isClient = comment.authorType === "client";
        const author = isClient 
          ? clients.find(c => c.id === comment.authorId) 
          : users.find(u => u.id === comment.authorId);
        
        const isAuthor = comment.authorId === currentUserId;

        return (
          <div key={comment.id} className="flex gap-4 group">
            <div className="shrink-0 mt-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isClient ? 'bg-orange-500/20 text-orange-500' : 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'}`}>
                {author?.name ? author.name.substring(0, 2).toUpperCase() : <UserIcon className="h-4 w-4" />}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-semibold text-sm mr-2">{author?.name || "Usuario"}</span>
                    {isClient && <span className="text-[10px] uppercase font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded mr-2">Cliente</span>}
                    <span className="text-xs text-[var(--color-muted-foreground)]">{formatRelativeTime(comment.createdAt)}</span>
                  </div>
                </div>
                <div className="text-sm text-[var(--color-foreground)] whitespace-pre-wrap">
                  {renderBody(comment.body)}
                </div>
              </div>
              <div className="flex gap-3 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onReply?.(comment.id)} className="text-xs font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">Responder</button>
                {isAuthor && onEdit && (
                  <button onClick={() => onEdit(comment.id)} className="text-xs font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">Editar</button>
                )}
                {isAuthor && onDelete && (
                  <button onClick={() => onDelete(comment.id)} className="text-xs font-medium text-[var(--color-destructive)] hover:text-[var(--color-destructive)]">Eliminar</button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
