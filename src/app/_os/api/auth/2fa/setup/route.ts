import { generateTOTPSetup } from "@/lib/auth/totp-service";
import { buildJsonErrorResponse } from "@/lib/api/error-response";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await generateTOTPSetup();
    return Response.json(result);
  } catch (error) {
    return buildJsonErrorResponse(error, "No fue posible generar la configuración de 2FA.");
  }
}
