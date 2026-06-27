import { authed } from "@/lib/api/handler";
import { assertPermission } from "@/lib/api/rbac";
import { updateProjectAction, getProjectById, deleteProject } from "@/lib/db/actions/projects";
import { updateProjectSchema } from "@/lib/validation/v1/projects";
import { ApiError } from "@/lib/api/errors";

export const runtime = "nodejs";

export const GET = authed<{ id: string }>(async ({ session, params }) => {
  await assertPermission(session, "projects", "read");
  const p = await getProjectById(params.id);
  if (!p) throw new ApiError("not_found", 404, "Proyecto no encontrado");
  return p;
});

export const PATCH = authed<{ id: string }>(async ({ req, session, params }) => {
  await assertPermission(session, "projects", "write");
  const parsed = updateProjectSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw new ApiError("bad_request", 400, "Datos inválidos", parsed.error.flatten());
  return updateProjectAction(params.id, parsed.data);
});

export const DELETE = authed<{ id: string }>(async ({ session, params }) => {
  await assertPermission(session, "projects", "write");
  await deleteProject(params.id);
  return { deleted: params.id };
});
