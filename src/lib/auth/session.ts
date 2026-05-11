import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as jose from "jose";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

const OS_COOKIE = "os_session";
const FALLBACK_SECRET = "default_super_secret_for_dev_only";

export type OsRole = "team" | "admin";
export type OsSession = { userId: string; email: string; name: string; role: OsRole };

function getAuthSecret() {
  if (process.env.NODE_ENV === "production" && !process.env.AUTH_SECRET) {
    throw new Error("AUTH_SECRET requerido en produccion");
  }
  return new TextEncoder().encode(process.env.AUTH_SECRET || FALLBACK_SECRET);
}

export async function createPasswordHash(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function signOsSession(session: OsSession) {
  const token = await new jose.SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setAudience("os")
    .setExpirationTime("7d")
    .sign(getAuthSecret());

  (await cookies()).set(OS_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getOsSession(): Promise<OsSession | null> {
  try {
    const token = (await cookies()).get(OS_COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jose.jwtVerify(token, getAuthSecret(), { audience: "os" });
    return {
      userId: String(payload.userId),
      email: String(payload.email),
      name: String(payload.name),
      role: payload.role === "admin" ? "admin" : "team",
    };
  } catch {
    return null;
  }
}

export async function requireOsUser() {
  const session = await getOsSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdminUser() {
  const session = await requireOsUser();
  if (session.role !== "admin") redirect("/os/admin");
  return session;
}

export async function loginTeam(email: string, password: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), eq(users.isActive, true)))
    .limit(1);

  if (!user) throw new Error("Credenciales inv\u00e1lidas");
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw new Error("Credenciales inv\u00e1lidas");

  await signOsSession({ userId: user.id, email: user.email, name: user.name, role: user.role });
  return { userId: user.id, role: user.role };
}

export async function logoutTeam() {
  (await cookies()).delete(OS_COOKIE);
}
