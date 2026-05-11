"use client";
import { GlobalHotkeys } from "./GlobalHotkeys";

export function GlobalHotkeysWrapper() {
  const handleQuickTask = () => {
    window.dispatchEvent(new CustomEvent("open-quick-task"));
  };
  return <GlobalHotkeys onQuickTask={handleQuickTask} />;
}
