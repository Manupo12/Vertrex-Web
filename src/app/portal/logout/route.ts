import { NextRequest, NextResponse } from "next/server";
import { logoutPortalClient } from "@/lib/auth/portal";

export async function GET(request: NextRequest) {
  await logoutPortalClient();
  return NextResponse.redirect(new URL("/portal/login", request.url));
}
