import { describe, it, expect, beforeAll, afterAll } from "vitest";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { createTestDb, cleanupTestUser } from "@/test/utils/db";
import { users, sessions } from "@/lib/db/schema";
import { authenticateUser, getSessionFromToken, clearSession } from "./session";

const TEST_EMAIL = "test-runner@vertrex.co";
const TEST_PASSWORD = "TestPass123!";

describe("session integration", () => {
  let userId: string;

  beforeAll(async () => {
    await cleanupTestUser(TEST_EMAIL);
    const { db } = createTestDb();
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
    const [user] = await db
      .insert(users)
      .values({
        name: "Test Runner",
        email: TEST_EMAIL,
        passwordHash,
        role: "team",
        isActive: true,
      })
      .returning({ id: users.id });
    userId = user.id;
  });

  afterAll(async () => {
    await cleanupTestUser(TEST_EMAIL);
  });

  it("should authenticate a valid user", async () => {
    const result = await authenticateUser(TEST_EMAIL, TEST_PASSWORD, "team");
    expect(result).not.toBeNull();
    expect(result?.user.email).toBe(TEST_EMAIL);
    expect(result?.user.role).toBe("team");
    expect(result?.token).toBeDefined();
  });

  it("should reject invalid password", async () => {
    const result = await authenticateUser(TEST_EMAIL, "wrong-password", "team");
    expect(result).toBeNull();
  });

  it("should reject wrong role", async () => {
    const result = await authenticateUser(TEST_EMAIL, TEST_PASSWORD, "client");
    expect(result).toBeNull();
  });

  it("should verify a session from token", async () => {
    const authResult = await authenticateUser(TEST_EMAIL, TEST_PASSWORD, "team");
    expect(authResult).not.toBeNull();

    const session = await getSessionFromToken(authResult!.token);
    expect(session).not.toBeNull();
    expect(session?.user.email).toBe(TEST_EMAIL);
    expect(session?.user.id).toBe(userId);
  });

  it("should clear a session", async () => {
    const authResult = await authenticateUser(TEST_EMAIL, TEST_PASSWORD, "team");
    expect(authResult).not.toBeNull();

    await clearSession(authResult!.token);

    const session = await getSessionFromToken(authResult!.token);
    expect(session).toBeNull();
  });
});
