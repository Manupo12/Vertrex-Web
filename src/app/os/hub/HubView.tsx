"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toolbar } from "@/components/os/layout/Toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { Lightbulb, BookOpen } from "lucide-react";
import { formatShortDate } from "@/lib/format";
import { toast } from "sonner";
import { updateIdeaStatus } from "@/lib/db/actions/hub";
import { KanbanBoard } from "@/components/os/data/KanbanBoard";
import { cn } from "@/lib/utils";

const KANBAN_COLUMNS = [
  { id: "semilla", label: "\ud83c\udf31 Semillas" },
  { id: "laboratorio", label: "\ud83e\uddfa Laboratorio" },
  { id: "ejecutar", label: "\ud83c\udfd7\ufe0f Para ejecutar" },
  { id: "congelador", label: "\ud83e\uddfa Congelador" },
];

import { useSearchParams } from "next/navigation";

export function HubView({
  notes,
  defaultView,
}: {
  notes: Array<{
    id: string;
    title: string;
    type: string;
    ideaStatus: string | null;
    nextStep: string | null;
    contentJson: unknown;
    createdAt: Date;
  }>;
  defaultView: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const view = searchParams.get("view") || defaultView;

  const setView = (v: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("view", v);
    router.push(`/os/hub?${params.toString()}`);
  };

  const ideas = notes.filter((n) => n.type === "software_idea");
  const regularNotes = notes.filter((n) => n.type === "note");

  const filteredIdeas = ideas.filter(
    (i) => !query || i.title.toLowerCase().includes(query.toLowerCase()),
  );

  const kanbanItems = filteredIdeas.map(i => ({
    ...i,
    id: i.id,
    status: i.ideaStatus || "semilla"
  }));

  const handleItemMove = async (itemId: string, newStatus: string) => {
    try {
      await updateIdeaStatus(itemId, newStatus as "semilla" | "laboratorio" | "ejecutar" | "congelador");
      toast.success("Estado actualizado");
      router.refresh();
    } catch {
      toast.error("Error al actualizar");
      throw new Error("Update failed");
    }
  };

  const renderIdeaCard = (i: { id: string; title: string; contentJson: unknown; nextStep: string | null; status: string }) => (
    <div
      onClick={() => router.push(`/os/hub/${i.id}`)}
      className={cn(
        "cursor-pointer rounded-lg border border-border bg-card p-3 border-l-2 transition-colors hover:bg-accent/30 shadow-sm",
        i.status === "semilla" && "border-l-green-500",
        i.status === "laboratorio" && "border-l-violet-500",
        i.status === "ejecutar" && "border-l-amber-500",
        i.status === "congelador" && "border-l-blue-500"
      )}
    >
      <p className="mb-1 text-sm font-medium text-foreground">
        {i.title}
      </p>
      <p className="mb-1 line-clamp-2 text-xs text-muted-foreground">
        {(typeof i.contentJson === "object" &&
          (
            i.contentJson as {
              content?: Array<{
                content?: Array<{ text?: string }>;
              }>;
            }
          )?.content?.[0]?.content?.[0]?.text) ||
          ""}
      </p>
      {i.nextStep && (
        <p className="mt-1 text-[10px] text-primary">
          \u2192 {i.nextStep}
        </p>
      )}
    </div>
  );

  const filteredNotes = regularNotes.filter(
    (n) => !query || n.title.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="flex gap-6 h-[calc(100vh-200px)]">
      <div className="w-64 shrink-0 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-4 hidden md:flex flex-col">
        <div className="mb-6">
          <h3 className="font-semibold text-sm text-[var(--color-muted-foreground)] uppercase tracking-wider mb-2">Daily</h3>
          <button 
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              router.push(`/os/hub/daily/${today}`);
            }}
            className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-[var(--color-muted)] transition-colors text-sm font-medium text-[var(--color-foreground)]"
          >
            <BookOpen className="h-4 w-4 text-[var(--color-primary)]" />
            Registro de hoy
          </button>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-sm text-[var(--color-muted-foreground)] uppercase tracking-wider mb-2">Filtros</h3>
          <div className="space-y-1">
            <button 
              onClick={() => setView("ideas")}
              className={cn("w-full flex justify-between items-center p-2 rounded-md transition-colors text-sm", view === "ideas" ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium" : "hover:bg-[var(--color-muted)] text-[var(--color-foreground)]")}
            >
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" /> Incubadora
              </div>
              <span className="text-xs bg-[var(--color-muted)] px-1.5 py-0.5 rounded text-[var(--color-muted-foreground)]">{ideas.length}</span>
            </button>
            <button 
              onClick={() => setView("notes")}
              className={cn("w-full flex justify-between items-center p-2 rounded-md transition-colors text-sm", view === "notes" ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium" : "hover:bg-[var(--color-muted)] text-[var(--color-foreground)]")}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Notas
              </div>
              <span className="text-xs bg-[var(--color-muted)] px-1.5 py-0.5 rounded text-[var(--color-muted-foreground)]">{regularNotes.length}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <Toolbar searchPlaceholder="Buscar notas e ideas..." onSearch={setQuery} />

        <div className="flex-1 overflow-y-auto mt-4">
          {view === "ideas" && (
            ideas.length === 0 && !query ? (
              <EmptyState
                icon={Lightbulb}
                title="Tu incubadora esta vacia"
                description="Presiona Ctrl+I para capturar tu primera idea."
              />
            ) : (
              <KanbanBoard 
                items={kanbanItems} 
                columns={KANBAN_COLUMNS} 
                renderItem={renderIdeaCard}
                onItemMove={handleItemMove}
              />
            )
          )}

          {view === "notes" && (
            regularNotes.length === 0 && !query ? (
              <EmptyState
                icon={BookOpen}
                title="No hay notas"
                description="Crea tu primera nota de trabajo."
                actionLabel="Nueva nota"
                onAction={() => router.push("/os/hub/new")}
              />
            ) : (
              <div className="space-y-2">
                {filteredNotes.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => router.push(`/os/hub/${n.id}`)}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent/30"
                  >
                    <div>
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatShortDate(n.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
