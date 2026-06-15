import { authed } from "@/lib/api/handler";
import { assertPermission } from "@/lib/api/rbac";
import { createAgendaEventAction } from "@/lib/db/actions/agenda";
import { createAgendaEventSchema } from "@/lib/validation/v1/agenda";
import { jsonToFormData } from "@/lib/api/form";
import { ApiError } from "@/lib/api/errors";
import { db } from "@/lib/db";
import { agendaEvents } from "@/lib/db/schema";
import { and, gte, lte, desc } from "drizzle-orm";

export const runtime = "nodejs";

export const GET = authed(async ({ req, session }) => {
  await assertPermission(session, "agenda", "read");
  const sp = new URL(req.url).searchParams;
  const from = sp.get("from");
  const to = sp.get("to");
  const limit = Number(sp.get("limit") || 100);
  const filters = [] as any[];
  if (from) filters.push(gte(agendaEvents.startsAt, new Date(from)));
  if (to) filters.push(lte(agendaEvents.startsAt, new Date(to)));
  const q = db.select().from(agendaEvents);
  return (filters.length ? q.where(and(...filters)) : q).orderBy(desc(agendaEvents.startsAt)).limit(limit);
});

export const POST = authed(async ({ req, session }) => {
  await assertPermission(session, "agenda", "write");
  const parsed = createAgendaEventSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw new ApiError("bad_request", 400, "Datos inválidos", parsed.error.flatten());
  return createAgendaEventAction(jsonToFormData(parsed.data as Record<string, unknown>));
});
