import { requireOsUser, requireAdminUser } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/auth/permissions";

type ModuleName = "finances" | "resources" | "legal" | "crm" | "projects" | "marketing" | "agenda" | "links" | "hub" | "team" | "settings" | "documents";
type AccessLevel = "read" | "write" | "admin";

export async function enforceAccess(module: ModuleName, level: AccessLevel = "write") {
  const user = await requireOsUser();
  await requireModuleAccess(user.userId, module, level);
  return user;
}

export async function enforceAdmin() {
  return requireAdminUser();
}
