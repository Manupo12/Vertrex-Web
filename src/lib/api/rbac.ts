import "server-only";
import { getModulePermission } from "@/lib/auth/permissions";
import { ApiError } from "@/lib/api/errors";
import type { OsSession } from "@/lib/auth/session";

const ORDER = { none: 0, read: 1, write: 2, admin: 3 } as const;
type Level = "read" | "write" | "admin";

export async function assertPermission(session: OsSession, module: string, level: Level) {
  if (session.role === "admin") return;
  const current = await getModulePermission(session.userId, module);
  if (ORDER[current] < ORDER[level]) {
    throw new ApiError("forbidden", 403, `Sin permiso "${level}" en módulo "${module}"`);
  }
}
