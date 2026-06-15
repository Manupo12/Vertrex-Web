import { authed } from "@/lib/api/handler";
import { assertPermission } from "@/lib/api/rbac";
import { updateAgendaEventAction } from "@/lib/db/actions/agenda";
import { updateAgendaEventSchema } from "@/lib/validation/v1/agenda";
import { jsonToFormData } from "@/lib/api/form";
import { ApiError } from "@/lib/api/errors";
import { db } from "@/lib/db";
import { agendaEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export const GET = authed<{ id: string }>(async ({ session, params }) => {
  await assertPermission(session, "agenda", "read");
  const [row] = await db.select().from(agendaEvents).where(eq(agendaEvents.id, params.id)).limit(1);
  if (!row) throw new ApiError("not_found", 404, "Evento no encontrado");
  return row;
});

export const PATCH = authed<{ id: string }>(async ({ req, session, params }) => {
  await assertPermission(session, "agenda", "write");
  const parsed = updateAgendaEventSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw new ApiError("bad_request", 400, "Datos inválidos", parsed.error.flatten());
  return updateAgendaEventAction(params.id, jsonToFormData(parsed.data as Record<string, unknown>));
});

export const DELETE = authed<{ id: string }>(async ({ session, params }) => {
  await assertPermission(session, "agenda", "write");
  await db.delete(agendaEvents).where(eq(agendaEvents.id, params.id));
  return { deleted: params.id };
});
