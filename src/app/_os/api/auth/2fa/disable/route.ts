import { disableTOTP } from "@/lib/auth/totp-service";
import { buildJsonErrorResponse } from "@/lib/api/error-response";

export const runtime = "nodejs";

export async function POST() {
  try {
    const ok = await disableTOTP();
    return Response.json({ ok });
  } catch (error) {
    return buildJsonErrorResponse(error, "No fue posible desactivar 2FA.");
  }
}
