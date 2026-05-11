import { Secret, TOTP } from "otpauth";

export function generateTwoFactorSecret(userEmail: string): { secret: string; otpauthUrl: string } {
  const secret = new Secret({ size: 20 });
  const totp = new TOTP({
    issuer: "Vertrex OS",
    label: userEmail,
    secret: secret,
  });
  return {
    secret: secret.base32,
    otpauthUrl: totp.toString(),
  };
}

export function verifyTwoFactorToken(secret: string, token: string): boolean {
  try {
    const totp = new TOTP({
      secret: Secret.fromBase32(secret),
    });
    const delta = totp.validate({ token, window: 1 });
    return delta !== null;
  } catch {
    return false;
  }
}
