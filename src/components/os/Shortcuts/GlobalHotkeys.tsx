"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function GlobalHotkeys({ onQuickTask }: { onQuickTask: () => void }) {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) {
        return;
      }

      // Ctrl+. or Cmd+. for Quick Task
      if ((e.ctrlKey || e.metaKey) && e.key === ".") {
        e.preventDefault();
        onQuickTask();
        return;
      }

      // g+t, g+p, g+h, g+c navigation (requires handling a sequence, keeping it simple for now)
      // For simple single-key shortcuts if needed, but sequences require more state.
      // Let's implement a simple sequence detector
    };

    let keySequence = "";
    let sequenceTimeout: NodeJS.Timeout;

    const handleSequence = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) {
        return;
      }

      // Only handle printable characters for sequence
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        keySequence += e.key;
        
        clearTimeout(sequenceTimeout);
        sequenceTimeout = setTimeout(() => {
          keySequence = "";
        }, 1000);

        if (keySequence === "gt") {
          e.preventDefault();
          router.push("/os/projects/mine");
          keySequence = "";
        } else if (keySequence === "gp") {
          e.preventDefault();
          router.push("/os/projects");
          keySequence = "";
        } else if (keySequence === "gh") {
          e.preventDefault();
          router.push("/os/hub");
          keySequence = "";
        } else if (keySequence === "gc") {
          e.preventDefault();
          router.push("/os/crm");
          keySequence = "";
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keydown", handleSequence);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keydown", handleSequence);
      clearTimeout(sequenceTimeout);
    };
  }, [onQuickTask, router]);

  return null;
}
