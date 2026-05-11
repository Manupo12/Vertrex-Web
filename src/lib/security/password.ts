import bcrypt from "bcryptjs";

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

export function generateSixDigitPin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
