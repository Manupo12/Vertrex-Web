import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as jose from "jose";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";

const PORTAL_COOKIE = "portal_session";
const FALLBACK_SECRET = "default_super_secret_for_dev_only";

export type PortalSession = { clientId: string; slug: string };

function getAuthSecret() {
  if (process.env.NODE_ENV === "production" && !process.env.AUTH_SECRET) {
    throw new Error("AUTH_SECRET requerido en produccion");
  }
  return new TextEncoder().encode(process.env.AUTH_SECRET || FALLBACK_SECRET);
}

export async function signPortalSession(session: PortalSession) {
  const token = await new jose.SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setAudience("portal")
    .setExpirationTime("7d")
    .sign(getAuthSecret());

  (await cookies()).set(PORTAL_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getPortalSession(): Promise<PortalSession | null> {
  try {
    const token = (await cookies()).get(PORTAL_COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jose.jwtVerify(token, getAuthSecret(), { audience: "portal" });
    return { clientId: String(payload.clientId), slug: String(payload.slug) };
  } catch {
    return null;
  }
}

export async function requirePortalClient(expectedSlug?: string) {
  const session = await getPortalSession();
  if (!session) redirect("/portal/login");
  if (expectedSlug && session.slug !== expectedSlug) redirect(`/portal/${session.slug}`);
  return session;
}

export async function verifyPortalAccess(slug: string, pin: string) {
  const [client] = await db.select().from(clients).where(eq(clients.slug, slug)).limit(1);
  if (!client) throw new Error("Cliente no encontrado");
  const valid = await bcrypt.compare(pin, client.pinHash);
  if (!valid) throw new Error("PIN invalido");
  await signPortalSession({ clientId: client.id, slug: client.slug });
  return client;
}

export async function logoutPortalClient() {
  (await cookies()).delete(PORTAL_COOKIE);
}
