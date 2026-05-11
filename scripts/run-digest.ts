import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { db } from "../src/lib/db";
import { eq } from "drizzle-orm";
import { users } from "../src/lib/db/schema";
import {
  generateDailyDigest,
  sendDailyDigest,
} from "../src/lib/email/digest";

async function main() {
  const allUsers = await db
    .select()
    .from(users)
    .where(eq(users.isActive, true));

  const emailUsers = allUsers.filter((u) => {
    if (!u.preferences) return false;
    if (typeof u.preferences !== "object") return false;
    return (u.preferences as Record<string, unknown>).email_notifications === true;
  });

  let success = 0;
  let failure = 0;

  for (const user of emailUsers) {
    try {
      const digest = await generateDailyDigest(user.id);
      if (digest && digest.unreadCount > 0) {
        await sendDailyDigest(digest);
      }
      success++;
    } catch (err) {
      console.error(`Error procesando digest para ${user.email}:`, err);
      failure++;
    }
  }

  console.log(`Digest completado: ${success} enviados, ${failure} fallos`);
  process.exit(failure > 0 ? 1 : 0);
}

main();
