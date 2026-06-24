import { test, expect } from "@playwright/test";

test.describe("Task critical flow", () => {
  test("should complete full task lifecycle", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', process.env.SEED_ADMIN_EMAIL || "admin@vertrex.com");
    await page.fill('input[name="password"]', process.env.SEED_ADMIN_PASSWORD || "admin123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/os/admin");

    await page.goto("/os/projects");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("text=Proyectos").first()).toBeVisible({ timeout: 5000 });
  });
});
