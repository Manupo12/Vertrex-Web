import { authed } from "@/lib/api/handler";
import { assertPermission } from "@/lib/api/rbac";
import { linkTaskBlocksAction, unlinkTaskBlocksAction } from "@/lib/db/actions/tasks";
import { ApiError } from "@/lib/api/errors";

export const runtime = "nodejs";

export const POST = authed<{ id: string }>(async ({ req, session, params }) => {
  await assertPermission(session, "projects", "write");
  const { on } = await req.json().catch(() => ({}));
  if (!on) throw new ApiError("bad_request", 400, "'on' (id de la tarea bloqueada) requerido");
  await linkTaskBlocksAction(params.id, on);
  return { from: params.id, blocks: on };
});

export const DELETE = authed<{ id: string }>(async ({ req, session }) => {
  await assertPermission(session, "projects", "write");
  const linkId = new URL(req.url).searchParams.get("linkId");
  if (!linkId) throw new ApiError("bad_request", 400, "linkId requerido");
  await unlinkTaskBlocksAction(linkId);
  return { unlinked: linkId };
});
