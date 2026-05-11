"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toolbar } from "@/components/os/layout/Toolbar";
import { StatusBadge } from "@/components/ui/status-badge";
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
      await updateIdeaStatus(itemId, newStatus as any);
      toast.success("Estado actualizado");
      router.refresh();
    } catch {
      toast.error("Error al actualizar");
      throw new Error("Update failed");
    }
  };

  const renderIdeaCard = (i: any) => (
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
    <div>
      <Tabs value={view} onValueChange={setView}>
        <div className="mb-4 flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="ideas">
              Incubadora ({ideas.length})
            </TabsTrigger>
            <TabsTrigger value="notes">
              Notas ({regularNotes.length})
            </TabsTrigger>
          </TabsList>
        </div>
        <Toolbar searchPlaceholder="Buscar..." onSearch={setQuery} />

        <TabsContent value="ideas">
          {ideas.length === 0 ? (
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
          )}
        </TabsContent>

        <TabsContent value="notes">
          {regularNotes.length === 0 ? (
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
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
