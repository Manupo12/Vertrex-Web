import { authed } from "@/lib/api/handler";
import {
  listApiTokensForUser,
  createApiTokenForUser,
} from "@/lib/db/actions/api-tokens";

export const runtime = "nodejs";

export const GET = authed(async ({ session }) => listApiTokensForUser(session.userId));

export const POST = authed(async ({ req, session }) => {
  const body = await req.json().catch(() => ({}));
  const { token, record } = await createApiTokenForUser(
    session.userId,
    body?.name || "token",
    body?.expiresAt ? new Date(body.expiresAt) : undefined,
  );
  return { token, id: record.id, name: record.name };
});
