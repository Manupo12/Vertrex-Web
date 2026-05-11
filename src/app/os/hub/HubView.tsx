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

const IDEA_COLUMNS: Record<
  string,
  { label: string; emoji: string; color: string }
> = {
  semilla: { label: "Semillas", emoji: "🌱", color: "border-l-green-500" },
  laboratorio: {
    label: "Laboratorio",
    emoji: "🧪",
    color: "border-l-violet-500",
  },
  ejecutar: {
    label: "Para ejecutar",
    emoji: "🏗️",
    color: "border-l-amber-500",
  },
  congelador: {
    label: "Congelador",
    emoji: "🧊",
    color: "border-l-blue-500",
  },
};

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
  const [query, setQuery] = useState("");
  const [view, setView] = useState(defaultView);

  const ideas = notes.filter((n) => n.type === "software_idea");
  const regularNotes = notes.filter((n) => n.type === "note");

  const filteredIdeas = ideas.filter(
    (i) => !query || i.title.toLowerCase().includes(query.toLowerCase()),
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(IDEA_COLUMNS).map(([status, config]) => {
                const items = filteredIdeas.filter(
                  (i) => i.ideaStatus === status,
                );
                return (
                  <div
                    key={status}
                    className="rounded-xl border border-border bg-card/50 p-3"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-medium">
                        {config.emoji} {config.label}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {items.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {items.length === 0 && (
                        <p className="py-4 text-center text-xs text-muted-foreground">
                          Vacio
                        </p>
                      )}
                      {items.map((i) => (
                        <div
                          key={i.id}
                          onClick={() => router.push(`/os/hub/${i.id}`)}
                          className={`cursor-pointer rounded-lg border border-border bg-card p-3 border-l-2 ${config.color} transition-colors hover:bg-accent/30`}
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
                              → {i.nextStep}
                            </p>
                          )}
                          <select
                            value={i.ideaStatus || "semilla"}
                            onChange={async (e) => {
                              try {
                                await updateIdeaStatus(
                                  i.id,
                                  e.target.value as
                                    | "semilla"
                                    | "laboratorio"
                                    | "ejecutar"
                                    | "congelador",
                                );
                                toast.success("Estado actualizado");
                                router.refresh();
                              } catch {
                                toast.error("Error");
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-2 w-full rounded border border-border bg-background px-2 py-1 text-[10px] text-foreground"
                          >
                            <option value="semilla">🌱 Semilla</option>
                            <option value="laboratorio">🧪 Laboratorio</option>
                            <option value="ejecutar">🏗️ Ejecutar</option>
                            <option value="congelador">🧊 Congelador</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
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
