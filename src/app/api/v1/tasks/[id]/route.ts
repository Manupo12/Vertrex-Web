import { authed } from "@/lib/api/handler";
import { assertPermission } from "@/lib/api/rbac";
import {
  getTaskDetailAction,
  updateTaskAction,
  deleteTaskAction,
} from "@/lib/db/actions/tasks";
import { updateTaskSchema } from "@/lib/validation/v1/tasks";
import { ApiError } from "@/lib/api/errors";

export const runtime = "nodejs";

export const GET = authed<{ id: string }>(async ({ session, params }) => {
  await assertPermission(session, "projects", "read");
  const task = await getTaskDetailAction(params.id);
  if (!task) throw new ApiError("not_found", 404, "Tarea no encontrada");
  return task;
});

export const PATCH = authed<{ id: string }>(async ({ req, session, params }) => {
  await assertPermission(session, "projects", "write");
  const parsed = updateTaskSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw new ApiError("bad_request", 400, "Datos inválidos", parsed.error.flatten());
  const patch: any = { ...parsed.data };
  if (patch.dueDate) patch.dueDate = new Date(patch.dueDate);
  return updateTaskAction(params.id, patch);
});

export const DELETE = authed<{ id: string }>(async ({ session, params }) => {
  await assertPermission(session, "projects", "write");
  await deleteTaskAction(params.id);
  return { deleted: params.id };
});
