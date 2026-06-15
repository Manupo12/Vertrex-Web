import { authed } from "@/lib/api/handler";
import { assertPermission } from "@/lib/api/rbac";
import { updateClientAction, getClientBySlug, bulkDeleteClientsAction } from "@/lib/db/actions/crm";
import { updateClientSchema } from "@/lib/validation/v1/clients";
import { jsonToFormData } from "@/lib/api/form";
import { ApiError } from "@/lib/api/errors";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";

export const runtime = "nodejs";

async function resolveClientId(idOrSlug: string) {
  // try as slug first, then as uuid
  const c = await getClientBySlug(idOrSlug);
  if (c) return c.id;
  const [byId] = await db.select({ id: clients.id }).from(clients).where(eq(clients.id, idOrSlug)).limit(1);
  return byId?.id ?? null;
}

export const GET = authed<{ id: string }>(async ({ session, params }) => {
  await assertPermission(session, "crm", "read");
  const c = await getClientBySlug(params.id);
  if (c) return c;
  const [byId] = await db.select().from(clients).where(eq(clients.id, params.id)).limit(1);
  if (!byId) throw new ApiError("not_found", 404, "Cliente no encontrado");
  return byId;
});

export const PATCH = authed<{ id: string }>(async ({ req, session, params }) => {
  await assertPermission(session, "crm", "write");
  const slug = (await getClientBySlug(params.id)) ? params.id : (await db.select({ slug: clients.slug }).from(clients).where(eq(clients.id, params.id)).limit(1))[0]?.slug;
  if (!slug) throw new ApiError("not_found", 404, "Cliente no encontrado");
  const parsed = updateClientSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw new ApiError("bad_request", 400, "Datos inválidos", parsed.error.flatten());
  return updateClientAction(slug, jsonToFormData(parsed.data as Record<string, unknown>));
});

export const DELETE = authed<{ id: string }>(async ({ session, params }) => {
  await assertPermission(session, "crm", "write");
  const id = await resolveClientId(params.id);
  if (!id) throw new ApiError("not_found", 404, "Cliente no encontrado");
  await bulkDeleteClientsAction([id]);
  return { deleted: id };
});
