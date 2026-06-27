"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, modulePermissions, tasks } from "@/lib/db/schema";
import { requireAdminUser, requireOsUser } from "@/lib/auth/session";
import { hashPassword } from "@/lib/security/password";

export async function createTeamMemberAction(formData: FormData) {
  await requireAdminUser();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "").trim();
  const role = String(formData.get("role") || "team") as "team" | "admin";
  if (!name || !email || !password) throw new Error("Nombre, email y contrasena son obligatorios");
  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(users).values({ name, email, passwordHash, role, isActive: true }).returning();
  revalidatePath("/os/team");
  return { userId: user.id, email: user.email, password };
}

export async function updateTeamMemberRoleAction(userId: string, role: "team" | "admin") {
  await requireAdminUser();
  await db.update(users).set({ role }).where(eq(users.id, userId));
  revalidatePath("/os/team");
  revalidatePath(`/os/team/${userId}`);
}

export async function deactivateTeamMemberAction(userId: string) {
  await requireAdminUser();
  await db.update(users).set({ isActive: false }).where(eq(users.id, userId));
  revalidatePath("/os/team");
  revalidatePath(`/os/team/${userId}`);
}

export async function updateUserStatusAction(userId: string, status: "active" | "focused" | "away" | "offline") {
  await requireOsUser();
  if (!["active", "focused", "away", "offline"].includes(status)) throw new Error("Estado invalido");
  await db.update(users).set({ status }).where(eq(users.id, userId));
  revalidatePath("/os/team");
}

export async function getWorkloadAction() {
  const adminUser = await requireAdminUser();
  const activeUsers = await db.select().from(users).where(
    and(eq(users.isActive, true), eq(users.status, "active"))
  );

  const result = [];
  for (const u of activeUsers) {
    const userTasks = await db.select().from(tasks).where(eq(tasks.assigneeId, u.id));
    const activeTasks = userTasks.filter(t => ["todo", "in_progress", "in_review"].includes(t.state)).length;
    const overdueTasks = userTasks.filter(t => t.state !== "done" && t.dueDate && t.dueDate < new Date()).length;
    result.push({
      userId: u.id,
      name: u.name,
      email: u.email,
      activeTasks,
      overdueTasks,
      totalTasks: userTasks.length,
      lastAccess: u.createdAt,
    });
  }
  return result;
}

export async function setModulePermissionAction(userId: string, module: string, permission: "none" | "read" | "write" | "admin") {
  await requireAdminUser();
  if (!["none", "read", "write", "admin"].includes(permission)) throw new Error("Permiso invalido");

  const [existing] = await db.select().from(modulePermissions).where(
    and(eq(modulePermissions.userId, userId), eq(modulePermissions.module, module))
  ).limit(1);

  if (existing) {
    await db.update(modulePermissions).set({ permission }).where(eq(modulePermissions.id, existing.id));
  } else {
    await db.insert(modulePermissions).values({ userId, module, permission });
  }

  revalidatePath("/os/team");
}

import { normalizeTelegramUsername } from "@/lib/telegram/mention";
import { logActivity } from "@/lib/activity/log";

export async function setTelegramUsernameAction(userId: string, rawUsername: string) {
  const adminUser = await requireAdminUser();
  const normalized = normalizeTelegramUsername(rawUsername);

  await db.update(users).set({ telegramUsername: normalized || null }).where(eq(users.id, userId));

  await logActivity({
    actorType: "team",
    actorId: adminUser.userId,
    verb: "telegram_linked",
    targetType: "user",
    targetId: userId,
    payload: { telegramUsername: normalized }
  });

  revalidatePath("/os/team");
  revalidatePath(`/os/team/${userId}`);
}

export async function getModulePermissionsAction(userId: string) {
  await requireAdminUser();
  return db.select().from(modulePermissions).where(eq(modulePermissions.userId, userId));
}


