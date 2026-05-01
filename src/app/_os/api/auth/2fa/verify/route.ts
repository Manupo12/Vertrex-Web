import { z } from "zod";
import { verifyTOTPSetup } from "@/lib/auth/totp-service";
import { buildJsonErrorResponse } from "@/lib/api/error-response";

export const runtime = "nodejs";

const schema = z.object({ code: z.string().length(6) });

export async function POST(request: Request) {
  try {
    const { code } = schema.parse(await request.json());
    const ok = await verifyTOTPSetup(code);
    return Response.json({ ok });
  } catch (error) {
    return buildJsonErrorResponse(error, "No fue posible verificar el código 2FA.");
  }
}
