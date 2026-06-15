import { authed } from "@/lib/api/handler";
import { assertPermission } from "@/lib/api/rbac";
import { saveKnowledgeNote, getKnowledgeNoteById } from "@/lib/db/actions/hub";
import { updateNoteSchema } from "@/lib/validation/v1/notes";
import { ApiError } from "@/lib/api/errors";
import { db } from "@/lib/db";
import { knowledgeNotes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export const GET = authed<{ id: string }>(async ({ session, params }) => {
  await assertPermission(session, "hub", "read");
  const n = await getKnowledgeNoteById(params.id);
  if (!n) throw new ApiError("not_found", 404, "Nota no encontrada");
  return n;
});

export const PATCH = authed<{ id: string }>(async ({ req, session, params }) => {
  await assertPermission(session, "hub", "write");
  const parsed = updateNoteSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw new ApiError("bad_request", 400, "Datos inválidos", parsed.error.flatten());
  return saveKnowledgeNote(params.id, parsed.data as any);
});

export const DELETE = authed<{ id: string }>(async ({ session, params }) => {
  await assertPermission(session, "hub", "write");
  await db.delete(knowledgeNotes).where(eq(knowledgeNotes.id, params.id));
  return { deleted: params.id };
});
