import {
  getKnowledgeNoteById,
  createKnowledgeNote,
  convertIdeaToProject,
} from "@/lib/db/actions/hub";
import { getProjectsForPicker } from "@/lib/db/actions/hub-pickers";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EntitySidebar } from "@/components/os/Graph/EntitySidebar";
import { EntityConnectSheet } from "@/components/os/actions/EntityConnectSheet";
import { notFound } from "next/navigation";
import { NoteEditor } from "./NoteEditor";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function HubDetailPage({ params }: Props) {
  const { id } = await params;

  if (id === "new") {
    return (
      <div>
        <PageHeader
          title="Nueva nota"
          breadcrumbs={[
            { label: "Hub", href: "/os/hub" },
            { label: "Nueva" },
          ]}
        />
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Crear nota o idea</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createKnowledgeNote} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">
                  Titulo *
                </label>
                <input
                  name="title"
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">
                  Tipo
                </label>
                <select
                  name="type"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="note">Nota</option>
                  <option value="software_idea">Idea de software</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Crear
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const note = await getKnowledgeNoteById(id);
  if (!note) notFound();

  const isIdea = note.type === "software_idea";
  const projectsList = isIdea ? await getProjectsForPicker() : [];

  return (
    <div>
      <PageHeader
        title={note.title}
        breadcrumbs={[
          { label: "Hub", href: "/os/hub" },
          { label: note.title },
        ]}
        badge={
          <div className="flex gap-2">
            {isIdea && (
              <StatusBadge
                category="ideas"
                status={note.ideaStatus || "semilla"}
              />
            )}
            <span className="text-xs text-muted-foreground">{note.type}</span>
          </div>
        }
        secondaryActions={<EntityConnectSheet sourceId={note.id} sourceType={isIdea ? "idea" : "note"} />}
      />
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="max-w-[920px] flex-1">
          <NoteEditor note={note} isIdea={isIdea} projects={projectsList} />
          {isIdea && note.ideaStatus === "ejecutar" && (
            <form action={convertIdeaToProject.bind(null, note.id)} className="mt-4">
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Convertir en proyecto
              </button>
            </form>
          )}
        </div>
        <div className="w-full shrink-0 lg:w-72">
          <EntitySidebar entityId={note.id} />
        </div>
      </div>
    </div>
  );
}
