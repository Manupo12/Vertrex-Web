import { authed } from "@/lib/api/handler";
import { assertPermission } from "@/lib/api/rbac";
import { createSubtaskAction } from "@/lib/db/actions/tasks";
import { ApiError } from "@/lib/api/errors";

export const runtime = "nodejs";

export const POST = authed<{ id: string }>(async ({ req, session, params }) => {
  await assertPermission(session, "projects", "write");
  const { title } = await req.json().catch(() => ({}));
  if (!title) throw new ApiError("bad_request", 400, "title requerido");
  return createSubtaskAction(params.id, title);
});
