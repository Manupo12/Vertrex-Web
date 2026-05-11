"use server";

import { redirect } from "next/navigation";
import { loginTeam, logoutTeam } from "@/lib/auth/session";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  if (!email || !password) redirect("/login?error=1");

  try {
    await loginTeam(email, password);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[LOGIN ERROR]", message);
    if (message.includes("Credenciales")) {
      redirect("/login?error=1");
    }
    // DB or server error — show generic message  
    redirect("/login?error=2");
  }

  redirect("/os/admin");
}

export async function logoutAction() {
  await logoutTeam();
  redirect("/login");
}
