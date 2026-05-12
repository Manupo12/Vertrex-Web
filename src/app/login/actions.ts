"use server";

import { redirect } from "next/navigation";
import { loginTeam, logoutTeam } from "@/lib/auth/session";

const loginAttempts = new Map<string, { count: number; timestamp: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60000;

export async function loginAction(formData: FormData) {
  const { headers } = await import("next/headers");
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? headersList.get("x-real-ip") ?? "unknown";
  const now = Date.now();
  const attempt = loginAttempts.get(ip) || { count: 0, timestamp: now };
  if (now - attempt.timestamp > WINDOW_MS) {
    attempt.count = 1;
    attempt.timestamp = now;
  } else {
    attempt.count++;
  }
  loginAttempts.set(ip, attempt);
  if (attempt.count > MAX_ATTEMPTS) {
    redirect("/login?error=3");
  }
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
