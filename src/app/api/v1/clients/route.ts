import { authed } from "@/lib/api/handler";
import { assertPermission } from "@/lib/api/rbac";
import { createClientAction, getClientBySlug } from "@/lib/db/actions/crm";
import { createClientSchema } from "@/lib/validation/v1/clients";
import { jsonToFormData } from "@/lib/api/form";
import { ApiError } from "@/lib/api/errors";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { desc, or, like } from "drizzle-orm";

export const runtime = "nodejs";

export const GET = authed(async ({ req, session }) => {
  await assertPermission(session, "crm", "read");
  const sp = new URL(req.url).searchParams;
  const q = sp.get("q");
  const limit = Number(sp.get("limit") || 100);
  if (q) {
    return db
      .select()
      .from(clients)
      .where(or(like(clients.name, `%${q}%`), like(clients.slug, `%${q}%`)))
      .orderBy(desc(clients.createdAt))
      .limit(limit);
  }
  return db.select().from(clients).orderBy(desc(clients.createdAt)).limit(limit);
});

export const POST = authed(async ({ req, session }) => {
  await assertPermission(session, "crm", "write");
  const parsed = createClientSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw new ApiError("bad_request", 400, "Datos inválidos", parsed.error.flatten());
  return createClientAction(jsonToFormData(parsed.data as Record<string, unknown>));
});
