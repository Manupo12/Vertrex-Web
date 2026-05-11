import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from "jose";

const PUBLIC_EXACT = [
  "/",
  "/login",
  "/portafolio",
  "/servicios",
  "/sobre-nosotros",
  "/contacto",
  "/terminos",
  "/politica-de-privacidad",
  "/demos",
  "/cuestionario",
  "/portal/login",
];
const PUBLIC_PFX = ["/_next", "/static", "/favicon", "/api/health"];

function authSecret() {
  if (process.env.NODE_ENV === "production" && !process.env.AUTH_SECRET) {
    throw new Error("AUTH_SECRET requerido en produccion");
  }
  return new TextEncoder().encode(process.env.AUTH_SECRET || "default_super_secret_for_dev_only");
}

async function verifyOsToken(token: string) {
  try {
    await jose.jwtVerify(token, authSecret(), { audience: "os" });
    return true;
  } catch {
    return false;
  }
}

async function verifyPortalToken(token: string) {
  try {
    await jose.jwtVerify(token, authSecret(), { audience: "portal" });
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_EXACT.includes(pathname) || PUBLIC_PFX.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/upload") || pathname.startsWith("/api/documents") || pathname.startsWith("/api/tickets")) {
    const osToken = request.cookies.get("os_session")?.value;
    const portalToken = request.cookies.get("portal_session")?.value;
    
    let hasAccess = false;
    if (osToken && await verifyOsToken(osToken)) hasAccess = true;
    if (portalToken && await verifyPortalToken(portalToken)) hasAccess = true;

    if (!hasAccess) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  if (pathname.startsWith("/os")) {
    const token = request.cookies.get("os_session")?.value;
    if (!token || !(await verifyOsToken(token))) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/portal")) {
    const token = request.cookies.get("portal_session")?.value;
    if (!token || !(await verifyPortalToken(token))) {
      return NextResponse.redirect(new URL("/portal/login", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/mcp.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
