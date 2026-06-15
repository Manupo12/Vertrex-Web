import { authed } from "@/lib/api/handler";
import { assertPermission } from "@/lib/api/rbac";
import { assignTaskAction } from "@/lib/db/actions/tasks";

export const runtime = "nodejs";

export const POST = authed<{ id: string }>(async ({ req, session, params }) => {
  await assertPermission(session, "projects", "write");
  const { assigneeId } = await req.json().catch(() => ({}));
  return assignTaskAction(params.id, assigneeId ?? null);
});
