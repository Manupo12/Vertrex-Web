import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  const { eq } = await import("drizzle-orm");
  const { db } = await import("@/lib/db");
  const { users } = await import("@/lib/db/schema");
  const { hashPassword } = await import("@/lib/security/password");

  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("ERROR: SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD deben estar configuradas en .env.local");
    process.exit(1);
  }

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (existing) {
    console.log(`Usuario admin ${email} ya existe. Saltando seed.`);
    process.exit(0);
  }

  const passwordHash = await hashPassword(password);

  await db.insert(users).values({
    email,
    name: "Admin",
    passwordHash,
    role: "admin",
    isActive: true,
  });

  console.log(`Usuario admin creado: ${email}`);
  process.exit(0);
}

main();
