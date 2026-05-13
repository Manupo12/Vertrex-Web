import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { requireOsUser } = await import("@/lib/auth/session");
    const { requireModuleAccess } = await import("@/lib/auth/permissions");
    const { encrypt } = await import("@/lib/security/encryption");
    const { db } = await import("@/lib/db");
    const { resources } = await import("@/lib/db/schema");
    const { revalidatePath } = await import("next/cache");

    const user = await requireOsUser();
    await requireModuleAccess(user.userId, "resources", "write");

    const formData = await request.formData();
    const title = String(formData.get("title") || "").trim();
    const type = String(formData.get("type") || "otro");
    const value = String(formData.get("value") || "").trim();

    if (!title || !value) {
      return NextResponse.json({ error: "Título y valor son obligatorios" }, { status: 400 });
    }

    const encryptedValue = encrypt(value);
    const [resource] = await db.insert(resources).values({ title, type, encryptedValue }).returning();
    revalidatePath("/os/resources");

    return NextResponse.json({ id: resource.id, title: resource.title });
  } catch (e: any) {
    console.error("[RESOURCE CREATE ERROR]", e);
    return NextResponse.json({ error: e.message || "Error desconocido" }, { status: 500 });
  }
}
