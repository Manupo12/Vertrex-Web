"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { knowledgeNotes, projects } from "@/lib/db/schema";
import { linkEntities } from "@/lib/db/actions/graph";

function titleFromText(text: string) {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > 60 ? `${clean.slice(0, 60)}…` : clean || "Idea sin titulo";
}

function blockNoteFromPlainText(text: string) {
  return [
    {
      type: "paragraph",
      content: text.trim(),
    },
  ];
}

export async function quickCaptureIdea(rawContent: string) {
  const content = rawContent.trim();
  if (!content) throw new Error("La idea no puede estar vacia");
  const [note] = await db
    .insert(knowledgeNotes)
    .values({ title: titleFromText(content), contentJson: blockNoteFromPlainText(content), type: "software_idea", ideaStatus: "semilla" })
    .returning();
  revalidatePath("/os/hub");
  return note;
}

export async function createKnowledgeNote(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const type = String(formData.get("type") || "note");
  if (!title) throw new Error("El titulo es obligatorio");
  const [note] = await db
    .insert(knowledgeNotes)
    .values({ title, contentJson: [{ type: "paragraph", content: [] }], type: type === "software_idea" ? "software_idea" : "note", ideaStatus: type === "software_idea" ? "semilla" : null })
    .returning();
  revalidatePath("/os/hub");
  redirect(`/os/hub/${note.id}`);
}

export async function saveKnowledgeNote(id: string, input: { title: string; contentJson: unknown; nextStep?: string | null; relatedProjectId?: string | null }) {
  const title = input.title.trim();
  if (!title) throw new Error("El titulo es obligatorio");
  await db.update(knowledgeNotes).set({ title, contentJson: input.contentJson as Record<string, unknown>, nextStep: input.nextStep || null, relatedProjectId: input.relatedProjectId || null }).where(eq(knowledgeNotes.id, id));
  revalidatePath("/os/hub");
  revalidatePath(`/os/hub/${id}`);
}

export async function updateIdeaStatus(id: string, status: "semilla" | "laboratorio" | "ejecutar" | "congelador") {
  await db.update(knowledgeNotes).set({ ideaStatus: status }).where(eq(knowledgeNotes.id, id));
  revalidatePath("/os/hub");
  revalidatePath(`/os/hub/${id}`);
}

export async function convertIdeaToProject(id: string) {
  const [idea] = await db.select().from(knowledgeNotes).where(eq(knowledgeNotes.id, id)).limit(1);
  if (!idea) throw new Error("Idea no encontrada");
  if (idea.type !== "software_idea") throw new Error("Solo las ideas se pueden convertir en proyecto");
  const [project] = await db.insert(projects).values({ name: idea.title, status: "active", progress: 0, currentVersion: "v1.0", referenceLinks: [] }).returning();
  await db.update(knowledgeNotes).set({ ideaStatus: "ejecutar", relatedProjectId: project.id }).where(eq(knowledgeNotes.id, id));
  await linkEntities(id, "idea", project.id, "project", "became_project");
  revalidatePath("/os/hub");
  revalidatePath("/os/projects");
  redirect(`/os/projects/${project.id}`);
}

export async function getKnowledgeNoteById(id: string) {
  return db.select().from(knowledgeNotes).where(eq(knowledgeNotes.id, id)).limit(1).then(rows => rows[0] || null);
}
