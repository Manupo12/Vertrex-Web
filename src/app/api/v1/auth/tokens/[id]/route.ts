import { authed } from "@/lib/api/handler";
import { revokeApiToken } from "@/lib/db/actions/api-tokens";

export const runtime = "nodejs";

export const DELETE = authed<{ id: string }>(async ({ session, params }) => {
  await revokeApiToken(session.userId, params.id);
  return { revoked: params.id };
});
