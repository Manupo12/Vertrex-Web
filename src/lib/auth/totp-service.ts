"use server";

import { eq } from "drizzle-orm";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { getDb, schema } from "@/lib/db";
import { requireAuthenticatedSession } from "@/lib/auth/session";

export type TOTPSetupResult = {
  secret: string;
  qrCodeUrl: string;
  provisioningUri: string;
};

function createTotp(secret: string, label: string) {
  return new OTPAuth.TOTP({
    issuer: "Vertrex OS",
    label,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
}

export async function generateTOTPSetup(): Promise<TOTPSetupResult> {
  const session = await requireAuthenticatedSession();
  const db = getDb();

  const secret = new OTPAuth.Secret({ size: 20 }).base32;
  const provisioningUri = createTotp(secret, session.user.email).toString();
  const qrCodeUrl = await QRCode.toDataURL(provisioningUri);

  await db
    .update(schema.users)
    .set({
      totpSecret: secret,
      totpEnabled: false,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, session.user.id));

  return { secret, qrCodeUrl, provisioningUri };
}

export async function verifyTOTPSetup(code: string): Promise<boolean> {
  const session = await requireAuthenticatedSession();
  const db = getDb();

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, session.user.id))
    .limit(1);

  if (!user?.totpSecret) {
    return false;
  }

  const totp = createTotp(user.totpSecret, user.email);
  const isValid = totp.validate({ token: code, window: 1 }) !== null;

  if (isValid) {
    await db
      .update(schema.users)
      .set({
        totpEnabled: true,
        totpVerifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, session.user.id));
  }

  return isValid;
}

export async function verifyTOTPForLogin(userId: string, code: string): Promise<boolean> {
  const db = getDb();

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  if (!user?.totpSecret || !user.totpEnabled) {
    return false;
  }

  const totp = createTotp(user.totpSecret, user.email);
  return totp.validate({ token: code, window: 1 }) !== null;
}

export async function disableTOTP(): Promise<boolean> {
  const session = await requireAuthenticatedSession();
  const db = getDb();

  await db
    .update(schema.users)
    .set({
      totpSecret: null,
      totpEnabled: false,
      totpVerifiedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, session.user.id));

  return true;
}

export async function getTOTPStatus(): Promise<{ enabled: boolean; verifiedAt: string | null }> {
  const session = await requireAuthenticatedSession();
  const db = getDb();

  const [user] = await db
    .select({
      totpEnabled: schema.users.totpEnabled,
      totpVerifiedAt: schema.users.totpVerifiedAt,
    })
    .from(schema.users)
    .where(eq(schema.users.id, session.user.id))
    .limit(1);

  return {
    enabled: user?.totpEnabled ?? false,
    verifiedAt: user?.totpVerifiedAt ? user.totpVerifiedAt.toISOString() : null,
  };
}
