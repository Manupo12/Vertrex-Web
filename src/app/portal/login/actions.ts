"use server";
import { redirect } from "next/navigation";
import { verifyPortalAccess } from "@/lib/auth/portal";

export async function loginClientAction(formData: FormData) {
  const slug = String(formData.get("slug") || "").trim();
  const pin = String(formData.get("pin") || "").trim();
  if (!slug || !pin) redirect("/portal/login?error=1");
  try {
    const client = await verifyPortalAccess(slug, pin);
    redirect(`/portal/${client.slug}`);
  } catch {
    redirect("/portal/login?error=1");
  }
}
