import { authed } from "@/lib/api/handler";
import { assertPermission } from "@/lib/api/rbac";
import { changeTaskStateAction } from "@/lib/db/actions/tasks";
import { ApiError } from "@/lib/api/errors";

export const runtime = "nodejs";

export const POST = authed<{ id: string }>(async ({ req, session, params }) => {
  await assertPermission(session, "projects", "write");
  const { state } = await req.json().catch(() => ({}));
  if (!state) throw new ApiError("bad_request", 400, "state requerido");
  return changeTaskStateAction(params.id, state);
});
