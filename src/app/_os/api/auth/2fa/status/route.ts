import { getTOTPStatus } from "@/lib/auth/totp-service";
import { buildJsonErrorResponse } from "@/lib/api/error-response";

export const runtime = "nodejs";

export async function GET() {
  try {
    const status = await getTOTPStatus();
    return Response.json(status);
  } catch (error) {
    return buildJsonErrorResponse(error, "No fue posible consultar el estado de 2FA.");
  }
}
