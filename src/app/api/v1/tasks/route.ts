import { authed } from "@/lib/api/handler";
import { assertPermission } from "@/lib/api/rbac";
import { createTaskAction, listTasksAction } from "@/lib/db/actions/tasks";
import { createTaskSchema } from "@/lib/validation/v1/tasks";
import { ApiError } from "@/lib/api/errors";

export const runtime = "nodejs";

export const GET = authed(async ({ req, session }) => {
  await assertPermission(session, "projects", "read");
  const projectId = new URL(req.url).searchParams.get("project") || undefined;
  return listTasksAction(projectId);
});

export const POST = authed(async ({ req, session }) => {
  await assertPermission(session, "projects", "write");
  const parsed = createTaskSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw new ApiError("bad_request", 400, "Datos inválidos", parsed.error.flatten());
  return createTaskAction(parsed.data);
});
