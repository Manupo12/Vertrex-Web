import { authed } from "@/lib/api/handler";
import { assertPermission } from "@/lib/api/rbac";
import { createKnowledgeNote, saveKnowledgeNote } from "@/lib/db/actions/hub";
import { createNoteSchema } from "@/lib/validation/v1/notes";
import { jsonToFormData } from "@/lib/api/form";
import { ApiError } from "@/lib/api/errors";
import { db } from "@/lib/db";
import { knowledgeNotes } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export const runtime = "nodejs";

export const GET = authed(async ({ req, session }) => {
  await assertPermission(session, "hub", "read");
  const limit = Number(new URL(req.url).searchParams.get("limit") || 100);
  return db.select().from(knowledgeNotes).orderBy(desc(knowledgeNotes.createdAt)).limit(limit);
});

export const POST = authed(async ({ req, session }) => {
  await assertPermission(session, "hub", "write");
  const parsed = createNoteSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw new ApiError("bad_request", 400, "Datos inválidos", parsed.error.flatten());
  return createKnowledgeNote(jsonToFormData(parsed.data as Record<string, unknown>));
});
