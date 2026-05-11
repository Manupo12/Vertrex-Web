"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAdminUser } from "@/lib/auth/session";
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
