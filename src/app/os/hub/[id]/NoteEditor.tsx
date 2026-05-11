"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { saveKnowledgeNote } from "@/lib/db/actions/hub";
import { toast } from "sonner";
import { BlockEditor } from "@/components/os/Editor/BlockEditor";
import { ProjectPicker } from "@/components/os/Hub/ProjectPicker";
import { RepoMentionPicker } from "@/components/os/Hub/RepoMentionPicker";
import { SearchResult } from "@/lib/db/actions/search";
import { linkEntities } from "@/lib/db/actions/graph";
import { Link2 } from "lucide-react";

import { Input } from "@/components/ui/input";

interface NoteEditorProps {
  note: {
    id: string;
    title: string;
    contentJson: unknown;
    nextStep: string | null;
    ideaStatus: string | null;
    relatedProjectId: string | null;
  };
  isIdea: boolean;
  projects: Array<{ id: string, name: string }>;
}

export function NoteEditor({ note, isIdea, projects }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState<unknown>(note.contentJson);
  const [nextStep, setNextStep] = useState(note.nextStep || "");
  const [relatedProjectId, setRelatedProjectId] = useState<string | null>(note.relatedProjectId);
  const [saving, setSaving] = useState(false);
  const [repoPickerOpen, setRepoPickerOpen] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveKnowledgeNote(note.id, {
        title,
        contentJson: content,
        nextStep: isIdea ? nextStep : undefined,
        relatedProjectId: isIdea ? relatedProjectId : undefined,
      });
      toast.success("Guardado correctamente");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    }
    setSaving(false);
  };

  const handleRepoSelect = async (repo: SearchResult) => {
    setRepoPickerOpen(false);
    try {
      await linkEntities(note.id, isIdea ? "idea" : "note", repo.id, "repository", "mentions");
      toast.success("Repositorio conectado");
    } catch {
      toast.error("Error conectando repositorio");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 bg-transparent text-xl font-bold text-foreground border-transparent hover:border-border px-0 focus-visible:px-3 focus-visible:ring-1 transition-all h-12"
          placeholder="Titulo de la nota o idea..."
        />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setRepoPickerOpen(true)}>
            <Link2 className="mr-2 h-4 w-4" /> @repo
          </Button>
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>

      <RepoMentionPicker 
        open={repoPickerOpen} 
        onClose={() => setRepoPickerOpen(false)} 
        onSelect={handleRepoSelect} 
      />

      {isIdea && (
        <div className="mb-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">
              Proyecto relacionado
            </label>
            <ProjectPicker initialProjectId={relatedProjectId} onSelect={setRelatedProjectId} projects={projects} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">
              Siguiente paso
            </label>
            <Input
              value={nextStep}
              onChange={(e) => setNextStep(e.target.value)}
              placeholder="Accion concreta siguiente..."
            />
          </div>
        </div>
      )}

      <div className="mt-4">
        <BlockEditor 
          initialContent={note.contentJson} 
          onChange={(newContent) => setContent(newContent)} 
        />
      </div>
    </div>
  );
}
