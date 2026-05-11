"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export interface CommentInputProps {
  onSubmit: (body: string) => Promise<void>;
  placeholder?: string;
  buttonLabel?: string;
}

export function CommentInput({ onSubmit, placeholder = "Escribe un comentario...", buttonLabel = "Comentar" }: CommentInputProps) {
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!body.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(body);
      setBody("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full bg-transparent border-none outline-none resize-none text-sm placeholder:text-[var(--color-muted-foreground)] min-h-[60px]"
        disabled={isSubmitting}
      />
      <div className="flex justify-between items-center mt-2 pt-2 border-t border-[var(--color-border)]">
        <div className="text-xs text-[var(--color-muted-foreground)] flex items-center gap-1">
          <span className="hidden sm:inline">Usa <kbd className="bg-[var(--color-muted)] px-1 rounded">@</kbd> para mencionar</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-muted-foreground)] hidden sm:inline">Ctrl+Enter</span>
          <Button onClick={handleSubmit} disabled={!body.trim() || isSubmitting} size="sm">
            {isSubmitting ? "Enviando..." : buttonLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
