"use server";

import { redirect } from "next/navigation";
import { loginTeam, logoutTeam } from "@/lib/auth/session";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  if (!email || !password) redirect("/login?error=1");

  try {
    await loginTeam(email, password);
  } catch {
    redirect("/login?error=1");
  }

  redirect("/os/admin");
}

export async function logoutAction() {
  await logoutTeam();
  redirect("/login");
}
