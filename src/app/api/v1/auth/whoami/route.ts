import { authed } from "@/lib/api/handler";
import { getUserModulePermissions } from "@/lib/auth/permissions";

export const runtime = "nodejs";

export const GET = authed(async ({ session }) => ({
  user: session,
  permissions: await getUserModulePermissions(session.userId),
}));
