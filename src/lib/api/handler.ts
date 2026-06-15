import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api/auth";
import { runWithActor } from "@/lib/auth/actor-context";
import { rateLimit } from "@/lib/api/ratelimit";
import { ApiError } from "@/lib/api/errors";
import type { OsSession } from "@/lib/auth/session";

type Ctx<P> = { req: NextRequest; session: OsSession; params: P };
type Handler<P> = (ctx: Ctx<P>) => Promise<unknown>;

export function authed<P = Record<string, string>>(handler: Handler<P>) {
  return async (req: NextRequest, route?: { params: Promise<P> }) => {
    try {
      if (!(await rateLimit(req)).ok) {
        throw new ApiError("rate_limited", 429, "Demasiadas solicitudes");
      }
      const session = await authenticateRequest(req);
      if (!session) throw new ApiError("unauthorized", 401, "Token inválido o ausente");
      const params = (route?.params ? await route.params : {}) as P;
      const data = await runWithActor(session, () => handler({ req, session, params }));
      return NextResponse.json({ data });
    } catch (e) {
      return errorResponse(e);
    }
  };
}

function errorResponse(e: unknown) {
  if (e instanceof ApiError) {
    return NextResponse.json(
      { error: { code: e.code, message: e.message, details: e.details ?? null } },
      { status: e.status },
    );
  }
  const msg = e instanceof Error ? e.message : "Error interno";
  const status = /no encontr|not found/i.test(msg)
    ? 404
    : /sin permiso|insuficiente|no autorizado/i.test(msg)
      ? 403
      : /inválid|invalid|requerid|transición/i.test(msg)
        ? 400
        : 500;
  return NextResponse.json(
    { error: { code: status === 500 ? "internal" : "error", message: msg } },
    { status },
  );
}
