import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { users, modulePermissions } from "@/lib/db/schema";

type PermissionLevel = "admin" | "write" | "read" | "none";

const PERMISSION_HIERARCHY: Record<PermissionLevel, number> = {
  none: 0,
  read: 1,
  write: 2,
  admin: 3,
};

export async function getModulePermission(
  userId: string,
  module: string,
): Promise<PermissionLevel> {
  const [row] = await db
    .select()
    .from(modulePermissions)
    .where(
      and(
        eq(modulePermissions.userId, userId),
        eq(modulePermissions.module, module),
      ),
    )
    .limit(1);
  if (!row) return "none";
  if (row.permission === "admin") return "admin";
  if (row.permission === "write") return "write";
  if (row.permission === "read") return "read";
  return "none";
}

export async function requireModuleAccess(
  userId: string,
  module: string,
  level: PermissionLevel,
) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (user?.role === "admin") return;
  const current = await getModulePermission(userId, module);
  if (PERMISSION_HIERARCHY[current] < PERMISSION_HIERARCHY[level]) {
    throw new Error(
      `Acceso insuficiente al módulo "${module}". Requerido: ${level}, actual: ${current}`,
    );
  }
}

export async function getUserModulePermissions(userId: string) {
  return db
    .select()
    .from(modulePermissions)
    .where(eq(modulePermissions.userId, userId));
}
