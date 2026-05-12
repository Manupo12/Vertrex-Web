import { headers } from "next/headers";

export async function validateOrigin(allowedOrigins?: string[]) {
  const headersList = await headers();
  const origin = headersList.get("origin") || headersList.get("referer") || "";
  const allowed = allowedOrigins || [process.env.PUBLIC_APP_URL || "http://localhost:3000"];
  if (origin && !allowed.some(a => origin.startsWith(a))) {
    throw new Error("CSRF: origen no permitido");
  }
}
