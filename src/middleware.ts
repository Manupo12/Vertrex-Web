import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "vertrex_session";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/portafolio",
  "/portafolio/",
  "/servicios",
  "/sobre-nosotros",
  "/contacto",
  "/terminos",
  "/politica-de-privacidad",
  "/api/health",
];

const PUBLIC_PREFIXES = [
  "/_next",
  "/static",
  "/favicon",
  "/api/",
  "/login",
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

async function verifyToken(token: string): Promise<{ role: string; email: string } | null> {
  try {
    const secret = process.env.AUTH_SECRET;
    if (!secret) return null;
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    if (!payload.role || !payload.email) return null;
    return { role: String(payload.role), email: String(payload.email) };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = await verifyToken(token);

  if (!payload) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  // Protect OS routes for team only
  if (pathname.startsWith("/os")) {
    if (payload.role !== "team") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Protect portal routes for client only
  if (pathname.startsWith("/portal")) {
    if (payload.role !== "client") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
