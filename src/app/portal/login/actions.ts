"use server";
import { redirect } from "next/navigation";
import { verifyPortalAccess } from "@/lib/auth/portal";

export async function loginClientAction(formData: FormData) {
  const slug = String(formData.get("slug") || "").trim();
  const pin = String(formData.get("pin") || "").trim();
  if (!slug || !pin) redirect("/portal/login?error=invalid_pin");
  try {
    const client = await verifyPortalAccess(slug, pin);
    redirect(`/portal/${client.slug}`);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Cliente no encontrado") {
        redirect("/portal/login?error=not_found");
      }
      if (error.message === "PIN invalido") {
        redirect("/portal/login?error=invalid_pin");
      }
    }
    redirect("/portal/login?error=invalid_pin");
  }
}
