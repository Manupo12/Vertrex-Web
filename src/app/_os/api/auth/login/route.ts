import { cookies } from "next/headers";
import { z } from "zod";

import { buildJsonErrorResponse } from "@/lib/api/error-response";
import { authenticateUser, getLoginRedirectPath, getSessionCookieOptions } from "@/lib/auth/session";
import { enforceRateLimit, readRateLimitFingerprint } from "@/lib/security/rate-limit";
import { logger } from "@/lib/logging/logger";

export const runtime = "nodejs";

const loginPayloadSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
  role: z.enum(["team", "client"]),
});

export async function POST(request: Request) {
  try {
    const payload = loginPayloadSchema.parse(await request.json());
    enforceRateLimit({
      request,
      namespace: "auth-login",
      max: 6,
      windowMs: 10 * 60 * 1000,
      identifier: `${payload.role}:${payload.identifier}:${readRateLimitFingerprint(request)}`,
      message: "Demasiados intentos de login. Espera un momento antes de intentar de nuevo.",
    });
    const session = await authenticateUser(payload.identifier, payload.password, payload.role);

    if (!session) {
      logger.warn("Login failed: invalid credentials", {
        identifier: payload.identifier,
        role: payload.role,
      });
      return Response.json({ error: "Credenciales inválidas o acceso no autorizado." }, { status: 401 });
    }

    logger.info("Login successful", { userId: session.user.id, role: session.user.role });

    const cookieStore = await cookies();
    cookieStore.set({
      ...getSessionCookieOptions(session.expiresAt),
      value: session.token,
      expires: session.expiresAt,
    });

    return Response.json({
      user: session.user,
      expiresAt: session.expiresAt.toISOString(),
      redirectTo: getLoginRedirectPath(session.user),
    });
  } catch (error) {
    logger.error("Login error", error instanceof Error ? error : undefined, {
      identifier: (await request.json().catch(() => ({}))).identifier,
    });
    return buildJsonErrorResponse(error, "No fue posible iniciar sesión.");
  }
}
