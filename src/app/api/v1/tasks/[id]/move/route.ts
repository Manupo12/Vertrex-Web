import { authed } from "@/lib/api/handler";
import { assertPermission } from "@/lib/api/rbac";
import { moveTaskToProjectAction } from "@/lib/db/actions/tasks";
import { ApiError } from "@/lib/api/errors";

export const runtime = "nodejs";

export const POST = authed<{ id: string }>(async ({ req, session, params }) => {
  await assertPermission(session, "projects", "write");
  const { projectId, cycleId, milestoneId } = await req.json().catch(() => ({}));
  if (!projectId) throw new ApiError("bad_request", 400, "projectId requerido");
  return moveTaskToProjectAction(params.id, projectId, cycleId, milestoneId);
});
